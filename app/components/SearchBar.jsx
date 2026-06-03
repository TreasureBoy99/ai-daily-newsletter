'use client';

import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative flex-grow lg:max-w-xs">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
        <Search className="w-4 h-4" />
      </span>
      <input
        type="text"
        placeholder="搜索标题、关键字、信息源..."
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
        className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-editorial-accent bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
      />
    </div>
  );
}
