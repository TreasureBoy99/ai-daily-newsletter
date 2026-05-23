# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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