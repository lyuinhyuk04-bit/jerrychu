// ==============================================================================
// [DATA BINDING] - 크롤러가 생성하는 data.js 로부터 데이터를 로드
// ==============================================================================
window.supabaseClient = null;

async function initSupabase() {
    if (window.supabaseClient) return true;
    try {
        const res = await fetch("config.json");
        const config = await res.json();
        if (typeof window.supabase !== "undefined" && config.SUPABASE_URL && config.SUPABASE_ANON_KEY && config.SUPABASE_URL !== "https://your-project.supabase.co") {
            window.supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
            console.log("Supabase Client initialized successfully.");
            return true;
        }
    } catch (e) {
        console.warn("Failed to load config.json or initialize Supabase:", e);
    }
    return false;
}

async function fetchAndMergeOverrides() {
    window.LOCAL_OVERRIDES = {};
    
    // 1. overrides.js 파일의 정적 데이터 우선 바인딩 (폴백용)
    if (typeof window.SCHEDULE_OVERRIDES !== "undefined") {
        window.LOCAL_OVERRIDES = Object.assign({}, window.SCHEDULE_OVERRIDES);
    }

    // 2. localStorage 로컬 수정 캐시 데이터 복구 바인딩 (Supabase 미연결 또는 로컬 테스트 환경용)
    try {
        const saved = localStorage.getItem("schedule_overrides");
        if (saved) {
            const localSaved = JSON.parse(saved);
            window.LOCAL_OVERRIDES = Object.assign(window.LOCAL_OVERRIDES, localSaved);
        }
    } catch (e) {
        console.warn("Failed to load schedule_overrides from localStorage:", e);
    }

    // 3. Supabase DB에서 실시간 오버라이드 내역 긁어와 병합 (최우선순위)
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('schedule_overrides')
                .select('date, time, detail, status');
            
            if (error) throw error;

            if (data) {
                data.forEach(row => {
                    window.LOCAL_OVERRIDES[row.date] = {
                        time: row.time,
                        detail: row.detail || "",
                        status: row.status
                    };
                });
                console.log(`Supabase로부터 {${data.length}}개의 일정을 성공적으로 동기화했습니다.`);
            }
        } catch (e) {
            console.warn("Supabase 데이터 로드 실패, 로컬 폴백을 시도합니다:", e);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    window.currentYear = today.getFullYear();
    window.currentMonth = today.getMonth() + 1;
    
    loadDataAndBind();
    
    // 1분마다 데이터를 백그라운드에서 자동으로 다시 로드하여 갱신합니다.
    setInterval(loadDataAndBind, 60000); 
});

function loadDataAndBind() {
    const oldScript = document.getElementById("dynamic-data-script");
    if (oldScript) {
        oldScript.remove();
    }
    
    const script = document.createElement("script");
    script.id = "dynamic-data-script";
    script.src = "data.js?t=" + new Date().getTime();
    script.onload = async () => {
        await initSupabase();
        await fetchAndMergeOverrides(); // 캘린더 로딩 전 Supabase 동기화
        initDataBinding();
        initMonthlyEditor();
        initTabNavigation();
        renderMonthlyCalendar();
        initImageModal();
        initEvents();
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

        // 4. 팬아트 갤러리 이미지 동적 바인딩 (무한 스크롤 적용)
        if (JERRY_DATA.fanarts && JERRY_DATA.fanarts.length > 0) {
            fanartGrid.innerHTML = ""; // 기존 로딩 표시 제거
            fanartCount.innerText = `${JERRY_DATA.fanarts.length}개`;

            const fanarts = JERRY_DATA.fanarts;
            const fanartsPerPage = 9;
            let currentFanartPage = 0;
            let isObserverBinding = false;

            // 특정 페이지의 팬아트들을 렌더링하는 함수
            const renderFanartPage = (page) => {
                const startIdx = page * fanartsPerPage;
                const endIdx = Math.min(startIdx + fanartsPerPage, fanarts.length);

                for (let i = startIdx; i < endIdx; i++) {
                    const imgUrl = fanarts[i];
                    const item = document.createElement("div");
                    item.className = "fanart-item";
                    item.innerHTML = `<img src="${imgUrl}" alt="제리츄 팬아트 ${i + 1}" loading="lazy">`;
                    
                    item.addEventListener("click", () => {
                        const modal = document.getElementById("image-modal");
                        const modalImg = document.getElementById("modal-target-img");
                        if (modal && modalImg) {
                            modal.style.display = "flex";
                            modalImg.src = imgUrl;
                        }
                    });
                    
                    fanartGrid.appendChild(item);
                }

                // 다음 페이지가 더 있다면 무한스크롤 감시 기포 생성 및 배치
                if (endIdx < fanarts.length) {
                    setupInfiniteScroll();
                } else {
                    removeSentinel();
                }
            };

            // 센티널 요소 생성 및 감시 설정
            const setupInfiniteScroll = () => {
                let sentinel = document.getElementById("fanart-sentinel");
                if (!sentinel) {
                    sentinel = document.createElement("div");
                    sentinel.id = "fanart-sentinel";
                    sentinel.style.gridColumn = "1 / -1";
                    sentinel.style.height = "60px";
                    sentinel.style.display = "flex";
                    sentinel.style.justifyContent = "center";
                    sentinel.style.alignItems = "center";
                    sentinel.style.color = "var(--text-muted)";
                    sentinel.style.fontSize = "0.9rem";
                    sentinel.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px; color: var(--primary-purple);"></i> 팬아트를 불러오는 중...`;
                }
                
                // 그리드 맨 아래로 위치 조정하여 어펜드
                fanartGrid.appendChild(sentinel);

                if (!isObserverBinding && 'IntersectionObserver' in window) {
                    isObserverBinding = true;
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                observer.unobserve(entry.target);
                                isObserverBinding = false;
                                
                                setTimeout(() => {
                                    currentFanartPage++;
                                    renderFanartPage(currentFanartPage);
                                }, 300);
                            }
                        });
                    }, {
                        root: fanartGrid,
                        rootMargin: "0px 0px 200px 0px"
                    });
                    
                    observer.observe(sentinel);
                }
            };

            const removeSentinel = () => {
                const sentinel = document.getElementById("fanart-sentinel");
                if (sentinel) {
                    sentinel.remove();
                }
            };

            // 최초 1페이지 렌더링
            renderFanartPage(0);

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
    const tabEvents = document.getElementById("tab-events");
    
    const viewMonthly = document.getElementById("view-monthly");
    const viewWeekly = document.getElementById("view-weekly");
    const viewEvents = document.getElementById("view-events");

    if (tabMonthly && tabWeekly && tabEvents && viewMonthly && viewWeekly && viewEvents) {
        tabMonthly.addEventListener("click", () => {
            setActiveTab(tabMonthly, viewMonthly);
        });

        tabWeekly.addEventListener("click", () => {
            setActiveTab(tabWeekly, viewWeekly);
        });
        
        tabEvents.addEventListener("click", () => {
            setActiveTab(tabEvents, viewEvents);
            renderEvents();
        });
    }
    
    function setActiveTab(activeTab, activeView) {
        [tabMonthly, tabWeekly, tabEvents].forEach(t => {
            if (t) t.classList.remove("active");
        });
        [viewMonthly, viewWeekly, viewEvents].forEach(v => {
            if (v) v.classList.remove("active");
        });
        
        activeTab.classList.add("active");
        activeView.classList.add("active");
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

// ==============================================================================
// [EVENTS TAB COMPONENT LOGIC]
// ==============================================================================
window.eventThumbnailBase64 = ""; // 전역 이미지 임시 캐시
window.editingEventId = null; // 수정 중인 이벤트 ID

function initEvents() {
    const btnOpenEventAdd = document.getElementById("btn-open-event-add");
    const eventEditModal = document.getElementById("event-edit-modal");
    const eventEditModalClose = document.getElementById("event-edit-modal-close");
    const btnSaveEvent = document.getElementById("btn-save-event");
    const btnDeleteEvent = document.getElementById("btn-delete-event");
    
    const eventTypeBtns = document.querySelectorAll(".event-type-btn");
    const fileInput = document.getElementById("event-thumbnail-file");
    const previewContainer = document.getElementById("event-thumbnail-preview-container");
    const previewImg = document.getElementById("event-thumbnail-preview");
    const btnRemovePreview = document.getElementById("btn-remove-preview");
    
    const btnParseOg = document.getElementById("btn-parse-og");
    const eventParserUrl = document.getElementById("event-parser-url");
    const linkParserArea = document.getElementById("event-link-parser-area");
    
    const eventDetailModal = document.getElementById("event-detail-modal");
    const eventDetailModalClose = document.getElementById("event-detail-modal-close");
    const btnDetailEdit = document.getElementById("btn-detail-edit");

    // 1) 이벤트 등록 모달 열기
    if (btnOpenEventAdd) {
        btnOpenEventAdd.addEventListener("click", () => {
            window.editingEventId = null;
            window.eventThumbnailBase64 = "";
            document.getElementById("event-edit-modal-title").innerText = "이벤트 등록";
            
            // 폼 초기화
            document.getElementById("event-title").value = "";
            document.getElementById("event-start-date").value = "";
            document.getElementById("event-end-date").value = "";
            document.getElementById("event-desc").value = "";
            document.getElementById("event-url").value = "";
            fileInput.value = "";
            if (eventParserUrl) eventParserUrl.value = "";
            
            if (previewContainer) previewContainer.style.display = "none";
            if (btnDeleteEvent) btnDeleteEvent.style.display = "none";
            
            // 기본 '직접 입력' 탭 활성화
            switchEventType("direct");
            
            if (eventEditModal) eventEditModal.style.display = "flex";
        });
    }

    // 2) 모달 닫기
    if (eventEditModalClose) {
        eventEditModalClose.addEventListener("click", () => {
            eventEditModal.style.display = "none";
        });
    }
    
    if (eventDetailModalClose) {
        eventDetailModalClose.addEventListener("click", () => {
            eventDetailModal.style.display = "none";
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === eventEditModal) {
            eventEditModal.style.display = "none";
        }
        if (e.target === eventDetailModal) {
            eventDetailModal.style.display = "none";
        }
    });

    // 3) 등록 방식 탭 전환
    eventTypeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            eventTypeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            switchEventType(btn.dataset.type);
        });
    });

    function switchEventType(type) {
        if (type === "link") {
            if (linkParserArea) linkParserArea.style.display = "block";
        } else {
            if (linkParserArea) linkParserArea.style.display = "none";
        }
    }

    // 4) 썸네일 이미지 업로드 시 Base64 변환 및 압축 캐싱
    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                resizeAndEncodeImage(file, (base64Str) => {
                    window.eventThumbnailBase64 = base64Str;
                    if (previewImg) previewImg.src = base64Str;
                    if (previewContainer) previewContainer.style.display = "block";
                });
            }
        });
    }

    // 5) 이미지 미리보기 제거
    if (btnRemovePreview) {
        btnRemovePreview.addEventListener("click", () => {
            window.eventThumbnailBase64 = "";
            if (fileInput) fileInput.value = "";
            if (previewContainer) previewContainer.style.display = "none";
        });
    }

    // 6) 링크 불러오기 (Open Graph 파서 API 호출 및 CORS 프록시 폴백)
    if (btnParseOg) {
        btnParseOg.addEventListener("click", async () => {
            const url = eventParserUrl.value.trim();
            if (!url) {
                alert("불러올 이벤트 URL 주소를 입력해 주세요.");
                return;
            }
            
            btnParseOg.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 불러오는 중...`;
            btnParseOg.disabled = true;

            let result = null;

            try {
                // 1차 시도: Vercel 서버리스 함수 호출
                try {
                    const res = await fetch(`/api/fetch_og?url=${encodeURIComponent(url)}`);
                    if (res.ok) {
                        result = await res.json();
                    }
                } catch (apiErr) {
                    console.warn("Vercel Serverless API not available. Trying CORS Proxy Fallback...", apiErr);
                }

                // 2차 시도: 1차 실패 시 퍼블릭 CORS 프록시로 클라이언트 측 직접 파싱 시도
                if (!result || !result.success) {
                    const fallbackRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
                    if (!fallbackRes.ok) throw new Error("CORS Proxy requests failed");
                    const json = await fallbackRes.json();
                    
                    if (json && json.contents) {
                        const html = json.contents;
                        
                        const extractMetaContent = (htmlText, propertyName) => {
                            const regex1 = new RegExp(`<meta[^>]*property=["']${propertyName}["'][^>]*content=["']([^"']*)["']`, 'i');
                            const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${propertyName}["']`, 'i');
                            const regex3 = new RegExp(`<meta[^>]*name=["']${propertyName}["'][^>]*content=["']([^"']*)["']`, 'i');
                            const regex4 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${propertyName}["']`, 'i');

                            const match = htmlText.match(regex1) || htmlText.match(regex2) || htmlText.match(regex3) || htmlText.match(regex4);
                            return match ? match[1] : '';
                        };

                        const decodeHtmlEntities = (text) => {
                            if (!text) return '';
                            return text
                                .replace(/&amp;/g, '&')
                                .replace(/&quot;/g, '"')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&#39;/g, "'")
                                .replace(/&apos;/g, "'")
                                .replace(/&#x2F;/g, '/');
                        };

                        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
                        const fallbackTitle = titleMatch ? titleMatch[1] : '';

                        result = {
                            success: true,
                            data: {
                                title: decodeHtmlEntities(extractMetaContent(html, 'og:title') || fallbackTitle || '제목 없음'),
                                description: decodeHtmlEntities(extractMetaContent(html, 'og:description') || extractMetaContent(html, 'description') || ''),
                                image: extractMetaContent(html, 'og:image') || '',
                                url: url
                            }
                        };
                    }
                }
                
                if (result && result.success && result.data) {
                    const ogData = result.data;
                    document.getElementById("event-title").value = ogData.title || "";
                    document.getElementById("event-desc").value = ogData.description || "";
                    document.getElementById("event-url").value = ogData.url || url;
                    
                    if (ogData.image) {
                        window.eventThumbnailBase64 = ogData.image;
                        if (previewImg) previewImg.src = ogData.image;
                        if (previewContainer) previewContainer.style.display = "block";
                    } else {
                        window.eventThumbnailBase64 = "";
                        if (previewContainer) previewContainer.style.display = "none";
                    }
                    alert("이벤트 정보를 정상적으로 로드했습니다!");
                } else {
                    alert("링크 정보를 가져오지 못했습니다. 직접 입력으로 작성해 주세요.");
                }
            } catch (e) {
                console.error("Open Graph parse error:", e);
                alert("정보를 자동으로 불러오지 못했습니다. 직접 작성해 주세요.");
            } finally {
                btnParseOg.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> 정보 불러오기`;
                btnParseOg.disabled = false;
            }
        });
    }

    // 7) 이벤트 저장하기
    if (btnSaveEvent) {
        btnSaveEvent.addEventListener("click", () => {
            const title = document.getElementById("event-title").value.trim();
            const startDate = document.getElementById("event-start-date").value;
            const endDate = document.getElementById("event-end-date").value;
            const desc = document.getElementById("event-desc").value.trim();
            const url = document.getElementById("event-url").value.trim();
            
            if (!title || !startDate || !endDate) {
                alert("제목, 시작일, 종료일은 필수 항목입니다.");
                return;
            }

            let events = [];
            try {
                const saved = localStorage.getItem("jerry_events");
                events = saved ? JSON.parse(saved) : [];
            } catch (e) {
                events = [];
            }

            const eventData = {
                id: window.editingEventId || "evt_" + new Date().getTime(),
                title: title,
                startDate: startDate,
                endDate: endDate,
                desc: desc,
                url: url,
                image: window.eventThumbnailBase64
            };

            if (window.editingEventId) {
                // 수정
                const idx = events.findIndex(e => e.id === window.editingEventId);
                if (idx !== -1) {
                    events[idx] = eventData;
                }
            } else {
                // 신규 추가
                events.push(eventData);
            }

            localStorage.setItem("jerry_events", JSON.stringify(events));
            
            if (eventEditModal) eventEditModal.style.display = "none";
            renderEvents();
        });
    }

    // 8) 이벤트 삭제하기
    if (btnDeleteEvent) {
        btnDeleteEvent.addEventListener("click", () => {
            if (!window.editingEventId) return;
            if (!confirm("이 이벤트를 정말로 삭제하시겠습니까?")) return;

            let events = [];
            try {
                const saved = localStorage.getItem("jerry_events");
                events = saved ? JSON.parse(saved) : [];
            } catch (e) {}

            events = events.filter(e => e.id !== window.editingEventId);
            localStorage.setItem("jerry_events", JSON.stringify(events));
            
            if (eventEditModal) eventEditModal.style.display = "none";
            renderEvents();
        });
    }

    // 9) 상세 페이지 내 수정 버튼 클릭
    if (btnDetailEdit) {
        btnDetailEdit.addEventListener("click", () => {
            if (eventDetailModal) eventDetailModal.style.display = "none";
            openEventEditModal(window.editingEventId);
        });
    }
}

// 이미지 리사이즈 및 Base64 인코딩 헬퍼 함수
function resizeAndEncodeImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const max_size = 600; 
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > max_size) {
                    height *= max_size / width;
                    width = max_size;
                }
            } else {
                if (height > max_size) {
                    width *= max_size / height;
                    height = max_size;
                }
            }
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            callback(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 특정 이벤트의 수정을 위해 모달을 여는 함수
function openEventEditModal(eventId) {
    let events = [];
    try {
        const saved = localStorage.getItem("jerry_events");
        events = saved ? JSON.parse(saved) : [];
    } catch (e) {}

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    window.editingEventId = eventId;
    window.eventThumbnailBase64 = event.image || "";
    
    document.getElementById("event-edit-modal-title").innerText = "이벤트 수정";
    document.getElementById("event-title").value = event.title;
    document.getElementById("event-start-date").value = event.startDate;
    document.getElementById("event-end-date").value = event.endDate;
    document.getElementById("event-desc").value = event.desc || "";
    document.getElementById("event-url").value = event.url || "";
    
    const previewContainer = document.getElementById("event-thumbnail-preview-container");
    const previewImg = document.getElementById("event-thumbnail-preview");
    const fileInput = document.getElementById("event-thumbnail-file");
    const btnDeleteEvent = document.getElementById("btn-delete-event");
    
    if (fileInput) fileInput.value = "";
    
    if (event.image) {
        if (previewImg) previewImg.src = event.image;
        if (previewContainer) previewContainer.style.display = "block";
    } else {
        if (previewContainer) previewContainer.style.display = "none";
    }

    if (btnDeleteEvent) btnDeleteEvent.style.display = "inline-flex";
    
    const eventEditModal = document.getElementById("event-edit-modal");
    if (eventEditModal) eventEditModal.style.display = "flex";
}

// 이벤트 상세 정보 모달 열기
function openEventDetailModal(eventId) {
    let events = [];
    try {
        const saved = localStorage.getItem("jerry_events");
        events = saved ? JSON.parse(saved) : [];
    } catch (e) {}

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    window.editingEventId = eventId;
    
    document.getElementById("event-detail-title").innerText = event.title;
    
    // 시작일 ~ 종료일 포맷팅
    const startStr = event.startDate.replace(/-/g, ".");
    const endStr = event.endDate.replace(/-/g, ".");
    document.getElementById("event-detail-date").innerText = `${startStr} ~ ${endStr}`;
    
    document.getElementById("event-detail-desc").innerText = event.desc || "상세 설명이 등록되어 있지 않습니다.";
    
    const badgeContainer = document.getElementById("event-detail-badge-container");
    const statusInfo = getEventStatus(event.startDate, event.endDate);
    
    badgeContainer.innerHTML = `<span class="event-badge ${statusInfo.class}" style="position:static;">${statusInfo.text}</span>`;
    
    const imgContainer = document.getElementById("event-detail-img-container");
    const detailImg = document.getElementById("event-detail-img");
    
    if (event.image) {
        if (detailImg) detailImg.src = event.image;
        if (imgContainer) imgContainer.style.display = "block";
    } else {
        if (imgContainer) imgContainer.style.display = "none";
    }
    
    const linkBtn = document.getElementById("btn-detail-link");
    if (linkBtn) {
        if (event.url) {
            linkBtn.href = event.url;
            linkBtn.style.display = "inline-flex";
        } else {
            linkBtn.style.display = "none";
        }
    }
    
    // 관리자(수정하기) 버튼 노출 여부
    const btnDetailEdit = document.getElementById("btn-detail-edit");
    if (btnDetailEdit) {
        btnDetailEdit.style.display = "inline-flex"; // 상세 화면에서 즉시 수정이 가능하도록 노출
    }

    const eventDetailModal = document.getElementById("event-detail-modal");
    if (eventDetailModal) eventDetailModal.style.display = "flex";
}

// 이벤트 상태 계산 헬퍼 함수
function getEventStatus(startDateStr, endDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // KST 자정 기준 설정
    
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    if (today < start) {
        return { text: "예정", class: "upcoming", order: 1 };
    } else if (today <= end) {
        return { text: "진행중", class: "ongoing", order: 0 };
    } else {
        return { text: "종료", class: "ended", order: 2 };
    }
}

// 이벤트 목록 렌더링 함수
function renderEvents() {
    const gridElem = document.getElementById("events-grid");
    if (!gridElem) return;

    let events = [];
    try {
        const saved = localStorage.getItem("jerry_events");
        events = saved ? JSON.parse(saved) : [];
    } catch (e) {}

    gridElem.innerHTML = "";

    // 등록된 이벤트가 완전히 비어 있을 때 안내 표시
    if (events.length === 0) {
        gridElem.innerHTML = `
            <div class="placeholder-text" style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 250px;">
                <i class="fa-solid fa-gift" style="font-size: 3.5rem; color: var(--primary-purple); opacity: 0.3; margin-bottom: 5px;"></i>
                <span style="font-size: 1.1rem; font-weight: 600; color: var(--text-main);">등록된 이벤트가 없습니다</span>
                <span style="font-size: 0.85rem; opacity: 0.8;">우측 상단의 '이벤트 등록' 버튼을 눌러 새로운 이벤트를 추가해 보세요!</span>
            </div>
        `;
        return;
    }

    // 1) 상태 및 시작날짜 기준 정렬
    events.forEach(e => {
        e._statusInfo = getEventStatus(e.startDate, e.endDate);
    });

    events.sort((a, b) => {
        // 1순위: 진행중(ongoing) > 예정(upcoming) > 종료(ended) 순서로 정렬
        if (a._statusInfo.order !== b._statusInfo.order) {
            return a._statusInfo.order - b._statusInfo.order;
        }
        // 2순위: 시작일 날짜가 빠른 순서 정렬
        return new Date(a.startDate) - new Date(b.startDate);
    });

    events.forEach(event => {
        const card = document.createElement("div");
        card.className = "event-card";
        
        const statusInfo = event._statusInfo;
        
        // 썸네일 이미지 레이아웃 빌드
        const thumbnailHtml = event.image 
            ? `<img class="event-thumbnail" src="${event.image}" alt="썸네일" />`
            : `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; background:var(--gradient-hero); color:#fff; font-size:2.5rem;"><i class="fa-solid fa-cheese"></i></div>`;

        card.innerHTML = `
            <span class="event-badge ${statusInfo.class}">${statusInfo.text}</span>
            <div class="event-thumbnail-wrap">
                ${thumbnailHtml}
            </div>
            <div class="event-card-content">
                <h3 class="event-card-title">${event.title}</h3>
                <div class="event-card-date">
                    <i class="fa-regular fa-calendar-check"></i>
                    <span>${event.startDate.replace(/-/g, ".")} ~ ${event.endDate.replace(/-/g, ".")}</span>
                </div>
                <button type="button" class="btn-event-go">
                    <i class="fa-solid fa-circle-info"></i> 상세보기
                </button>
            </div>
        `;

        card.addEventListener("click", () => {
            openEventDetailModal(event.id);
        });

        gridElem.appendChild(card);
    });
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
        newBtnSaveEdit.addEventListener("click", async () => {
            const dateStr = window.activeEditDate;
            const status = document.getElementById("edit-status").value;
            const time = document.getElementById("edit-time").value.trim();
            const detail = document.getElementById("edit-detail").value.trim();

            if (!window.LOCAL_OVERRIDES) window.LOCAL_OVERRIDES = {};

            const resolvedTime = (status === "rest") ? "휴방" : (time || "오후 7:00 방송");
            const resolvedDetail = detail;

            // 저장 처리 중 더블클릭 방지 및 UI 인디케이터
            const originalText = newBtnSaveEdit.innerHTML;
            newBtnSaveEdit.disabled = true;
            newBtnSaveEdit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...`;

            if (window.supabaseClient) {
                try {
                    if (status === "tbd") {
                        // DB에서 삭제
                        const { error } = await window.supabaseClient
                            .from('schedule_overrides')
                            .delete()
                            .eq('date', dateStr);
                        if (error) throw error;
                        
                        delete window.LOCAL_OVERRIDES[dateStr];
                    } else {
                        // DB에 UPSERT (덮어쓰기)
                        const { error } = await window.supabaseClient
                            .from('schedule_overrides')
                            .upsert({
                                date: dateStr,
                                time: resolvedTime,
                                detail: resolvedDetail,
                                status: status
                            });
                        if (error) throw error;

                        window.LOCAL_OVERRIDES[dateStr] = {
                            time: resolvedTime,
                            detail: resolvedDetail,
                            status: status
                        };
                    }
                    console.log("Supabase에 일정이 성공적으로 동기화되었습니다.");
                } catch (err) {
                    console.error("Supabase 저장 에러:", err);
                    alert("데이터베이스 일정 저장 실패: " + err.message);
                    newBtnSaveEdit.disabled = false;
                    newBtnSaveEdit.innerHTML = originalText;
                    return;
                }
            } else {
                // Supabase 미연결 시 로컬 폴백
                if (status === "tbd") {
                    delete window.LOCAL_OVERRIDES[dateStr];
                } else {
                    window.LOCAL_OVERRIDES[dateStr] = {
                        time: resolvedTime,
                        detail: resolvedDetail,
                        status: status
                    };
                }
                try {
                    localStorage.setItem("schedule_overrides", JSON.stringify(window.LOCAL_OVERRIDES));
                } catch (e) {}
                console.warn("Supabase 자격 증명이 세팅되지 않았습니다. 로컬 브라우저 세션에만 반영됩니다.");
            }

            newBtnSaveEdit.disabled = false;
            newBtnSaveEdit.innerHTML = originalText;
            editModal.style.display = "none";
            
            // 즉각 화면 리렌더링
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


