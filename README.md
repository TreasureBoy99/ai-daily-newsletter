# 🤖 AI Daily Newsletter

聚合 40+ 顶级 AI、Agent 及前沿研究信息源，自动生成每日 AI 新闻简报，并同步推送到基于 Vercel 的 WebUI 门户。支持 RSS、Hacker News、GitHub Trending、HuggingFace Papers、LinuxDo 和 Reddit。

[English](./README.en.md) | [访问 Vercel 线上 WebUI](https://ai-daily-newsletter.vercel.app)

---

## 🌟 功能特性

- **40+ 顶级数据源**：主流 AI 媒体、公司博客、顶级 Newsletters、大 V 博客、研究机构、开源项目生态、以及多智能体与自主进化论文源。
- **每日自动流更新**：内置 GitHub Actions 每日凌晨自动抓取、更新、并推送最新 JSON 及索引数据，实现 **零服务器成本 (Serverless)** 的自动聚合流。
- **优雅的 WebUI 阅读器**：专为 Vercel 设计的 **Editorial (报刊风格) SPA 网页前端**。支持：
  - 📆 历史期数日历归档与深色模式。
  - 🔍 客户端级极速模糊搜索及 Category 过滤。
  - 🔗 深度链接锚定（支持特定日期分享，例如 `?date=2026-06-02`）。
- **AI 智能过滤与关键词匹配**：通过正则表达式自适应匹配，精准过滤无关条目，保持简报的高含金量。
- **Bypass Cloudflare**：LinuxDo/Reddit 智能调用 `curl` 绕过 TLS 指纹防护，保障数据源的长期可用性。
- **并行抓取机制**：利用 `ThreadPoolExecutor` 多线程并发抓取，极速收集全部信息流。
- **OpenClaw & Hermes 智能体自学习集成**：内嵌专门针对 **Hermes OpenClaw Agent** 深度学习和自主演化能力设计的 Skill。

---

## 📂 核心目录结构

```text
├── .github/workflows/
│   └── daily_update.yml      # GitHub Actions 每日自动抓取与构建流
├── data/
│   ├── index.json            # 历史期数索引（用于前端日历）
│   ├── latest.json           # 最新一期新闻简报
│   └── ai-news-YYYY-MM-DD.json # 每日历史 JSON 数据
├── scripts/
│   ├── fetch_ai_news.py      # 多线程 AI 简报抓取核心脚本
│   ├── update_index.py       # JSON 索引更新与 latest 生成脚本
│   └── render_html.py        # Newsletter 渲染与分节截图工具
├── index.html                # Vercel WebUI 报刊风格 HTML 门户
├── app.js                    # WebUI 极速客户端交互逻辑
├── vercel.json               # Vercel Caching & Access Control 配置
├── SKILL.md                  # 专为 OpenClaw/Hermes 智能体优化的自学习 Skill
└── requirements.txt          # Python 依赖包
```

---

## 📡 数据源注册列表 (40+ 优质数据源)

### 🔬 智能体与自主进化 (AI Agents & Self-Evolution)
- **Lil'Log (Lilian Weng)**: 智能体系统架构与自省认知的前沿殿堂级博客
- **Arxiv cs.MA**: 多智能体系统 (Multi-Agent Systems) 及自主演化顶级论文源
- **LangChain Blog**: 开源智能体应用与生产力范式博客
- **Hugging Face Blog**: 开源生态及小型智能体（SmolAgents）指南
- **BAIR (Berkeley AI Research)**: 智能体规划、强化学习与决策体系
- **Stanford CRFM (Center for Research on Foundation Models)**: 基础模型、Agentic 能力测评

### 📰 AI 前沿新闻与媒体
- VentureBeat AI、TechCrunch AI、The Verge AI、MIT Technology Review AI、AI News

### 🏢 AI 领军企业博客
- OpenAI Blog、Anthropic Blog、Google AI Blog、DeepMind Blog、Microsoft AI Blog、Meta AI Blog

### 📬 AI 顶级 Newsletters
- Latent Space AINews、Interconnects (Nathan Lambert)、One Useful Thing (Ethan Mollick)、ChinAI (Jeff Ding)、The Batch (Andrew Ng)

### ✍️ AI 思想家与领头人
- Simon Willison、Gary Marcus、Andrej Karpathy、Jay Alammar

### 🚀 社区与产品
- Hacker News (Algolia API + 关键词精准过滤)
- GitHub Trending (每日全球 AI 开源项目，含 README 自动抓取分析)
- LinuxDo (热帖抓取，国内最活跃的技术极客社区)
- Reddit r/MachineLearning + r/artificial
- Product Hunt

---

## 🚀 快速上手

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 抓取每日新闻简报

```bash
# 抓取最近 24 小时的 AI 简报并输出到 stdout
python3 scripts/fetch_ai_news.py

# 抓取最近 48 小时并将生成的 JSON 存储到 data/ 目录
python3 scripts/fetch_ai_news.py --hours 48 --outdir data
```

### 3. 本地刷新 WebUI 数据索引

当你在本地抓取了新的 JSON 简报后，可以运行：
```bash
python3 scripts/update_index.py
```
这会自动重新生成 `data/index.json` 和 `data/latest.json`。打开 `index.html` 即可在本地 WebUI 预览最新内容！

---

## 🤖 OpenClaw Skill 智能集成

将本项目安装为 **OpenClaw / Hermes Agent** 的技能：

```bash
cp SKILL.md ~/.openclaw/workspace/skills/ai-daily-newsletter.md
```

当你说出以下指令时，Agent 会自主启动多 subagents 并行分析流程：
- *"获取今日 AI 日报"*
- *"看看最近的研究论文和智能体前沿"*
- *"今日 AI"*

---

## 🛠️ Vercel WebUI 部署

本项目专为 Vercel 静态托管进行优化，无需任何 Build Step。
1. 在 GitHub 上 Fork 本项目。
2. 登录 Vercel，导入你的 Fork 仓库。
3. 点击 **Deploy**。Vercel 会自动读取 `vercel.json` 的缓存控制首部，提供全球毫秒级响应。
4. 在 GitHub Actions 启用每日定时更新任务（`.github/workflows/daily_update.yml`），自动为你更新 JSON，网页无需重新部署即可静默热更新！

---

## 📝 License

MIT License.
