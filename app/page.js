'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Search, Share2, Moon, Sun, Flame, 
  BookOpen, Cpu, Wrench, Coins, Globe, MessagesSquare, 
  Star, MessageSquare, Newspaper, X, ChevronRight, CornerDownRight, ListFilter, HelpCircle
} from 'lucide-react';

const CATEGORIES_CONFIG = {
  all: { label: '全部', icon: ListFilter, color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  announcements: { label: '🔥 重大发布', icon: Flame, color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-100 dark:border-red-900/30' },
  research: { label: '🔬 研究论文', icon: BookOpen, color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-100 dark:border-purple-900/30' },
  tools: { label: '🛠️ 工具应用', icon: Wrench, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30' },
  industry: { label: '💰 行业商业', icon: Coins, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30' },
  policy: { label: '🌍 政策伦理', icon: Globe, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30' },
  community: { label: '💬 社区热议', icon: MessagesSquare, color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-100 dark:border-pink-900/30' }
};

export default function Home() {
  // State variables
  const [allDates, setAllDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [articles, setArticles] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Initialize Theme and load Archive Index
  useEffect(() => {
    // 1. Theme initialization
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkActive = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    setIsDarkMode(darkActive);
    if (darkActive) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Load Archive Index
    async function loadIndex() {
      try {
        const res = await fetch('/data/index.json');
        if (!res.ok) throw new Error('Failed to fetch archive index');
        const dates = await res.json();
        setAllDates(dates);

        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');

        if (dateParam && dates.includes(dateParam)) {
          setSelectedDate(dateParam);
        } else if (dates.length > 0) {
          setSelectedDate(dates[0]);
        } else {
          // If no index dates, try loading latest directly
          loadLatest();
        }
      } catch (err) {
        console.error('Error loading index:', err);
        // Fallback to try loading latest
        loadLatest();
      }
    }
    loadIndex();
  }, []);

  // Fetch articles when selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;

    // Update URL parameter
    const url = new URL(window.location.href);
    url.searchParams.set('date', selectedDate);
    window.history.pushState({ path: url.href }, '', url.href);

    async function loadArticles() {
      setIsLoading(true);
      try {
        const res = await fetch(`/data/ai-news-${selectedDate}.json`);
        if (!res.ok) throw new Error('Failed to fetch articles');
        const data = await res.json();
        setArticles(data);
      } catch (err) {
        console.error('Error loading articles:', err);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadArticles();
  }, [selectedDate]);

  // Fallback to load latest.json directly
  async function loadLatest() {
    setIsLoading(true);
    try {
      const res = await fetch('/data/latest.json');
      if (!res.ok) throw new Error('Failed to fetch latest articles');
      const data = await res.json();
      setArticles(data);
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Failed to load latest.json directly:', err);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Dark Mode Toggle
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Helper: format dates
  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    try {
      const [, month, day] = dateString.split('-');
      return `${month}月${day}日`;
    } catch (e) {
      return dateString;
    }
  };

  const formatDateHuman = (dateString) => {
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

  const formatTimeAgo = (timeString) => {
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

  const getDomainIcon = (url) => {
    if (!url) return HelpCircle;
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (host.includes('github')) return Cpu;
      if (host.includes('reddit')) return MessagesSquare;
      if (host.includes('arxiv') || host.includes('huggingface')) return BookOpen;
      if (host.includes('venturebeat') || host.includes('techcrunch') || host.includes('theverge')) return Newspaper;
    } catch (e) {}
    return Globe;
  };

  // Filtered articles logic
  const filteredArticles = articles.filter(article => {
    const matchesCategory = currentCategory === 'all' || article.category === currentCategory;
    const matchesSearch = !searchQuery || 
      article.title?.toLowerCase().includes(searchQuery) ||
      article.summary?.toLowerCase().includes(searchQuery) ||
      article.source?.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Unique sources count
  const sourceCount = new Set(articles.map(a => a.source)).size;

  // Copy share link and toast
  const copyShareLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setToast('链接复制成功，快去分享给好友吧！');
      setTimeout(() => setToast(null), 2500);
    }).catch(err => {
      console.error('Copy link failed:', err);
    });
  };

  // Count items per category (for badges on tabs)
  const getCategoryCount = (cat) => {
    if (cat === 'all') return articles.length;
    return articles.filter(a => a.category === cat).length;
  };

  return (
    <div className="min-h-screen transition-colors duration-200 text-slate-800 dark:text-slate-100 bg-editorial-light dark:bg-editorial-dark antialiased">
      
      {/* Navigation Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 bg-white/95 dark:bg-editorial-dark/95 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <div className="flex items-center space-x-3">
              <span className="text-2xl sm:text-3xl">🤖</span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-serif">
                  AI Daily <span className="text-editorial-accent">Newsletter</span>
                </h1>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                  每日 AI & 智能体前沿情报流
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsMobileDrawerOpen(true)}
                className="p-2 text-slate-500 hover:text-editorial-accent md:hidden transition-colors"
                title="历史归档"
              >
                <Calendar className="w-5 h-5" />
              </button>

              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all duration-200"
                title="切换主题"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <a 
                href="https://github.com/adminlove520/ai-daily-newsletter" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="GitHub"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.18-1.305.247-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Desktop Sidebar (Historical Archive) */}
          <aside className="hidden md:block md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 max-h-[80vh] overflow-y-auto sticky top-24 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-editorial-accent" />
                <span>历史归档</span>
              </h2>
              <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                {allDates.length} 期
              </span>
            </div>
            
            <div className="space-y-1">
              {allDates.map(date => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all text-left ${
                    date === selectedDate 
                      ? 'bg-red-50 dark:bg-red-950/20 text-editorial-accent dark:text-red-400 font-bold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span>{formatDateShort(date)}</span>
                  </div>
                  <ChevronRight className={`w-3 h-3 transition-opacity ${date === selectedDate ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              ))}
            </div>
          </aside>

          {/* Core Content Area */}
          <main className="col-span-1 md:col-span-3 space-y-6">
            
            {/* Header Newsletter Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-editorial-accent to-rose-400" />
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/30 text-editorial-accent border border-red-100 dark:border-red-900/50 mb-2">
                    <Newspaper className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                    最新精选简报
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif">
                    {formatDateHuman(selectedDate)}
                  </h2>
                  <div className="text-xs text-slate-400 mt-2 flex flex-wrap gap-4 items-center">
                    <span className="inline-flex items-center"><CornerDownRight className="w-3.5 h-3.5 mr-1 text-slate-300" /> 包含 {articles.length} 条精选情报</span>
                    <span>•</span>
                    <span>深度解析 {sourceCount} 个权威渠道</span>
                  </div>
                </div>
                
                <button 
                  onClick={copyShareLink}
                  className="inline-flex items-center space-x-1.5 text-xs bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3.5 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-700 font-medium self-start sm:self-center"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>分享此页</span>
                </button>
              </div>
            </div>

            {/* Toolbar for Filtering & Searching */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-[4.1rem] z-30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
              {/* Categories Tabs Scroll container */}
              <div className="flex items-center overflow-x-auto space-x-1.5 pb-2 lg:pb-0 scrollbar-none">
                {Object.entries(CATEGORIES_CONFIG).map(([key, config]) => {
                  const IconComponent = config.icon;
                  const isActive = currentCategory === key;
                  const count = getCategoryCount(key);
                  return (
                    <button
                      key={key}
                      onClick={() => setCurrentCategory(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                        isActive 
                          ? 'bg-editorial-accent text-white shadow-sm' 
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      <span>{config.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/60 dark:bg-slate-700 text-slate-400 dark:text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Keyword Search Input */}
              <div className="relative flex-grow lg:max-w-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  placeholder="搜索标题、关键字、信息源..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toLowerCase().trim())}
                  className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-editorial-accent bg-slate-50 dark:bg-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
                />
              </div>
            </div>

            {/* Articles Feed */}
            <div className="space-y-4">
              {isLoading ? (
                // Skeletons State
                Array(3).fill(0).map((_, i) => (
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
                ))
              ) : filteredArticles.length === 0 ? (
                // No Results State
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                  <div className="text-4xl">🔍</div>
                  <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">没有找到相关资讯</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    未能在今天的新闻中过滤出匹配当前检索词的内容，请尝试清除搜索框或选择其他栏目。
                  </p>
                </div>
              ) : (
                // Article Cards
                filteredArticles.map((article, i) => {
                  const cat = article.category || 'all';
                  const catConfig = CATEGORIES_CONFIG[cat] || CATEGORIES_CONFIG.all;
                  const IconComp = catConfig.icon;
                  const SourceIcon = getDomainIcon(article.url);
                  const isGithub = article.source === 'GitHub Trending';
                  const isHN = article.source === 'Hacker News';
                  const isHF = article.source === 'HuggingFace Papers';

                  return (
                    <article 
                      key={i} 
                      className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative flex flex-col justify-between"
                    >
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
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 ${catConfig.color}`}>
                              <IconComp className="w-3 h-3" />
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
                })
              )}
            </div>

          </main>
        </div>
      </div>

      {/* Floating Share Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg z-50 border border-slate-700 flex items-center space-x-2 animate-bounce">
          <span className="text-emerald-500">✔</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Mobile Drawer Slide-out Calendar */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end md:hidden">
          <div className="w-64 max-w-xs bg-white dark:bg-slate-900 shadow-xl flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-editorial-accent" />
                <span>历史归档列表</span>
              </h3>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-1">
              {allDates.map(date => (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date);
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all text-left ${
                    date === selectedDate 
                      ? 'bg-red-50 dark:bg-red-950/20 text-editorial-accent dark:text-red-400 font-bold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span>{formatDateShort(date)}</span>
                  </div>
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-16 bg-white dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            本简报基于 Next.js & Tailwind CSS 开发，全部数据完全由 GitHub Actions 每日凌晨自动定时运行抓取，依托 Vercel Edge Serverless 架构极致分发。
          </p>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-center space-x-1.5">
            <span>Made with ❤️ for AI Enthusiasts</span>
            <span>•</span>
            <a href="https://github.com/adminlove520/ai-daily-newsletter" target="_blank" rel="noreferrer" className="hover:text-editorial-accent underline">Source Code</a>
          </p>
        </div>
      </footer>

    </div>
  );
}
