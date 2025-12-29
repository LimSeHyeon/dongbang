class ReservationSchedule {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            isAdmin: false,
            showDates: false, // If true, shows the date numbers like index.html
            headerTitle: '', // Optional title override
            onWeekChange: null, // Callback when week changes
            ...options
        };

        if (!this.container) {
            console.error(`ReservationSchedule: Container #${containerId} not found`);
            return;
        }

        this.days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        this.fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        this.currentDate = new Date();
        
        // Initialize mobile tab index based on today
        const day = this.currentDate.getDay(); // 0=Sun, 1=Mon...6=Sat
        // Our grid is [Mon, Tue, Wed, Thu, Fri, Sat, Sun] indices 0..6
        this.activeMobileTabIndex = day === 0 ? 6 : day - 1;
        
        this.calculateWeekDates();

        // Render immediately
        this.render();

        // Add resize listener for responsive updates
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.render();
                // Ensure data is re-fetched/re-rendered if needed
                if (this.options.onWeekChange) {
                     this.options.onWeekChange(this.currentDate);
                }
            }, 200);
        });
    }

    calculateWeekDates() {
        // Calculate Monday of the current week
        const current = new Date(this.currentDate);
        const day = current.getDay(); // 0 is Sunday
        const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        
        const monday = new Date(current);
        monday.setDate(diff);

        this.weekDates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            this.weekDates.push(d);
        }
    }

    getMondayDate() {
        if (this.weekDates.length > 0) {
            return this.weekDates[0];
        }
        return new Date(); // Fallback
    }

    getFormattedDateRange() {
        if (!this.weekDates || this.weekDates.length === 0) return '';
        const start = this.weekDates[0];
        const end = this.weekDates[6];
        
        // Mobile check (simple generic check matching CSS)
        const isMobile = window.matchMedia('(max-aspect-ratio: 1/1), (max-width: 1024px)').matches;

        if (isMobile) {
             // Short format: 10.23 - 10.29
             const startStr = `${start.getMonth() + 1}.${start.getDate()}`;
             const endStr = `${end.getMonth() + 1}.${end.getDate()}`;
             return `${startStr} - ${endStr}`;
        }

        // Format: 10월 23일 - 10월 29일, 2023
        const startStr = `${start.getMonth() + 1}월 ${start.getDate()}일`;
        const endStr = `${end.getMonth() + 1}월 ${end.getDate()}일`;
        const year = end.getFullYear();
        
        return `${startStr} - ${endStr}, ${year}`;
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    render() {
        this.container.innerHTML = `
            ${this.renderHeader()}
            ${this.renderMobileTabs()}
            ${this.renderGrid()}
        `;
        this.attachEventListeners();
        this.updateMobileView();
    }

    renderMobileTabs() {
        // Only visible on mobile
        const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
        return `
            <div class="flex desktop:hidden overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2632] scrollbar-hide">
                ${dayNames.map((name, i) => `
                    <button data-tab-index="${i}" class="mobile-tab-btn flex-1 py-3 text-sm font-medium text-slate-500 relative whitespace-nowrap px-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        ${name}
                        ${i === this.activeMobileTabIndex ? '<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>' : ''}
                    </button>
                `).join('')}
            </div>
        `;
    }

    updateMobileView() {
        // Toggle columns based on active tab ONLY if mobile
        const isMobile = window.matchMedia('(max-aspect-ratio: 1/1), (max-width: 1024px)').matches;
        
        const cols = this.container.querySelectorAll('[id^="col-"], [id^="admin-col-"]');
        cols.forEach((col, i) => {
            if (isMobile) {
                if (i === this.activeMobileTabIndex) {
                    col.style.display = 'block';
                    col.style.width = '100%';
                } else {
                    col.style.display = 'none';
                }
            } else {
                col.style.display = 'block';
                col.style.width = ''; 
            }
        });

        // Hide regular header on mobile (tabs replace it)
        const headerContainer = this.container.querySelector('.days-header-container');
        if (headerContainer) {
             if (isMobile) {
                 headerContainer.style.display = 'none';
             } else {
                 if (headerContainer.classList.contains('grid')) headerContainer.style.display = 'grid';
                 else headerContainer.style.display = 'flex';
             }
        }

        // Update Tab Active State in DOM
        const tabs = this.container.querySelectorAll('.mobile-tab-btn');
        tabs.forEach((tab, i) => {
            if (i === this.activeMobileTabIndex) {
                tab.classList.add('text-primary', 'font-bold');
                tab.classList.remove('text-slate-500');
                if (!tab.querySelector('.bg-primary')) {
                    tab.innerHTML += '<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>';
                }
            } else {
                tab.classList.remove('text-primary', 'font-bold');
                tab.classList.add('text-slate-500');
                const indicator = tab.querySelector('.bg-primary');
                if (indicator) indicator.remove();
            }
        });
    }

    switchMobileTab(index) {
        this.activeMobileTabIndex = index;
        this.updateMobileView();
    }

    attachEventListeners() {
        const allButtons = Array.from(this.container.querySelectorAll('button:not(.mobile-tab-btn)'));
        const prev = allButtons.find(b => b.innerHTML.includes('chevron_left'));
        const next = allButtons.find(b => b.innerHTML.includes('chevron_right'));
        const today = allButtons.find(b => b.innerText.includes('오늘') || b.dataset.action === 'today');
        const refresh = allButtons.find(b => b.id === 'refresh-btn');

        if (prev) prev.onclick = () => this.changeWeek(-7);
        if (next) next.onclick = () => this.changeWeek(7);
        if (today) today.onclick = () => this.goToToday();
        if (refresh && this.options.onWeekChange) {
            refresh.onclick = () => {
                this.options.onWeekChange(this.currentDate);
                const icon = refresh.querySelector('.material-symbols-outlined');
                if(icon) {
                    icon.style.transition = 'transform 0.5s ease';
                    icon.style.transform = 'rotate(360deg)';
                    setTimeout(() => icon.style.transform = '', 500);
                }
            };
        }

        // Mobile Tabs
        const tabBtns = this.container.querySelectorAll('.mobile-tab-btn');
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.tabIndex);
                this.switchMobileTab(idx);
            };
        });
    }

    renderGrid() {
        const { isAdmin } = this.options;
        const colPrefix = isAdmin ? 'admin-col-' : 'col-';
        
        return `
            <div class="flex-1 overflow-auto custom-scrollbar relative bg-white dark:bg-[#1a2632]">
                <div class="w-full h-full flex flex-col ${isAdmin ? '' : 'pb-10'}">
                    ${this.renderDaysHeader()}
                    
                    <div class="relative flex flex-1">
                        <!-- Time Column -->
                        <div class="w-10 md:w-20 shrink-0 flex flex-col bg-white dark:bg-[#1a2632] border-r border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-400 dark:text-slate-500 text-right select-none ${isAdmin ? 'sticky left-0 z-10' : ''}">
                             ${this.renderTimeSlots()}
                        </div>
                        
                        <!-- Slots Grid -->
                        <div class="flex-1 relative bg-[linear-gradient(#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(#1e293b_1px,transparent_1px)] bg-[size:100%_3.5rem] flex divide-x divide-slate-100 dark:divide-slate-800/50">
                            ${this.days.map((day, index) => {
                                const isWeekend = day === 'sat' || day === 'sun';
                                const bgClass = isWeekend ? 'bg-slate-50/50 dark:bg-[#15202b]/50' : '';
                                
                                const dateObj = this.weekDates[index];
                                const isCurrentDate = this.isToday(dateObj);
                                const extraClass = (!isAdmin && isCurrentDate) ? 'bg-primary/5 dark:bg-primary/5' : bgClass;
                                
                                return `
                                    <div id="${colPrefix}${day}" class="relative flex-1 min-h-[896px] ${extraClass} group">
                                        ${isAdmin ? this.renderAdminGridLines() : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderHeader() {
        const { isAdmin } = this.options;
        const rangeString = this.getFormattedDateRange();

        if (isAdmin) {
            return `
                <div class="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2632] gap-3 md:gap-0">
                    <div class="flex items-center justify-between md:justify-start md:gap-4 w-full md:w-auto">
                        <button class="p-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                            <span class="material-symbols-outlined">chevron_left</span>
                        </button>
                        <h3 class="text-base md:text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap">${rangeString}</h3>
                        <button class="p-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    <div class="flex items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto">
                         <div class="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-400"></span><span class="hidden md:inline">관리자</span></div>
                            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-400"></span><span class="hidden md:inline">부원</span></div>
                        </div>
                        <div class="hidden md:block w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                        <button data-action="today" class="h-8 md:h-9 px-3 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 text-sm font-medium transition-colors border border-slate-200 md:border-transparent dark:border-slate-700">오늘</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[#e5e7eb] dark:border-[#2a3441] bg-white dark:bg-[#1a2632] gap-3 md:gap-0">
                    <div class="flex items-center justify-between md:justify-start md:gap-4 w-full md:w-auto">
                        <button class="p-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                            <span class="material-symbols-outlined">chevron_left</span>
                        </button>
                        <h3 class="text-base md:text-lg font-bold text-slate-800 dark:text-white whitespace-nowrap">${rangeString}</h3>
                        <button class="p-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    <div class="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
                        <div class="flex items-center gap-2">
                            <button id="refresh-btn" class="p-2 mr-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors" title="새로고침">
                                <span class="material-symbols-outlined text-[20px]">refresh</span>
                            </button>
                            <button data-action="today" class="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-lg whitespace-nowrap">오늘</button>
                        </div>
                        <div class="flex items-center gap-4 ml-2 md:ml-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary"></span><span class="hidden sm:inline">일정</span></div>
                            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-400"></span><span class="hidden sm:inline">합주</span></div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderDaysHeader() {
        const { isAdmin } = this.options;
        const dayNames = {
            'mon': '월', 'tue': '화', 'wed': '수', 'thu': '목', 'fri': '금', 'sat': '토', 'sun': '일'
        };
        const fullDayNames = {
             'mon': '월요일', 'tue': '화요일', 'wed': '수요일', 'thu': '목요일', 'fri': '금요일', 'sat': '토요일', 'sun': '일요일'
        };
        
        const containerClass = "days-header-container";

        if (isAdmin) {
             return `
                <div class="${containerClass} grid grid-cols-[2.5rem_repeat(7,1fr)] md:grid-cols-[80px_repeat(7,1fr)] bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm sticky top-0 z-10 transition-all duration-300">
                    <div class="p-2 md:p-3 border-r border-slate-200 dark:border-slate-700"></div>
                    ${this.days.map((day, i) => {
                        const dateObj = this.weekDates[i];
                        const isSelected = this.isToday(dateObj);
                        
                        const textClass = isSelected ? 'text-primary' : 'text-slate-500 dark:text-slate-400';
                        const numClass = isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-200';
                        
                        return `
                            <div class="py-2 md:p-3 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                                <p class="text-xs font-bold ${textClass} uppercase tracking-wider">${dayNames[day]}</p>
                                <div class="text-sm md:text-lg font-bold ${numClass}">${dateObj.getDate()}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
             `;
        } else {
            // Index Header with Dates
            return `
                <div class="${containerClass} sticky top-0 z-20 flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2632] transition-all duration-300">
                    <div class="w-10 md:w-20 shrink-0 border-r border-slate-200 dark:border-slate-800"></div> 
                    <div class="flex-1 grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800">
                        ${this.days.map((day, i) => {
                            const dateObj = this.weekDates[i];
                            const isSelected = this.isToday(dateObj);
                            
                            const textClass = isSelected ? 'text-primary' : 'text-slate-500 dark:text-slate-400';
                            const bgClass = isSelected ? 'bg-primary/5' : (day === 'sat' || day === 'sun' ? 'bg-slate-50 dark:bg-[#15202b]' : '');
                            const numClass = isSelected ? 'text-primary' : (day === 'sat' || day === 'sun' ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200');
                            
                            return `
                                <div class="py-2 md:p-3 text-center ${bgClass}">
                                    <p class="text-xs font-medium ${textClass} uppercase">${dayNames[day]}</p>
                                    <p class="text-sm md:text-lg font-bold ${numClass}">${dateObj.getDate()}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    }

    renderTimeSlots() {
        // 08:00 to 23:00
        let html = '';
        for (let i = 8; i <= 23; i++) {
            const time = i.toString().padStart(2, '0') + ':00';
            html += `<div class="h-14 pr-3 pt-2 relative border-b border-transparent ${this.options.isAdmin ? 'border-b-slate-100 dark:border-b-slate-800' : ''}">${time}</div>`;
        }
        return html;
    }

    renderAdminGridLines() {
        // Restore explicit grid lines for admin view as in original design
        return `
            <div class="absolute inset-0 flex flex-col pointer-events-none">
                ${Array(16).fill(0).map(() => 
                    `<div class="h-14 border-b border-slate-50 dark:border-slate-800/50"></div>`
                ).join('')}
            </div>
        `;
    }
}
