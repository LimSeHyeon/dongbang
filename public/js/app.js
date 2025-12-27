/**
 * Club Room Reservation System - Core Application Logic
 * Connected to Backend API
 */

const API_BASE_URL = ''; // Relative path since we serve static files from the same server

// --- Application State ---
let state = {
    reservations: [],
    isAdminPage: false,
    reservationSchedule: null
};

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    const adminScheduleContainer = document.getElementById('admin-schedule');
    const indexScheduleContainer = document.getElementById('reservation-schedule');

    state.isAdminPage = !!adminScheduleContainer;
    const isIndexPage = !!indexScheduleContainer;
    
    // Initialize Reservation Schedule based on present container
    if (state.isAdminPage) {
        state.reservationSchedule = new ReservationSchedule('admin-schedule', {
            isAdmin: true,
            showDates: false,
            onWeekChange: (newDate) => {
                fetchReservations();
            }
        });
        checkAdminAuth();
    } else if (isIndexPage) {
        state.reservationSchedule = new ReservationSchedule('reservation-schedule', {
            isAdmin: false,
            showDates: true,
            onWeekChange: (newDate) => {
                fetchReservations();
            }
        });
        fetchReservations();
        setupIndexInteractions();
    }
}

function checkAdminAuth() {
    // Check session
    const authToken = sessionStorage.getItem('adminAuthenticated');
    
    if (!authToken) {
        // Force login
        loadModal('adminLoginModal.html', (container, defaultClose) => {
            // Wrap close to redirect if not authenticated
            const forcedClose = () => {
                defaultClose();
                if (!sessionStorage.getItem('adminAuthenticated')) {
                    window.location.href = 'index.html';
                }
            };
            // Pass true for isPageGate
            setupLoginModal(container, forcedClose, true);
        });
    } else {
        // Allowed
        fetchReservations();
        setupAdminInteractions();
    }
}

// --- Data Fetching ---

async function fetchReservations() {
    try {
        let dateStr;
        if (state.reservationSchedule && typeof state.reservationSchedule.getMondayDate === 'function') { // Check if initialized
            const monday = state.reservationSchedule.getMondayDate();
             // Adjust to YYYY-MM-DD local time.
            const pad = (n) => n.toString().padStart(2, '0');
            dateStr = `${monday.getFullYear()}-${pad(monday.getMonth()+1)}-${pad(monday.getDate())}`;
        } else {
             // Fallback: If schedule component isn't ready (unlikely) or we are just fetching data without schedule UI
            dateStr = new Date().toISOString().split('T')[0];
        }

        const response = await fetch(`${API_BASE_URL}/reserve/week?date=${dateStr}`);
        const data = await response.json();

        if (data.isSuccess) {
            state.reservations = data.result.reservation.map(r => {
                const start = new Date(r.startTime);
                const end = new Date(r.endTime);
                const duration = (end - start) / (1000 * 60 * 60); // hours
                
                // Map day to "mon", "tue", etc.
                const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                const dayStr = days[start.getDay()];
                
                // Format HH:MM
                const startTimeStr = r.startTime.split(' ')[1].substring(0, 5);

                return {
                    id: r.reservationId,
                    title: r.songName,
                    day: dayStr,
                    startTime: startTimeStr,
                    duration: duration,
                    colorClass: r.byAdmin ? 'blue' : 'purple', 
                    isAdminViewOnly: false 
                };
            });
            renderReservations(state.isAdminPage);
        } else {
            console.error('Failed to fetch reservations:', data.message);
        }
    } catch (error) {
        console.error('Error fetching reservations:', error);
        // Fallback or empty state could be handled here
    }
}

// --- Rendering Logic ---

function renderReservations(isAdmin) {
    // Clear existing
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(day => {
        const colId = isAdmin ? `admin-col-${day}` : `col-${day}`;
        const col = document.getElementById(colId);
        if (col) {
            // Keep the column structure but remove cards?
            // The columns in HTML are empty except placeholders.
            // We should remove elements with class 'js-reservation-card'
            const existing = col.querySelectorAll('.js-reservation-card');
            existing.forEach(e => e.remove());
        }
    });

    // Render new
    state.reservations.forEach(r => {
        const colId = isAdmin ? `admin-col-${r.day}` : `col-${r.day}`;
        const column = document.getElementById(colId);
        if (column) {
            column.appendChild(createReservationElement(r, isAdmin));
        }
    });
}

const START_HOUR = 8;
const HOUR_HEIGHT_REM = 3.5;

function createReservationElement(data, isAdmin) {
    const div = document.createElement('div');
    const [startH, startM] = data.startTime.split(':').map(Number);
    const timeOffset = (startH + (startM / 60)) - START_HOUR;
    const topRem = timeOffset * HOUR_HEIGHT_REM;
    const heightRem = data.duration * HOUR_HEIGHT_REM;

    let colorClasses = '';
    if (data.colorClass === 'purple') colorClasses = 'bg-purple-100 dark:bg-purple-900/60 border-l-4 border-purple-500 text-purple-900 dark:text-purple-100';
    else if (data.colorClass === 'blue') colorClasses = 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 border-l-4 border-blue-500 text-blue-700 dark:text-blue-200';
    else if (data.colorClass === 'emerald') colorClasses = 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-200';
    else if (data.colorClass === 'orange') colorClasses = 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-600/20 dark:hover:bg-orange-600/30 border-l-4 border-orange-500 text-orange-700 dark:text-orange-200';

    div.className = `absolute left-1 right-1 rounded p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow group overflow-hidden ${colorClasses} js-reservation-card`;
    div.style.top = `${topRem}rem`;
    div.style.height = `${heightRem}rem`;
    div.setAttribute('data-id', data.id);

    const titleP = document.createElement('p');
    titleP.className = 'text-xs font-bold truncate';
    titleP.innerText = data.title;

    const timeP = document.createElement('p');
    timeP.className = `text-[10px] font-medium opacity-80`;
    
    const endTotalHours = (startH + (startM / 60)) + data.duration;
    const endH = Math.floor(endTotalHours);
    const endM = Math.round((endTotalHours - endH) * 60);
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    
    timeP.innerText = `${data.startTime} - ${endTime}`;

    div.appendChild(titleP);
    div.appendChild(timeP);

    return div;
}

// --- Interaction Setup ---

function setupIndexInteractions() {
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            loadModal('adminLoginModal.html', setupLoginModal);
        });
    }

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.js-reservation-card');
        if (card) {
            const id = card.getAttribute('data-id');
            // Check if admin is logged in? For now anyone can click delete in UI, but API is delete default
            // User side deletion usually requires password or session. 
            // In this app, we just trigger the modal.
            loadModal('deleteModal.html', (container, close) => setupDeleteModal(container, close, id));
        }
    });

    setupFormInteractions();
    setupDynamicDuration(); // Add this call
    setupReservationSubmit();
}

async function setupDynamicDuration() {
    const selector = document.getElementById('duration-selector');
    if (!selector) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/setting`);
        const data = await response.json();
        
        let maxTime = 2; // Default
        if (data.isSuccess) {
            const { maxUseTime, max_use_time } = data.result;
            maxTime = parseFloat(maxUseTime || max_use_time || 2);
        }

        selector.innerHTML = ''; // Clear defaults

        let defaultTime = 2.0;
        if (maxTime < 2.0) defaultTime = 1.0;
        if (maxTime < 1.0) defaultTime = 0.5;

        for (let time = 0.5; time <= maxTime; time += 0.5) {
            const labelText = time === 0.5 ? '30분' : `${time}시간`;
            
            const label = document.createElement('label');
            label.className = 'cursor-pointer';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'duration';
            input.className = 'peer sr-only';
            input.value = time; // Use value for easier retrieval
            if (time === defaultTime) input.checked = true;

            const div = document.createElement('div');
            div.className = 'px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#232d38] text-sm font-medium text-slate-600 dark:text-slate-300 peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';
            div.innerText = labelText;

            label.appendChild(input);
            label.appendChild(div);
            selector.appendChild(label);
        }

    } catch (err) {
        console.error('Failed to load duration settings', err);
        // Fallback or leave empty? Maybe render default static
    }
}

function setupFormInteractions() {
    // ... (unchanged)
    // Day Selection
    const daySelector = document.getElementById('day-selector');
    if (daySelector) {
        const buttons = daySelector.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => {
                    b.className = 'h-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors';
                    b.removeAttribute('data-active');
                });
                btn.className = 'h-9 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm transition-transform active:scale-95';
                btn.setAttribute('data-active', 'true');
            });
        });
    }

    // Minute Selection
    const minuteSelector = document.getElementById('minute-selector');
    if (minuteSelector) {
        const buttons = minuteSelector.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => {
                    b.className = 'flex-1 rounded text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1.5 transition-all';
                    b.removeAttribute('data-active');
                });
                btn.className = 'flex-1 rounded bg-white dark:bg-[#232d38] shadow-sm text-xs font-semibold text-primary py-1.5 transition-all';
                btn.setAttribute('data-active', 'true');
            });
        });
    }
}

function setupReservationSubmit() {
    // Select by ID
    const realSubmitBtn = document.getElementById('reserve-submit-btn');

    if (realSubmitBtn) {
        realSubmitBtn.addEventListener('click', async () => {
            // Gather Data
            // Activity Input
            const activityInput = document.querySelector('aside input[type="text"]');
            const songName = activityInput ? activityInput.value : '';
            
            // Day
            const activeDayBtn = document.querySelector('#day-selector button[data-active="true"]');
            const day = activeDayBtn ? activeDayBtn.getAttribute('data-day') : null;
            
            // Time
            const hourSelect = document.querySelector('aside select');
            const hour = hourSelect ? hourSelect.value : null;

            const activeMinuteBtn = document.querySelector('#minute-selector button[data-active="true"]');
            const minute = activeMinuteBtn ? activeMinuteBtn.getAttribute('data-minute') : '00';

            // Duration - UPDATED LOGIC
            const checkedDuration = document.querySelector('input[name="duration"]:checked');
            let duration = 1.0;
            if (checkedDuration) {
                duration = parseFloat(checkedDuration.value);
            }

            if (!songName) {
                alert('활동명(곡명)을 입력해주세요.');
                return;
            }
            if (!day) {
                alert('요일을 선택해주세요.');
                return;
            }

            // Calculate Date
            const targetDate = getNextDayOfWeek(day, hour, minute);
            const dateStr = formatDate(targetDate); // YYYY-MM-DD HH:mm:ss

            try {
                const response = await fetch(`${API_BASE_URL}/reserve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        songName: songName,
                        startTime: dateStr,
                        hapjuTerm: duration
                    })
                });

                const resData = await response.json();
                if (resData.isSuccess) {
                    alert('예약이 요청되었습니다! 곧 표시됩니다.');
                    fetchReservations(); // Refresh
                } else {
                    alert('예약 실패: ' + resData.message);
                }
            } catch (err) {
                console.error(err);
                alert('예약 제출 중 오류가 발생했습니다.');
            }
        });
    }
}

function getNextDayOfWeek(dayShort, hour, minute) {
    // ... same logic ...
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const targetIndex = days.indexOf(dayShort.toLowerCase());
    
    // ...
    let referenceDate = new Date(); // Default
    if (state.reservationSchedule) {
        referenceDate = new Date(state.reservationSchedule.getMondayDate());
        // getMondayDate returns Monday.
    }
    
    // ...
    
    const dayMap = { 'mon':0, 'tue':1, 'wed':2, 'thu':3, 'fri':4, 'sat':5, 'sun':6 };
    const offset = dayMap[dayShort.toLowerCase()];
    
    const target = new Date(referenceDate); // This is Monday
    target.setDate(referenceDate.getDate() + offset);
    target.setHours(parseInt(hour), parseInt(minute), 0, 0);
    
    return target;
}

function formatDate(date) {
    // YYYY-MM-DD HH:mm:ss
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function setupAdminInteractions() {
    const historyBtn = document.getElementById('view-history-btn');
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            loadModal('historyModal.html', setupHistoryModal);
        });
    }

    const logoutBtns = document.querySelectorAll('button');
    logoutBtns.forEach(btn => {
        if (btn.innerText.includes('로그아웃') || btn.innerText.includes('Logout')) {
            btn.addEventListener('click', () => {
                sessionStorage.removeItem('adminAuthenticated');
                window.location.href = 'index.html';
            });
        }
    });

    setupChangePassword();

// ... (previous code)

    setupChangePassword();

    // Initialize Admin Reservation Defaults - REMOVED per user request
    // The user wants these empty/default by browser, not pre-filled with Today/NextHour.
    
    // Admin Day Selection
    const adminDaySelector = document.getElementById('admin-day-selector');
    if (adminDaySelector) {
        const buttons = adminDaySelector.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => {
                    b.className = 'h-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors';
                    b.removeAttribute('data-active');
                });
                btn.className = 'h-9 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm transition-transform active:scale-95';
                btn.setAttribute('data-active', 'true');
            });
        });
    }

    // Admin Minute Selection
    const adminMinuteSelector = document.getElementById('admin-minute-selector');
    if (adminMinuteSelector) {
        const buttons = adminMinuteSelector.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => {
                    b.className = 'flex-1 rounded text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1.5 transition-all';
                    b.removeAttribute('data-active');
                });
                btn.className = 'flex-1 rounded bg-white dark:bg-[#232d38] shadow-sm text-xs font-semibold text-primary py-1.5 transition-all';
                btn.setAttribute('data-active', 'true');
            });
        });
    }

    // Admin Reservation Submit
    const adminReserveBtn = document.getElementById('admin-reserve-btn');
    if (adminReserveBtn) {
        adminReserveBtn.addEventListener('click', async () => {
             const songName = document.getElementById('admin-reserve-song').value;
             
             // Get Day from new selector
             const activeDayBtn = document.querySelector('#admin-day-selector button[data-active="true"]');
             const dayVal = activeDayBtn ? activeDayBtn.getAttribute('data-day') : null;

             // Get Time from new selector
             const hourVal = document.getElementById('admin-reserve-hour').value;
             const activeMinuteBtn = document.querySelector('#admin-minute-selector button[data-active="true"]');
             const minuteVal = activeMinuteBtn ? activeMinuteBtn.getAttribute('data-minute') : '00';
             
             const timeVal = `${hourVal}:${minuteVal}`;
             const durationVal = document.getElementById('admin-reserve-duration').value;

             if (!songName || !dayVal || !timeVal || !durationVal) {
                 alert('모든 예약 정보를 입력해주세요.');
                 return;
             }
             
             if (parseFloat(durationVal) % 0.5 !== 0) {
                 alert('30분 단위로만 예약 가능합니다');
                 return;
             }
             
             // Calculate Target Date for "dayVal" based on current week
             // Assumes reservation is for the *current* displayed week or next occurrence?
             // Usually "Next occurrence of Day" logic.
             
             // Reuse getNextDayOfWeek logic or similar
             const now = new Date();
             const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
             const targetDayIndex = days.indexOf(dayVal); // 0=sun...
             
             let targetDate = new Date();
             // If we have access to schedule start date, use it?
             if (state.reservationSchedule && typeof state.reservationSchedule.getMondayDate === 'function') {
                  const monday = state.reservationSchedule.getMondayDate();
                  const dayMap = { 'mon':0, 'tue':1, 'wed':2, 'thu':3, 'fri':4, 'sat':5, 'sun':6 };
                  const targetDayOffset = dayMap[dayVal]; // 0-6 relative to Monday
                  
                  targetDate = new Date(monday);
                  targetDate.setDate(monday.getDate() + targetDayOffset);
             } else {
                 // Fallback
                  const currentDay = now.getDay();
                  let diff = targetDayIndex - currentDay;
                  if (diff < 0) diff += 7; // Next occurrence
                  targetDate.setDate(now.getDate() + diff);
             }
             
             const [hh, mm] = timeVal.split(':').map(Number);
             targetDate.setHours(hh, mm, 0, 0);

             const pad = (n) => n.toString().padStart(2, '0');
             const startTimeStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth()+1)}-${pad(targetDate.getDate())} ${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}:00`;

             try {
                // Use Admin-specific endpoint
                const response = await fetch(`${API_BASE_URL}/admin/reserve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        songName,
                        startTime: startTimeStr,
                        hapjuTerm: parseFloat(durationVal),
                        isAdmin: true 
                    })
                });
                
                const data = await response.json();
                if (data.isSuccess) {
                    alert('관리자 예약이 등록되었습니다.');
                    fetchReservations();
                    // Reset form
                    document.getElementById('admin-reserve-song').value = '';
                } else {
                    alert('예약 등록 실패: ' + data.message);
                }
             } catch(err) {
                 console.error(err);
                 alert('오류 발생');
             }
        });
    }

    // Enable reservation card interactions (deletion)
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.js-reservation-card');
        if (card) {
            const id = card.getAttribute('data-id');
            loadModal('deleteModal.html', (container, close) => setupDeleteModal(container, close, id));
        }
    });

    fetchAdminSettings();
    setupSaveSettings();
    setupPasswordVisibilityToggles();
}

function setupSaveSettings() {
    const saveBtn = document.getElementById('save-setting-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const dayInput = document.getElementById('setting-open-day').value;
            const timeInput = document.getElementById('setting-open-time').value;
            const maxInput = document.getElementById('setting-max-time').value;

            // Simple parsing
            let openWeekday = parseInt(dayInput);
            if (isNaN(openWeekday)) openWeekday = 3; 

            let openTime = parseInt(timeInput.split(':')[0]);
            if (isNaN(openTime)) openTime = 9;

            let maxUseTime = parseFloat(maxInput); 
            
            if (isNaN(maxUseTime)) {
                alert("올바른 수를 입력해주세요.");
                return;
            }

            if (maxUseTime % 0.5 !== 0) {
                alert("정수 혹은 .5로 끝나는 수를 입력해주세요. (예: 1.5, 2.0)");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/admin/setting`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        openWeekday,
                        openTime,
                        maxUseTime
                    })
                });
                
                const data = await response.json();
                if (data.isSuccess) {
                    alert('설정이 저장되었습니다!');
                    fetchAdminSettings(); // Refresh
                } else {
                    alert('설정 저장 실패: ' + data.message);
                }
            } catch (err) {
                console.error(err);
                alert('설정 저장 중 오류가 발생했습니다.');
            }
        });
    }
}

async function fetchAdminSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/setting`);
        const data = await response.json();

        if (data.isSuccess) {
            // Handle both camelCase (likely) and snake_case (fallback)
            const result = data.result;
            const openWeekday = result.openWeekday || result.open_weekday;
            const openTime = result.openTime !== undefined ? result.openTime : result.open_time;
            const maxUseTime = result.maxUseTime || result.max_use_time;

            // Set Day
            const daySelect = document.getElementById('setting-open-day');
            if (daySelect) {
                // If backend returns Korean string (e.g. "수요일"), map to integer
                const dayMap = {
                    '월요일': '1', '화요일': '2', '수요일': '3', 
                    '목요일': '4', '금요일': '5', '토요일': '6', '일요일': '0'
                };
                
                if (dayMap[openWeekday]) {
                    daySelect.value = dayMap[openWeekday];
                } else {
                    daySelect.value = openWeekday; // Fallback if it's already an integer
                }
            }

            // Set Time
            const timeSelect = document.getElementById('setting-open-time');
            if (timeSelect) {
                // Handle integer input (e.g. 22 -> "22:00")
                let timeStr = openTime.toString();
                // If it's just a number (e.g. 22 or "22"), append ":00"
                if (!timeStr.includes(':')) {
                    timeStr = timeStr.padStart(2, '0') + ':00';
                }
                timeSelect.value = timeStr;
            }

            // Set Max Time
            const maxInput = document.getElementById('setting-max-time');
            if (maxInput) maxInput.value = `${maxUseTime} 시간`;
        }
    } catch (err) {
        console.error('Error fetching settings:', err);
    }
}



function setupPasswordVisibilityToggles() {
    const toggles = document.querySelectorAll('.js-password-toggle');
    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
             const input = btn.previousElementSibling;
             if (input && input.type === 'password') {
                 input.type = 'text';
                 btn.querySelector('span').innerText = 'visibility';
             } else if (input) {
                 input.type = 'password';
                 btn.querySelector('span').innerText = 'visibility_off';
             }
        });
    });
}

// ...

function setupChangePassword() {
    const changeBtn = document.getElementById('change-password-btn');
    if (changeBtn) {
        // Prevent double binding
        if (changeBtn.dataset.listenerAttached) return;
        changeBtn.dataset.listenerAttached = 'true';

        changeBtn.addEventListener('click', async () => {
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                alert('모든 비밀번호 필드를 입력해주세요.');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('새 비밀번호가 일치하지 않습니다.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/admin/password`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prevPassword: currentPassword,
                        newPassword: newPassword
                    })
                });
                
                const data = await response.json();
                
                if (data.isSuccess) {
                    alert('비밀번호가 변경되었습니다!');
                    // Clear inputs
                    document.getElementById('current-password').value = '';
                    document.getElementById('new-password').value = '';
                    document.getElementById('confirm-password').value = '';
                } else {
                    alert('비밀번호 변경 실패: ' + data.message);
                }

            } catch (err) {
                console.error(err);
                alert('비밀번호 변경 중 오류가 발생했습니다.');
            }
        });
    }
}

// --- Modal Logic ---

async function loadModal(url, callback) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        const htmlText = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-wrapper fixed inset-0 z-50';
        
        const modalPart = doc.querySelector('.z-50.fixed, .z-50.absolute');
        const backdropPart = doc.querySelector('.backdrop-blur-sm');
        
        let extracted = false;
        if (modalPart) {
            extracted = true;
            if (backdropPart && !modalPart.contains(backdropPart) && backdropPart !== modalPart) {
                modalContainer.appendChild(backdropPart.cloneNode(true));
            }
            modalContainer.appendChild(modalPart.cloneNode(true));
        }

        if (!extracted) {
             Array.from(doc.body.children).forEach(child => {
                if (child.tagName !== 'SCRIPT' && !['HEADER', 'ASIDE', 'MAIN'].includes(child.tagName)) {
                     modalContainer.appendChild(child.cloneNode(true));
                }
            });
        }

        document.body.appendChild(modalContainer);
        if (callback) callback(modalContainer, () => modalContainer.remove());

    } catch (error) {
         console.error('Error loading modal:', error);
    }
}

function setupLoginModal(modalContainer, closeModal, isPageGate = false) {
    const loginBtn = modalContainer.querySelector('button.bg-primary') || modalContainer.querySelector('#login-btn');
    const passwordInput = modalContainer.querySelector('input[type="password"]');
    
    const closeBtns = modalContainer.querySelectorAll('button');
    closeBtns.forEach(btn => {
        if (btn.querySelector('.material-symbols-outlined')?.innerText === 'close' || btn.id === 'close-modal') {
            btn.addEventListener('click', closeModal);
        }
    });

    if (loginBtn && passwordInput) {
        loginBtn.addEventListener('click', async () => {
             const password = passwordInput.value;
             try {
                 const res = await fetch(`${API_BASE_URL}/admin`, {
                     method: 'POST',
                     headers: {'Content-Type': 'application/json'},
                     body: JSON.stringify({ password })
                 });
                 const data = await res.json();
                 
                 if (data.isSuccess) {
                     sessionStorage.setItem('adminAuthenticated', 'true');
                     localStorage.setItem('adminPassword', password); 
                     
                     if (isPageGate) {
                         closeModal();
                         fetchReservations();
                         setupAdminInteractions();
                     } else {
                         window.location.href = 'admin.html';
                     }
                 } else {
                     alert(data.message || '로그인 실패');
                 }
             } catch(err) {
                 console.error(err);
                 alert('서버 연결 오류.');
             }
        });

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loginBtn.click();
        });

        // Password Visibility Toggle
        const toggleBtn = passwordInput.nextElementSibling;
        if (toggleBtn && toggleBtn.tagName === 'BUTTON') {
            toggleBtn.addEventListener('click', () => {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    toggleBtn.querySelector('span').innerText = 'visibility'; // Show eye when text is visible
                } else {
                    passwordInput.type = 'password';
                    toggleBtn.querySelector('span').innerText = 'visibility_off'; // Show crossed eye when hidden
                }
            });
        }
    }
}

function setupDeleteModal(modalContainer, closeModal, reservationId) {
    const cancelBtn = Array.from(modalContainer.querySelectorAll('button')).find(b => b.innerText.includes('Cancel') || b.innerText.includes('취소'));
    const deleteBtn = Array.from(modalContainer.querySelectorAll('button')).find(b => b.innerText.includes('Delete') || b.innerText.includes('삭제'));
    
    // Populate Data
    const reservation = state.reservations.find(r => r.id == reservationId);
    if (reservation) {
        // Find elements
        // The structure is quite specific in deleteModal.html
        const infoContainer = modalContainer.querySelector('.mt-6.rounded-lg');
        if (infoContainer) {
            const titleEl = infoContainer.querySelector('p.font-semibold');
            if (titleEl) titleEl.innerText = reservation.title;

            // Day and Time are in nested spans. 
            // We can try to select them by icon proximity or structure.
            const metaSpans = infoContainer.querySelectorAll('.text-xs span.flex.items-center.gap-1');
            
            // First span is Day (has calendar_today icon)
            if (metaSpans[0]) {
                const dayText = metaSpans[0].lastChild; // The text node after the icon span
                if (dayText) dayText.textContent = reservation.day.charAt(0).toUpperCase() + reservation.day.slice(1);
            }

            // Second span is Time (has schedule icon)
            if (metaSpans[1]) {
                const timeText = metaSpans[1].lastChild;
                
                // Calculate end time
                const [h, m] = reservation.startTime.split(':').map(Number);
                const endTotal = h + (m/60) + reservation.duration;
                const endH = Math.floor(endTotal);
                const endM = Math.round((endTotal - endH) * 60);
                const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                
                if (timeText) timeText.textContent = `${reservation.startTime} - ${endTimeStr}`;
            }
        }
    }

    const backdrop = modalContainer.querySelector('.backdrop-blur-sm');
    if (backdrop) backdrop.addEventListener('click', closeModal);

    const closeBtns = modalContainer.querySelectorAll('button');
    closeBtns.forEach(btn => {
        if (btn.querySelector('.material-symbols-outlined')?.innerText === 'close') {
            btn.addEventListener('click', closeModal);
        }
    });

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/reserve?reservationId=${reservationId}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                
                if (data.isSuccess) {
                    const card = document.querySelector(`.js-reservation-card[data-id="${reservationId}"]`);
                    if (card) card.remove();
                    // Also remove from state to match UI
                    state.reservations = state.reservations.filter(r => r.id != reservationId);
                    closeModal();
                } else {
                    alert('삭제 실패: ' + data.message);
                }
            } catch(err) {
                console.error(err);
                alert('예약 삭제 중 오류가 발생했습니다.');
            }
        });
    }
}

function setupHistoryModal(modalContainer, closeModal) {
    const closeViewerBtn = Array.from(modalContainer.querySelectorAll('button')).find(b => b.innerText.includes('Close Viewer') || b.innerText.includes('닫기'));
    if (closeViewerBtn) closeViewerBtn.addEventListener('click', closeModal);
    
    if (modalContainer.querySelector('.backdrop-blur-sm')) {
         const backdropEl = modalContainer.querySelector('.backdrop-blur-sm');
         if (backdropEl) {
             backdropEl.addEventListener('click', (e) => {
                 if (e.target === backdropEl) closeModal();
             });
         }
    }

    const closeBtns = modalContainer.querySelectorAll('button');
    closeBtns.forEach(btn => {
         if (btn.querySelector('.material-symbols-outlined')?.innerText === 'close') {
             btn.addEventListener('click', closeModal);
         }
    });

    const refreshBtn = modalContainer.querySelector('#history-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
             // Add check spin animation?
             const icon = refreshBtn.querySelector('.material-symbols-outlined');
             if(icon) {
                 icon.classList.add('animate-spin');
                 setTimeout(() => icon.classList.remove('animate-spin'), 1000);
             }
             loadHistoryData();
        });
    }

    // Fetch History Data
    async function loadHistoryData() {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/history`);
            const data = await res.json();
            
            if (data.isSuccess) {
                const summary = data.result.summary;
                const rows = data.result.data;

                // Update Summary
                const durEl = modalContainer.querySelector('#history-total-duration');
                if(durEl) durEl.innerText = summary.totalDuration;
                
                const countEl = modalContainer.querySelector('#history-total-count');
                if(countEl) countEl.innerText = summary.totalCount;

                const periodEl = modalContainer.querySelector('#history-period');
                if(periodEl) periodEl.innerText = summary.period;

                // Update Table
                const tbody = modalContainer.querySelector('#history-table-body');
                if (tbody) {
                    tbody.innerHTML = ''; // Clear mock data
                    rows.forEach(row => {
                         const tr = document.createElement('tr');
                         tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group';
                         
                         // Determine color based on index or something? Or random?
                         // Mock colors: purple, blue, orange...
                         const colors = ['purple', 'blue', 'orange', 'pink', 'indigo', 'red', 'green', 'yellow'];
                         const color = colors[row.historyId % colors.length];
                         
                         tr.innerHTML = `
                             <td class="py-3 px-4 text-sm font-mono text-slate-400 dark:text-slate-500">#${row.historyId}</td>
                             <td class="py-3 px-4">
                                 <div class="flex items-center gap-3">
                                     <div class="w-8 h-8 rounded bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 flex items-center justify-center shrink-0">
                                         <span class="material-symbols-outlined text-sm">music_note</span>
                                     </div>
                                     <span class="font-medium text-slate-900 dark:text-slate-200">${row.songName}</span>
                                 </div>
                             </td>
                             <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">${row.startTime}</td>
                             <td class="py-3 px-4">
                                 <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                     ${row.hapjuTerm}h
                                 </span>
                             </td>
                             <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">${row.requestTime}</td>
                         `;
                         tbody.appendChild(tr);
                    });
                }

            } else {
                console.error('Failed to load history:', data.message);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    }

    loadHistoryData();
}
