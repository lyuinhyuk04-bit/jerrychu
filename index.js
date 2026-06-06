// ==============================================================================
// [DATA BINDING] - 크롤러가 생성하는 data.js 로부터 데이터를 로드
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
    initDataBinding();
    initImageModal();
});

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
        if (liveIndicator) {
            if (JERRY_DATA.is_live) {
                liveIndicator.style.display = "flex";
            } else {
                liveIndicator.style.display = "none";
            }
        }
        
        // 1. 동기화 시간 갱신
        if (JERRY_DATA.updated_at) {
            updateBadge.innerText = `${JERRY_DATA.updated_at} 동기화 완료`;
            updateBadge.style.background = "rgba(43, 194, 83, 0.15)";
            updateBadge.style.color = "hsl(135, 75%, 65%)";
            updateBadge.style.borderColor = "hsla(135, 75%, 65%, 0.3)";
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
                    
                    noticeItem.innerHTML = `
                        <div class="notice-item-header">
                            <div class="notice-item-title">
                                <i class="fa-solid fa-bullhorn"></i>
                                <span>${notice.title}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <span class="notice-item-date">${notice.date.split(" ")[0]}</span>
                                <span class="notice-item-toggle">내용보기 <i class="fa-solid fa-chevron-down"></i></span>
                            </div>
                        </div>
                        <div class="notice-item-body">${notice.content}</div>
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

        // 3. 주간 일정표 (캘린더 그리드) 동적 바인딩
        const calendarGrid = document.getElementById("calendar-grid");
        if (calendarGrid) {
            if (JERRY_DATA.schedule && JERRY_DATA.schedule.length > 0) {
                schedulePlaceholder.style.display = "none";
                calendarGrid.style.display = "grid";
                calendarGrid.innerHTML = "";
                
                // 오늘 요일 구하기
                const todayDate = new Date();
                const todayDayNum = todayDate.getDate();
                const todayMonth = todayDate.getMonth() + 1; // 1-indexed
                
                JERRY_DATA.schedule.forEach(item => {
                    const dayCard = document.createElement("div");
                    dayCard.className = "calendar-day-card";
                    
                    // 오늘 날짜인지 체크
                    const [m, d] = item.date.split("/").map(Number);
                    if (m === todayMonth && d === todayDayNum) {
                        dayCard.classList.add("today");
                    }
                    
                    // 휴방인지 체크
                    if (item.time === "휴방") {
                        dayCard.classList.add("rest");
                    } else if (item.time && item.time !== "공지 대기") {
                        dayCard.classList.add("active");
                    }
                    
                    dayCard.innerHTML = `
                        <div class="calendar-day-week">${item.day}</div>
                        <div class="calendar-day-date">${item.date}</div>
                        <div class="calendar-day-time">${item.time}</div>
                        <div class="calendar-day-detail">${item.detail}</div>
                    `;
                    calendarGrid.appendChild(dayCard);
                });
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
