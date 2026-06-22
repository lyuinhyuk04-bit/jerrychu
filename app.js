/* ==========================================================================
   app.js  —  오아팀 지통실 대시보드 스크립트 (기존 오아팀 코드 확장 개조)
   ========================================================================== */

// ── 상태 관리 (State) ─────────────────────────────────────────────────────────────
let appConfig       = null;
let rawSchedules    = [];          // 전체 멤버 일정
let activeMember    = null;        // 현재 선택된 멤버 key
let currentWeekStart = null;       // 보고 있는 주의 월요일 Date
let isAdminMode     = false;       // 관리자 모드 활성화 여부
let isDirty         = false;       // 수정사항 저장 여부
let isLoaded        = false;       // 데이터 로드 완료 여부
let liveMembersData = [];          // 실시간 방송 상태 캐시
let filterLiveByActiveMember = false; // 선택된 멤버의 방송만 필터링해서 볼지 여부

// ── DOM 참조 (DOM Refs) ──────────────────────────────────────────────────────────
const sidebar              = document.getElementById('sidebar');
const menuToggleBtn        = document.getElementById('menuToggleBtn');
const sidebarCloseBtn      = document.getElementById('sidebarCloseBtn');
const crewLinksContainer   = document.getElementById('crewLinksContainer');
const tabCrewLinksContainer = document.getElementById('linksPanelGrid');
const membersListContainer = document.getElementById('membersListContainer');
const activeMemberProfile  = document.getElementById('activeMemberProfile');
const searchInput          = document.getElementById('searchInput');
const liveStatusSection    = document.getElementById('liveStatusSection');
const liveGridContainer    = document.getElementById('liveGridContainer');
const liveRefreshBtn       = document.getElementById('liveRefreshBtn');
const liveRefreshText      = document.getElementById('liveRefreshText');

// 관리자 & 모달 DOM
const adminModeToggle      = document.getElementById('adminModeToggle');
const scheduleModal        = document.getElementById('scheduleModal');
const scheduleForm         = document.getElementById('scheduleForm');
const modalCloseBtn        = document.getElementById('modalCloseBtn');
const editIndex            = document.getElementById('editIndex');
const editOrigDate         = document.getElementById('editOrigDate');
const editDate             = document.getElementById('editDate');
const editTime             = document.getElementById('editTime');
const editTitle            = document.getElementById('editTitle');
const editNote             = document.getElementById('editNote');
const editLock             = document.getElementById('editLock');
const deleteBtn            = document.getElementById('deleteBtn');
const floatingSaveAction   = document.getElementById('floatingSaveAction');
const floatingSaveBtn      = document.getElementById('floatingSaveBtn');
const clearSearchBtn       = document.getElementById('clearSearchBtn');
const prevWeekBtn          = document.getElementById('prevWeekBtn');
const nextWeekBtn          = document.getElementById('nextWeekBtn');
const todayBtn             = document.getElementById('todayBtn');
const currentWeekLabel     = document.getElementById('currentWeekLabel');
const weeklyGridContainer  = document.getElementById('weeklyGridContainer');
const scheduleTabPlaceholder = document.getElementById('scheduleTabPlaceholder');
const scheduleViewSection  = document.getElementById('scheduleViewSection');
const searchResultsSection = document.getElementById('searchResultsSection');
const searchResultsList    = document.getElementById('searchResultsList');
const searchCount          = document.getElementById('searchCount');
const backToWeekBtn        = document.getElementById('backToWeekBtn');

// 메모장 편집 모달 DOM
const openNotepadBtn       = document.getElementById('openNotepadBtn');
const notepadModal         = document.getElementById('notepadModal');
const notepadModalCloseBtn = document.getElementById('notepadModalCloseBtn');
const notepadCancelBtn     = document.getElementById('notepadCancelBtn');
const notepadSaveBtn       = document.getElementById('notepadSaveBtn');
const notepadTextArea       = document.getElementById('notepadTextArea');

// 우측 패널 DOM
const todayScheduleContainer = document.getElementById('todayScheduleContainer');
const recentActivitiesContainer = document.getElementById('recentActivitiesContainer');

// 탭 버튼 및 콘텐츠 패널 DOM
const tabButtons = document.querySelectorAll('.sidebar-menu .menu-item');
const tabPanes   = document.querySelectorAll('.tab-pane');

// 모바일 오버레이
const sidebarOverlay = document.createElement('div');
sidebarOverlay.className = 'sidebar-overlay';
document.body.appendChild(sidebarOverlay);

// ── 초기 구동 (Boot) ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupTabs();
  startLiveClock();
  initTodoList();
  initSecurity();

  let apiSchedulesUrl = '/api/schedules';
  if (window.location.protocol === 'file:') {
    apiSchedulesUrl = 'http://localhost:8000/api/schedules';
  }

  fetch(apiSchedulesUrl)
    .then(resp => {
      if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
      return resp.json();
    })
    .then(data => {
      appConfig = data.config;
      rawSchedules = (data.schedules || []).map(s => {
        if (s.title) s.title = s.title.replace(/뚱딴지/g, "오아팀");
        if (s.note) s.note = s.note.replace(/뚱딴지/g, "오아팀");
        return s;
      });
      activeMember = appConfig.defaultMember;
      isLoaded = true;

      renderCrewLinks();
      selectMember(activeMember, false);
      fetchLiveStatus();
    })
    .catch(err => {
      console.warn('API fetch failed, trying local fallback window data:', err);
      isLoaded = true;
      if (window.APP_CONFIG && window.APP_SCHEDULE) {
        appConfig = window.APP_CONFIG;
        rawSchedules = (window.APP_SCHEDULE || []).map(s => {
          if (s.title) s.title = s.title.replace(/뚱딴지/g, "오아팀");
          if (s.note) s.note = s.note.replace(/뚱딴지/g, "오아팀");
          return s;
        });
        activeMember = appConfig.defaultMember;

        renderCrewLinks();
        selectMember(activeMember, false);
        fetchLiveStatus();
      } else {
        const errorHtml = `
          <div class="loading-container" style="grid-column:span 7">
            <p style="color:var(--accent-orange);font-size:15px;">⚠️ 일정 데이터를 불러오지 못했습니다.</p>
            <p style="color:var(--color-text-muted);font-size:12px;">로컬 서버(python server.py)가 실행 중인지 확인해 주세요.</p>
          </div>`;
        if (weeklyGridContainer) weeklyGridContainer.innerHTML = errorHtml;
      }
    });
});

// ── 실시간 디지털 시계 ─────────────────────────────────────────────────────────────
function startLiveClock() {
  const clockElement = document.getElementById('liveClockTime');
  if (!clockElement) return;

  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    clockElement.textContent = `${hh}:${mm}:${ss}`;
  }
  
  updateClock();
  setInterval(updateClock, 1000);
}

// ── 탭 전환 유틸리티 ──────────────────────────────────────────────────────────────
function switchTab(targetTab, shouldResetFilter = true) {
  // 검색창 클리어 및 스케줄 화면 복귀
  if (searchInput) {
    searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
  }
  showScheduleView();

  // 버튼 활성화 클래스 스위칭
  if (tabButtons) {
    tabButtons.forEach(b => {
      if (b.getAttribute('data-tab') === targetTab) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // 탭 패널 표시 제어
  if (tabPanes) {
    tabPanes.forEach(pane => {
      const paneId = pane.getAttribute('id');
      if (paneId === `pane-${targetTab}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  // 모바일일 경우 탭 클릭 후 사이드바 닫기
  if (sidebar) sidebar.classList.remove('open');
  if (sidebarOverlay) sidebarOverlay.classList.remove('active');

  // 탭별 추가 렌더링
  if (targetTab === 'dashboard') {
    if (shouldResetFilter) {
      filterLiveByActiveMember = false;
    }
    renderLiveStatus(liveMembersData);
  } else if (targetTab === 'members') {
    renderMembersGridAll();
  } else if (targetTab === 'daily-work') {
    loadDailyWorks();
  }
}

// ── 탭 메뉴 제어 로직 ──────────────────────────────────────────────────────────────
function setupTabs() {
  if (tabButtons) {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab, true);
      });
    });
  }
}

// ── 이벤트 리스너 설정 ────────────────────────────────────────────────────────────
function setupEventListeners() {
  if (menuToggleBtn) {
    menuToggleBtn.addEventListener('click', () => {
      if (sidebar) sidebar.classList.add('open');
      if (sidebarOverlay) sidebarOverlay.classList.add('active');
    });
  }

  const closeSidebar = () => {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  };
  
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
      if (currentWeekStart) {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        renderWeeklySchedule();
      }
    });
  }
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
      if (currentWeekStart) {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        renderWeeklySchedule();
      }
    });
  }
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      setWeekStartToDate(new Date());
      renderWeeklySchedule();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      if (clearSearchBtn) clearSearchBtn.style.display = q ? 'block' : 'none';
      q ? performSearch(q) : showScheduleView();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      showScheduleView();
    });
  }

  if (backToWeekBtn) {
    backToWeekBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      showScheduleView();
    });
  }

  // Admin 모드 토글
  if (adminModeToggle) {
    adminModeToggle.addEventListener('change', e => {
      isAdminMode = e.target.checked;
      if (isAdminMode) {
        document.body.classList.add('admin-mode-active');
      } else {
        document.body.classList.remove('admin-mode-active');
      }
      renderWeeklySchedule();
    });
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (scheduleModal) {
    scheduleModal.addEventListener('click', e => {
      if (e.target === scheduleModal) closeModal();
    });
  }
  if (scheduleForm) scheduleForm.addEventListener('submit', handleFormSubmit);
  if (deleteBtn) deleteBtn.addEventListener('click', handleDeleteClick);
  if (floatingSaveBtn) floatingSaveBtn.addEventListener('click', saveToServer);
  if (liveRefreshBtn) liveRefreshBtn.addEventListener('click', fetchLiveStatus);

  // 메모장 편집 이벤트 바인딩
  if (openNotepadBtn) openNotepadBtn.addEventListener('click', openNotepadModal);
  if (notepadModalCloseBtn) notepadModalCloseBtn.addEventListener('click', closeNotepadModal);
  if (notepadCancelBtn) notepadCancelBtn.addEventListener('click', closeNotepadModal);
  if (notepadSaveBtn) notepadSaveBtn.addEventListener('click', saveNotepadSchedule);
  if (notepadModal) {
    notepadModal.addEventListener('click', e => {
      if (e.target === notepadModal) closeNotepadModal();
    });
  }
}

// ── 시간 포맷 파서 및 헬퍼 ─────────────────────────────────────────────────────────
function formatDisplayTime(timeStr, memberKey) {
  if (!timeStr || timeStr === '미정') {
    return `<span style="color:var(--color-text-muted)">시간 미정</span>`;
  }
  
  const hhmmMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    let h = parseInt(hhmmMatch[1], 10);
    const m = parseInt(hhmmMatch[2], 10);
    let ampm = h < 12 ? '오전' : '오후';
    let displayHour = h > 12 ? h - 12 : h;
    if (h === 0 || h === 24) {
      ampm = '오전';
      displayHour = 12;
    } else if (h === 12) {
      ampm = '오후';
    }
    
    return m > 0 ? `${ampm} ${displayHour}시 ${m}분` : `${ampm} ${displayHour}시`;
  }
  
  if (timeStr.replace(/\s+/g,'').match(/(오전|오후|새벽|밤|낮)/)) {
    return timeStr.trim();
  }
  
  const siMatch = timeStr.match(/^(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?$/);
  if (siMatch) {
    let h = parseInt(siMatch[1], 10);
    const m = siMatch[2] ? parseInt(siMatch[2], 10) : 0;
    let ampm = '오후';
    const isMorningMember = memberKey && ['yuki', 'neboring'].includes(memberKey);
    
    if (h < 12) {
      ampm = isMorningMember ? '오전' : '오후';
    } else if (h === 12) {
      ampm = '오후';
    } else {
      ampm = '오후';
      h = h - 12;
    }
    return m > 0 ? `${ampm} ${h}시 ${m}분` : `${ampm} ${h}시`;
  }
  
  return timeStr;
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function setWeekStartToDate(target) {
  const d   = new Date(target);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  currentWeekStart = new Date(d.setDate(diff));
  currentWeekStart.setHours(0, 0, 0, 0);
}

function getMemberSchedules() {
  return rawSchedules.filter(s => s.member === activeMember);
}

// ── 사이드바 렌더링 ──────────────────────────────────────────────────────────────
function renderCrewLinks() {
  const L = appConfig.crewLinks;
  const links = [
    { key:'youtube', name:'YouTube',     desc:'오아팀 공식 유튜브', icon:'fa-brands fa-youtube',     url: L.youtube },
    { key:'cafe',    name:'네이버 카페', desc:'오아팀 팬카페',       icon:'fa-solid fa-mug-hot',       url: L.cafe    },
    { key:'sheet',   name:'구글 시트',   desc:'통합 작전 일정표',    icon:'fa-solid fa-table-columns', url: L.sheet   },
  ];
  const linksHtml = links.map(l => `
    <a href="${l.url}" target="_blank" class="crew-link-card">
      <div class="crew-link-icon ${l.key}"><i class="${l.icon}"></i></div>
      <div class="crew-link-info">
        <h3>${l.name}</h3><p>${l.desc}</p>
      </div>
    </a>`).join('');

  if (crewLinksContainer) crewLinksContainer.innerHTML = linksHtml;
}

function renderMembersList() {
  membersListContainer.innerHTML = Object.entries(appConfig.members)
    .map(([key, m]) => `
      <div class="member-item ${key === activeMember ? 'active' : ''}"
           onclick="selectMember('${key}')">
        <div class="member-info-wrapper">
          <div class="member-avatar">
            ${m.avatar 
              ? `<img src="${m.avatar}" alt="${m.name}" class="member-avatar-img">`
              : m.emoji}
          </div>
          <span class="member-name-text">${m.name}</span>
        </div>
        ${key === activeMember ? '<div class="active-dot"></div>' : ''}
      </div>`).join('');
}

function selectMember(key, isInteractive = true) {
  activeMember = key;
  if (isInteractive) {
    filterLiveByActiveMember = true;
    switchTab('dashboard', false);
  }
  renderMembersList();
  renderActiveMemberProfile();
  renderLiveStatus(liveMembersData);
  
  const memberScheds = rawSchedules.filter(s => s.member === key);
  if (memberScheds.length > 0) {
    const today = new Date();
    const curWeekD = new Date(today);
    const curWeekDay = curWeekD.getDay();
    const curWeekDiff = curWeekD.getDate() - curWeekDay + (curWeekDay === 0 ? -6 : 1);
    const curWeekStartD = new Date(curWeekD.setDate(curWeekDiff));
    curWeekStartD.setHours(0,0,0,0);
    
    const curWeekEnd = new Date(curWeekStartD);
    curWeekEnd.setDate(curWeekStartD.getDate() + 6);
    curWeekEnd.setHours(23,59,59,999);
    
    const hasCurrentWeekSched = memberScheds.some(s => {
      const sDate = new Date(s.date);
      return sDate >= curWeekStartD && sDate <= curWeekEnd;
    });
    
    if (!hasCurrentWeekSched) {
      const sorted = [...memberScheds].sort((a, b) => b.date.localeCompare(a.date));
      setWeekStartToDate(new Date(sorted[0].date));
    } else {
      setWeekStartToDate(today);
    }
  } else {
    setWeekStartToDate(new Date());
  }

  renderWeeklySchedule();
}

function renderActiveMemberProfile() {
  const m = appConfig.members[activeMember];
  const primaryBoard = (m.soopBoards && m.soopBoards[0]) || `https://www.sooplive.com/station/${m.soopId}`;
  
  // Find current live status from live cached data
  const liveInfo = liveMembersData.find(r => r.member === activeMember);
  const isOnline = liveInfo ? liveInfo.is_live : false;
  const statusBadge = isOnline 
    ? `<span style="font-size: 10px; font-weight:700; color:var(--accent-green); background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.2); padding:2px 8px; border-radius:4px;"><i class="fa-solid fa-circle" style="font-size:7px; vertical-align:middle; margin-right:4px;"></i>ONLINE</span>`
    : `<span style="font-size: 10px; font-weight:700; color:var(--color-text-secondary); background:var(--bg-tertiary); border:1px solid rgba(255,255,255,0.05); padding:2px 8px; border-radius:4px;">OFFLINE</span>`;

  activeMemberProfile.innerHTML = `
    ${m.avatar 
      ? `<img src="${m.avatar}" alt="${m.name}" class="active-member-avatar-img" onerror="this.src='logo.png'">`
      : `<div class="active-member-emoji">${m.emoji}</div>`}
    <div class="active-member-details" style="display:flex; flex-direction:column; gap:4px; flex-grow:1;">
      <div style="display:flex; align-items:center; gap:8px;">
        <h2 style="margin:0; font-size:15px; font-weight:700;">${m.name} 지휘 통제표</h2>
        ${statusBadge}
      </div>
      <div style="display:flex; gap: 8px; align-items:center; flex-wrap: wrap;">
        <span style="font-size:10px; font-family:var(--font-display); background:rgba(249,115,22,0.08); padding: 2px 6px; border-radius:4px; color:var(--accent-orange); border:1px solid rgba(249,115,22,0.15);">ID: ${m.soopId || '미기재'}</span>
        <a href="${m.soopId ? primaryBoard : '#'}" target="_blank" style="font-size: 11px; color: var(--accent-gold); font-weight:600; display:inline-flex; align-items:center; gap:3px;">
          <i class="fa-solid fa-square-rss"></i> SOOP 바로가기
        </a>
      </div>
    </div>`;
}

// ── 주간 일정표 렌더링 ────────────────────────────────────────────────────────────
function renderWeeklySchedule() {
  if (!currentWeekStart) return;

  const year  = currentWeekStart.getFullYear();
  const month = currentWeekStart.getMonth() + 1;
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);

  const weekOfMonth = Math.ceil(currentWeekStart.getDate() / 7);
  const ordKor = ['첫','두','세','네','다섯'];
  const ordLabel = (ordKor[weekOfMonth - 1] ?? weekOfMonth) + '번째주';
  const endMonth = weekEnd.getMonth() + 1;
  const rangeLabel = endMonth !== month
    ? `${month}월 ${currentWeekStart.getDate()}일 ~ ${endMonth}월 ${weekEnd.getDate()}일`
    : `${month}월 ${currentWeekStart.getDate()}일 ~ ${weekEnd.getDate()}일`;

  currentWeekLabel.textContent = `${year}년 ${ordLabel} · ${rangeLabel}`;

  const TODAY_STR  = formatDateISO(new Date());
  const DAY_NAMES  = ['월','화','수','목','금','토','일'];
  const memberScheds = getMemberSchedules();

  const gridHtml = DAY_NAMES.map((dayName, idx) => {
    const dateObj = new Date(currentWeekStart);
    dateObj.setDate(currentWeekStart.getDate() + idx);
    const dateStr = formatDateISO(dateObj);
    const isToday = dateStr === TODAY_STR;

    const dayScheds = memberScheds
      .filter(s => s.date === dateStr)
      .sort((a, b) => {
        const aC = a.title.startsWith('[크루]'), bC = b.title.startsWith('[크루]');
        if (aC && !bC) return 1; if (!aC && bC) return -1;
        if (a.time === '미정' && b.time !== '미정') return 1;
        if (a.time !== '미정' && b.time === '미정') return -1;
        return a.time.localeCompare(b.time);
      });

    let schedulesHtml = '';
    const isRest = dayScheds.some(s => s.title === '휴방');

    if (isRest) {
      schedulesHtml = `
        <div class="empty-day rest-day">
          <i class="fa-solid fa-moon" style="color:var(--accent-pink);font-size:20px;margin-bottom:4px;"></i>
          <p style="color:var(--accent-pink);font-weight:600;">휴방</p>
        </div>`;
    } else if (dayScheds.length > 0) {
      schedulesHtml = dayScheds.map(s => {
        const isCrew       = s.title.startsWith('[크루]');
        const rawTitle     = isCrew ? s.title.replace('[크루]','').trim() : s.title;
        const displayTitle = rawTitle.replace(/\.\.\.$/,'').trim();
        const timeDisplay = formatDisplayTime(s.time, s.member);

        const sourceLinkHtml = s.url
          ? `<a href="${s.url}" target="_blank" class="schedule-source"><i class="fa-solid fa-link"></i> 본문</a>`
          : '';

        const globalIdx = rawSchedules.indexOf(s);
        const adminActionsHtml = isAdminMode
          ? `<div class="schedule-card-actions">
               <button class="btn-card-edit" onclick="window.openEditModal(event, ${globalIdx})" title="수정">
                 <i class="fa-solid fa-pencil"></i>
               </button>
               <button class="btn-card-delete" onclick="window.deleteScheduleDirect(event, ${globalIdx})" title="삭제">
                 <i class="fa-solid fa-trash"></i>
               </button>
             </div>`
          : '';

        return `
          <div class="schedule-card${isCrew ? ' crew-event' : ''}">
            <div class="schedule-time"><i class="fa-regular fa-clock"></i> ${timeDisplay}</div>
            <div class="schedule-title">
              ${isCrew ? '<span class="crew-tag">[크루]</span> ' : ''}${displayTitle}
            </div>
            ${sourceLinkHtml}
            ${adminActionsHtml}
          </div>`;
      }).join('');
    } else {
      schedulesHtml = isLoaded
        ? `<div class="empty-day tbd-day">
             <i class="fa-regular fa-calendar" style="color:var(--color-text-muted);font-size:16px;margin-bottom:4px;"></i>
             <p style="color:var(--color-text-muted);">일정 미정</p>
           </div>`
        : `<div class="empty-day loading-day">
             <i class="fa-solid fa-spinner fa-spin" style="color:var(--accent-orange);font-size:16px;margin-bottom:4px;"></i>
             <p style="color:var(--color-text-muted);">일정 확인 중</p>
           </div>`;
    }

    const headerHtml = isAdminMode
      ? `<div class="day-header-admin">
           <div class="day-header-left">
             <span class="day-date">${dateObj.getDate()}</span>
             <span class="day-name">${dayName}요일</span>
           </div>
           <button class="btn-add-schedule" onclick="window.openAddModal('${dateStr}')" title="일정 추가">
             <i class="fa-solid fa-plus"></i>
           </button>
         </div>`
      : `<div class="day-header">
           <span class="day-date">${dateObj.getDate()}</span>
           <span class="day-name">${dayName}요일</span>
         </div>`;

    return `
      <div class="day-card ${isToday ? 'today' : ''}" data-day="${dayName}">
        ${headerHtml}
        <div class="schedules-container">${schedulesHtml}</div>
      </div>`;
  }).join('');

  if (weeklyGridContainer) weeklyGridContainer.innerHTML = gridHtml;
  if (scheduleTabPlaceholder) scheduleTabPlaceholder.innerHTML = `
    <div class="weekly-grid-tab-mirror" style="margin-top: 16px;">
      <div class="weekly-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        ${gridHtml}
      </div>
    </div>`;
}

// ── 검색 기능 (Search) ────────────────────────────────────────────────────────────
function performSearch(query) {
  if (scheduleViewSection) scheduleViewSection.classList.add('hidden');
  if (liveStatusSection) liveStatusSection.classList.add('hidden');
  if (searchResultsSection) searchResultsSection.classList.remove('hidden');

  // 활성 탭 화면도 가림 (검색 뷰 우선 노출)
  tabPanes.forEach(pane => pane.classList.remove('active'));

  const memberScheds = getMemberSchedules();
  const results = memberScheds.filter(s =>
    s.date.includes(query) ||
    s.title.toLowerCase().includes(query) ||
    (s.note || '').toLowerCase().includes(query) ||
    s.day.includes(query)
  );

  searchCount.textContent = `${results.length}건`;

  if (results.length === 0) {
    searchResultsList.innerHTML = `
      <div class="loading-container">
        <i class="fa-regular fa-folder-open" style="font-size:32px;color:var(--color-text-muted)"></i>
        <p>검색 결과가 없습니다.</p>
      </div>`;
    return;
  }

  const MON_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  searchResultsList.innerHTML = results.map(s => {
    const d        = new Date(s.date);
    const isCrew   = s.title.startsWith('[크루]');
    const dispTitle= isCrew ? s.title.replace('[크루]','').trim() : s.title;

    return `
      <div class="search-result-item" onclick="jumpToDate('${s.date}')">
        <div class="search-result-left">
          <div class="search-result-date-badge">
            <span class="search-result-month">${MON_ABBR[d.getMonth()]}</span>
            <span class="search-result-day-num">${d.getDate()}</span>
          </div>
          <div class="search-result-info">
            <div class="search-result-meta">
              <span class="search-result-day-name">${s.day}요일</span>
               <span class="search-result-time">
                <i class="fa-regular fa-clock"></i> ${formatDisplayTime(s.time, s.member)}
              </span>
            </div>
            <div class="search-result-title">
              ${isCrew ? '<span class="crew-tag">[크루]</span> ' : ''}${dispTitle}
            </div>
          </div>
        </div>
        <div class="search-result-right">
          <div class="view-btn" title="이 주차로 이동">
            <i class="fa-solid fa-arrow-right"></i>
          </div>
        </div>
      </div>`;
  }).join('');
}

function jumpToDate(dateStr) {
  setWeekStartToDate(new Date(dateStr + 'T12:00:00'));
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  showScheduleView();
  renderWeeklySchedule();
}

function showScheduleView() {
  searchResultsSection.classList.add('hidden');
  if (scheduleViewSection) scheduleViewSection.classList.remove('hidden');
  if (liveStatusSection) liveStatusSection.classList.remove('hidden');

  // 대시보드 활성화 상태로 복귀
  tabButtons.forEach(b => {
    if (b.getAttribute('data-tab') === 'dashboard') b.classList.add('active');
    else b.classList.remove('active');
  });
  tabPanes.forEach(pane => {
    if (pane.getAttribute('id') === 'pane-dashboard') pane.classList.add('active');
    else pane.classList.remove('active');
  });
}

// ── 관리자 수동 일정 모달 제어 ──────────────────────────────────────────────────────────
function closeModal() {
  if (scheduleModal) scheduleModal.classList.remove('active');
}

// ── 메모장 일정 모달 제어 및 로직 ──────────────────────────────────────────────────────
function openNotepadModal() {
  if (!notepadModal) return;
  loadScheduleToNotepad();
  notepadModal.classList.add('active');
}

function closeNotepadModal() {
  if (notepadModal) notepadModal.classList.remove('active');
}

function loadScheduleToNotepad() {
  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
  const memberScheds = getMemberSchedules();
  let text = '';

  for (let idx = 0; idx < 7; idx++) {
    const dateObj = new Date(currentWeekStart);
    dateObj.setDate(currentWeekStart.getDate() + idx);
    const dateStr = formatDateISO(dateObj);
    const dayName = DAY_NAMES[idx];

    const dayScheds = memberScheds
      .filter(s => s.date === dateStr)
      .sort((a, b) => {
        if (a.time === '미정' && b.time !== '미정') return 1;
        if (a.time !== '미정' && b.time === '미정') return -1;
        return a.time.localeCompare(b.time);
      });

    if (dayScheds.length === 0) {
      text += `${dayName}: 휴방 또는 일정 입력\n`;
    } else {
      dayScheds.forEach(s => {
        let line = `${dayName}: `;
        if (s.time && s.time !== '미정') {
          line += `${s.time} `;
        } else if (s.time === '미정') {
          line += `미정 `;
        }
        line += `${s.title}`;
        if (s.note && s.note !== '수동 수정') {
          line += ` (비고: ${s.note})`;
        }
        text += line + '\n';
      });
    }
  }
  notepadTextArea.value = text.trim();
}

function saveNotepadSchedule() {
  if (!notepadTextArea) return;
  const lines = notepadTextArea.value.split('\n');

  // 1. Get dates of the current week
  const weekDates = [];
  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
  for (let idx = 0; idx < 7; idx++) {
    const dateObj = new Date(currentWeekStart);
    dateObj.setDate(currentWeekStart.getDate() + idx);
    weekDates.push({
      dateStr: formatDateISO(dateObj),
      dayName: DAY_NAMES[idx]
    });
  }

  const weekStartStr = weekDates[0].dateStr;
  const weekEndStr = weekDates[6].dateStr;

  // 2. Filter out existing schedules for activeMember in this week
  rawSchedules = rawSchedules.filter(s => {
    if (s.member === activeMember && s.date >= weekStartStr && s.date <= weekEndStr) {
      return false;
    }
    return true;
  });

  const newSchedules = [];

  // Helper to parse time
  function parseTimeStr(str) {
    str = str.trim();
    if (str === '미정' || !str) return '미정';
    
    // HH:MM
    const hhmm = str.match(/^(\d{1,2}):(\d{2})/);
    if (hhmm) {
      const h = parseInt(hhmm[1], 10);
      const m = parseInt(hhmm[2], 10);
      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }

    // Korean time
    const korTime = str.match(/^(오전|오후|새벽|밤|낮)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
    if (korTime) {
      const ampm = korTime[1];
      let h = parseInt(korTime[2], 10);
      const m = korTime[3] ? parseInt(korTime[3], 10) : 0;
      
      if (ampm === '오후' && h < 12) {
        h += 12;
      } else if (ampm === '오전' && h === 12) {
        h = 0;
      } else if (ampm === '새벽' && h < 6) {
        if (h === 12) h = 0;
      } else if (ampm === '밤' && h < 12) {
        h += 12;
      }
      
      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }

    // Number only
    const numOnly = str.match(/^(\d{1,2})$/);
    if (numOnly) {
      const h = parseInt(numOnly[1], 10);
      if (h >= 0 && h < 24) {
        return `${String(h).padStart(2, '0')}:00`;
      }
    }

    return '미정';
  }

  // 3. Parse each line
  lines.forEach(line => {
    let cleanLine = line.trim().replace(/^[\-\*\s•\d\.\,\)]+/, '').trim();
    if (!cleanLine) return;

    const match = cleanLine.match(/^([월화수목금토일])\s*[:\-]?\s*(.*)$/);
    if (!match) return;

    const dayName = match[1];
    let content = match[2].trim();

    if (!content || content.includes('일정 입력') || content.includes('일정입력')) {
      return;
    }

    const dateInfo = weekDates.find(d => d.dayName === dayName);
    if (!dateInfo) return;

    // Extract note
    let note = '';
    const noteRegex = /[\[\(]비고\s*[:\s]*([^\]\)]+)[\]\)]/i;
    const noteMatch = content.match(noteRegex);
    if (noteMatch) {
      note = noteMatch[1].trim();
      content = content.replace(noteRegex, '').trim();
    }

    // Extract time
    let time = '미정';
    let title = content;

    const hhmmMatch = content.match(/^(\d{1,2}):(\d{2})/);
    if (hhmmMatch) {
      time = parseTimeStr(hhmmMatch[0]);
      title = content.substring(hhmmMatch[0].length).trim();
    } else {
      const korMatch = content.match(/^(오전|오후|새벽|밤|낮)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
      if (korMatch) {
        time = parseTimeStr(korMatch[0]);
        title = content.substring(korMatch[0].length).trim();
      } else if (content.startsWith('미정')) {
        time = '미정';
        title = content.substring(2).trim();
      } else {
        const numMatch = content.match(/^(\d{1,2})\s+/);
        if (numMatch) {
          const val = parseInt(numMatch[1], 10);
          if (val >= 0 && val <= 24) {
            time = `${String(val).padStart(2, '0')}:00`;
            title = content.substring(numMatch[0].length).trim();
          }
        }
      }
    }

    if (title === '휴방' || title === '휴뱅') {
      title = '휴방';
      time = '미정';
    }

    if (!title) {
      title = '개인 방송';
    }

    newSchedules.push({
      member: activeMember,
      date: dateInfo.dateStr,
      day: dayName,
      time: time,
      title: title,
      note: note || '수동 수정',
      source: 'manual'
    });
  });

  // 4. Add parsed items to rawSchedules
  rawSchedules.push(...newSchedules);

  // 5. Sort rawSchedules
  rawSchedules.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.member !== b.member) return a.member.localeCompare(b.member);
    return a.time.localeCompare(b.time);
  });

  // 6. Refresh UI & State
  markDirty();
  closeNotepadModal();
  renderWeeklySchedule();
  updateRightPanel();
}

window.openAddModal = function(dateStr) {
  if (!scheduleModal) return;
  document.getElementById('modalTitle').textContent = '일정 추가';
  editIndex.value = '';
  editOrigDate.value = '';
  editDate.value = dateStr;
  editTime.value = '미정';
  editTitle.value = '';
  editNote.value = '';
  editLock.checked = true;
  deleteBtn.style.display = 'none';
  scheduleModal.classList.add('active');
};

window.openEditModal = function(e, index) {
  e.stopPropagation();
  const s = rawSchedules[index];
  if (!s || !scheduleModal) return;

  document.getElementById('modalTitle').textContent = '일정 수정';
  editIndex.value = index;
  editOrigDate.value = s.date;
  editDate.value = s.date;
  editTime.value = s.time;
  editTitle.value = s.title;
  editNote.value = s.note || '';
  editLock.checked = s.source === 'manual';
  deleteBtn.style.display = 'block';
  scheduleModal.classList.add('active');
};

window.deleteScheduleDirect = function(e, index) {
  e.stopPropagation();
  if (confirm('이 일정을 삭제하시겠습니까?')) {
    rawSchedules.splice(index, 1);
    markDirty();
    renderWeeklySchedule();
    updateRightPanel();
  }
};

function handleDeleteClick() {
  const index = editIndex.value;
  if (index !== '' && confirm('이 일정을 삭제하시겠습니까?')) {
    rawSchedules.splice(index, 1);
    markDirty();
    closeModal();
    renderWeeklySchedule();
    updateRightPanel();
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  const index = editIndex.value;
  const dateVal = editDate.value;
  const timeVal = editTime.value.trim();
  const titleVal = editTitle.value.trim();
  const noteVal = editNote.value.trim();
  const isLocked = editLock.checked;

  const dayMap = ['일','월','화','수','목','금','토'];
  const dayName = dayMap[new Date(dateVal + 'T12:00:00').getDay()];

  const item = {
    member: activeMember,
    date: dateVal,
    day: dayName,
    time: timeVal,
    title: titleVal,
    note: noteVal || '수동 수정',
    source: isLocked ? 'manual' : 'soop'
  };

  if (index === '') {
    rawSchedules.push(item);
  } else {
    const orig = rawSchedules[index];
    if (orig.url) item.url = orig.url;
    rawSchedules[index] = item;
  }

  rawSchedules.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.member !== b.member) return a.member.localeCompare(b.member);
    return a.time.localeCompare(b.time);
  });

  markDirty();
  closeModal();
  renderWeeklySchedule();
  updateRightPanel();
}

function markDirty() {
  isDirty = true;
  if (floatingSaveAction) floatingSaveAction.classList.add('active');
}

function saveToServer() {
  if (!floatingSaveBtn) return;
  floatingSaveBtn.disabled = true;
  floatingSaveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...';

  let saveUrl = '/api/save_schedule';
  if (window.location.protocol === 'file:') {
    saveUrl = 'http://localhost:8000/api/save_schedule';
  }

  fetch(saveUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rawSchedules)
  })
  .then(resp => resp.json())
  .then(data => {
    if (data.status === 'ok') {
      showToast('일정이 지통실 서버에 성공적으로 저장되었습니다.', 'success');
      isDirty = false;
      if (floatingSaveAction) floatingSaveAction.classList.remove('active');
    } else {
      showToast('저장 오류: ' + data.message, 'error');
    }
  })
  .catch(err => {
    showToast('지통실 서버 연결 실패: ' + err.message, 'error');
  })
  .finally(() => {
    floatingSaveBtn.disabled = false;
    floatingSaveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> 변경사항 지통실 서버 저장';
  });
}

function showToast(msg, type = 'success') {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = type === 'success'
    ? `<i class="fa-solid fa-circle-check"></i> <span>${msg}</span>`
    : `<i class="fa-solid fa-circle-exclamation"></i> <span>${msg}</span>`;

  document.body.appendChild(toast);
  toast.offsetHeight; // Reflow
  toast.classList.add('active');

  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── 실시간 방송 상태 제어 (Live Monitoring) ──────────────────────────────────────
let isFetchingLive = false;

function renderOfflineFallback() {
  if (!appConfig || !appConfig.members) return;
  const fallbackData = Object.entries(appConfig.members).map(([key, m]) => {
    const stationUrl = (m.soopBoards && m.soopBoards[0]) || `https://www.sooplive.com/station/${m.soopId}`;
    return {
      member: key,
      name: m.name,
      is_live: false,
      profile_image: m.avatar || 'logo.png',
      broad_title: '방송 준비 중',
      url: m.soopId ? stationUrl : '#',
      thumbnail: m.avatar || 'logo.png'
    };
  });
  renderLiveStatus(fallbackData);
}

function fetchLiveStatus() {
  if (isFetchingLive) return;
  isFetchingLive = true;

  if (liveRefreshBtn) {
    const icon = liveRefreshBtn.querySelector('i');
    if (icon) icon.classList.add('spin');
  }
  if (liveRefreshText) liveRefreshText.textContent = '관제 수집 중...';

  const handleFailure = (err) => {
    console.error('Error fetching live status:', err);
    renderOfflineFallback();
    resetLiveRefreshButton();
  };

  let liveStatusUrl = '/api/live_status';
  if (window.location.protocol === 'file:') {
    liveStatusUrl = 'http://localhost:8000/api/live_status';
  }

  fetch(liveStatusUrl)
    .then(resp => {
      if (!resp.ok) throw new Error(`HTTP status: ${resp.status}`);
      return resp.json();
    })
    .then(data => {
      liveMembersData = data;
      renderLiveStatus(data);
      updateRightPanel();
      resetLiveRefreshButton();
    })
    .catch(err => {
      handleFailure(err);
    })
    .finally(() => {
      isFetchingLive = false;
    });
}

function resetLiveRefreshButton() {
  if (liveRefreshText) {
    liveRefreshText.textContent = '수집 완료';
    setTimeout(() => {
      liveRefreshText.textContent = '새로고침';
      if (liveRefreshBtn) {
        const icon = liveRefreshBtn.querySelector('i');
        if (icon) icon.classList.remove('spin');
      }
    }, 2000);
  }
}

function renderLiveStatus(results) {
  if (!liveGridContainer || !results) return;

  let filteredResults = results;
  if (filterLiveByActiveMember && activeMember) {
    filteredResults = results.filter(r => r.member === activeMember);
  }

  // 방송 중인 멤버 상단 정렬
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (a.is_live && !b.is_live) return -1;
    if (!a.is_live && b.is_live) return 1;
    return 0;
  });

  liveGridContainer.innerHTML = sortedResults.map(r => {
    const mConfig = appConfig.members[r.member] || {};
    
    // 추가 슬롯 등의 빈 슬롯 처리
    if (!mConfig.soopId && r.member === 'extra_member') {
      return `
        <div class="live-card offline-active" style="border-style: dashed; opacity: 0.6; cursor: default;" onclick="event.stopPropagation();">
          <div class="live-card-header">
            <div class="live-card-member">
              <div class="live-card-avatar-placeholder"><i class="fa-solid fa-plus"></i></div>
              <span class="live-card-name">슬롯 비어있음</span>
            </div>
            <span class="status-badge offline">VACANT</span>
          </div>
          <div class="live-thumbnail-wrapper" style="display: flex; align-items: center; justify-content: center;">
            <p style="color:var(--color-text-muted); font-size:11.5px;">관리자에서 멤버를 등록하세요.</p>
          </div>
        </div>
      `;
    }

    const avatarSrc = r.is_live ? (mConfig.avatar || r.profile_image || 'logo.png') : (mConfig.avatar || 'logo.png');
    const avatarHtml = `<img src="${avatarSrc}" alt="${r.name}" class="live-card-avatar" onerror="this.src='logo.png'">`;

    const cardClass = r.is_live ? 'live-card live-active' : 'live-card offline-active';
    const statusText = r.is_live ? 'LIVE' : 'OFFLINE';
    const statusClass = r.is_live ? 'status-badge live' : 'status-badge offline';
    const displayTitle = r.is_live ? r.broad_title : '방송 준비 중';
    const thumbnailSrc = r.is_live ? r.thumbnail : (mConfig.avatar || 'logo.png');

    return `
      <div class="${cardClass}" onclick="if('${r.url}'!=='#') window.open('${r.url}', '_blank')">
        <div class="live-card-header">
          <div class="live-card-member">
            ${avatarHtml}
            <span class="live-card-name">${r.name}</span>
          </div>
          <span class="${statusClass}">${statusText}</span>
        </div>
        <div class="live-thumbnail-wrapper">
          <img src="${thumbnailSrc}" alt="${r.name} 방송 미리보기" class="live-thumbnail-img" loading="lazy" onerror="this.src='logo.png'">
          <div class="live-thumbnail-overlay">
            <div class="live-title-text">${displayTitle}</div>
          </div>
          <div class="live-thumbnail-play">
            <i class="fa-solid fa-play"></i>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── 우측 통제 패널 렌더링 ─────────────────────────────────────────────────────────
function updateRightPanel() {
  if (!appConfig) return;
  const todayStr = formatDateISO(new Date());

  // 1. TODAY SCHEDULE 요약 (To-do list is used instead of automatic schedule)



  // 3. ACTIVITY LOG (지통실 스타일 모니터링 로그 생성)
  const simulatedLogs = [];
  const now = new Date();
  
  if (liveMembersData.length > 0) {
    liveMembersData.forEach(r => {
      if (r.is_live) {
        simulatedLogs.push(`[LIVE] ${r.name} 스트리머 뱅온 감지 -> "${r.broad_title.substring(0,18)}..."`);
      }
    });
  }
  simulatedLogs.push(`[SYSTEM] 지통실 관제 시스템 정상 가동 중.`);
  simulatedLogs.push(`[SYSTEM] 데이터 동기화 완료 (스케줄: ${rawSchedules.length}건).`);

  recentActivitiesContainer.innerHTML = simulatedLogs.map(log => {
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    return `
      <div class="log-item">
        <span class="log-time">${timeStr}</span>
        <span class="log-msg">${log}</span>
      </div>`;
  }).join('');
}

// ── 멤버 현황 탭 렌더링 (Tab: members) ──────────────────────────────────────────────
function renderMembersGridAll() {
  const container = document.getElementById('membersGridAll');
  if (!container || !appConfig) return;

  container.innerHTML = Object.entries(appConfig.members).map(([key, m]) => {
    const liveInfo = liveMembersData.find(r => r.member === key);
    const isOnline = liveInfo ? liveInfo.is_live : false;
    const statusText = isOnline ? 'ONLINE' : 'OFFLINE';
    const statusClass = isOnline ? 'profile-card-status online' : 'profile-card-status offline';
    const linkUrl = (m.soopBoards && m.soopBoards[0]) || `https://www.sooplive.com/station/${m.soopId}`;

    if (!m.soopId && key === 'extra_member') {
      return `
        <div class="member-profile-card" style="border-style: dashed; opacity: 0.5; cursor: default;">
          <div class="profile-card-avatar">➕</div>
          <div class="profile-card-name">슬롯 비어있음</div>
          <span class="profile-card-status offline">VACANT</span>
        </div>
      `;
    }

    return `
      <div class="member-profile-card" onclick="window.open('${linkUrl}', '_blank')">
        <div class="profile-card-avatar">
          ${m.avatar 
            ? `<img src="${m.avatar}" alt="${m.name}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`
            : m.emoji}
        </div>
        <div class="profile-card-name">${m.name}</div>
        <span class="${statusClass}">${statusText}</span>
        <div class="profile-card-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> 방송국 이동</div>
      </div>`;
  }).join('');
}



// ── 오늘 한 일 (Daily Works) ───────────────────────────────────────────────────
function loadDailyWorks() {
  const inputEl = document.getElementById('dailyWorkInput');
  const selectEl = document.getElementById('dailyWorkMemberSelect');
  const listEl  = document.getElementById('dailyWorkList');
  const saveBtn = document.getElementById('saveDailyWorkBtn');
  
  if (!inputEl || !listEl || !appConfig) return;

  // 1. 셀렉트 박스 채우기 (처음 한 번만 채움)
  if (selectEl && selectEl.options.length === 0) {
    const entries = Object.entries(appConfig.members).filter(([key, m]) => key !== 'extra_member');
    selectEl.innerHTML = entries.map(([key, m]) => {
      return `<option value="${key}">${m.emoji} ${m.name}</option>`;
    }).join('');
    
    // 현재 activeMember를 기본 선택 값으로 설정
    selectEl.value = activeMember;

    // 셀렉트 박스 변경 시 이벤트
    selectEl.addEventListener('change', () => {
      const selectedMember = selectEl.value;
      const todayStr = formatDateISO(new Date());
      
      let fetchUrl = '/api/daily_works';
      if (window.location.protocol === 'file:') {
        fetchUrl = 'http://localhost:8000/api/daily_works';
      }
      
      fetch(fetchUrl)
        .then(r => r.json())
        .catch(() => ({}))
        .then(works => {
          if (works[todayStr] && works[todayStr][selectedMember]) {
            inputEl.value = works[todayStr][selectedMember];
          } else {
            inputEl.value = '';
          }
        });
    });
  }

  const selectedMember = selectEl ? selectEl.value : activeMember;
  inputEl.value = '';

  const todayStr = formatDateISO(new Date());

  let fetchUrl = '/api/daily_works';
  if (window.location.protocol === 'file:') {
    fetchUrl = 'http://localhost:8000/api/daily_works';
  }

  fetch(fetchUrl)
    .then(r => r.json())
    .catch(() => ({}))
    .then(works => {
      // 1. 현재 선택된 멤버의 오늘 기록 채워두기
      if (works[todayStr] && works[todayStr][selectedMember]) {
        inputEl.value = works[todayStr][selectedMember];
      }

      // 2. 전체 멤버의 오늘 한 일 리스트 렌더링
      const todayWorks = works[todayStr] || {};
      const entries = Object.entries(appConfig.members).filter(([key, m]) => key !== 'extra_member');

      listEl.innerHTML = entries.map(([key, memberConfig]) => {
        const content = todayWorks[key] || '';
        const contentHtml = content 
          ? `<div class="daily-work-item-content">${content.replace(/\n/g, '<br>')}</div>`
          : `<div class="daily-work-item-content" style="color:var(--color-text-muted); font-style:italic;">기록된 활동이 없습니다.</div>`;

        return `
          <div class="daily-work-item">
            <div class="daily-work-item-header">
              <span class="daily-work-item-member">${memberConfig.emoji} ${memberConfig.name}</span>
              <span class="daily-work-item-date">${todayStr}</span>
            </div>
            ${contentHtml}
          </div>
        `;
      }).join('');
    });

  // 저장 버튼 리스너 바인딩 (중복 등록 방지를 위해 한 번만)
  if (!saveBtn.dataset.bound) {
    saveBtn.dataset.bound = 'true';
    saveBtn.addEventListener('click', () => {
      const targetMember = selectEl ? selectEl.value : activeMember;
      const contentVal = inputEl.value.trim();
      
      let postUrl = '/api/save_daily_work';
      if (window.location.protocol === 'file:') {
        postUrl = 'http://localhost:8000/api/save_daily_work';
      }

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...';

      fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member: targetMember,
          date: todayStr,
          content: contentVal
        })
      })
      .then(resp => resp.json())
      .then(data => {
        if (data.status === 'ok') {
          showToast('활동 내역이 지통실 대장에 기록되었습니다.', 'success');
          loadDailyWorks(); // 리스트 새로고침
        } else {
          showToast('저장 오류: ' + data.message, 'error');
        }
      })
      .catch(err => {
        showToast('서버 연결 실패: ' + err.message, 'error');
      })
      .finally(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> 기록 저장';
      });
    });
  }
}

// ── To-Do List Widget (TODAY SCHEDULE) ─────────────────────────────────────────────
let todoItems = [];

function initTodoList() {
  const todoInput = document.getElementById('todoInput');
  const addTodoBtn = document.getElementById('addTodoBtn');

  // Load from localStorage
  const saved = localStorage.getItem('oa_today_todos');
  if (saved) {
    try {
      todoItems = JSON.parse(saved);
    } catch (e) {
      todoItems = [];
    }
  } else {
    todoItems = [];
  }

  if (addTodoBtn && todoInput) {
    addTodoBtn.addEventListener('click', () => {
      addTodo();
    });
    todoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addTodo();
      }
    });
  }

  renderTodos();
}

function addTodo() {
  const todoInput = document.getElementById('todoInput');
  if (!todoInput) return;
  const text = todoInput.value.trim();
  if (!text) return;

  const newItem = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    text: text,
    completed: false
  };

  todoItems.push(newItem);
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

function toggleTodo(id) {
  todoItems = todoItems.map(item => {
    if (item.id === id) {
      return { ...item, completed: !item.completed };
    }
    return item;
  });
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todoItems = todoItems.filter(item => item.id !== id);
  saveTodos();
  renderTodos();
}

function saveTodos() {
  localStorage.setItem('oa_today_todos', JSON.stringify(todoItems));
}

function renderTodos() {
  const container = document.getElementById('todayScheduleContainer');
  if (!container) return;

  if (todoItems.length === 0) {
    container.innerHTML = `<div class="no-activity">할 일이 없습니다.</div>`;
    return;
  }

  container.innerHTML = todoItems.map(item => {
    return `
      <div class="todo-item ${item.completed ? 'completed' : ''}">
        <input type="checkbox" class="todo-item-checkbox" ${item.completed ? 'checked' : ''} onchange="window.toggleTodoItem('${item.id}')">
        <span class="todo-item-text" onclick="window.toggleTodoItem('${item.id}')">${escapeHtml(item.text)}</span>
        <button class="todo-item-delete" onclick="window.deleteTodoItem('${item.id}')" title="삭제">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
  }).join('');
}

// Global helpers so inline onclick/onchange works smoothly
window.toggleTodoItem = function(id) {
  toggleTodo(id);
};

window.deleteTodoItem = function(id) {
  deleteTodo(id);
};

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── 보안 잠금 기능 (Security Lock: 950120) ──────────────────────────────────────────
const SECURITY_PASSWORD = "950120";

function initSecurity() {
  const dailyWorkPasswordInput = document.getElementById('dailyWorkPasswordInput');
  const dailyWorkUnlockBtn = document.getElementById('dailyWorkUnlockBtn');
  const todoPasswordInput = document.getElementById('todoPasswordInput');
  const todoUnlockBtn = document.getElementById('todoUnlockBtn');

  if (dailyWorkUnlockBtn && dailyWorkPasswordInput) {
    dailyWorkUnlockBtn.addEventListener('click', () => {
      tryUnlock(dailyWorkPasswordInput.value, 'dailyWorkLockError');
      dailyWorkPasswordInput.value = '';
    });
    dailyWorkPasswordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        tryUnlock(dailyWorkPasswordInput.value, 'dailyWorkLockError');
        dailyWorkPasswordInput.value = '';
      }
    });
  }

  if (todoUnlockBtn && todoPasswordInput) {
    todoUnlockBtn.addEventListener('click', () => {
      tryUnlock(todoPasswordInput.value, 'todoLockError');
      todoPasswordInput.value = '';
    });
    todoPasswordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        tryUnlock(todoPasswordInput.value, 'todoLockError');
        todoPasswordInput.value = '';
      }
    });
  }

  checkSecurityState();
}

function checkSecurityState() {
  const isUnlocked = sessionStorage.getItem('oa_security_unlocked') === 'true';
  
  const dailyWorkLockScreen = document.getElementById('dailyWorkLockScreen');
  const dailyWorkActualContent = document.getElementById('dailyWorkActualContent');
  const todoLockScreen = document.getElementById('todoLockScreen');
  const todoActualContent = document.getElementById('todoActualContent');

  if (isUnlocked) {
    if (dailyWorkLockScreen) dailyWorkLockScreen.style.display = 'none';
    if (dailyWorkActualContent) dailyWorkActualContent.style.display = 'block';
    if (todoLockScreen) todoLockScreen.style.display = 'none';
    if (todoActualContent) todoActualContent.style.display = 'block';
  } else {
    if (dailyWorkLockScreen) dailyWorkLockScreen.style.display = 'flex';
    if (dailyWorkActualContent) dailyWorkActualContent.style.display = 'none';
    if (todoLockScreen) todoLockScreen.style.display = 'flex';
    if (todoActualContent) todoActualContent.style.display = 'none';
  }
}

function tryUnlock(password, errorElementId) {
  const errorEl = document.getElementById(errorElementId);
  if (password === SECURITY_PASSWORD) {
    sessionStorage.setItem('oa_security_unlocked', 'true');
    if (errorEl) errorEl.style.display = 'none';
    checkSecurityState();
    showToast('보안 영역이 잠금 해제되었습니다.', 'success');
    
    // 오늘 한 일 탭이 활성화되어 있다면 즉시 데이터 다시 로드
    const dailyPane = document.getElementById('pane-daily-work');
    if (dailyPane && dailyPane.classList.contains('active')) {
      loadDailyWorks();
    }
  } else {
    if (errorEl) {
      errorEl.style.display = 'block';
      setTimeout(() => {
        errorEl.style.display = 'none';
      }, 3000);
    }
    showToast('비밀번호가 올바르지 않습니다.', 'error');
  }
}


