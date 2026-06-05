# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-06-05

### Added
- **Sophon 数据源**：AI 评估、模型、工具和论文追踪平台 (https://sophon.at/feed.xml)
- **60+ 新增订阅源**，总数从 40+ 扩展到 100+：
  - **AI 评估和基准**：LM Arena、Artificial Analysis、Papers with Code、MMLU、SWE Bench、HumanEval
  - **AI Agent 框架**：CrewAI、AutoGen、LlamaIndex、Haystack、DSPy
  - **向量数据库**：Pinecone、Weaviate、Qdrant、Milvus、ChromaDB、LanceDB
  - **AI 编程工具**：Cursor、Replit AI、GitHub Copilot、Codeium、Tabnine、Sourcegraph
  - **AI 可观测性**：Arize、Weights & Biases、Comet ML、MLflow、Neptune、ClearML、Helicone、Braintrust
  - **AI 部署平台**：Replicate、Fal.ai、Baseten、RunPod、Vast.ai、Lambda Labs、vLLM、Together AI
  - **AI 安全和对齐**：Alignment Forum、LessWrong、MIRI、EleutherAI、Conjecture、Redwood Research
  - **AI 投资机构**：a16z、Sequoia、Greylock
  - **更多研究机构**：Apple Research、Amazon Science、IBM Research、NVIDIA Research
  - **多模态 AI**：Stability AI、ElevenLabs
  - **更多媒体**：Wired AI、Axios AI、FT AI、Economist AI、Bloomberg AI

### Changed
- **并行抓取优化**：ThreadPoolExecutor max_workers 从 10 提升到 15
- **AI 关键词扩展**：新增 "Multi.*Agent"、"AutoGPT"、"LangChain"、"CrewAI"、"AutoGen"、"Sophon"、"Benchmark"、"Eval"、"Alignment"、"Safety"
- **README 更新**：更新数据源描述，反映 100+ 订阅源

### Fixed
- **DeepMind Blog URL 更新**：使用新的 `https://deepmind.google/blog/rss.xml`
- **OpenAI Blog URL 更新**：使用 `https://openai.com/blog/rss.xml`

## [1.1.0] - 2026-05-25

### Added
- **LinuxDo 数据源**：`https://linux.do/top.rss?period=daily`（中文技术社区热帖）
  - 使用 curl 绕过 Cloudflare TLS 指纹
  - 先尝试 top.rss（每日热帖），失败则 fallback 到 latest.rss
- **Reddit 数据源**：`r/MachineLearning` + `r/artificial`
  - 使用 curl 绕过 Reddit UA 限制
  - AI 关键词过滤 + 过滤 sticky posts
- **curl helper 函数**：\_curl_fetch()，用于绕过 Cloudflare/Reddit 的 TLS/UA 限制

### Changed
- `fetch_ai_news.py` 重构：内联 HuggingFace Papers 逻辑（原 subprocess 调用改为内嵌代码）
- Phase 2 扩展：新增 LinuxDo + Reddit 并行抓取（5 并发 → 原来 3 个 + 2 个新的）

## [1.0.0] - 2026-04-xx

### Added
- 初始版本，支持 20+ AI 数据源
- RSS、Hacker News、GitHub Trending、HuggingFace Papers
- AI 关键词过滤系统
- 并行抓取架构
- JSON 输出格式