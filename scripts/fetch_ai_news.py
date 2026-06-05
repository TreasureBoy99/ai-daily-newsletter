#!/usr/bin/env python3
"""AI Daily Newsletter - Unified news fetcher.

Fetches from 100+ AI sources: RSS feeds, Hacker News, GitHub Trending,
HuggingFace Papers, LinuxDo, Reddit, and more. Outputs unified JSON to stdout.

Usage:
    python3 fetch_ai_news.py [--hours 24] [--limit 20] [--outdir PATH]
"""

import argparse
import concurrent.futures
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from time import mktime
from html import unescape
from typing import Optional

import feedparser
import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# AI keyword filter set
# ---------------------------------------------------------------------------
AI_KEYWORDS = re.compile(
    r"\b("
    r"AI|LLM|GPT|Claude|Agent|RAG|DeepSeek|Gemini|Llama|"
    r"Transformer|Diffusion|RLHF|MCP|Anthropic|OpenAI|"
    r"Machine\s*Learning|Deep\s*Learning|Neural\s*Net|"
    r"Foundation\s*Model|Fine[\s-]?tun|Embedding|Vector\s*DB|"
    r"Copilot|Midjourney|Stable\s*Diffusion|ChatGPT|"
    r"Mistral|Qwen|Phi-|Groq|vLLM|GGUF|LoRA|"
    r"Computer\s*Vision|NLP|MLOps|GenAI|Generative|"
    r"Multi.*Agent|AutoGPT|LangChain|CrewAI|AutoGen|"
    r"Sophon|Benchmark|Eval|Alignment|Safety"
    r")\b",
    re.IGNORECASE,
)


def matches_ai(text: str) -> bool:
    """Return True if text contains an AI-related keyword."""
    return bool(AI_KEYWORDS.search(text or ""))


# ---------------------------------------------------------------------------
# curl helper (bypasses Cloudflare TLS fingerprint for LinuxDo/Reddit)
# ---------------------------------------------------------------------------
def _curl_fetch(url: str, extra_headers: list[str], timeout: int = 20) -> str:
    """Shell out to curl for sites that block Python's TLS fingerprint."""
    args = ["curl", "-sSL", "-m", str(timeout), "--compressed"] + extra_headers + [url]
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout + 5)
    if result.returncode != 0:
        raise RuntimeError(f"curl failed: {result.stderr}")
    return result.stdout


# ---------------------------------------------------------------------------
# RSS source registry (100+ sources)
# ---------------------------------------------------------------------------
RSS_SOURCES = [
    # ========================================
    # Tier 1: 主流 AI 媒体
    # ========================================
    {
        "url": "https://venturebeat.com/category/ai/feed/",
        "name": "VentureBeat AI",
        "category": "industry",
        "ai_filter": True,
    },
    {
        "url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "name": "TechCrunch AI",
        "category": "industry",
        "ai_filter": True,
    },
    {
        "url": "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
        "name": "The Verge AI",
        "category": "announcements",
    },
    {
        "url": "https://www.technologyreview.com/topic/artificial-intelligence/feed",
        "name": "MIT Technology Review AI",
        "category": "research",
    },
    {
        "url": "https://artificialintelligence-news.com/feed/",
        "name": "AI News",
        "category": "announcements",
    },
    {
        "url": "https://www.wired.com/feed/category/ai/",
        "name": "Wired AI",
        "category": "industry",
    },
    {
        "url": "https://www.axios.com/technology/artificial-intelligence/rss",
        "name": "Axios AI",
        "category": "industry",
    },

    # ========================================
    # AI 公司博客
    # ========================================
    {
        "url": "https://openai.com/blog/rss.xml",
        "name": "OpenAI Blog",
        "category": "announcements",
    },
    {
        "url": "https://www.anthropic.com/feed.xml",
        "name": "Anthropic",
        "category": "announcements",
    },
    {
        "url": "https://blog.google/technology/ai/rss/",
        "name": "Google AI Blog",
        "category": "announcements",
    },
    {
        "url": "https://deepmind.google/blog/rss.xml",
        "name": "DeepMind Blog",
        "category": "research",
    },
    {
        "url": "https://blogs.microsoft.com/ai/feed/",
        "name": "Microsoft AI Blog",
        "category": "announcements",
    },
    {
        "url": "https://ai.meta.com/blog/rss/",
        "name": "Meta AI Blog",
        "category": "research",
    },
    {
        "url": "https://blog.nvidia.com/ai/feed/",
        "name": "NVIDIA AI Blog",
        "category": "research",
    },
    {
        "url": "https://www.mistral.ai/blog/feed/",
        "name": "Mistral AI Blog",
        "category": "announcements",
    },
    {
        "url": "https://www.cohere.com/blog/rss.xml",
        "name": "Cohere Blog",
        "category": "research",
    },
    {
        "url": "https://www.aws.amazon.com/blogs/machine-learning/feed/",
        "name": "AWS ML Blog",
        "category": "industry",
    },
    {
        "url": "https://cloud.google.com/blog/products/ai-machine-learning/rss",
        "name": "Google Cloud AI",
        "category": "industry",
    },
    {
        "url": "https://blog.products.48n0.com/rss",
        "name": "H (HuggingFace) Blog",
        "category": "announcements",
    },
    {
        "url": "https://www.x.ai/blog/rss",
        "name": "xAI Blog",
        "category": "announcements",
    },

    # ========================================
    # AI 评估和基准 (NEW - 包括 Sophon)
    # ========================================
    {
        "url": "https://sophon.at/feed.xml",
        "name": "Sophon",
        "category": "research",
    },
    {
        "url": "https://huggingface.co/datasets/HuggingFaceH4/ai-benchmark-runs/rss",
        "name": "HF Benchmarks",
        "category": "research",
    },
    {
        "url": "https://www.lmarena.ai/rss/",
        "name": "LM Arena",
        "category": "research",
    },
    {
        "url": "https://www.artificialanalysis.org/rss",
        "name": "Artificial Analysis",
        "category": "research",
    },
    {
        "url": "https://promptfoo.dev/rss.xml",
        "name": "Promptfoo",
        "category": "tools",
    },
    {
        "url": "https://www.paperswithcode.com/rss",
        "name": "Papers with Code",
        "category": "research",
    },
    {
        "url": "https://www.mmlu.io/rss",
        "name": "MMLU Benchmark",
        "category": "research",
    },
    {
        "url": "https://www.swebench.org/rss",
        "name": "SWE Bench",
        "category": "research",
    },
    {
        "url": "https://www.humaneval.org/rss",
        "name": "HumanEval",
        "category": "research",
    },

    # ========================================
    # AI Newsletters
    # ========================================
    {
        "url": "https://www.latent.space/feed",
        "name": "Latent Space AINews",
        "category": "industry",
        "filter_prefix": "[AINews]",
    },
    {
        "url": "https://www.interconnects.ai/feed",
        "name": "Interconnects",
        "category": "industry",
    },
    {
        "url": "https://www.oneusefulthing.org/feed",
        "name": "One Useful Thing",
        "category": "announcements",
    },
    {
        "url": "https://chinai.substack.com/feed",
        "name": "ChinAI",
        "category": "policy",
    },
    {
        "url": "https://www.deeplearning.ai/the-batch/feed/",
        "name": "The Batch (Andrew Ng)",
        "category": "industry",
    },
    {
        "url": "https://www.therobotbrains.ai/substack/feed",
        "name": "Robot Brains",
        "category": "research",
    },
    {
        "url": "https://tlmr.substack.com/feed",
        "name": "This Month in AI",
        "category": "industry",
    },
    {
        "url": "https://www.ben-evans.com/benedictevans/rss",
        "name": "Ben Evans",
        "category": "industry",
    },
    {
        "url": "https://www.diffusion.blog/rss",
        "name": "Diffusion Blog",
        "category": "industry",
    },

    # ========================================
    # AI 专家/博主
    # ========================================
    {
        "url": "https://simonwillison.net/atom/everything/",
        "name": "Simon Willison",
        "category": "tools",
    },
    {
        "url": "https://karpathy.github.io/feed.xml",
        "name": "Andrej Karpathy",
        "category": "research",
    },
    {
        "url": "https://jalammar.github.io/feed.xml",
        "name": "Jay Alammar",
        "category": "research",
    },
    {
        "url": "https://newsletter.languagemodels.co/feed",
        "name": "Jay Alammar (Substack)",
        "category": "research",
    },
    {
        "url": "https://lilian.substack.com/feed",
        "name": "Lilian Weng (The Cartella)",
        "category": "research",
    },
    {
        "url": "https://lilianweng.github.io/posts/index.xml",
        "name": "Lil'Log (Lilian Weng)",
        "category": "research",
    },
    {
        "url": "https://semianalysis.com/feed/",
        "name": "SemiAnalysis",
        "category": "industry",
    },
    {
        "url": "https://stratechery.com/feed/",
        "name": "Stratechery",
        "category": "industry",
    },
    {
        "url": "https://garymarcus.substack.com/feed",
        "name": "Gary Marcus",
        "category": "policy",
    },
    {
        "url": "https://sebastianraschka.com/feed.xml",
        "name": "Sebastian Raschka",
        "category": "research",
    },
    {
        "url": "https://eugeneyan.com/feed.xml",
        "name": "Eugen Yan",
        "category": "research",
    },
    {
        "url": "https://vickiboykis.com/feed.xml",
        "name": "Vicki Boykis",
        "category": "research",
    },
    {
        "url": "https://blog.fast.ai/feed.xml",
        "name": "Fast.ai Blog",
        "category": "tools",
    },
    {
        "url": "https://stjermir.com/rss/",
        "name": "Stjermir",
        "category": "tools",
    },

    # ========================================
    # 论文源 (Arxiv + 研究实验室)
    # ========================================
    {
        "url": "http://export.arxiv.org/rss/cs.AI",
        "name": "Arxiv cs.AI",
        "category": "research",
    },
    {
        "url": "http://export.arxiv.org/rss/cs.LG",
        "name": "Arxiv cs.LG",
        "category": "research",
    },
    {
        "url": "http://export.arxiv.org/rss/cs.CL",
        "name": "Arxiv cs.CL",
        "category": "research",
    },
    {
        "url": "http://export.arxiv.org/rss/cs.CV",
        "name": "Arxiv cs.CV",
        "category": "research",
    },
    {
        "url": "http://export.arxiv.org/rss/cs.MA",
        "name": "Arxiv cs.MA (Multi-Agent)",
        "category": "research",
    },
    {
        "url": "http://export.arxiv.org/rss/cs.NE",
        "name": "Arxiv cs.NE",
        "category": "research",
    },
    {
        "url": "https://bair.berkeley.edu/blog/feed.xml",
        "name": "BAIR Blog",
        "category": "research",
    },
    {
        "url": "https://ai.stanford.edu/blog/feed.xml",
        "name": "Stanford HAI",
        "category": "research",
    },
    {
        "url": "https://crfm.stanford.edu/feed.xml",
        "name": "Stanford CRFM",
        "category": "research",
    },
    {
        "url": "https://www.nature.com/nmach/articles.rss",
        "name": "Nature Machine Intelligence",
        "category": "research",
    },
    {
        "url": "https://www.science.org/rss/news/artificial-intelligence",
        "name": "Science AI",
        "category": "research",
    },
    {
        "url": "https://research.google/blog/rss/",
        "name": "Google Research AI",
        "category": "research",
    },
    {
        "url": "https://research.apple.com/blog/rss",
        "name": "Apple Research AI",
        "category": "research",
    },
    {
        "url": "https://www.microsoft.com/en-us/research/blog/feed/",
        "name": "Microsoft Research",
        "category": "research",
    },
    {
        "url": "https://research.fb.com/category/artificial-intelligence/feed/",
        "name": "Meta Research AI",
        "category": "research",
    },
    {
        "url": "https://www.amazon.science/category/artificial-intelligence/feed/",
        "name": "Amazon Science AI",
        "category": "research",
    },
    {
        "url": "https://www.ibm.com/research/blog/category/artificial-intelligence/feed/",
        "name": "IBM Research AI",
        "category": "research",
    },
    {
        "url": "https://research.nvidia.com/feed",
        "name": "NVIDIA Research",
        "category": "research",
    },

    # ========================================
    # AI Agent 框架 (NEW)
    # ========================================
    {
        "url": "https://blog.langchain.dev/rss/",
        "name": "LangChain Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.crewai.com/rss.xml",
        "name": "CrewAI Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.autogen.ai/rss.xml",
        "name": "AutoGen Blog",
        "category": "tools",
    },
    {
        "url": "https://www.llamaindex.ai/blog/rss",
        "name": "LlamaIndex Blog",
        "category": "tools",
    },
    {
        "url": "https://www.haystack.ai/blog/rss",
        "name": "Haystack Blog",
        "category": "tools",
    },
    {
        "url": "https://www.dspy.ai/blog/rss",
        "name": "DSPy Blog",
        "category": "tools",
    },

    # ========================================
    # 向量数据库 (NEW)
    # ========================================
    {
        "url": "https://blog.pinecone.io/rss/",
        "name": "Pinecone Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.weaviate.io/rss.xml",
        "name": "Weaviate Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.qdrant.com/rss",
        "name": "Qdrant Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.milvus.io/rss",
        "name": "Milvus Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.chroma.ai/rss",
        "name": "ChromaDB Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.lancedb.com/rss",
        "name": "LanceDB Blog",
        "category": "tools",
    },

    # ========================================
    # AI 编程工具 (NEW)
    # ========================================
    {
        "url": "https://blog.cursor.com/rss",
        "name": "Cursor Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.replit.com/rss",
        "name": "Replit AI",
        "category": "tools",
    },
    {
        "url": "https://blog.github.com/rss",
        "name": "GitHub Copilot",
        "category": "tools",
    },
    {
        "url": "https://codeium.com/blog/rss",
        "name": "Codeium Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.tabnine.com/rss",
        "name": "Tabnine AI",
        "category": "tools",
    },
    {
        "url": "https://blog.sourcegraph.com/rss",
        "name": "Sourcegraph AI",
        "category": "tools",
    },

    # ========================================
    # AI 可观测性 (NEW)
    # ========================================
    {
        "url": "https://blog.arize.com/rss",
        "name": "Arize AI",
        "category": "tools",
    },
    {
        "url": "https://blog.weightsbiases.com/rss",
        "name": "Weights & Biases",
        "category": "tools",
    },
    {
        "url": "https://blog.comet.com/rss",
        "name": "Comet ML",
        "category": "tools",
    },
    {
        "url": "https://www.mlflow.org/blog/rss",
        "name": "MLflow Blog",
        "category": "tools",
    },
    {
        "url": "https://www.neptune.ai/blog/rss",
        "name": "Neptune.ai",
        "category": "tools",
    },
    {
        "url": "https://www.clearml.com/blog/rss",
        "name": "ClearML Blog",
        "category": "tools",
    },
    {
        "url": "https://www.helicone.com/blog/rss",
        "name": "Helicone Blog",
        "category": "tools",
    },
    {
        "url": "https://www.braintrust.dev/blog/rss",
        "name": "Braintrust",
        "category": "tools",
    },
    {
        "url": "https://www.traceloop.com/blog/rss",
        "name": "Traceloop Blog",
        "category": "tools",
    },
    {
        "url": "https://www.agentops.ai/blog/rss",
        "name": "AgentOps Blog",
        "category": "tools",
    },

    # ========================================
    # AI 部署和推理平台 (NEW)
    # ========================================
    {
        "url": "https://blog.replicate.com/rss",
        "name": "Replicate Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.fal.ai/rss",
        "name": "Fal.ai Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.baseten.co/rss",
        "name": "Baseten Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.runpod.io/rss",
        "name": "RunPod Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.vast.ai/rss",
        "name": "Vast.ai",
        "category": "tools",
    },
    {
        "url": "https://blog.lambdalabs.com/rss",
        "name": "Lambda Labs",
        "category": "tools",
    },
    {
        "url": "https://blog.vllm.ai/rss.xml",
        "name": "vLLM Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.together.ai/rss",
        "name": "Together AI",
        "category": "tools",
    },
    {
        "url": "https://blog.modular.com/blog/rss.xml",
        "name": "Modular AI",
        "category": "tools",
    },

    # ========================================
    # AI 安全和对齐 (NEW)
    # ========================================
    {
        "url": "https://www.alignmentforum.org/feed.xml",
        "name": "Alignment Forum",
        "category": "policy",
    },
    {
        "url": "https://www.lesswrong.com/feed.xml",
        "name": "LessWrong",
        "category": "policy",
    },
    {
        "url": "https://www.miri.org/rss",
        "name": "MIRI Research",
        "category": "research",
    },
    {
        "url": "https://www.fhi.ox.ac.uk/rss",
        "name": "Future of Humanity Institute",
        "category": "research",
    },
    {
        "url": "https://www.cset.georgetown.edu/rss",
        "name": "CSET AI",
        "category": "policy",
    },
    {
        "url": "https://www.eleuther.ai/rss",
        "name": "EleutherAI",
        "category": "research",
    },
    {
        "url": "https://www.conjecture.dev/rss",
        "name": "Conjecture AI",
        "category": "research",
    },
    {
        "url": "https://www.redwoodresearch.org/rss",
        "name": "Redwood Research",
        "category": "research",
    },
    {
        "url": "https://www.aiimpacts.org/rss",
        "name": "AI Impacts",
        "category": "research",
    },
    {
        "url": "https://www.epoch.ai/rss",
        "name": "Epoch AI Research",
        "category": "research",
    },

    # ========================================
    # AI 投资和行业分析 (NEW)
    # ========================================
    {
        "url": "https://www.a16z.com/feed/",
        "name": "a16z AI",
        "category": "industry",
    },
    {
        "url": "https://www.sequoiacap.com/rss/",
        "name": "Sequoia AI",
        "category": "industry",
    },
    {
        "url": "https://www.greylock.com/feed",
        "name": "Greylock AI",
        "category": "industry",
    },
    {
        "url": "https://www.ft.com/world/companies/artificial-intelligence?rss",
        "name": "FT AI",
        "category": "industry",
    },
    {
        "url": "https://www.economist.com/rss/the-world-ahead/artificial-intelligence",
        "name": "Economist AI",
        "category": "industry",
    },
    {
        "url": "https://www.information.com/artificial-intelligence/rss",
        "name": "The Information AI",
        "category": "industry",
    },
    {
        "url": "https://www.bloomberg.com/ai/rss",
        "name": "Bloomberg AI",
        "category": "industry",
    },
    {
        "url": "https://www.reuters.com/technology/artificial-intelligence/rss",
        "name": "Reuters AI",
        "category": "industry",
    },

    # ========================================
    # 中文 AI 资讯
    # ========================================
    {
        "url": "https://www.jiqizhixin.com/rss",
        "name": "机器之心",
        "category": "industry",
    },

    # ========================================
    # 产品和工具发现
    # ========================================
    {
        "url": "https://www.producthunt.com/feed",
        "name": "Product Hunt",
        "category": "tools",
    },
    {
        "url": "https://news.ycombinator.com/rss",
        "name": "Hacker News",
        "category": "tools",
        "ai_filter": True,
    },

    # ========================================
    # HuggingFace 生态
    # ========================================
    {
        "url": "https://huggingface.co/blog/feed.xml",
        "name": "Hugging Face Blog",
        "category": "tools",
    },
    {
        "url": "https://huggingface.co/datasets/rss",
        "name": "HuggingFace Datasets",
        "category": "tools",
    },
    {
        "url": "https://huggingface.co/models/rss",
        "name": "HuggingFace Models",
        "category": "tools",
    },

    # ========================================
    # 多模态 AI
    # ========================================
    {
        "url": "https://stability.ai/blog/feed.xml",
        "name": "Stability AI",
        "category": "research",
    },
    {
        "url": "https://www.elevenlabs.io/blog/rss",
        "name": "ElevenLabs Blog",
        "category": "tools",
    },
    {
        "url": "https://blog.play.ht/rss",
        "name": "Play.ht AI",
        "category": "tools",
    },
]


# ---------------------------------------------------------------------------
# Date parsing
# ---------------------------------------------------------------------------
def parse_date(entry) -> Optional[datetime]:
    """Extract datetime from a feedparser entry."""
    for attr in ("published_parsed", "updated_parsed"):
        val = getattr(entry, attr, None)
        if val:
            try:
                return datetime.fromtimestamp(mktime(val), tz=timezone.utc)
            except Exception:
                pass
    return None


# ---------------------------------------------------------------------------
# RSS fetcher
# ---------------------------------------------------------------------------
def fetch_rss(source: dict, cutoff: datetime, limit: int) -> list[dict]:
    """Fetch a single RSS source and return entries within the time window."""
    url = source["url"]
    results = []
    try:
        feed = feedparser.parse(url)
        for entry in feed.entries:
            if len(results) >= limit:
                break

            title = entry.get("title", "No Title")

            # Optional prefix filter (e.g. Latent Space [AINews])
            prefix = source.get("filter_prefix")
            if prefix and not title.startswith(prefix):
                continue

            # Optional AI keyword filter
            if source.get("ai_filter"):
                text = f"{title} {entry.get('summary', '')}"
                if not matches_ai(text):
                    continue

            pub_date = parse_date(entry)
            if pub_date and pub_date < cutoff:
                continue

            summary_raw = entry.get("summary", "") or ""
            summary = BeautifulSoup(summary_raw, "html.parser").get_text()[:500]

            results.append({
                "source": source["name"],
                "category": source["category"],
                "title": unescape(title),
                "url": entry.get("link", ""),
                "time": pub_date.isoformat() if pub_date else "",
                "summary": summary,
            })
    except Exception as e:
        print(f"[RSS] Error fetching {source['name']} ({url}): {e}", file=sys.stderr)
    return results


# ---------------------------------------------------------------------------
# LinuxDo (uses curl to bypass Cloudflare TLS fingerprint)
# ---------------------------------------------------------------------------
def fetch_linuxdo(cutoff: datetime, limit: int) -> list[dict]:
    """Fetch hot posts from LinuxDo via RSS, using curl to bypass Cloudflare."""
    results = []
    curl_headers = [
        "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "-H", "Accept: application/atom+xml, application/rss+xml, application/xml, text/xml, */*",
        "-H", "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8",
    ]
    try:
        # Try top.rss?period=daily first (today's hot), fallback to latest.rss
        try:
            xml = _curl_fetch("https://linux.do/top.rss?period=daily", curl_headers)
            feed = feedparser.parse(xml)
        except Exception:
            xml = _curl_fetch("https://linux.do/latest.rss", curl_headers)
            feed = feedparser.parse(xml)

        for entry in feed.entries[:limit]:
            title = entry.get("title", "")
            pub_date = parse_date(entry)
            if pub_date and pub_date < cutoff:
                continue
            summary_raw = entry.get("summary", "") or ""
            summary = BeautifulSoup(summary_raw, "html.parser").get_text()[:300]
            results.append({
                "source": "LinuxDo",
                "category": "community",
                "title": unescape(title),
                "url": entry.get("link", ""),
                "time": pub_date.isoformat() if pub_date else "",
                "summary": summary,
            })
    except Exception as e:
        print(f"[LinuxDo] Error: {e}", file=sys.stderr)
    return results


# ---------------------------------------------------------------------------
# Reddit (uses curl to bypass Reddit's UA restrictions)
# ---------------------------------------------------------------------------
def fetch_reddit(subreddits: list[str], cutoff: datetime, limit_per: int) -> list[dict]:
    """Fetch hot posts from Reddit via RSS, using curl for UA compatibility."""
    results = []
    curl_headers = [
        "-H", "User-Agent: Mozilla/5.0 (compatible; ai-daily-newsletter/1.0)",
        "-H", "Accept: application/atom+xml, application/rss+xml, */*",
    ]
    for sub in subreddits:
        try:
            url = f"https://www.reddit.com/r/{sub}/hot/.rss?limit={limit_per}"
            xml = _curl_fetch(url, curl_headers)
            feed = feedparser.parse(xml)
            for entry in feed.entries[:limit_per]:
                title = entry.get("title", "")
                # Skip stickied posts (usually meta posts)
                if getattr(entry, "is_stickied", False):
                    continue
                pub_date = parse_date(entry)
                if pub_date and pub_date < cutoff:
                    continue
                # AI keyword filter
                if not matches_ai(title):
                    continue
                summary_raw = entry.get("summary", "") or ""
                summary = BeautifulSoup(summary_raw, "html.parser").get_text()[:300]
                results.append({
                    "source": f"r/{sub}",
                    "category": "community",
                    "title": unescape(title),
                    "url": entry.get("link", ""),
                    "time": pub_date.isoformat() if pub_date else "",
                    "summary": summary,
                })
        except Exception as e:
            print(f"[Reddit r/{sub}] Error: {e}", file=sys.stderr)
    return results


# ---------------------------------------------------------------------------
# Twitter/X (dual source: fxtwitter RSS or autocli)
# ---------------------------------------------------------------------------
def fetch_twitter_via_autocli(cutoff: datetime, limit: int) -> list[dict]:
    """Fetch AI-related tweets from Twitter timeline using autocli."""
    results = []
    try:
        result = subprocess.run(
            ["autocli", "twitter", "timeline", "--limit", "50", "--format", "json"],
            capture_output=True, text=True, timeout=60,
        )
        if result.returncode != 0:
            print(f"[Twitter/autocli] Error: {result.stderr}", file=sys.stderr)
            return []

        tweets = json.loads(result.stdout)
        for tweet in tweets:
            if len(results) >= limit:
                break
            text = tweet.get("text", "")
            if not matches_ai(text):
                continue
            created_str = tweet.get("created_at", "")
            pub_date = None
            if created_str:
                try:
                    from email.utils import parsedate_to_datetime
                    pub_date = parsedate_to_datetime(created_str)
                except Exception:
                    pass
            if pub_date and pub_date < cutoff:
                continue
            results.append({
                "source": f"Twitter/@{tweet.get('author', '')}",
                "category": "community",
                "title": text[:200] if text else "",
                "url": tweet.get("url", ""),
                "time": pub_date.isoformat() if pub_date else "",
                "summary": text,
                "likes": tweet.get("likes", 0),
                "retweets": tweet.get("retweets", 0),
                "views": tweet.get("views", 0),
            })
    except subprocess.TimeoutExpired:
        print("[Twitter/autocli] fetch timed out", file=sys.stderr)
    except Exception as e:
        print(f"[Twitter/autocli] Error: {e}", file=sys.stderr)
    return results


def fetch_twitter_via_fxtwitter(cutoff: datetime, limit: int) -> list[dict]:
    """Fetch tweets from Twitter handles via fxtwitter RSS feed."""
    handles = ["TheHackersNews", "simonw", "ylecun", "AndrewYNg", "AlphaSignalAI"]
    all_results = []
    for handle in handles:
        try:
            curl_headers = [
                "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "-H", "Accept: application/rss+xml, application/atom+xml, */*",
            ]
            url = f"https://fxtwitter.com/{handle}/feed.xml?count={limit}&safe=1"
            xml = _curl_fetch(url, curl_headers)
            feed = feedparser.parse(xml)
            for entry in feed.entries:
                if len(all_results) >= limit * len(handles):
                    break
                title = entry.get("title", "")
                desc_raw = entry.get("summary", "") or ""
                desc = BeautifulSoup(desc_raw, "html.parser").get_text()[:500]
                pub_date = parse_date(entry)
                if pub_date and pub_date < cutoff:
                    continue
                if matches_ai(title + " " + desc):
                    all_results.append({
                        "source": f"Twitter/@{handle}",
                        "category": "community",
                        "title": title,
                        "url": entry.get("link", ""),
                        "time": pub_date.isoformat() if pub_date else "",
                        "summary": desc,
                    })
        except Exception as e:
            print(f"[Twitter/@{handle}] Error: {e}", file=sys.stderr)
    return all_results[:limit]


def fetch_twitter(cutoff: datetime, limit: int) -> list[dict]:
    """Fetch AI-related tweets. Uses autocli if TWITTER_SOURCE=autocli, else fxtwitter RSS."""
    source = os.environ.get("TWITTER_SOURCE", "fxtwitter").lower()
    if source == "autocli":
        print("[Twitter] Using autocli mode", file=sys.stderr)
        return fetch_twitter_via_autocli(cutoff, limit)
    else:
        print("[Twitter] Using fxtwitter RSS mode", file=sys.stderr)
        return fetch_twitter_via_fxtwitter(cutoff, limit)


# ---------------------------------------------------------------------------
# Hacker News (Algolia API) - optimized single-query with OR keywords
# ---------------------------------------------------------------------------
def fetch_hn(cutoff: datetime, limit: int) -> list[dict]:
    """Fetch AI-related stories from Hacker News via Algolia API.

    Uses a single combined query with OR keywords to minimize API calls.
    """
    results = []
    keywords = ["AI", "LLM", "GPT", "Claude", "OpenAI", "Anthropic", "DeepSeek",
                "Gemini", "Llama", "transformer", "RAG", "agent", "MCP"]

    timestamp = int(cutoff.timestamp())

    # Combine all keywords into a single OR query
    combined_query = " ".join(f'"{kw}"' for kw in keywords)

    try:
        resp = requests.get(
            "https://hn.algolia.com/api/v1/search",
            params={
                "query": combined_query,
                "tags": "story",
                "numericFilters": f"created_at_i>{timestamp}",
                "hitsPerPage": min(limit * 3, 100),
            },
            timeout=15,
        )
        resp.raise_for_status()
        hits = resp.json().get("hits", [])

        seen_hn_urls = set()
        for hit in hits:
            if len(results) >= limit:
                break
            hn_url = f"https://news.ycombinator.com/item?id={hit['objectID']}"

            if hn_url in seen_hn_urls:
                continue
            seen_hn_urls.add(hn_url)

            results.append({
                "source": "Hacker News",
                "category": "community",
                "title": hit.get("title", ""),
                "url": hn_url,
                "time": hit.get("created_at", ""),
                "heat": str(hit.get("points", 0)),
                "summary": "",
                "hn_url": hn_url,
            })
    except Exception as e:
        print(f"[HN] Error: {e}", file=sys.stderr)

    results.sort(key=lambda x: int(x.get("heat", "0")), reverse=True)
    return results[:limit]


# ---------------------------------------------------------------------------
# GitHub API helper (supports token auth to avoid rate limits)
# ---------------------------------------------------------------------------
def _gh_headers() -> dict:
    """Return headers for GitHub API, using GH_TOKEN env var if available."""
    headers = {"User-Agent": "Mozilla/5.0 AI-Daily-Newsletter/1.0"}
    token = os.environ.get("GH_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


# ---------------------------------------------------------------------------
# GitHub Trending
# ---------------------------------------------------------------------------
def fetch_readme(repo_path: str) -> str:
    """Fetch README text for a GitHub repo (first 1000 chars). Returns empty string on failure."""
    headers = _gh_headers()
    for branch in ("main", "master"):
        try:
            url = f"https://raw.githubusercontent.com/{repo_path}/{branch}/README.md"
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                return resp.text[:1000]
        except Exception:
            pass
    return ""


def fetch_github_trending_html(limit: int) -> list[dict]:
    """Scrape GitHub Trending, fetch README for AI candidates, filter by README content.
    Used as fallback when GH_TOKEN is not available for GraphQL API.
    """
    candidates = []
    headers = _gh_headers()
    try:
        resp = requests.get(
            "https://github.com/trending",
            params={"since": "daily"},
            headers=headers,
            timeout=15,
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        for article in soup.select("article.Box-row"):
            h2 = article.select_one("h2 a")
            if not h2:
                continue
            repo_path = h2.get("href", "").strip("/")
            repo_url = f"https://github.com/{repo_path}"
            repo_name = repo_path.split("/")[-1] if "/" in repo_path else repo_path

            p = article.select_one("p")
            desc = p.get_text(strip=True) if p else ""

            lang_span = article.select_one("[itemprop='programmingLanguage']")
            lang = lang_span.get_text(strip=True) if lang_span else ""

            stars_links = article.select("a.Link--muted")
            stars = stars_links[0].get_text(strip=True).replace(",", "") if stars_links else ""

            if not matches_ai(f"{repo_name} {desc}"):
                continue

            candidates.append({
                "repo_path": repo_path,
                "repo_url": repo_url,
                "desc": desc,
                "lang": lang,
                "stars": stars,
            })
    except Exception as e:
        print(f"[GitHub] Error fetching trending page: {e}", file=sys.stderr)
        return []

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(fetch_readme, c["repo_path"]): c
            for c in candidates
        }
        for future in concurrent.futures.as_completed(futures):
            c = futures[future]
            try:
                readme = future.result()
                if readme and matches_ai(readme):
                    results.append({
                        "source": "GitHub Trending",
                        "category": "tools",
                        "title": c["repo_path"].split("/")[-1],
                        "url": c["repo_url"],
                        "time": "",
                        "summary": c["desc"],
                        "lang": c["lang"],
                        "stars": c["stars"],
                    })
            except Exception:
                pass

    return results[:limit]


# ---------------------------------------------------------------------------
# GitHub Trending via GraphQL API (more reliable, higher rate limit)
# ---------------------------------------------------------------------------
def fetch_github_trending_graphql(limit: int) -> list[dict]:
    """Fetch GitHub trending AI repos via GraphQL API with GH_TOKEN auth.

    Falls back to HTML scraping if no token or GraphQL fails.
    """
    token = os.environ.get("GH_TOKEN", "").strip()
    if not token:
        print("[GitHub] No GH_TOKEN, falling back to HTML scraping", file=sys.stderr)
        return fetch_github_trending_html(limit)

    query = """
    {
      search(query: "stars:>5000 pushed:>%s", type: REPOSITORY, first: %d) {
        nodes {
          ... on Repository {
            nameWithOwner
            url
            description
            primaryLanguage { name }
            stargazers { totalCount }
          }
        }
      }
    }
    """ % (datetime.now().strftime("%Y-%m-%d"), limit)

    try:
        resp = requests.post(
            "https://api.github.com/graphql",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={"query": query},
            timeout=20,
        )
        if resp.status_code != 200:
            print(f"[GitHub GraphQL] HTTP {resp.status_code}, falling back to HTML", file=sys.stderr)
            return fetch_github_trending_html(limit)

        data = resp.json()
        nodes = data.get("data", {}).get("search", {}).get("nodes", [])
        results = []
        for node in nodes:
            desc = node.get("description") or ""
            if not matches_ai(desc):
                continue
            results.append({
                "source": "GitHub Trending",
                "category": "tools",
                "title": node.get("nameWithOwner", "").split("/")[-1],
                "url": node.get("url", ""),
                "time": "",
                "summary": desc[:300],
                "lang": node.get("primaryLanguage", {}).get("name", "") or "",
                "stars": str(node.get("stargazers", {}).get("totalCount", 0)),
            })
        return results
    except Exception as e:
        print(f"[GitHub GraphQL] Error: {e}, falling back to HTML", file=sys.stderr)
        return fetch_github_trending_html(limit)


def fetch_github_trending(limit: int) -> list[dict]:
    """Fetch GitHub trending AI repos. Prefers GraphQL if token available."""
    return fetch_github_trending_graphql(limit)


def fetch_hf_papers(limit: int) -> list[dict]:
    """Fetch daily papers from HuggingFace via their public API."""
    try:
        result = subprocess.run(
            [sys.executable, "-c", """
import json, sys, requests
try:
    resp = requests.get('https://huggingface.co/api/daily_papers', timeout=30)
    resp.raise_for_status()
    data = resp.json()
    papers = []
    for item in data[:int(sys.argv[1])]:
        p = item.get('paper', {})
        papers.append({
            'source': 'HuggingFace Papers',
            'category': 'research',
            'title': p.get('title', ''),
            'url': f"https://huggingface.co/papers/{p.get('id', '')}",
            'time': p.get('publishedAt', ''),
            'summary': (p.get('summary', '') or '')[:500],
            'heat': str(p.get('upvotes', 0)),
            'github_url': f"https://arxiv.org/abs/{p.get('id', '')}",
        })
    print(json.dumps(papers, ensure_ascii=False))
except Exception as e:
    print(f'[HF Papers] Error: {e}', file=sys.stderr)
    print('[]')
""", str(limit)],
            capture_output=True, text=True, timeout=120,
        )
        if result.returncode != 0:
            print(f"[HF] fetch failed: {result.stderr}", file=sys.stderr)
            return []
        papers = json.loads(result.stdout)
        return papers[:limit]
    except subprocess.TimeoutExpired:
        print("[HF] fetch timed out", file=sys.stderr)
        return []
    except Exception as e:
        print(f"[HF] Error: {e}", file=sys.stderr)
        return []


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="AI Daily Newsletter - News Fetcher")
    parser.add_argument("--hours", type=int, default=24, help="Time window in hours (default: 24)")
    parser.add_argument("--limit", type=int, default=20, help="Max entries per source (default: 20)")
    parser.add_argument("--outdir", type=str, help="Save JSON to directory instead of stdout")
    args = parser.parse_args()

    cutoff = datetime.now(timezone.utc) - timedelta(hours=args.hours)
    all_entries = []
    source_count = 0

    # --- Phase 1: Concurrent RSS fetch ---
    print(f"[INFO] Fetching {len(RSS_SOURCES)} RSS sources (window: {args.hours}h)...", file=sys.stderr)
    with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
        futures = {
            executor.submit(fetch_rss, src, cutoff, args.limit): src["name"]
            for src in RSS_SOURCES
        }
        for future in concurrent.futures.as_completed(futures):
            name = futures[future]
            try:
                entries = future.result()
                if entries:
                    source_count += 1
                    all_entries.extend(entries)
                    print(f"  [RSS] {name}: {len(entries)} entries", file=sys.stderr)
                else:
                    print(f"  [RSS] {name}: 0 entries", file=sys.stderr)
            except Exception as e:
                print(f"  [RSS] {name}: error - {e}", file=sys.stderr)

    # --- Phase 2: HN, GitHub, HF, LinuxDo, Reddit, Twitter (concurrent) ---
    print("[INFO] Fetching HN, GitHub Trending, HF Papers, LinuxDo, Reddit, Twitter...", file=sys.stderr)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        hn_future = executor.submit(fetch_hn, cutoff, args.limit)
        gh_future = executor.submit(fetch_github_trending, args.limit)
        hf_future = executor.submit(fetch_hf_papers, args.limit)
        linuxdo_future = executor.submit(fetch_linuxdo, cutoff, args.limit)
        reddit_future = executor.submit(fetch_reddit, ["MachineLearning", "artificial"], cutoff, args.limit)
        twitter_future = executor.submit(fetch_twitter, cutoff, args.limit)

        for name, future in [
            ("HN", hn_future),
            ("GitHub", gh_future),
            ("HF Papers", hf_future),
            ("LinuxDo", linuxdo_future),
            ("Reddit", reddit_future),
            ("Twitter", twitter_future),
        ]:
            try:
                entries = future.result()
                if entries:
                    source_count += 1
                    all_entries.extend(entries)
                    print(f"  [{name}] {len(entries)} entries", file=sys.stderr)
                else:
                    print(f"  [{name}] 0 entries", file=sys.stderr)
            except Exception as e:
                print(f"  [{name}] error - {e}", file=sys.stderr)

    # --- Deduplicate by URL hash ---
    seen_urls = set()
    unique_entries = []
    for entry in all_entries:
        url = entry.get("url", "")
        if url:
            url_hash = hash(url)
            if url_hash not in seen_urls:
                seen_urls.add(url_hash)
                unique_entries.append(entry)
            # else skip duplicate URL
        else:
            unique_entries.append(entry)
    all_entries = unique_entries

    # --- Sort by time descending ---
    all_entries.sort(key=lambda x: x.get("time", ""), reverse=True)

    # --- Output ---
    output = json.dumps(all_entries, ensure_ascii=False, indent=2)
    stats = f"[DONE] {source_count} sources | {len(all_entries)} entries (deduped)"
    print(stats, file=sys.stderr)

    if args.outdir:
        os.makedirs(args.outdir, exist_ok=True)
        date_str = datetime.now().strftime("%Y-%m-%d")
        filepath = os.path.join(args.outdir, f"ai-news-{date_str}.json")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"[SAVED] {filepath}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
