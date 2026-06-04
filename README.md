# 🤖 AI Daily Newsletter

聚合 40+ 顶级 AI、Agent 及前沿研究信息源，自动生成每日 AI 新闻简报，支持邮件订阅推送 + 优雅的 WebUI 阅读器。

[![Vercel](https://img.shields.io/badge/Vercel-部署-brightgreen)](https://vercel.com/new/clone?repository-url=https://github.com/adminlove520/ai-daily-newsletter)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

[🌐 在线访问](https://ai-daily-newsletter.vercel.app) · [📧 订阅简报](#-邮件订阅) · [📖 English](./README.en.md)

---

## 🌟 功能特性

- **40+ 顶级数据源**：主流 AI 媒体、公司博客、顶级 Newsletters、大 V 博客、研究机构、开源生态、Multi-Agent 论文。
- **每日自动更新**：GitHub Actions 每日凌晨自动抓取，完全零服务器成本（Serverless）。
- **优雅的 WebUI**：报刊风格 SPA，支持历史归档日历、深色模式、客户端模糊搜索、分类过滤。
- **邮件订阅推送**（SaaS）：邮箱订阅 → 确认邮件 → 每日自动发送，带退订链接。
- **AI 智能过滤**：正则关键词精准过滤无关条目，保持简报高含金量。
- **Bypass Cloudflare**：LinuxDo/Reddit 智能 curl 绕过 TLS 指纹防护。
- **并行抓取**：ThreadPoolExecutor 多线程并发，极速收集全部信息流。

---

## 🚀 快速上手

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 抓取每日新闻简报

```bash
# 抓取最近 24 小时并输出到 stdout
python scripts/fetch_ai_news.py

# 抓取最近 48 小时，输出到 data/ 目录
python scripts/fetch_ai_news.py --hours 48 --outdir data

# 更新历史索引
python scripts/update_index.py
```

### 3. 本地预览 WebUI

```bash
npm install
npm run dev
# 打开 http://localhost:3000
```

---

## 📧 邮件订阅（SaaS 功能）

### 用户订阅流程

1. 点击网页右上角 **📮 订阅** 按钮
2. 输入邮箱地址提交
3. 查收确认邮件，点击确认链接
4. 每日凌晨自动收到当日精选简报

### 部署订阅功能

#### 方式一：Vercel 一键部署（推荐）

1. Fork 本仓库
2. 在 [Resend](https://resend.com) 注册，获取 API Key
3. Vercel 导入仓库 → Environment Variables → 添加 `RESEND_API_KEY`
4. Deploy 完成，`data/subscribers.json` 会由 Vercel FS 自动持久化

> **注意**：Vercel Hobby 计划的 Serverless Function 有 100MB 临时磁盘写入限制。
> `data/subscribers.json` 和 `data/confirmations.json` 文件较轻，足够数千订阅者使用。
> 如需更大规模，推荐升级至 Vercel Pro 或切换至 Upstash Redis 存储。

#### 方式二：自托管（Docker）

```bash
docker build -t ai-newsletter .
docker run -d -p 3000:3000 \
  -e RESEND_API_KEY=re_xxxxx \
  -v $(pwd)/data:/app/data \
  ai-newsletter
```

#### 方式三：配合 GitHub Actions（免费方案）

订阅数据保存在 GitHub 仓库的 `data/subscribers.json`，每日 Action 读取并发送邮件：

1. Fork 并开启仓库
2. Settings → Secrets → 添加 `RESEND_API_KEY`
3. GitHub Actions 会自动在每日更新后发送邮件

---

## 🛠 部署

### Vercel WebUI 部署

本项目专为 Vercel 静态托管 + Serverless Functions 优化。

1. Fork 本项目
2. 登录 [Vercel](https://vercel.com)，导入你的 Fork 仓库
3. 点击 **Deploy**（无需 Build Step）
4. 启用 GitHub Actions 每日定时更新（`.github/workflows/daily_update.yml`）

### 订阅数据存储说明

| 存储方式 | 说明 |
|---------|------|
| Vercel 本地 FS | Hobby Plan 可用，适合 ~5000 订阅者 |
| Upstash Redis | 推荐生产环境，零维护 |
| GitHub Actions | 免费，通过 commit 存储订阅数据 |

---

## 📂 目录结构

```
.
├── .github/workflows/
│   └── daily_update.yml     # GitHub Actions 每日自动抓取 + 发邮件
├── app/
│   ├── api/
│   │   ├── subscribe/       # POST 订阅接口
│   │   ├── confirm/         # GET 确认订阅 token
│   │   ├── unsubscribe/     # POST 退订接口
│   │   └── news/            # 现有新闻 API
│   ├── components/
│   │   ├── SubscribeModal.jsx  # 订阅弹窗组件
│   │   └── ...
│   └── page.js
├── data/
│   ├── subscribers.json     # 订阅者数据（首次订阅后自动创建）
│   ├── confirmations.json   # 待确认 token（24h 过期）
│   ├── index.json
│   └── latest.json
├── scripts/
│   ├── fetch_ai_news.py     # 多线程抓取核心
│   ├── update_index.py      # 索引更新
│   └── send_emails.py       # 邮件发送脚本
├── requirements.txt
└── vercel.json
```

---

## 📡 数据源（40+）

覆盖：OpenAI/Anthropic/DeepMind/Google AI Blog、Latent Space/The Batch/Lil'Log、HuggingFace Blog、Arxiv cs.MA、GitHub Trending、Hacker News、LinuxDo、Reddit r/MachineLearning 等。

详见上方数据源列表。

---

## 🤖 OpenClaw / Hermes Agent 集成

```bash
cp SKILL.md ~/.openclaw/workspace/skills/ai-daily-newsletter.md
```

---

## 🔧 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `RESEND_API_KEY` | 订阅功能必需 | [Resend](https://resend.com) API Key |
| `UPSTASH_REDIS_REST_URL` | 可选 | 替代本地 FS 的 Redis 存储 |
| `UPSTASH_REDIS_REST_TOKEN` | 可选 | Upstash Redis Token |

---

## 📝 License

MIT License.
