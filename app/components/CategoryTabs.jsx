'use client';

import {
  ListFilter, Flame, BookOpen, Wrench, Coins, Globe, MessagesSquare,
  Search
} from 'lucide-react';

const ICON_MAP = {
  ListFilter,
  Flame,
  BookOpen,
  Wrench,
  Coins,
  Globe,
  MessagesSquare,
};

const CATEGORIES_CONFIG = [
  { key: 'all', label: '全部', icon: 'ListFilter', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  { key: 'announcements', label: '🔥 重大发布', icon: 'Flame', color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-100 dark:border-red-900/30' },
  { key: 'research', label: '🔬 研究论文', icon: 'BookOpen', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-100 dark:border-purple-900/30' },
  { key: 'tools', label: '🛠️ 工具应用', icon: 'Wrench', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30' },
  { key: 'industry', label: '💰 行业商业', icon: 'Coins', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30' },
  { key: 'policy', label: '🌍 政策伦理', icon: 'Globe', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30' },
  { key: 'community', label: '💬 社区热议', icon: 'MessagesSquare', color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-100 dark:border-pink-900/30' },
];

export default function CategoryTabs({ currentCategory, onCategoryChange, getCategoryCount }) {
  return (
    <div className="flex items-center overflow-x-auto space-x-1.5 pb-2 lg:pb-0 scrollbar-none">
      {CATEGORIES_CONFIG.map(({ key, label, icon, color }) => {
        const IconComponent = ICON_MAP[icon];
        const isActive = currentCategory === key;
        const count = getCategoryCount(key);
        return (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              isActive
                ? 'bg-editorial-accent text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span>{label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              isActive ? 'bg-white/20 text-white' : 'bg-slate-200/60 dark:bg-slate-700 text-slate-400 dark:text-slate-400'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
