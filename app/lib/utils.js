// Shared date formatting utilities used across components
export const formatDateShort = (dateString) => {
  if (!dateString) return '';
  try {
    const [, month, day] = dateString.split('-');
    return `${month}月${day}日`;
  } catch (e) {
    return dateString;
  }
};

export const formatDateHuman = (dateString) => {
  if (!dateString) return '加载中...';
  try {
    const [year, month, day] = dateString.split('-');
    const d = new Date(year, month - 1, day);
    const weekDay = d.toLocaleDateString('zh-CN', { weekday: 'long' });
    return `AI 简报 | ${year}年${month}月${day}日 ${weekDay}`;
  } catch (e) {
    return `AI 简报 | ${dateString}`;
  }
};

export const formatTimeAgo = (timeString) => {
  if (!timeString) return '时间未知';
  try {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHr < 24) return `${diffHr} 小时前`;

    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  } catch (e) {
    return '不久前';
  }
};

export const CATEGORIES_CONFIG = {
  all: { label: '全部', icon: 'ListFilter', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  announcements: { label: '🔥 重大发布', icon: 'Flame', color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-100 dark:border-red-900/30' },
  research: { label: '🔬 研究论文', icon: 'BookOpen', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-100 dark:border-purple-900/30' },
  tools: { label: '🛠️ 工具应用', icon: 'Wrench', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30' },
  industry: { label: '💰 行业商业', icon: 'Coins', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30' },
  policy: { label: '🌍 政策伦理', icon: 'Globe', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30' },
  community: { label: '💬 社区热议', icon: 'MessagesSquare', color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-100 dark:border-pink-900/30' }
};
