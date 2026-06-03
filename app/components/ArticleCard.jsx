'use client';

import { Star, MessageSquare, BookOpen, ChevronRight, Globe, HelpCircle } from 'lucide-react';
import { formatTimeAgo, CATEGORIES_CONFIG } from '../lib/utils';

function getDomainIcon(url) {
  if (!url) return HelpCircle;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('github')) return Globe;
    if (host.includes('reddit')) return MessageSquare;
    if (host.includes('arxiv') || host.includes('huggingface')) return BookOpen;
    if (host.includes('venturebeat') || host.includes('techcrunch') || host.includes('theverge')) return Globe;
  } catch (e) {}
  return HelpCircle;
}

export default function ArticleCard({ article }) {
  const cat = article.category || 'all';
  const catConfig = CATEGORIES_CONFIG[cat] || CATEGORIES_CONFIG.all;
  const catColor = catConfig.color;
  const SourceIcon = getDomainIcon(article.url);
  const isGithub = article.source === 'GitHub Trending';
  const isHN = article.source === 'Hacker News';
  const isHF = article.source === 'HuggingFace Papers';

  return (
    <article className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative flex flex-col justify-between">
      <div className="space-y-3">
        {/* Meta Header */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
              <SourceIcon className="w-3.5 h-3.5 text-slate-500" />
            </span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">{article.source}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">{formatTimeAgo(article.time)}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 ${catColor}`}>
              <span>{catConfig.label}</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug hover:text-editorial-accent dark:hover:text-red-400 transition-colors">
          <a href={article.url} target="_blank" rel="noreferrer" className="hover:underline outline-none">
            {article.title}
          </a>
        </h3>

        {/* Summary */}
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-justify line-clamp-4">
          {article.summary || '今日此栏目无详细描述摘要，您可以点击右下方阅读原文浏览完整内容。'}
        </p>
      </div>

      {/* Card Footer Detail Metrics */}
      <div className="border-t border-slate-100 dark:border-slate-800 mt-4 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {isGithub && (article.lang || article.stars) ? (
          <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
            {article.lang && <span className="inline-flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block mr-1.5" />{article.lang}</span>}
            {article.stars && <span className="inline-flex items-center"><Star className="w-3.5 h-3.5 text-amber-500 mr-1 fill-amber-500" />{article.stars} Stars</span>}
          </div>
        ) : isHN && article.heat ? (
          <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
            <span className="inline-flex items-center text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
              {article.heat} points
            </span>
            {article.hn_url && <a href={article.hn_url} target="_blank" rel="noreferrer" className="hover:underline flex items-center"><MessageSquare className="w-3.5 h-3.5 mr-1" />查看讨论</a>}
          </div>
        ) : isHF ? (
          <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
            {article.heat && <span className="inline-flex items-center text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold">{article.heat} upvotes</span>}
            {article.github_url && <a href={article.github_url} target="_blank" rel="noreferrer" className="hover:underline flex items-center"><BookOpen className="w-3.5 h-3.5 mr-1" />论文 Arxiv</a>}
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}

        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center space-x-1 text-xs font-semibold text-editorial-accent hover:text-editorial-accentHover dark:text-red-400 dark:hover:text-red-300 transition-colors self-end"
        >
          <span>阅读原文</span>
          <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
