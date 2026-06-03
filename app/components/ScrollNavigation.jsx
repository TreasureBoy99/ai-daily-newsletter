'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';

export default function ScrollNavigation({ visible, onScrollTop, onScrollBottom }) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col space-y-2.5 z-40 animate-fade-in">
      <button
        onClick={onScrollTop}
        className="p-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-lg border border-slate-200 dark:border-slate-800 transition-all hover:scale-110 active:scale-95 outline-none cursor-pointer group"
        title="回到顶部"
      >
        <ArrowUp className="w-4 h-4 group-hover:text-editorial-accent" />
      </button>
      <button
        onClick={onScrollBottom}
        className="p-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-lg border border-slate-200 dark:border-slate-800 transition-all hover:scale-110 active:scale-95 outline-none cursor-pointer group"
        title="回到底部"
      >
        <ArrowDown className="w-4 h-4 group-hover:text-editorial-accent" />
      </button>
    </div>
  );
}
