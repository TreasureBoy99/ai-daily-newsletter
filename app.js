// AI Daily Newsletter - Core WebUI Application

document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        allDates: [],
        selectedDate: null,
        articles: [],
        currentCategory: 'all',
        searchQuery: '',
        darkMode: false
    };

    // DOM Elements
    const elements = {
        archiveList: document.getElementById('archive-list'),
        mobileArchiveList: document.getElementById('mobile-archive-list'),
        issueCount: document.getElementById('issue-count'),
        newsletterDate: document.getElementById('newsletter-date'),
        newsletterStats: document.getElementById('newsletter-stats'),
        newsContainer: document.getElementById('news-container'),
        searchInput: document.getElementById('search-input'),
        catFilters: document.querySelectorAll('.cat-filter-btn'),
        themeToggle: document.getElementById('theme-toggle'),
        shareBtn: document.getElementById('share-btn'),
        progressBar: document.getElementById('progress-bar'),
        mobileArchiveBtn: document.getElementById('mobile-archive-btn'),
        mobileArchiveDrawer: document.getElementById('mobile-archive-drawer'),
        closeDrawerBtn: document.getElementById('close-drawer-btn')
    };

    // Category configurations (labels, icons, tailwind styling)
    const categoriesConfig = {
        all: { label: '全部', icon: 'fa-layer-group', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
        announcements: { label: '🔥 重大发布', icon: 'fa-fire', color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-100 dark:border-red-900/30' },
        research: { label: '🔬 研究论文', icon: 'fa-microscope', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-100 dark:border-purple-900/30' },
        tools: { label: '🛠️ 工具应用', icon: 'fa-screwdriver-wrench', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30' },
        industry: { label: '💰 行业商业', icon: 'fa-coins', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30' },
        policy: { label: '🌍 政策伦理', icon: 'fa-globe', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30' },
        community: { label: '💬 社区热议', icon: 'fa-comments', color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-100 dark:border-pink-900/30' }
    };

    // Initialize application
    init();

    async function init() {
        initTheme();
        setupEventListeners();
        await loadArchiveIndex();
        
        // Handle URL parameters for deep-linking
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        
        if (dateParam && state.allDates.includes(dateParam)) {
            await selectDate(dateParam);
        } else if (state.allDates.length > 0) {
            await selectDate(state.allDates[0]);
        } else {
            // Fallback if index.json is empty or missing, try loading latest.json directly
            await loadLatestDirectly();
        }
    }

    // ---------------------------------------------------------------------------
    // Theme (Dark / Light Mode)
    // ---------------------------------------------------------------------------
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
            state.darkMode = true;
        } else {
            document.documentElement.classList.remove('dark');
            state.darkMode = false;
        }
    }

    function toggleTheme() {
        if (state.darkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            state.darkMode = false;
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            state.darkMode = true;
        }
    }

    // ---------------------------------------------------------------------------
    // Event Listeners
    // ---------------------------------------------------------------------------
    function setupEventListeners() {
        // Theme button
        elements.themeToggle.addEventListener('click', toggleTheme);

        // Category filter buttons
        elements.catFilters.forEach(button => {
            button.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-cat');
                setActiveCategory(category);
            });
        });

        // Search inputs
        elements.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase().trim();
            renderArticles();
        });

        // Share button
        elements.shareBtn.addEventListener('click', copyShareLink);

        // Mobile sidebar drawer
        elements.mobileArchiveBtn.addEventListener('click', openMobileDrawer);
        elements.closeDrawerBtn.addEventListener('click', closeMobileDrawer);
        elements.mobileArchiveDrawer.addEventListener('click', (e) => {
            if (e.target === elements.mobileArchiveDrawer) closeMobileDrawer();
        });
    }

    // ---------------------------------------------------------------------------
    // Data Fetching
    // ---------------------------------------------------------------------------
    async function loadArchiveIndex() {
        setProgressBar(20);
        try {
            const response = await fetch('data/index.json');
            if (!response.ok) throw new Error('Failed to load archive index');
            state.allDates = await response.json();
            
            elements.issueCount.textContent = `${state.allDates.length} 期`;
            renderArchiveList();
        } catch (error) {
            console.error('Error loading archive index:', error);
            elements.issueCount.textContent = '0 期';
            elements.archiveList.innerHTML = `
                <div class="text-xs text-slate-400 py-2">
                    <i class="fa-solid fa-triangle-exclamation mr-1 text-amber-500"></i>
                    未能加载历史归档
                </div>
            `;
        }
        setProgressBar(40);
    }

    async function loadLatestDirectly() {
        setProgressBar(50);
        try {
            const response = await fetch('data/latest.json');
            if (!response.ok) throw new Error('Failed to load latest.json');
            state.articles = await response.json();
            state.selectedDate = getTodayDateString();
            
            elements.newsletterDate.textContent = `今日精选简报 (${state.selectedDate})`;
            updateStatsAndRender();
        } catch (error) {
            showErrorState("无法获取任何 AI 新闻数据。请确保至少运行过一次抓取脚本。");
        }
        setProgressBar(100);
    }

    async function selectDate(date) {
        state.selectedDate = date;
        updateURLParameter('date', date);
        
        // Highlight active date in both lists
        highlightActiveDateElements();
        
        // Load news data for this date
        setProgressBar(60);
        try {
            renderLoadingSkeletons();
            const response = await fetch(`data/ai-news-${date}.json`);
            if (!response.ok) throw new Error(`Failed to fetch articles for ${date}`);
            state.articles = await response.json();
            
            // Format nice human-readable date
            elements.newsletterDate.textContent = formatDateHuman(date);
            updateStatsAndRender();
        } catch (error) {
            console.error(error);
            showErrorState(`无法加载 ${date} 的新闻简报。文件可能不存在或已损坏。`);
        }
        setProgressBar(100);
        closeMobileDrawer();
    }

    // ---------------------------------------------------------------------------
    // Render Functions
    // ---------------------------------------------------------------------------
    function renderArchiveList() {
        const createListHTML = (dates) => {
            if (dates.length === 0) {
                return `<div class="text-xs text-slate-400 py-2">暂无历史发布</div>`;
            }
            return dates.map(date => {
                const prettyDate = formatDateShort(date);
                return `
                    <button class="archive-date-btn w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all duration-200 text-left text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" data-date="${date}">
                        <div class="flex items-center space-x-2">
                            <i class="fa-regular fa-calendar-check text-slate-400"></i>
                            <span class="font-medium">${prettyDate}</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </button>
                `;
            }).join('');
        };

        const listHTML = createListHTML(state.allDates);
        elements.archiveList.innerHTML = listHTML;
        elements.mobileArchiveList.innerHTML = listHTML;

        // Add event listeners to newly generated buttons
        document.querySelectorAll('.archive-date-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const date = btn.getAttribute('data-date');
                selectDate(date);
            });
        });

        highlightActiveDateElements();
    }

    function highlightActiveDateElements() {
        document.querySelectorAll('.archive-date-btn').forEach(btn => {
            const date = btn.getAttribute('data-date');
            if (date === state.selectedDate) {
                btn.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
                btn.classList.add('bg-red-50', 'dark:bg-red-950/20', 'text-editorial-accent', 'dark:text-red-400', 'font-bold');
            } else {
                btn.classList.remove('bg-red-50', 'dark:bg-red-950/20', 'text-editorial-accent', 'dark:text-red-400', 'font-bold');
                btn.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
            }
        });
    }

    function updateStatsAndRender() {
        const sourceSet = new Set();
        state.articles.forEach(a => {
            if (a.source) sourceSet.add(a.source);
        });

        elements.newsletterStats.innerHTML = `
            <span class="inline-flex items-center mr-3"><i class="fa-solid fa-list mr-1"></i> ${state.articles.length} 条资讯</span>
            <span class="inline-flex items-center"><i class="fa-solid fa-database mr-1"></i> 覆盖 ${sourceSet.size} 个高质信息源</span>
        `;

        renderArticles();
    }

    function renderArticles() {
        // Filter articles by category and search query
        const filtered = state.articles.filter(article => {
            // Category filter
            const matchesCategory = state.currentCategory === 'all' || article.category === state.currentCategory;
            
            // Search query filter
            const matchesSearch = !state.searchQuery || 
                article.title?.toLowerCase().includes(state.searchQuery) ||
                article.summary?.toLowerCase().includes(state.searchQuery) ||
                article.source?.toLowerCase().includes(state.searchQuery);

            return matchesCategory && matchesSearch;
        });

        if (filtered.length === 0) {
            elements.newsContainer.innerHTML = `
                <div class="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                    <div class="text-4xl text-slate-300 dark:text-slate-700">🔍</div>
                    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">没有找到相关资讯</h3>
                    <p class="text-sm text-slate-400 max-w-sm mx-auto">
                        今日没有找到符合当前筛选条件“${state.currentCategory !== 'all' ? categoriesConfig[state.currentCategory].label : ''} ${state.searchQuery ? '"' + state.searchQuery + '"' : ''}”的内容。
                    </p>
                </div>
            `;
            return;
        }

        elements.newsContainer.innerHTML = filtered.map(article => {
            const cat = article.category || 'all';
            const catConfig = categoriesConfig[cat] || categoriesConfig.all;
            const domainIcon = getDomainIcon(article.url);
            
            // Extra metadata tags based on source
            let metricsHTML = '';
            
            if (article.source === 'GitHub Trending' && (article.lang || article.stars)) {
                metricsHTML = `
                    <div class="flex items-center space-x-3 text-xs text-slate-400 mt-2 font-mono">
                        ${article.lang ? `<span class="inline-flex items-center"><span class="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block mr-1.5"></span>${article.lang}</span>` : ''}
                        ${article.stars ? `<span class="inline-flex items-center"><i class="fa-solid fa-star text-amber-500 mr-1"></i>${article.stars} Stars</span>` : ''}
                    </div>
                `;
            } else if (article.source === 'Hacker News' && article.heat) {
                metricsHTML = `
                    <div class="flex items-center space-x-3 text-xs text-slate-400 mt-2 font-mono">
                        <span class="inline-flex items-center text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                            <i class="fa-solid fa-fire mr-1"></i>${article.heat} points
                        </span>
                        ${article.hn_url ? `<a href="${article.hn_url}" target="_blank" class="hover:underline text-slate-400"><i class="fa-regular fa-comment mr-1"></i>查看讨论</a>` : ''}
                    </div>
                `;
            } else if (article.source === 'HuggingFace Papers') {
                metricsHTML = `
                    <div class="flex items-center space-x-3 text-xs text-slate-400 mt-2 font-mono">
                        ${article.heat ? `<span class="inline-flex items-center text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold"><i class="fa-solid fa-circle-up mr-1"></i>${article.heat} upvotes</span>` : ''}
                        ${article.github_url ? `<a href="${article.github_url}" target="_blank" class="hover:underline text-slate-400"><i class="fa-solid fa-book mr-1"></i>Arxiv</a>` : ''}
                    </div>
                `;
            }

            // Summary description or generic fallback
            const summaryText = article.summary ? article.summary.trim() : '目前无此条目的详细摘要，请点击阅读原文获取更多细节。';

            return `
                <article class="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 relative group flex flex-col justify-between">
                    <div class="space-y-3">
                        <!-- Top Meta Header -->
                        <div class="flex items-center justify-between text-xs">
                            <div class="flex items-center space-x-2">
                                <span class="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                                    <i class="${domainIcon} text-slate-500 dark:text-slate-400"></i>
                                </span>
                                <span class="font-semibold text-slate-600 dark:text-slate-300">${article.source}</span>
                            </div>
                            
                            <div class="flex items-center space-x-2">
                                <span class="text-slate-400">${formatTimeAgo(article.time)}</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${catConfig.color}">
                                    <i class="fa-solid ${catConfig.icon} mr-1"></i>${catConfig.label}
                                </span>
                            </div>
                        </div>

                        <!-- Article Title -->
                        <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-editorial-accent dark:group-hover:text-red-400 transition-colors">
                            <a href="${article.url}" target="_blank" class="hover:underline outline-none">
                                ${article.title}
                            </a>
                        </h3>

                        <!-- Article Summary -->
                        <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-justify line-clamp-3">
                            ${summaryText}
                        </p>
                    </div>

                    <!-- Footer Details / Actions -->
                    <div class="border-t border-slate-100 dark:border-slate-800 mt-4 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        ${metricsHTML || '<div class="hidden sm:block"></div>'}
                        
                        <a href="${article.url}" target="_blank" class="inline-flex items-center justify-center space-x-1 text-xs font-semibold text-editorial-accent hover:text-editorial-accentHover dark:text-red-400 dark:hover:text-red-300 transition-colors self-end">
                            <span>阅读原文</span>
                            <i class="fa-solid fa-arrow-right-to-bracket text-[10px]"></i>
                        </a>
                    </div>
                </article>
            `;
        }).join('');
    }

    function renderLoadingSkeletons() {
        elements.newsContainer.innerHTML = Array(3).fill(0).map(() => `
            <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                        <div class="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div>
                    </div>
                    <div class="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
                </div>
                <div class="h-6 w-3/4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div class="space-y-2">
                    <div class="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
                    <div class="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded"></div>
                </div>
                <div class="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded"></div>
            </div>
        `).join('');
    }

    function showErrorState(message) {
        elements.newsletterDate.textContent = "Error";
        elements.newsletterStats.textContent = "";
        elements.newsContainer.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                <div class="text-4xl text-red-500">⚠️</div>
                <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">加载数据失败</h3>
                <p class="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                    ${message}
                </p>
                <button onclick="window.location.reload()" class="mt-2 text-xs bg-editorial-accent hover:bg-editorial-accentHover text-white px-4 py-2 rounded-xl font-bold shadow transition-all">
                    重新加载
                </button>
            </div>
        `;
    }

    // ---------------------------------------------------------------------------
    // Helper & utility functions
    // ---------------------------------------------------------------------------
    function setActiveCategory(category) {
        state.currentCategory = category;
        elements.catFilters.forEach(btn => {
            const btnCat = btn.getAttribute('data-cat');
            if (btnCat === category) {
                btn.classList.remove('bg-slate-50', 'hover:bg-slate-100', 'dark:bg-slate-800', 'dark:hover:bg-slate-700', 'text-slate-600', 'dark:text-slate-300');
                btn.classList.add('bg-editorial-accent', 'text-white');
            } else {
                btn.classList.add('bg-slate-50', 'hover:bg-slate-100', 'dark:bg-slate-800', 'dark:hover:bg-slate-700', 'text-slate-600', 'dark:text-slate-300');
                btn.classList.remove('bg-editorial-accent', 'text-white');
            }
        });
        renderArticles();
    }

    function getDomainIcon(url) {
        if (!url) return 'fa-solid fa-globe';
        try {
            const host = new URL(url).hostname.toLowerCase();
            if (host.includes('github')) return 'fa-brands fa-github';
            if (host.includes('reddit')) return 'fa-brands fa-reddit';
            if (host.includes('twitter') || host.includes('x.com')) return 'fa-brands fa-twitter';
            if (host.includes('arxiv')) return 'fa-regular fa-file-pdf';
            if (host.includes('huggingface')) return 'fa-solid fa-face-smile';
            if (host.includes('venturebeat')) return 'fa-solid fa-building';
            if (host.includes('techcrunch')) return 'fa-solid fa-bolt';
            if (host.includes('theverge')) return 'fa-solid fa-newspaper';
            if (host.includes('technologyreview')) return 'fa-solid fa-graduation-cap';
            if (host.includes('openai') || host.includes('anthropic') || host.includes('google') || host.includes('microsoft')) return 'fa-solid fa-microchip';
        } catch (e) {}
        return 'fa-solid fa-globe';
    }

    function formatTimeAgo(timeString) {
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
            
            // Otherwise show date
            return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        } catch (e) {
            return '不久前';
        }
    }

    function formatDateShort(dateString) {
        try {
            const [year, month, day] = dateString.split('-');
            return `${month}月${day}日 (${year})`;
        } catch (e) {
            return dateString;
        }
    }

    function formatDateHuman(dateString) {
        try {
            const [year, month, day] = dateString.split('-');
            const d = new Date(year, month - 1, day);
            const weekDay = d.toLocaleDateString('zh-CN', { weekday: 'long' });
            return `AI 简报 | ${year}年${month}月${day}日 ${weekDay}`;
        } catch (e) {
            return `AI 简报 | ${dateString}`;
        }
    }

    function getTodayDateString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function updateURLParameter(key, value) {
        const url = new URL(window.location.href);
        url.searchParams.set(key, value);
        window.history.pushState({ path: url.href }, '', url.href);
    }

    function setProgressBar(pct) {
        elements.progressBar.style.width = `${pct}%`;
        if (pct >= 100) {
            setTimeout(() => {
                elements.progressBar.style.opacity = '0';
                setTimeout(() => {
                    elements.progressBar.style.width = '0%';
                    elements.progressBar.style.opacity = '1';
                }, 300);
            }, 500);
        }
    }

    function copyShareLink() {
        const link = window.location.href;
        navigator.clipboard.writeText(link).then(() => {
            // Show custom toast notification
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg z-50 transition-opacity duration-300 flex items-center space-x-2 border border-slate-700';
            toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-500 text-sm"></i><span>页面链接已复制，去分享吧！</span>`;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 2500);
        }).catch(err => {
            console.error('Copy link failed:', err);
        });
    }

    function openMobileDrawer() {
        elements.mobileArchiveDrawer.classList.remove('pointer-events-none');
        elements.mobileArchiveDrawer.classList.add('opacity-100');
        elements.mobileArchiveDrawer.querySelector('.transform').classList.remove('translate-x-full');
    }

    function closeMobileDrawer() {
        elements.mobileArchiveDrawer.classList.add('pointer-events-none');
        elements.mobileArchiveDrawer.classList.remove('opacity-100');
        elements.mobileArchiveDrawer.querySelector('.transform').classList.add('translate-x-full');
    }
});
