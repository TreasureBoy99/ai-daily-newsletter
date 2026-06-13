#!/usr/bin/env python3
"""
AI Daily Newsletter — MCP Server

将新闻抓取能力暴露为 MCP 工具，供 AI 助手（OpenClaw、Claude Desktop 等）直接调用。

Tools:
  - adn_fetch_news     抓取多源 AI 新闻 → JSON
  - adn_fetch_papers   抓取 HuggingFace 论文 → JSON
  - adn_render         从 JSON 渲染 HTML 日报
  - adn_run_daily      一键：抓取 + 渲染 → HTML 文件
  - adn_list_sources   列出所有信息源

Usage:
  python mcp_server.py                    # stdio 模式（MCP 客户端启动）
  python mcp_server.py --transport http --port 8080  # HTTP 模式

OpenClaw 配置 (openclaw.json):
  "mcp": {
    "servers": {
      "ai-daily-newsletter": {
        "command": "python",
        "args": ["C:/path/to/mcp_server.py"]
      }
    }
  }
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from mcp.server.fastmcp import FastMCP

SCRIPTS_DIR = Path(__file__).parent / "scripts"

# -----------------------------------------------------------------------
# MCP Server
# -----------------------------------------------------------------------
mcp = FastMCP(
    "ai-daily-newsletter",
    instructions="AI Daily Newsletter — 抓取 30+ 源的 AI 新闻并生成日报。",
)


# -----------------------------------------------------------------------
# Tool: adn_list_sources
# -----------------------------------------------------------------------
@mcp.tool()
def adn_list_sources() -> str:
    """列出所有配置的信息源。"""
    sys.path.insert(0, str(SCRIPTS_DIR))
    from fetch_ai_news import RSS_SOURCES

    sources = []
    for s in RSS_SOURCES:
        sources.append(f"📡 {s['name']} ({s['category']}) — {s['url']}")

    extra = [
        "📰 Hacker News (Algolia API)",
        "🐙 GitHub Trending (scrape)",
        "📄 HuggingFace Papers (API)",
        "💬 LinuxDo (RSS via curl)",
        "💬 Reddit r/MachineLearning + r/artificial (RSS)",
        "🐦 Twitter/X (fxtwitter RSS or autocli)",
    ]
    sources.extend(extra)

    return f"共 {len(sources)} 个信息源:\n\n" + "\n".join(sources)


# -----------------------------------------------------------------------
# Tool: adn_fetch_news
# -----------------------------------------------------------------------
@mcp.tool()
def adn_fetch_news(hours: int = 24, limit: int = 20) -> str:
    """
    抓取多源 AI 新闻，返回 JSON。

    Args:
        hours: 时间窗口（小时），默认 24
        limit: 每个源最大条数，默认 20
    """
    result = subprocess.run(
        [sys.executable, str(SCRIPTS_DIR / "fetch_ai_news.py"),
         "--hours", str(hours), "--limit", str(limit)],
        capture_output=True, text=True, timeout=300,
        cwd=str(SCRIPTS_DIR),
    )

    if result.returncode != 0:
        return f"❌ 抓取失败:\nstderr: {result.stderr}"

    try:
        data = json.loads(result.stdout)
        stats = {
            "total": len(data),
            "sources": list(set(item.get("source", "?") for item in data)),
            "categories": list(set(item.get("category", "?") for item in data)),
        }
        return json.dumps(
            {"stats": stats, "items": data},
            ensure_ascii=False, indent=2,
        )
    except json.JSONDecodeError:
        return f"❌ JSON 解析失败:\n{result.stdout[:500]}\n\nstderr: {result.stderr}"


# -----------------------------------------------------------------------
# Tool: adn_fetch_papers
# -----------------------------------------------------------------------
@mcp.tool()
def adn_fetch_papers(limit: int = 10) -> str:
    """
    抓取 HuggingFace 每日热门论文。

    Args:
        limit: 最大论文数，默认 10
    """
    result = subprocess.run(
        [sys.executable, str(SCRIPTS_DIR / "fetch_hf_papers.py"),
         "--limit", str(limit)],
        capture_output=True, text=True, timeout=120,
        cwd=str(SCRIPTS_DIR),
    )

    if result.returncode != 0:
        return f"❌ 抓取失败:\n{result.stderr}"

    return result.stdout


# -----------------------------------------------------------------------
# Tool: adn_render
# -----------------------------------------------------------------------
@mcp.tool()
def adn_render(json_data: str, output_path: str = "") -> str:
    """
    从 JSON 数据渲染 HTML 日报。

    Args:
        json_data: 新闻 JSON 字符串（adn_fetch_news 的输出）
        output_path: HTML 输出路径，默认输出到 stdout
    """
    args = [sys.executable, str(SCRIPTS_DIR / "render_html.py")]
    if output_path:
        args.extend(["--output", output_path])

    result = subprocess.run(
        args,
        input=json_data,
        capture_output=True, text=True, timeout=60,
        cwd=str(SCRIPTS_DIR),
    )

    if result.returncode != 0:
        return f"❌ 渲染失败:\n{result.stderr}"

    if output_path:
        return f"✅ HTML 已保存到 {output_path}"
    else:
        return result.stdout


# -----------------------------------------------------------------------
# Tool: adn_run_daily
# -----------------------------------------------------------------------
@mcp.tool()
def adn_run_daily(hours: int = 24, limit: int = 20, output_dir: str = "") -> str:
    """
    一键生成日报：抓取新闻 + 渲染 HTML。

    Args:
        hours: 时间窗口，默认 24
        limit: 每源最大条数，默认 20
        output_dir: 输出目录，默认 ./output
    """
    if not output_dir:
        output_dir = str(Path(__file__).parent / "output")

    os.makedirs(output_dir, exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")
    json_path = os.path.join(output_dir, f"ai-news-{date_str}.json")
    html_path = os.path.join(output_dir, f"ai-news-{date_str}.html")

    # Step 1: fetch
    fetch_result = subprocess.run(
        [sys.executable, str(SCRIPTS_DIR / "fetch_ai_news.py"),
         "--hours", str(hours), "--limit", str(limit),
         "--outdir", output_dir],
        capture_output=True, text=True, timeout=300,
        cwd=str(SCRIPTS_DIR),
    )

    if fetch_result.returncode != 0:
        return f"❌ 抓取失败:\n{fetch_result.stderr}"

    # 读取抓取的 JSON
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            news_data = f.read()
    except FileNotFoundError:
        return f"❌ 抓取结果未找到: {json_path}"

    news_json = json.loads(news_data)

    # Step 2: render
    render_result = subprocess.run(
        [sys.executable, str(SCRIPTS_DIR / "render_html.py"),
         "--output", html_path],
        input=news_data,
        capture_output=True, text=True, timeout=60,
        cwd=str(SCRIPTS_DIR),
    )

    if render_result.returncode != 0:
        return f"⚠️ 渲染失败，但 JSON 已保存\nJSON: {json_path}\nError: {render_result.stderr}"

    # 统计
    sources = list(set(item.get("source", "?") for item in news_json))

    return (
        f"✅ 日报生成完成！\n\n"
        f"📊 统计:\n"
        f"  - 新闻数: {len(news_json)}\n"
        f"  - 信息源: {len(sources)} 个\n"
        f"  - 时间窗口: {hours}h\n\n"
        f"📁 文件:\n"
        f"  - JSON: {json_path}\n"
        f"  - HTML: {html_path}"
    )


# -----------------------------------------------------------------------
# Resources
# -----------------------------------------------------------------------
@mcp.resource("adn://sources")
def get_sources() -> str:
    """所有配置的信息源列表。"""
    return adn_list_sources()


@mcp.resource("adn://config")
def get_config() -> str:
    """当前配置信息。"""
    sys.path.insert(0, str(SCRIPTS_DIR))
    from fetch_ai_news import RSS_SOURCES

    return json.dumps({
        "rss_sources": len(RSS_SOURCES),
        "extra_sources": ["Hacker News", "GitHub Trending", "HuggingFace Papers",
                          "LinuxDo", "Reddit", "Twitter/X"],
        "twitter_mode": os.environ.get("TWITTER_SOURCE", "fxtwitter"),
        "github_token": "configured" if os.environ.get("GH_TOKEN") else "not set",
    }, ensure_ascii=False, indent=2)


# -----------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="AI Daily Newsletter MCP Server")
    parser.add_argument("--transport", choices=["stdio", "http"], default="stdio")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    if args.transport == "http":
        mcp.run(transport="http", port=args.port)
    else:
        mcp.run()


if __name__ == "__main__":
    main()
