'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MobileDrawer from './components/MobileDrawer';
import CategoryTabs from './components/CategoryTabs';
import SearchBar from './components/SearchBar';
import ArticleList from './components/ArticleList';
import ScrollNavigation from './components/ScrollNavigation';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import SubscribeModal from './components/SubscribeModal';
import { formatDateHuman } from './lib/utils';

export default function Home() {
  // State
  const [allDates, setAllDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [articles, setArticles] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [visibleLimit, setVisibleLimit] = useState(10);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  // Handle ?subscribed=true from email confirmation redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscribed') === 'true') {
      setToast('订阅成功！欢迎开启每日 AI 情报之旅 🎉');
      setTimeout(() => setToast(null), 5000);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);,

  // Theme init
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved === 'dark' || (!saved && systemDark);
    setIsDarkMode(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  // Load archive index
  useEffect(() => {
    async function loadIndex() {
      try {
        const res = await fetch('/api/news/dates');
        if (!res.ok) throw new Error('Failed to fetch archive index');
        const dates = await res.json();
        setAllDates(dates);

        const params = new URLSearchParams(window.location.search);
        const dateParam = params.get('date');
        if (dateParam && dates.includes(dateParam)) {
          setSelectedDate(dateParam);
        } else if (dates.length > 0) {
          setSelectedDate(dates[0]);
        } else {
          loadLatest();
        }
      } catch (err) {
        console.error('Error loading index:', err);
        loadLatest();
      }
    }
    loadIndex();
  }, []);

  // Scroll monitor
  useEffect(() => {
    const onScroll = () => setShowScrollButtons(window.scrollY > 250);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch articles when date changes
  useEffect(() => {
    if (!selectedDate) return;
    setVisibleLimit(10);

    const url = new URL(window.location.href);
    url.searchParams.set('date', selectedDate);
    window.history.pushState({ path: url.href }, '', url.href);

    async function loadArticles() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/news/${selectedDate}`);
        if (!res.ok) throw new Error('Failed to fetch articles');
        setArticles(await res.json());
      } catch (err) {
        console.error('Error loading articles:', err);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadArticles();
  }, [selectedDate]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleLimit(10);
  }, [currentCategory, searchQuery]);

  // Helpers
  function loadLatest() {
    setIsLoading(true);
    fetch('/api/news/index')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setArticles(data);
        setSelectedDate(new Date().toISOString().split('T')[0]);
      })
      .catch(() => setArticles([]))
      .finally(() => setIsLoading(false));
  }

  function toggleTheme() {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setToast('链接复制成功，快去分享给好友吧！');
        setTimeout(() => setToast(null), 2500);
      })
      .catch(console.error);
  }

  function getCategoryCount(cat) {
    return cat === 'all' ? articles.length : articles.filter(a => a.category === cat).length;
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function scrollToBottom() {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchCat = currentCategory === 'all' || a.category === currentCategory;
      const matchSearch = !searchQuery ||
        a.title?.toLowerCase().includes(searchQuery) ||
        a.summary?.toLowerCase().includes(searchQuery) ||
        a.source?.toLowerCase().includes(searchQuery);
      return matchCat && matchSearch;
    });
  }, [articles, currentCategory, searchQuery]);

  const renderedArticles = useMemo(() => filteredArticles.slice(0, visibleLimit), [filteredArticles, visibleLimit]);
  const sourceCount = useMemo(() => new Set(articles.map(a => a.source)).size, [articles]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen transition-colors duration-200 text-slate-800 dark:text-slate-100 bg-editorial-light dark:bg-editorial-dark antialiased pb-12">

        <Header
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          onCalendarClick={() => setIsMobileDrawerOpen(true)}
          onSubscribeClick={() => setIsSubscribeModalOpen(true)}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            <Sidebar
              allDates={allDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            <main className="col-span-1 md:col-span-3 space-y-6">

              {/* Newsletter Header */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-editorial-accent to-rose-400" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/30 text-editorial-accent border border-red-100 dark:border-red-900/50 mb-2">
                      <span className="w-2 h-2 rounded-full bg-editorial-accent mr-1.5 animate-pulse" />
                      最新精选简报
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif">
                      {formatDateHuman(selectedDate)}
                    </h2>
                    <div className="text-xs text-slate-400 mt-2 flex flex-wrap gap-4 items-center">
                      <span>包含 {articles.length} 条精选情报</span>
                      <span>•</span>
                      <span>深度解析 {sourceCount} 个权威渠道</span>
                    </div>
                  </div>
                  <button
                    onClick={copyShareLink}
                    className="inline-flex items-center space-x-1.5 text-xs bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3.5 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-700 font-medium self-start sm:self-center"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>分享此页</span>
                  </button>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-[4.1rem] z-30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                <CategoryTabs
                  currentCategory={currentCategory}
                  onCategoryChange={setCurrentCategory}
                  getCategoryCount={getCategoryCount}
                />
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>

              {/* Articles */}
              <ErrorBoundary>
                <ArticleList
                  filteredArticles={filteredArticles}
                  renderedArticles={renderedArticles}
                  visibleLimit={visibleLimit}
                  onLoadMore={() => setVisibleLimit(v => v + 10)}
                  isLoading={isLoading}
                />
              </ErrorBoundary>

            </main>
          </div>
        </div>

        <ScrollNavigation
          visible={showScrollButtons}
          onScrollTop={scrollToTop}
          onScrollBottom={scrollToBottom}
        />

        <Toast message={toast} />

        <SubscribeModal
          isOpen={isSubscribeModalOpen}
          onClose={() => setIsSubscribeModalOpen(false)}
        />

        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          allDates={allDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

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
    </ErrorBoundary>
  );
}
