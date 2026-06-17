// ==============================================================================
// [DATA BINDING] - 크롤러가 생성하는 data.js 로부터 데이터를 로드
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    window.currentYear = today.getFullYear();
    window.currentMonth = today.getMonth() + 1;
    
    loadDataAndBind();
    
    // 1분마다 데이터를 백그라운드에서 자동으로 다시 로드하여 갱신합니다.
    setInterval(loadDataAndBind, 60000); 
});

function loadDataAndBind() {
    // 이전의 동적 스크립트 태그가 있다면 제거하여 메모리 누수를 방지합니다.
    const oldScript = document.getElementById("dynamic-data-script");
    if (oldScript) {
        oldScript.remove();
    }
    
    const script = document.createElement("script");
    script.id = "dynamic-data-script";
    script.src = "data.js?t=" + new Date().getTime();
    script.onload = () => {
        initDataBinding();
        initMonthlyEditor();
        initTabNavigation();
        renderMonthlyCalendar();
        initImageModal();
    };
    script.onerror = () => {
        console.error("data.js 데이터를 불러오는 데 실패했습니다.");
        initDataBinding();
        initImageModal();
    };
    document.head.appendChild(script);
}

function initDataBinding() {
    const updateBadge = document.getElementById("update-badge");
    const schedulePlaceholder = document.getElementById("schedule-placeholder");
    const fanartGrid = document.getElementById("fanart-grid");
    const fanartCount = document.getElementById("fanart-count");

    // 전역 변수 JERRY_DATA 가 로드되었는지 확인 (CORS 에러를 우회하는 최적의 방법)
    if (typeof JERRY_DATA !== "undefined" && JERRY_DATA) {
        console.log("제리츄 데이터 로드 성공:", JERRY_DATA);
        
        // 0. 생방송 온에어 상태 바인딩
        const liveIndicator = document.getElementById("live-indicator");
        const profileLiveBadge = document.getElementById("profile-live-badge");
        const profileImg = document.getElementById("profile-img");

        if (JERRY_DATA.is_live) {
            if (liveIndicator) liveIndicator.style.display = "flex";
            if (profileLiveBadge) profileLiveBadge.style.display = "inline-block";
            if (profileImg) profileImg.classList.add("live-active");
        } else {
            if (liveIndicator) liveIndicator.style.display = "none";
            if (profileLiveBadge) profileLiveBadge.style.display = "none";
            if (profileImg) profileImg.classList.remove("live-active");
        }
        
        // 1. 동기화 시간 갱신
        if (JERRY_DATA.updated_at) {
            updateBadge.innerText = `${JERRY_DATA.updated_at} 동기화 완료`;
            updateBadge.style.background = "rgba(43, 194, 83, 0.15)";
            updateBadge.style.color = "hsl(135, 75%, 35%)";
            updateBadge.style.borderColor = "hsla(135, 75%, 35%, 0.3)";
        }

        // 2. 공지사항 (6월~) 아코디언 리스트 바인딩
        const noticeListContainer = document.getElementById("notice-list-container");
        if (noticeListContainer) {
            if (JERRY_DATA.notices && JERRY_DATA.notices.length > 0) {
                noticeListContainer.innerHTML = "";
                
                JERRY_DATA.notices.forEach((notice, idx) => {
                    const noticeItem = document.createElement("div");
                    noticeItem.className = "notice-item";
                    if (idx === 0) {
                        noticeItem.classList.add("expanded"); // 가장 최근 글은 기본적으로 펼쳐둠
                    }
                    
                    const cleanTitle = notice.title.replace(/^\[?공지\]?\s*/, "").replace(/^\[?Notice\]?\s*/i, "").trim();
                    
                    // 본문 내의 URL 주소를 클릭 가능한 링크로 변환하는 함수
                    const linkify = (text) => {
                        if (!text) return "";
                        const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                        return text.replace(urlPattern, '<a href="$1" target="_blank" class="notice-link">$1 <i class="fa-solid fa-up-right-from-square" style="font-size: 0.75rem;"></i></a>');
                    };
                    
                    const formattedContent = linkify(notice.content);
                    
                    noticeItem.innerHTML = `
                        <div class="notice-item-header">
                            <div class="notice-item-title">
                                <i class="fa-solid fa-bullhorn"></i>
                                <span>${cleanTitle}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <span class="notice-item-date">${notice.date.split(" ")[0]}</span>
                                <span class="notice-item-toggle">내용보기 <i class="fa-solid fa-chevron-down"></i></span>
                            </div>
                        </div>
                        <div class="notice-item-body">
                            <div class="notice-text-content" style="white-space: pre-wrap; word-break: break-word;">${formattedContent}</div>
                            <div class="notice-action-area" style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed rgba(255, 255, 255, 0.1); display: flex; justify-content: flex-end;">
                                <a href="${notice.url}" target="_blank" class="btn-soop-link">
                                    <i class="fa-solid fa-square-arrow-up-right"></i> SOOP에서 원문 보기
                                </a>
                            </div>
                        </div>
                    `;
                    
                    noticeItem.addEventListener("click", () => {
                        noticeItem.classList.toggle("expanded");
                    });
                    
                    const body = noticeItem.querySelector(".notice-item-body");
                    body.addEventListener("click", (e) => {
                        e.stopPropagation();
                    });
                    
                    noticeListContainer.appendChild(noticeItem);
                });
            } else if (JERRY_DATA.notice_text) {
                noticeListContainer.innerHTML = `
                    <div class="notice-item expanded">
                        <div class="notice-item-header">
                            <div class="notice-item-title"><i class="fa-solid fa-bullhorn"></i> 최신 공지사항</div>
                        </div>
                        <div class="notice-item-body" style="display: block;">${JERRY_DATA.notice_text}</div>
                    </div>
                `;
            } else {
                noticeListContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px 0;">수집된 공지사항이 없습니다.</div>`;
            }
        }

        // 3. 주간 일정표 (캘린더 그리드) 동적 바인딩 및 히스토리 네비게이션
        const calendarGrid = document.getElementById("calendar-grid");
        if (calendarGrid) {
            // 주차별 일정 목록 구축
            let availableWeeks = [];
            
            if (JERRY_DATA.schedules && Object.keys(JERRY_DATA.schedules).length > 0) {
                const sortedKeys = Object.keys(JERRY_DATA.schedules).sort();
                sortedKeys.forEach(key => {
                    availableWeeks.push({
                         key: key,
                         schedule: JERRY_DATA.schedules[key]
                    });
                });
            }
            
            if (availableWeeks.length === 0 && JERRY_DATA.schedule && JERRY_DATA.schedule.length > 0) {
                const todayDate = new Date();
                const day = todayDate.getDay();
                const diff = todayDate.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(todayDate.setDate(diff));
                const mondayStr = monday.getFullYear() + "-" + String(monday.getMonth() + 1).padStart(2, '0') + "-" + String(monday.getDate()).padStart(2, '0');
                availableWeeks.push({
                    key: mondayStr,
                    schedule: JERRY_DATA.schedule
                });
            }
            
            window.availableWeeks = availableWeeks;
            
            if (availableWeeks.length > 0) {
                schedulePlaceholder.style.display = "none";
                calendarGrid.style.display = "grid";
                
                // 현재 보고 있는 주차 인덱스 초기값 설정 (오늘이 속한 주차 찾기, 없으면 가장 최신 주차)
                if (typeof window.currentWeekIndex === "undefined") {
                    const todayZero = new Date();
                    todayZero.setHours(0, 0, 0, 0);
                    const dayNum = todayZero.getDay();
                    const diff = todayZero.getDate() - dayNum + (dayNum === 0 ? -6 : 1);
                    const curMonday = new Date(todayZero.getFullYear(), todayZero.getMonth(), diff);
                    const curMondayStr = curMonday.getFullYear() + "-" + String(curMonday.getMonth() + 1).padStart(2, '0') + "-" + String(curMonday.getDate()).padStart(2, '0');
                    
                    const foundIdx = availableWeeks.findIndex(w => w.key === curMondayStr);
                    window.currentWeekIndex = (foundIdx !== -1) ? foundIdx : (availableWeeks.length - 1);
                }
                
                // 네비게이션 버튼 이벤트 바인딩 (최초 1회만)
                if (!window.scheduleNavInitialized) {
                    window.scheduleNavInitialized = true;
                    const prevBtn = document.getElementById("btn-prev-week");
                    const nextBtn = document.getElementById("btn-next-week");
                    
                    if (prevBtn) {
                        prevBtn.addEventListener("click", () => {
                            if (window.currentWeekIndex > 0) {
                                window.currentWeekIndex--;
                                renderSelectedSchedule();
                            }
                        });
                    }
                    if (nextBtn) {
                        nextBtn.addEventListener("click", () => {
                            if (window.currentWeekIndex < window.availableWeeks.length - 1) {
                                window.currentWeekIndex++;
                                renderSelectedSchedule();
                            }
                        });
                    }
                }
                
                // 실제 주차 일정 렌더링 함수 정의 및 호출
                window.renderSelectedSchedule = function() {
                    const idx = window.currentWeekIndex;
                    const selectedWeek = window.availableWeeks[idx];
                    if (!selectedWeek) return;
                    
                    calendarGrid.innerHTML = "";
                    
                    if (window.isWeeklyEditModeActive) {
                        calendarGrid.classList.add("edit-mode-active");
                    } else {
                        calendarGrid.classList.remove("edit-mode-active");
                    }
                    
                    // 1) 헤더 및 버튼 갱신
                    const todayZero = new Date();
                    todayZero.setHours(0, 0, 0, 0);
                    const todayDayNum = todayZero.getDate();
                    const todayMonth = todayZero.getMonth() + 1;
                    
                    const dayNum = todayZero.getDay();
                    const diff = todayZero.getDate() - dayNum + (dayNum === 0 ? -6 : 1);
                    const curMonday = new Date(todayZero.getFullYear(), todayZero.getMonth(), diff);
                    const curMondayStr = curMonday.getFullYear() + "-" + String(curMonday.getMonth() + 1).padStart(2, '0') + "-" + String(curMonday.getDate()).padStart(2, '0');
                    
                    const [y, m, d] = selectedWeek.key.split("-").map(Number);
                    const monDate = new Date(y, m - 1, d);
                    const sunDate = new Date(y, m - 1, d + 6);
                    
                    const isThisWeek = (selectedWeek.key === curMondayStr);
                    const weekTitleText = (isThisWeek ? "이번 주" : `${monDate.getMonth() + 1}/${monDate.getDate()} ~ ${sunDate.getMonth() + 1}/${sunDate.getDate()}`);
                    
                    const weekTitleElem = document.getElementById("schedule-week-title");
                    if (weekTitleElem) {
                        weekTitleElem.innerText = weekTitleText;
                    }
                    
                    const prevBtn = document.getElementById("btn-prev-week");
                    const nextBtn = document.getElementById("btn-next-week");
                    if (prevBtn) prevBtn.disabled = (idx <= 0);
                    if (nextBtn) nextBtn.disabled = (idx >= window.availableWeeks.length - 1);
                    
                    // 2) 7일 렌더링
                    selectedWeek.schedule.forEach(item => {
                        const dayCard = document.createElement("div");
                        dayCard.className = "calendar-day-card";
                        
                        // 오늘 날짜인지 체크
                        const [itemMonth, itemDay] = item.date.split("/").map(Number);
                        if (itemMonth === todayMonth && itemDay === todayDayNum) {
                            dayCard.classList.add("today");
                        }
                         
                        // Construct targetDateStr to search in overrides
                        const itemYear = y;
                        const dateStr = `${itemYear}-${String(itemMonth).padStart(2, '0')}-${String(itemDay).padStart(2, '0')}`;
                        
                        const overrides = window.LOCAL_OVERRIDES || window.SCHEDULE_OVERRIDES || {};
                        let displayTime = item.time;
                        let displayDetail = item.detail;
                        
                        if (overrides[dateStr]) {
                            const ov = overrides[dateStr];
                            if (typeof ov === "string") {
                                displayTime = ov;
                                displayDetail = "";
                            } else {
                                displayTime = ov.time || "공지 대기";
                                displayDetail = ov.detail || "";
                            }
                        } else {
                            const itemZero = new Date(todayZero.getFullYear(), itemMonth - 1, itemDay);
                            if (itemZero < todayZero && displayTime === "공지 대기") {
                                displayTime = "휴방";
                            }
                        }
                         
                        if (displayTime === "휴방" || displayTime.startsWith("휴방")) {
                            dayCard.classList.add("rest");
                        } else if (displayTime && displayTime !== "공지 대기") {
                            dayCard.classList.add("active");
                        }
                         
                        dayCard.innerHTML = `
                            <div class="calendar-day-week">${item.day}</div>
                            <div class="calendar-day-date">${item.date}</div>
                            <div class="calendar-day-time">${displayTime}</div>
                            <div class="calendar-day-detail">${displayDetail}</div>
                        `;
                        
                        dayCard.addEventListener("click", () => {
                            if (window.isWeeklyEditModeActive) {
                                let status = "tbd";
                                if (displayTime === "휴방" || displayTime.startsWith("휴방")) {
                                    status = "rest";
                                    let cleanTime = displayTime.replace(/^휴방\s*->\s*/, "");
                                    if (cleanTime === "휴방") cleanTime = "";
                                    openEditModal(dateStr, cleanTime, displayDetail, status);
                                } else {
                                    if (displayTime !== "공지 대기") {
                                        status = "stream";
                                    }
                                    openEditModal(dateStr, displayTime, displayDetail, status);
                                }
                            }
                        });
                        
                        calendarGrid.appendChild(dayCard);
                    });
                };
                
                window.renderSelectedSchedule();
            } else {
                calendarGrid.style.display = "none";
                schedulePlaceholder.innerHTML = `<i class="fa-regular fa-folder-open"></i> 이번 주 일정이 아직 업로드되지 않았습니다.`;
            }
        }

        // 4. 팬아트 갤러리 이미지 동적 바인딩
        if (JERRY_DATA.fanarts && JERRY_DATA.fanarts.length > 0) {
            fanartGrid.innerHTML = ""; // 기존 로딩 표시 제거
            fanartCount.innerText = `${JERRY_DATA.fanarts.length}개`;

            JERRY_DATA.fanarts.forEach((imgUrl, index) => {
                const item = document.createElement("div");
                item.className = "fanart-item";
                item.innerHTML = `<img src="${imgUrl}" alt="제리츄 팬아트 ${index + 1}" loading="lazy">`;
                
                // 마이크로 상호작용: 클릭 시 모달 확대 바인딩
                item.addEventListener("click", () => {
                    const modal = document.getElementById("image-modal");
                    const modalImg = document.getElementById("modal-target-img");
                    modal.style.display = "flex";
                    modalImg.src = imgUrl;
                });
                
                fanartGrid.appendChild(item);
            });
        } else {
            fanartGrid.innerHTML = `
<div style="text-align: center; color: var(--text-muted); padding: 50px 0; font-size: 0.95rem; grid-column: 1 / -1;">
    <i class="fa-regular fa-images" style="font-size: 2.5rem; margin-bottom: 15px; display: block; color: var(--border-color);"></i>
    수집된 팬아트 이미지가 없습니다.
</div>`;
            fanartCount.innerText = "0개";
        }
    } else {
        // 데이터가 없는 최초 상태 또는 스크립트 미실행 시 샘플/가이드 데이터를 표기합니다.
        console.log("JERRY_DATA를 찾을 수 없습니다. 기본 가이드 데이터를 표기합니다.");
        updateBadge.innerText = "로컬 세팅 완료 (데이터 없음)";
        fanartCount.innerText = "0개";
        
        const noticeListContainer = document.getElementById("notice-list-container");
        if (noticeListContainer) {
            noticeListContainer.innerHTML = `
<div style="color: var(--text-muted); font-size: 0.95rem; text-align: center; padding: 20px 0;">
    <p><i class="fa-solid fa-circle-info" style="color: var(--primary-purple); font-size: 1.5rem; margin-bottom: 10px;"></i></p>
    <p>아직 크롤러를 통해 공지사항 데이터를 가져오지 않았습니다.</p>
    <p style="margin-top: 5px; font-size: 0.85rem;">[run.bat] 파일을 실행하여 제리츄님의 최신 공지를 수집해 주세요!</p>
</div>`;
        }

        schedulePlaceholder.innerHTML = `
<div style="text-align: center;">
    <i class="fa-solid fa-cheese" style="font-size: 2.5rem; color: var(--primary-cheese); margin-bottom: 15px;"></i>
    <p style="font-size: 0.9rem;">매크로가 작동하면 6월 일정표가 이곳에 뜹니다.</p>
</div>`;

        fanartGrid.innerHTML = `
<div style="text-align: center; color: var(--text-muted); padding: 50px 0; font-size: 0.95rem; grid-column: 1 / -1;">
    <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 2.5rem; color: var(--primary-purple); margin-bottom: 15px; display: block;"></i>
    매크로가 작동하면 팬아트 목록이 이곳에 로드됩니다.
</div>`;
    }
}

// ==============================================================================
// [IMAGE ZOOM MODAL LOGIC (공통)]
// ==============================================================================
function initImageModal() {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-target-img");
    const closeBtn = document.getElementById("modal-close");

    const closeModal = () => {
        modal.style.display = "none";
    };

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal || e.target === closeBtn) {
            closeModal();
        }
    });

    // ESC 키로 닫기
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "flex") {
            closeModal();
        }
    });
}

// ==============================================================================
// [MONTHLY CALENDAR RENDERING & EDITING LOGIC]
// ==============================================================================
function initTabNavigation() {
    const tabMonthly = document.getElementById("tab-monthly");
    const tabWeekly = document.getElementById("tab-weekly");
    const viewMonthly = document.getElementById("view-monthly");
    const viewWeekly = document.getElementById("view-weekly");

    if (tabMonthly && tabWeekly && viewMonthly && viewWeekly) {
        tabMonthly.addEventListener("click", () => {
            tabMonthly.classList.add("active");
            tabWeekly.classList.remove("active");
            viewMonthly.classList.add("active");
            viewWeekly.classList.remove("active");
        });

        tabWeekly.addEventListener("click", () => {
            tabWeekly.classList.add("active");
            tabMonthly.classList.remove("active");
            viewWeekly.classList.add("active");
            viewMonthly.classList.remove("active");
        });
    }
}

function renderMonthlyCalendar() {
    const titleElem = document.getElementById("monthly-title");
    const gridElem = document.getElementById("calendar-month-grid");
    if (!titleElem || !gridElem) return;

    const year = window.currentYear;
    const month = window.currentMonth;

    titleElem.innerText = `${year}년 ${month}월`;
    gridElem.innerHTML = "";

    const firstDay = new Date(year, month - 1, 1);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = new Date(year, month, 0).getDate();

    const prevMonthTotalDays = new Date(year, month - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const dayCard = document.createElement("div");
        dayCard.className = "monthly-day-card other-month";
        dayCard.innerHTML = `<div class="day-number">${prevMonthTotalDays - i}</div>`;
        gridElem.appendChild(dayCard);
    }

    const today = new Date();
    const isCurrentMonth = (today.getFullYear() === year && today.getMonth() + 1 === month);
    const todayDay = today.getDate();

    const overrides = window.LOCAL_OVERRIDES || window.SCHEDULE_OVERRIDES || {};

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayCard = document.createElement("div");
        dayCard.className = "monthly-day-card";
        
        const currentDayDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDayDate.getDay();
        if (dayOfWeek === 0) dayCard.classList.add("sunday");
        if (dayOfWeek === 6) dayCard.classList.add("saturday");

        if (isCurrentMonth && day === todayDay) {
            dayCard.classList.add("today");
        }

        let scheduleItem = null;
        if (overrides[dateStr]) {
            scheduleItem = overrides[dateStr];
        } else {
            scheduleItem = findParsedScheduleForDate(year, month, day);
        }

        let timeText = "공지 대기";
        let detailText = "";
        let status = "tbd";

        if (scheduleItem) {
            if (typeof scheduleItem === "string") {
                timeText = scheduleItem;
                if (scheduleItem === "휴방") {
                    status = "rest";
                } else if (scheduleItem !== "공지 대기") {
                    status = "stream";
                }
            } else {
                timeText = scheduleItem.time || "공지 대기";
                detailText = scheduleItem.detail || "";
                status = scheduleItem.status || "tbd";
            }
        }

        if (status === "rest" || timeText.startsWith("휴방")) {
            dayCard.classList.add("rest");
        } else if (status === "stream" || (timeText && timeText !== "공지 대기")) {
            dayCard.classList.add("stream");
        }

        dayCard.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-time-text">${timeText}</div>
            ${detailText ? `<div class="day-detail-text" title="${detailText}">${detailText}</div>` : ''}
        `;

        dayCard.addEventListener("click", () => {
            if (window.isEditModeActive) {
                openEditModal(dateStr, timeText, detailText, status);
            }
        });

        gridElem.appendChild(dayCard);
    }
}

function findParsedScheduleForDate(year, month, day) {
    if (typeof JERRY_DATA === "undefined" || !JERRY_DATA || !JERRY_DATA.schedules) return null;
    
    const targetDateStr = `${month}/${day}`;
    
    for (let mondayKey in JERRY_DATA.schedules) {
        const [mYear, mMonth, mDay] = mondayKey.split("-").map(Number);
        
        const monDate = new Date(mYear, mMonth - 1, mDay);
        const targetDate = new Date(year, month - 1, day);
        
        const diffTime = targetDate - monDate;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < 7) {
            const weekSchedule = JERRY_DATA.schedules[mondayKey];
            if (weekSchedule) {
                const matchedDay = weekSchedule.find(item => item.date === targetDateStr);
                if (matchedDay) {
                    let timeVal = matchedDay.time;
                    const todayZero = new Date();
                    todayZero.setHours(0,0,0,0);
                    if (targetDate < todayZero && timeVal === "공지 대기") {
                        timeVal = "휴방";
                    }
                    return {
                        time: timeVal,
                        detail: matchedDay.detail || "",
                        status: (timeVal === "휴방" || timeVal.startsWith("휴방")) ? "rest" : ((timeVal !== "공지 대기") ? "stream" : "tbd")
                    };
                }
            }
        }
    }
    return null;
}

function initMonthlyEditor() {
    const btnToggleEdit = document.getElementById("btn-toggle-edit");
    const btnDownloadOverrides = document.getElementById("btn-download-overrides");
    const gridElem = document.getElementById("calendar-month-grid");

    if (typeof window.LOCAL_OVERRIDES === "undefined") {
        try {
            const saved = localStorage.getItem("schedule_overrides");
            window.LOCAL_OVERRIDES = saved ? JSON.parse(saved) : {};
        } catch (e) {
            window.LOCAL_OVERRIDES = {};
        }
        
        if (typeof window.SCHEDULE_OVERRIDES !== "undefined") {
            window.LOCAL_OVERRIDES = Object.assign({}, window.SCHEDULE_OVERRIDES, window.LOCAL_OVERRIDES);
        }
    }

    if (btnToggleEdit) {
        window.isEditModeActive = false;
        
        // Remove any old event listeners by replacing the element
        const newBtnToggleEdit = btnToggleEdit.cloneNode(true);
        btnToggleEdit.parentNode.replaceChild(newBtnToggleEdit, btnToggleEdit);
        
        newBtnToggleEdit.addEventListener("click", () => {
            window.isEditModeActive = !window.isEditModeActive;
            const grid = document.getElementById("calendar-month-grid");
            
            if (window.isEditModeActive) {
                newBtnToggleEdit.innerHTML = `<i class="fa-solid fa-lock"></i> 수정 모드 끄기`;
                newBtnToggleEdit.style.background = "rgba(255, 75, 75, 0.15)";
                newBtnToggleEdit.style.color = "hsl(0, 85%, 45%)";
                newBtnToggleEdit.style.borderColor = "hsla(0, 85%, 45%, 0.3)";
                if (grid) grid.classList.add("edit-mode-active");
            } else {
                newBtnToggleEdit.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> 수정 모드 켜기`;
                newBtnToggleEdit.style.background = "";
                newBtnToggleEdit.style.color = "";
                newBtnToggleEdit.style.borderColor = "";
                if (grid) grid.classList.remove("edit-mode-active");
            }
            renderMonthlyCalendar();
        });
    }

    const editModal = document.getElementById("edit-modal");
    const editModalClose = document.getElementById("edit-modal-close");
    const btnSaveEdit = document.getElementById("btn-save-edit");

    if (editModalClose) {
        editModalClose.addEventListener("click", () => {
            editModal.style.display = "none";
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === editModal) {
            editModal.style.display = "none";
        }
    });

    if (btnSaveEdit) {
        const newBtnSaveEdit = btnSaveEdit.cloneNode(true);
        btnSaveEdit.parentNode.replaceChild(newBtnSaveEdit, btnSaveEdit);
        newBtnSaveEdit.addEventListener("click", () => {
            const dateStr = window.activeEditDate;
            const status = document.getElementById("edit-status").value;
            const time = document.getElementById("edit-time").value.trim();
            const detail = document.getElementById("edit-detail").value.trim();

            if (!window.LOCAL_OVERRIDES) window.LOCAL_OVERRIDES = {};

            if (status === "tbd") {
                delete window.LOCAL_OVERRIDES[dateStr];
            } else {
                window.LOCAL_OVERRIDES[dateStr] = {
                    time: (status === "rest") ? "휴방" : (time || "오후 7:00 방송"),
                    detail: detail,
                    status: status
                };
            }

            try {
                localStorage.setItem("schedule_overrides", JSON.stringify(window.LOCAL_OVERRIDES));
            } catch (e) {}

            editModal.style.display = "none";
            renderMonthlyCalendar();
            
            if (typeof window.renderSelectedSchedule === "function") {
                window.renderSelectedSchedule();
            }
        });
    }

    // 주간 일정 수정 버튼 바인딩
    const btnToggleEditWeekly = document.getElementById("btn-toggle-edit-weekly");
    const btnDownloadOverridesWeekly = document.getElementById("btn-download-overrides-weekly");

    if (btnToggleEditWeekly) {
        window.isWeeklyEditModeActive = false;
        
        const newBtnToggleEditWeekly = btnToggleEditWeekly.cloneNode(true);
        btnToggleEditWeekly.parentNode.replaceChild(newBtnToggleEditWeekly, btnToggleEditWeekly);
        
        newBtnToggleEditWeekly.addEventListener("click", () => {
            window.isWeeklyEditModeActive = !window.isWeeklyEditModeActive;
            const grid = document.getElementById("calendar-grid");
            
            if (window.isWeeklyEditModeActive) {
                newBtnToggleEditWeekly.innerHTML = `<i class="fa-solid fa-lock"></i> 수정 모드 끄기`;
                newBtnToggleEditWeekly.style.background = "rgba(255, 75, 75, 0.15)";
                newBtnToggleEditWeekly.style.color = "hsl(0, 85%, 45%)";
                newBtnToggleEditWeekly.style.borderColor = "hsla(0, 85%, 45%, 0.3)";
                if (grid) grid.classList.add("edit-mode-active");
            } else {
                newBtnToggleEditWeekly.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> 수정 모드 켜기`;
                newBtnToggleEditWeekly.style.background = "";
                newBtnToggleEditWeekly.style.color = "";
                newBtnToggleEditWeekly.style.borderColor = "";
                if (grid) grid.classList.remove("edit-mode-active");
            }
            if (typeof window.renderSelectedSchedule === "function") {
                window.renderSelectedSchedule();
            }
        });
    }

    const prevMonthBtn = document.getElementById("btn-prev-month");
    const nextMonthBtn = document.getElementById("btn-next-month");
    
    if (prevMonthBtn) {
        const newPrevMonthBtn = prevMonthBtn.cloneNode(true);
        prevMonthBtn.parentNode.replaceChild(newPrevMonthBtn, prevMonthBtn);
        newPrevMonthBtn.addEventListener("click", () => {
            if (window.currentMonth === 1) {
                window.currentMonth = 12;
                window.currentYear--;
            } else {
                window.currentMonth--;
            }
            renderMonthlyCalendar();
        });
    }
    
    if (nextMonthBtn) {
        const newNextMonthBtn = nextMonthBtn.cloneNode(true);
        nextMonthBtn.parentNode.replaceChild(newNextMonthBtn, nextMonthBtn);
        newNextMonthBtn.addEventListener("click", () => {
            if (window.currentMonth === 12) {
                window.currentMonth = 1;
                window.currentYear++;
            } else {
                window.currentMonth++;
            }
            renderMonthlyCalendar();
        });
    }
}

function openEditModal(dateStr, timeText, detailText, status) {
    const editModal = document.getElementById("edit-modal");
    const titleElem = document.getElementById("edit-modal-title");
    if (!editModal || !titleElem) return;

    window.activeEditDate = dateStr;
    const [y, m, d] = dateStr.split("-").map(Number);
    titleElem.innerText = `${y}년 ${m}월 ${d}일 일정 수정`;

    const statusSelect = document.getElementById("edit-status");
    const timeInput = document.getElementById("edit-time");
    const detailInput = document.getElementById("edit-detail");

    statusSelect.value = status || "tbd";
    timeInput.value = (status === "rest" || timeText === "휴방") ? "" : timeText;
    detailInput.value = detailText || "";

    editModal.style.display = "flex";
}


