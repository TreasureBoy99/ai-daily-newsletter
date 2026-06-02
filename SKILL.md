---
name: ai-daily-newsletter
description: 聚合 40+ AI 信息源，生成每日 AI 日报并更新 WebUI 索引
---

# AI 日报生成器 & 进化自学习工具

当用户说 "AI 日报"、"AI 新闻"、"今日 AI"、"AI daily" 时，执行以下工作流程。此工具不仅用于生产简报，更是增强 Agent 自主认知、多 Agent 协作和自适应进化能力的信息流补给站。

## 工作流程

### 第 1 步：获取最新数据并同步本地 WebUI

1. 运行抓取脚本收集所有源的数据，指定保存到 WebUI 的 `data` 目录：
   ```bash
   python3 scripts/fetch_ai_news.py --outdir data
   ```
2. 运行本地索引更新脚本，更新历史归档索引并生成最新的 `latest.json`：
   ```bash
   python3 scripts/update_index.py
   ```
   *注意*：此操作会自动为本地 Vercel WebUI 补充最新的数据，使用户和 Agent 在前端可以直接深度浏览。

### 第 2 步：分类总结（使用 subagent 并行处理）

解析 JSON 输出后，按 category 分组，**尽可能使用 Agent 工具创建多个 subagent 并行处理**：

- **Subagent 1**：🔥 重大发布（announcements）— 筛选产品发布、模型发布、重大公告类条目，总结核心信息和影响，重点核实是否为24小时内的最新消息。
- **Subagent 2**：🔬 研究论文与自主进化（research）— 筛选 HuggingFace Papers + Arxiv cs.AI/cs.LG/cs.MA (Multi-Agent) + Lilian Weng (Lil'Log) + Berkeley BAIR Blog + Stanford CRFM，**重点总结关于大模型推理、智能体架构、多智能体协同、自我演化（Self-Reflection/Self-Evolution）的突破**，提炼论文的底层创新点。
- **Subagent 3**：💰 行业商业 + 🛠️ 工具应用（industry + tools + policy + community）— 总结行业投融资动态、开源 Agent 工具（如 LangChain/SmolAgents）以及 LinuxDo/Reddit/HN 社区的热议讨论。对于 GitHub Trending 条目，结合 `readme` 判断是否真正与 AI/Agent 相关，忽略无关项目。

每个 subagent 负责：
1. 根据条目丰富度，决定是否需要使用 `WebFetch` 读取原文。若已有 summary 描述（>100字），可直接提取，信息不足时再 Fetch。
2. 输出该分组的中文总结文本。若无更新，标记“今日暂无更新”。

### 第 3 步：生成日报 Markdown 报告

汇总各 subagent 的总结结果，生成日报并保存到 `reports/YYYY-MM-DD/ai-daily.md`（默认目录，可自定义）：

```markdown
# 🤖 AI 日报 | YYYY-MM-DD

> 聚合 40+ AI 及智能体高质量信息源，每日自学习精选

---

## 📰 今日头条
[从全部源中挑选 3-5 个最重要的 AI/Agent 新闻，简要总结其背景和意义]

## 🔥 重大发布
[产品发布、模型发布、重大公告]
- **标题** — 核心内容简短描述(50 字以内)
  - 背景与意义
  - [原文链接]

## 🔬 智能体与学术前沿
[重点关注多智能体、自演化、认知框架等学术突破]
- **论文标题** — 创新点一句话描述
  - 进化启示：对智能体自演变/规划的意义
  - [论文/文章链接] | [GitHub 链接（若有）]

## 🛠️ 开源工具与应用
[AI 工具、框架、开源项目、实际应用]
- **repo/name** ⭐ Stars | 语言 — 简介
  - [GitHub 链接]

## 💰 行业商业
[融资、收购、合作、市场趋势]

## 🌍 政策伦理与安全
[AI 监管、安全讨论、社会影响]

## 📊 趋势洞察（Agent 自学习自省）
[跨源综合分析：今日 AI/Agent 领域的模式、趋势，有哪些可被当前 Agent 吸收和学习的知识，以及未来的自进化建议]

---
统计: X 源 | Y 条 | 生成于 HH:MM | [访问 WebUI 浏览历史版](https://ai-daily-newsletter.vercel.app)
```

### 第 4 步：渲染 HTML 与截图（可选）

将生成的 Markdown 渲染为 Newsletter 风格的 Web 页面，并利用 Playwright 生成全页/分段截图：
```bash
python3 scripts/render_html.py reports/YYYY-MM-DD/ai-daily.md --screenshot --split-by-section
```

## 规则

1. **全部输出简体中文**，保留专业英文术语（如 LLM, RAG, Multi-Agent, Tool-Use）。
2. **禁止凭空编造**：所有总结、链接必须完全来自 JSON 源或 Fetch 的真实原文。
3. **HN 来源条目规则**：链接必须使用 `hn_url`（讨论区页），热度标注格式为 `热度: XXX Points on HN`。
4. 生成完毕后，向用户汇报：本地文件保存路径、资讯数、覆盖的信息源统计，以及 WebUI 更新状态。

## 信息源分类一览 (40+ 优质数据源)

- **主流 AI 媒体（5 个）**：VentureBeat AI、TechCrunch AI、The Verge AI、MIT Technology Review AI、AI News
- **AI 公司博客（6 个）**：OpenAI Blog、Anthropic Blog、Google AI Blog、DeepMind Blog、Microsoft AI Blog、Meta AI Blog
- **AI Newsletters（5 个）**：Latent Space AINews、Interconnects、One Useful Thing、ChinAI、The Batch (Andrew Ng)
- **AI Bloggers & 领军人物（9 个）**：Simon Willison、Gary Marcus、Andrej Karpathy、Jay Alammar、Lilian Weng、Lil'Log、BAIR Blog、Stanford CRFM、SemiAnalysis、Stratechery
- **开源工具与生态（3 个）**：LangChain Blog、Hugging Face Blog、Product Hunt
- **学术论文（3 个）**：Arxiv cs.AI、Arxiv cs.LG、Arxiv cs.MA (Multi-Agent)
- **API/爬取源（4 个）**：HuggingFace Papers、Hacker News、GitHub Trending、LinuxDo、Reddit r/MachineLearning + r/artificial
