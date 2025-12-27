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
        this.calculateWeekDates();

        // Render immediately
        this.render();
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
            ${this.renderGrid()}
        `;
        this.attachEventListeners();
    }

    attachEventListeners() {
        // We know the structure: Prev, Today, Next are key buttons.
        // Update selection logic to be more robust or account for new refresh button.
        const prevBtn = this.container.querySelector('button .material-symbols-outlined').closest('button');
        // Actually, let's stick to indices but be careful.
        // Left group: Prev [0], Next [1] (Wait, check order in renderHeader)
        // Admin: Prev, Next. Right: Today.
        // Index: Prev, Next. Right: Refresh, Today.
        
        // Let's use specific selectors if possible, or classes. But they don't have unique classes.
        // Let's use the material icon content to identify.
        const allButtons = Array.from(this.container.querySelectorAll('button'));
        const prev = allButtons.find(b => b.innerHTML.includes('chevron_left'));
        const next = allButtons.find(b => b.innerHTML.includes('chevron_right'));
        const today = allButtons.find(b => b.innerText.includes('오늘'));
        const refresh = allButtons.find(b => b.id === 'refresh-btn');

        if (prev) prev.onclick = () => this.changeWeek(-7);
        if (next) next.onclick = () => this.changeWeek(7);
        if (today) today.onclick = () => this.goToToday();
        if (refresh && this.options.onWeekChange) {
            refresh.onclick = () => {
                // Trigger refresh logic (re-fetch)
                // We can treat it as re-rendering or custom callback
                this.options.onWeekChange(this.currentDate);
                
                // Add simple animation
                const icon = refresh.querySelector('.material-symbols-outlined');
                if(icon) {
                    icon.style.transition = 'transform 0.5s ease';
                    icon.style.transform = 'rotate(360deg)';
                    setTimeout(() => icon.style.transform = '', 500);
                }
            };
        }
    }

    changeWeek(days) {
        this.currentDate.setDate(this.currentDate.getDate() + days);
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

    renderHeader() {
        const { isAdmin } = this.options;
        const rangeString = this.getFormattedDateRange();

        if (isAdmin) {
            return `
                <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2632]">
                    <div class="flex items-center gap-4">
                        <button class="p-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                            <span class="material-symbols-outlined">chevron_left</span>
                        </button>
                        <h3 class="text-lg font-bold text-slate-900 dark:text-white">${rangeString}</h3>
                        <button class="p-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    <div class="flex items-center gap-6">
                         <div class="flex items-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-400"></span> 관리자 예약</div>
                            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-400"></span> 부원 예약</div>
                        </div>
                        <div class="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                        <button class="h-9 px-3 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 text-sm font-medium transition-colors">오늘</button>
                    </div>
                </div>
            `;
        } else {
            // Index header style
            return `
                <div class="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] dark:border-[#2a3441] bg-white dark:bg-[#1a2632]">
                    <div class="flex items-center gap-4">
                        <button class="p-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                            <span class="material-symbols-outlined">chevron_left</span>
                        </button>
                        <h3 class="text-lg font-bold text-slate-800 dark:text-white">${rangeString}</h3>
                        <button class="p-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="refresh-btn" class="p-2 mr-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors" title="새로고침">
                            <span class="material-symbols-outlined text-[20px]">refresh</span>
                        </button>
                        <button class="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-lg">오늘</button>
                        <div class="flex items-center gap-6 ml-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-primary/20 border border-primary"></span> 동아리 일정</div>
                            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-400"></span> 합주 예약</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderGrid() {
        const { isAdmin } = this.options;
        const colPrefix = isAdmin ? 'admin-col-' : 'col-';
        
        return `
            <div class="flex-1 overflow-auto custom-scrollbar relative bg-white dark:bg-[#1a2632]">
                <div class="min-w-[800px] ${isAdmin ? '' : 'pb-10'}">
                    ${this.renderDaysHeader()}
                    
                    <div class="relative flex">
                        <!-- Time Column -->
                        <div class="w-20 shrink-0 flex flex-col bg-white dark:bg-[#1a2632] border-r border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-400 dark:text-slate-500 text-right select-none ${isAdmin ? 'sticky left-0 z-10' : ''}">
                             ${this.renderTimeSlots()}
                        </div>
                        
                        <!-- Slots Grid -->
                        <div class="flex-1 relative bg-[linear-gradient(#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(#1e293b_1px,transparent_1px)] bg-[size:100%_3.5rem] grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-800/50">
                            ${this.days.map((day, index) => {
                                const isWeekend = day === 'sat' || day === 'sun';
                                const bgClass = isWeekend ? 'bg-slate-50/50 dark:bg-[#15202b]/50' : '';
                                
                                const dateObj = this.weekDates[index];
                                const isCurrentDate = this.isToday(dateObj);
                                const extraClass = (!isAdmin && isCurrentDate) ? 'bg-primary/5 dark:bg-primary/5' : bgClass;
                                
                                return `
                                    <div id="${colPrefix}${day}" class="relative min-h-[896px] ${extraClass} group">
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

    renderDaysHeader() {
        const { isAdmin } = this.options;
        // Korean day names map
        const dayNames = {
            'mon': '월', 'tue': '화', 'wed': '수', 'thu': '목', 'fri': '금', 'sat': '토', 'sun': '일'
        };
        const fullDayNames = {
             'mon': '월요일', 'tue': '화요일', 'wed': '수요일', 'thu': '목요일', 'fri': '금요일', 'sat': '토요일', 'sun': '일요일'
        };
        
        if (isAdmin) {
             return `
                <div class="grid grid-cols-[80px_repeat(7,1fr)] bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm sticky top-0 z-10">
                    <div class="p-3 border-r border-slate-200 dark:border-slate-700"></div>
                    ${this.days.map((day, i) => {
                        const dateObj = this.weekDates[i];
                        const isSelected = this.isToday(dateObj);
                        
                        const textClass = isSelected ? 'text-primary' : 'text-slate-500 dark:text-slate-400';
                        const numClass = isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-200';
                        
                        return `
                            <div class="p-3 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                                <p class="text-xs font-bold ${textClass} uppercase tracking-wider">${dayNames[day]}</p>
                                <div class="text-lg font-bold ${numClass}">${dateObj.getDate()}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
             `;
        } else {
            // Index Header with Dates
            return `
                <div class="sticky top-0 z-20 flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2632]">
                    <div class="w-20 shrink-0 border-r border-slate-200 dark:border-slate-800"></div> 
                    <div class="flex-1 grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800">
                        ${this.days.map((day, i) => {
                            const dateObj = this.weekDates[i];
                            const isSelected = this.isToday(dateObj);
                            
                            const textClass = isSelected ? 'text-primary' : 'text-slate-500 dark:text-slate-400';
                            const bgClass = isSelected ? 'bg-primary/5' : (day === 'sat' || day === 'sun' ? 'bg-slate-50 dark:bg-[#15202b]' : '');
                            const numClass = isSelected ? 'text-primary' : (day === 'sat' || day === 'sun' ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200');
                            
                            return `
                                <div class="p-3 text-center ${bgClass}">
                                    <p class="text-xs font-medium ${textClass} uppercase">${dayNames[day]}</p>
                                    <p class="text-lg font-bold ${numClass}">${dateObj.getDate()}</p>
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
