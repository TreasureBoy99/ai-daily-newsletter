# 🤖 AI Daily Newsletter

聚合 25+ AI 信息源，自动生成每日 AI 新闻简报。支持 RSS、Hacker News、GitHub Trending、HuggingFace Papers、LinuxDo 和 Reddit。

[English](./README.en.md)

## 功能特性

- **25+ 数据源**：主流 AI 媒体、公司博客、 newsletters、论文、社区
- **AI 关键词过滤**：自动过滤非 AI 相关内容
- **多平台支持**：RSS、Hacker News Algolia API、网页抓取
- **Cloudflare 绕过**：LinuxDo/Reddit 使用 curl 绕过 TLS 指纹
- **并行抓取**：多线程并发抓取，速度快
- **时间窗口过滤**：只保留最近 N 小时的内容
- **JSON 输出**：标准化格式，方便后续处理

## 数据源

### AI 新闻（RSS）
- VentureBeat AI、TechCrunch AI、The Verge AI、MIT Technology Review AI、AI News

### AI 公司博客
- OpenAI Blog、Anthropic Blog、Google AI Blog、DeepMind Blog、Microsoft AI Blog、Meta AI Blog

### AI Newsletters
- Latent Space AINews、Interconnects、One Useful Thing、ChinAI、The Batch

### AI Bloggers
- Simon Willison、Gary Marcus

### 论文
- Arxiv cs.AI、Arxiv cs.LG、HuggingFace Papers

### 社区
- Hacker News（Algolia API + AI 关键词）
- GitHub Trending（AI 相关项目）
- **LinuxDo**（新增，中文技术社区）
- **Reddit r/MachineLearning + r/artificial**（新增，国际 AI 社区）

### 产品
- Product Hunt

## 安装

```bash
pip install -r requirements.txt
```

## 使用方法

### 基本用法

```bash
# 抓取最近 24 小时的所有 AI 新闻
python3 scripts/fetch_ai_news.py

# 抓取最近 48 小时的内容
python3 scripts/fetch_ai_news.py --hours 48

# 每个源最多抓取 30 条
python3 scripts/fetch_ai_news.py --limit 30

# 保存到文件
python3 scripts/fetch_ai_news.py --outdir ./output
```

### OpenClaw Skill 集成

将 `ai-daily-newsletter` skill 安装到 OpenClaw workspace：

```bash
cp -r ai-daily-newsletter ~/.openclaw/workspace/skills/
```

在 OpenClaw 中说以下关键词即可触发：
- "AI 日报"
- "AI 新闻"
- "今日 AI"
- "AI daily"

## 输出格式

```json
[
  {
    "source": "VentureBeat AI",
    "category": "industry",
    "title": "OpenAI 发布 GPT-5",
    "url": "https://venturebeat.com/...",
    "time": "2026-05-25T10:00:00Z",
    "summary": "..."
  },
  {
    "source": "Hacker News",
    "category": "community",
    "title": "Show HN: 本地运行 LLM 的新方法",
    "url": "https://news.ycombinator.com/item?id=...",
    "time": "2026-05-25T09:30:00Z",
    "heat": "342",
    "hn_url": "https://news.ycombinator.com/item?id=..."
  }
]
```

### Category 分类体系

| Category | 含义 |
|----------|------|
| `announcements` | 产品发布、模型发布、重大公告 |
| `research` | 学术突破、研究论文、新技术 |
| `industry` | 融资、收购、合作、市场趋势 |
| `tools` | AI 工具、框架、开源项目、实际应用 |
| `policy` | AI 监管、安全讨论、社会影响 |
| `community` | HN/Reddit/社区热议 |

## 环境要求

- Python 3.10+
- 需要 `curl` 命令（用于 LinuxDo 和 Reddit）

## License

MIT