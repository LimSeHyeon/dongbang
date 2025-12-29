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
        
        // Mobile check: Pixel based (< 1024px)
        const isMobile = window.matchMedia('(max-width: 1023px)').matches;

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
        // 전체 구조 렌더링
        this.container.innerHTML = `
            ${this.renderHeader()}
            <div class="flex-1 flex flex-col overflow-hidden relative">
                ${this.renderMobileList()}
                ${this.renderGrid()}
            </div>
        `;
        this.attachEventListeners();
    }

    renderMobileList() {
        // 모바일 리스트: 1024px 미만에서만 노출
        return `
            <div id="mobile-schedule-list" class="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0d1218] p-4 space-y-4 desktop:hidden">
                ${this.days.map((day, i) => {
                     const dateObj = this.weekDates[i];
                     const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                     const dayName = ['월', '화', '수', '목', '금', '토', '일'][i];
                     const isToday = this.isToday(dateObj);
                     
                     return `
                        <div id="mobile-day-${day}" class="mobile-day-section">
                            <h4 class="text-sm font-bold ${isToday ? 'text-primary' : 'text-slate-500'} mb-2 pl-2 border-l-4 ${isToday ? 'border-primary' : 'border-slate-300'}">
                                ${dateStr} ${dayName}요일 ${isToday ? '(오늘)' : ''}
                            </h4>
                            <div class="space-y-2 mobile-day-content min-h-[60px] text-xs text-slate-400 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#1a2632]">
                                <p class="text-center py-2 italic text-slate-400">예약 내역을 불러오는 중...</p>
                            </div>
                        </div>
                     `;
                }).join('')}
            </div>
        `;
    }

    // Event Listeners - Restored
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
    }

    changeWeek(offset) {
        this.currentDate.setDate(this.currentDate.getDate() + offset);
        this.calculateWeekDates();
        this.render();
        if (this.options.onWeekChange) {
            this.options.onWeekChange(this.currentDate);
        }
    }

    goToToday() {
        this.currentDate = new Date();
        this.calculateWeekDates();
        this.render();
        if (this.options.onWeekChange) {
            this.options.onWeekChange(this.currentDate);
        }
    }

    renderGrid() {
        const { isAdmin } = this.options;
        const colPrefix = isAdmin ? 'admin-col-' : 'col-';
        
        // 데스크탑 그리드: 1024px 이상에서만 노출
        return `
            <div class="hidden desktop:flex flex-1 overflow-auto custom-scrollbar relative bg-white dark:bg-[#1a2632]">
                <div class="w-full h-full flex flex-col ${isAdmin ? '' : 'pb-10'}">
                    ${this.renderDaysHeader()}
                    <div class="relative flex flex-1">
                        <div class="w-20 shrink-0 flex flex-col bg-white dark:bg-[#1a2632] border-r border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-400 text-right select-none sticky left-0 z-10">
                             ${this.renderTimeSlots()}
                        </div>
                        <div class="flex-1 relative bg-[linear-gradient(#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(#1e293b_1px,transparent_1px)] bg-[size:100%_3.5rem] flex divide-x divide-slate-100 dark:divide-slate-800/50">
                            ${this.days.map((day, index) => {
                                const dateObj = this.weekDates[index];
                                const isCurrentDate = this.isToday(dateObj);
                                const isWeekend = day === 'sat' || day === 'sun';
                                const bgClass = isCurrentDate ? 'bg-primary/5' : (isWeekend ? 'bg-slate-50/50 dark:bg-[#15202b]/50' : '');
                                
                                return `<div id="${colPrefix}${day}" class="relative flex-1 min-h-[896px] ${bgClass} group"></div>`;
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
                <div class="${containerClass} hidden desktop:grid grid-cols-[2.5rem_repeat(7,1fr)] desktop:grid-cols-[80px_repeat(7,1fr)] bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm sticky top-0 z-10 transition-all duration-300">
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
                <div class="${containerClass} hidden desktop:flex sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2632] transition-all duration-300">
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
        let html = '';
        for (let i = 8; i <= 23; i++) {
            html += `<div class="h-14 pr-3 pt-2 border-b border-transparent text-slate-400">${i.toString().padStart(2, '0')}:00</div>`;
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
