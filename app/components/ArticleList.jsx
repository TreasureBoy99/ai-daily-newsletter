'use client';

import { Sparkles } from 'lucide-react';
import ArticleCard from './ArticleCard';

export default function ArticleList({ filteredArticles, renderedArticles, visibleLimit, onLoadMore, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-6 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredArticles.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <div className="text-4xl">🔍</div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">没有找到相关资讯</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          未能在今天的新闻中过滤出匹配当前检索词的内容，请尝试清除搜索框或选择其他栏目。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {renderedArticles.map((article, i) => (
          <ArticleCard key={i} article={article} />
        ))}
      </div>

      {filteredArticles.length > visibleLimit ? (
        <div className="flex flex-col items-center py-6 space-y-2 border-t border-slate-200/60 dark:border-slate-800 mt-6">
          <p className="text-xs text-slate-400 font-medium">
            已加载 {visibleLimit} 条，共计 {filteredArticles.length} 条
          </p>
          <button
            onClick={onLoadMore}
            className="px-6 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all shadow-sm flex items-center space-x-2 cursor-pointer outline-none hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-editorial-accent animate-pulse" />
            <span>加载更多资讯</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-8 text-xs text-slate-400 font-medium flex items-center justify-center space-x-1.5">
          <span>🎉 已为您呈现全部 {filteredArticles.length} 条精彩资讯</span>
        </div>
      )}
    </div>
  );
}
