import './globals.css'

export const metadata = {
  title: '🤖 AI Daily Newsletter - 每日 AI 新闻简报',
  description: '聚合 40+ 顶级 AI 前沿信息源，自动生成每日 AI 新闻并基于 Vercel 静态缓存托管。支持 RSS、HN、GitHub Trending、LinuxDo、HF 等。',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="transition-colors duration-200 ease-in-out antialiased">
        {children}
      </body>
    </html>
  )
}
