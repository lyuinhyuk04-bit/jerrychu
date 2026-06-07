# -*- coding: utf-8 -*-
"""
SOOP(구 아프리카TV) 스트리머 공지사항 자동 크롤링 및 유저 게시글 업데이트 매크로 프로그램

이 프로그램은 버추얼 스트리머 '제리츄'님의 방송국에서
1) 공지사항 게시판에서 최신 공지 텍스트를 긁어오고,
2) 일정표 게시판에서 최신 주간 일정 이미지를 긁어와서,
사용자의 개인 블로그(유저 게시판) 고정 게시글에 자동으로 수정·덮어쓰기하는 스크립트입니다.

[사전 필수 조건]
1. Python 환경에서 아래 패키지들을 설치해야 합니다:
   pip install selenium webdriver-manager beautifulsoup4
2. 최초 실행 시, 새로 열리는 크롬 창에서 SOOP 로그인을 완료한 뒤 터미널에 Y를 입력해 세션을 영구 보존해야 합니다.
"""

import os
import sys
import time
import json
from datetime import datetime
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# ==============================================================================
# [사용자 설정 변수 (VARIABLES)] - 본인의 환경에 맞게 경로와 URL을 입력하세요.
# ==============================================================================

# 1. 크롬 로컬 프로필 경로 설정
# - 프로젝트 폴더 내부에 매크로 전용 크롬 프로필(chrome_profile)을 자동으로 생성합니다.
# - 평소에 사용하시는 구글 크롬 브라우저를 종료할 필요 없이 독립적으로 실행 가능합니다.
USER_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chrome_profile")
PROFILE_DIR = "Default"

# 2. 크롤링할 스트리머(제리츄)의 게시판 URL 주소들
# - 최신 공지사항 텍스트를 가져올 게시판 주소
NOTICE_BOARD_URL = "https://www.sooplive.com/station/rariruro/board/111790159"

# - 최신 주간 일정표 이미지를 가져올 게시판 주소
SCHEDULE_BOARD_URL = "https://www.sooplive.com/station/rariruro/board/90430481"

# - 최신 팬아트 이미지들을 가져올 게시판 주소
FANART_BOARD_URL = "https://www.sooplive.com/station/rariruro/board/123988475"

# 3. 업데이트(덮어쓰기)할 본인의 유저 게시글 수정 페이지 URL
# - 본인이 개설한 블로그(유저 게시판) 글의 수정(modify) 페이지 주소를 여기에 정확히 입력하셔야 합니다.
# - (예: https://www.sooplive.com/station/사용자아이디/post/12345678/modify)
MY_POST_MODIFY_URL = "https://www.sooplive.com/station/본인아이디/post/게시글번호/modify"

# ==============================================================================


def setup_chrome_driver(user_data_dir, profile_dir, headless=False):
    """
    격리된 전용 크롬 프로필을 연동하여 Selenium WebDriver를 초기화합니다.
    """
    if headless:
        print("[1/5] Chrome 브라우저를 백그라운드(Headless) 모드로 실행하는 중...")
    else:
        print("[1/5] Chrome 브라우저를 독립 프로필로 실행하는 중...")
    
    if not os.path.exists(user_data_dir):
        try:
            os.makedirs(user_data_dir, exist_ok=True)
            print(f"매크로 전용 크롬 프로필 디렉토리를 생성했습니다: {user_data_dir}")
        except Exception as e:
            print(f"[경고] 사용자 데이터 폴더 생성 실패: {e}")

    chrome_options = Options()
    chrome_options.add_argument(f"user-data-dir={user_data_dir}")
    chrome_options.add_argument(f"profile-directory={profile_dir}")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    if headless:
        chrome_options.add_argument("--headless=new")
        
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        if not headless:
            driver.maximize_window()
        return driver
    except Exception as e:
        print("\n[에러] Chrome 드라이버 실행에 실패했습니다.")
        print("원인: 다른 프로그램(또는 이전 매크로)이 매크로 전용 크롬 프로필을 사용 중일 수 있습니다.")
        print("대책: 열려 있는 다른 매크로용 크롬 브라우저가 있다면 모두 닫아주세요.\n")
        print(f"상세 에러 내용: {e}")
        sys.exit(1)


def check_live_status(driver):
    """
    현재 페이지 상에서 제리츄님의 생방송(LIVE) 뱃지가 노출되고 있는지 검사합니다.
    """
    print("생방송(LIVE) 진행 상태를 확인하는 중...")
    
    # SOOP 방송중 표시 클래스 및 태그 후보군
    live_selectors = [
        "[class*='LiveList_live']",
        "[class*='liveBadge']",
        "[class*='liveFullSizeWrapper']",
        "[class*='livePreview']",
        "span.live",
        ".state_live",
        ".badge_live",
        "[class*='live-on']",
        "[class*='is-live']",
        ".profile_area .live",
        "[class*='profile'] [class*='live']"
    ]
    
    for sel in live_selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, sel)
            for elem in elements:
                if elem and elem.is_displayed():
                    txt = elem.text.strip().upper()
                    # 텍스트가 'LIVE', '방송중'이거나 아이콘만 떠 있는 경우 방송중으로 간주
                    if "LIVE" in txt or "방송" in txt or txt == "":
                        return True
        except Exception:
            continue
            
    # XPath 기반 2차 텍스트 매칭 보완
    try:
        elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'LIVE') or contains(text(), '방송중')]")
        for elem in elements:
            if elem.is_displayed() and len(elem.text.strip()) <= 6:
                return True
    except Exception:
        pass
        
    return False


def crawl_latest_post_detail_url(driver, board_url):
    """
    게시판 목록 페이지에서 실제 글 목록 영역을 좁히고, 그 안에서 가장 첫 번째(최신) 글의 상세 URL을 찾습니다.
    """
    driver.get(board_url)
    wait = WebDriverWait(driver, 15)
    
    try:
        # 게시글 링크 요소가 렌더링될 때까지 대기
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/post/']")))
    except Exception:
        print(f"[에러] 게시판({board_url}) 로드 실패 또는 게시글을 찾을 수 없습니다.")
        return None
        
    # 실제 글 목록을 담는 유력한 컨테이너 클래스들
    list_containers = [
        "ul.post_list",
        "div.post_list",
        "table.board_list",
        "div.board_list_all",
        "div.list_wrap",
        "div.post_list_all",
        "ul.bbs_list",
        "div.board_list"
    ]
    
    post_elements = []
    # 목록 컨테이너 범위 내에서만 a[href*='/post/'] 요소를 찾음 (메뉴나 프로필 링크 혼입 방지)
    for container in list_containers:
        elements = driver.find_elements(By.CSS_SELECTOR, f"{container} a[href*='/post/']")
        if elements:
            post_elements = elements
            break
            
    if not post_elements:
        # 대비책으로 전체 페이지에서 탐색
        post_elements = driver.find_elements(By.CSS_SELECTOR, "a[href*='/post/']")
        
    if not post_elements:
        return None
        
    # 유효한 상세글 URL 선택 (댓글 카운트 숫자나 프로필로 향하는 무효한 링크 필터링)
    valid_url = None
    for elem in post_elements:
        href = elem.get_attribute("href")
        if href and "/post/" in href:
            text = elem.text.strip()
            # 텍스트가 비어있지 않고 단순히 숫자로만 이루어지지 않은 진짜 제목 링크 선정
            if text and not text.isdigit() and len(text) > 2:
                valid_url = href
                break
                
    if not valid_url:
        # 필터링에 걸리지 않았을 경우 최상단 요소의 주소를 가져옴
        valid_url = post_elements[0].get_attribute("href")
        
    return valid_url


def crawl_latest_post_urls(driver, board_url, max_count=8):
    """
    게시판 목록 페이지에서 여러 최신글들의 상세 URL 목록을 추출합니다.
    """
    driver.get(board_url)
    wait = WebDriverWait(driver, 15)
    
    try:
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/post/']")))
    except Exception:
        print(f"[에러] 게시판({board_url}) 로드 실패 또는 게시글을 찾을 수 없습니다.")
        return []
        
    list_containers = [
        "ul.post_list",
        "div.post_list",
        "table.board_list",
        "div.board_list_all",
        "div.list_wrap",
        "div.post_list_all",
        "ul.bbs_list",
        "div.board_list"
    ]
    
    post_elements = []
    for container in list_containers:
        elements = driver.find_elements(By.CSS_SELECTOR, f"{container} a[href*='/post/']")
        if elements:
            post_elements = elements
            break
            
    if not post_elements:
        post_elements = driver.find_elements(By.CSS_SELECTOR, "a[href*='/post/']")
        
    if not post_elements:
        return []
        
    valid_urls = []
    for elem in post_elements:
        href = elem.get_attribute("href")
        if href and "/post/" in href:
            text = elem.text.strip()
            # 진짜 본문 제목 형태의 링크만 선집 (댓글수 및 글번호 형태 제외)
            if text and not text.isdigit() and len(text) > 2:
                if href not in valid_urls:
                    valid_urls.append(href)
                if len(valid_urls) >= max_count:
                    break
                    
    return valid_urls


def crawl_june_notices(driver, notice_board_url):
    """
    공지사항 게시판에서 6월 이후 작성된 모든 공지사항을 수집합니다.
    """
    print(f"[2/5] 공지사항 게시판({notice_board_url})에서 6월 공지글 수집 중...")
    post_urls = crawl_latest_post_urls(driver, notice_board_url, max_count=30)
    
    if not post_urls:
        print("[경고] 공지글 목록을 가져오지 못했습니다.")
        return []
        
    june_notices = []
    
    for idx, post_url in enumerate(post_urls):
        print(f"공지글 [{idx+1}/{len(post_urls)}] 로딩 중: {post_url}")
        driver.get(post_url)
        time.sleep(2.5)
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # 1. 제목 추출
        title_elem = soup.select_one("[class*='PostTitle_title']") or soup.select_one("[class*='Title_title']") or soup.select_one(".title") or soup.select_one("h2")
        title = title_elem.text.strip() if title_elem else "제목 없음"
        
        # 2. 날짜 추출
        date_elem = soup.select_one("span[class*='regDate']") or soup.select_one("[class*='writeDate']") or soup.select_one("span.date")
        date_text = date_elem.text.strip() if date_elem else ""
        
        # 3. 본문 추출
        post_body = None
        content_selectors = [
            ".soop-editor-content",
            "[class*='postContent_postContent']",
            "div.txt_area", 
            "div.post_content"
        ]
        for selector in content_selectors:
            post_body = soup.select_one(selector)
            if post_body:
                break
                
        if post_body:
            # 불필요한 요소 제거
            trash_selectors = [
                "div.reply_area", "div.comment_area", "div.reply_wrap", "div.comment_wrap",
                "div.list_wrap", "table.board_list", ".post_list_all", "div.list_wrap_all",
                "div.view_list", ".writer_info", ".post_info"
            ]
            for trash_sel in trash_selectors:
                for trash in post_body.select(trash_sel):
                    trash.decompose()
            content_text = post_body.get_text(separator="\n").strip()
        else:
            content_text = ""
            
        # 날짜 검증: 6월 1일 이후 글인지 확인 (2026-06-01 이후)
        if date_text:
            try:
                post_date = datetime.strptime(date_text.split(" ")[0], "%Y-%m-%d").date()
                limit_date = datetime.strptime("2026-06-01", "%Y-%m-%d").date()
                if post_date < limit_date:
                    print(f"6월 이전 글 감지 ({date_text}). 수집을 중단합니다.")
                    break
            except Exception:
                # 상대적 시간(예: '방금 전', '1시간 전')으로 표시되는 오늘 글은 무조건 허용
                pass
        else:
            print("[경고] 작성 날짜를 읽지 못했습니다. 일단 계속 수집합니다.")
            
        june_notices.append({
            "title": title,
            "date": date_text,
            "url": post_url,
            "content": content_text
        })
        
    print(f"총 {len(june_notices)}개의 6월 공지사항을 성공적으로 수집했습니다.")
    return june_notices


def compile_weekly_schedule(notices):
    """
    현재 날짜가 속한 주(월요일~일요일)를 계산하여 공지사항 본문을 분석하고 주간 일정표를 동적으로 빌드합니다.
    """
    import re
    from datetime import datetime, timedelta
    
    # 실행 시점의 현재 날짜 구하기
    today = datetime.now().date()
    # 이번 주 월요일 계산 (weekday: 0=월, 1=화, ... 6=일)
    monday = today - timedelta(days=today.weekday())
    
    # 7일간의 일정 템플릿 생성
    days_of_week = ["월", "화", "수", "목", "금", "토", "일"]
    schedule = []
    for i in range(7):
        day_date = monday + timedelta(days=i)
        schedule.append({
            "day": days_of_week[i],
            "date": f"{day_date.month}/{day_date.day}",
            "time": "공지 대기",
            "detail": "소통 방송",
            "full_date_str": day_date.strftime("%Y-%m-%d")  # 매핑용 임시 필드 (YYYY-MM-DD)
        })
        
    # 오래된 공지부터 처리하여 최신 수정 공지가 덮어쓰도록 함 (notices는 최신순이므로 역순 정렬)
    sorted_notices = sorted(notices, key=lambda x: x.get("date", ""))
    
    for notice in sorted_notices:
        date_str = notice.get("date", "")
        content = notice.get("content", "")
        title = notice.get("title", "")
        
        if not date_str or not content:
            continue
            
        # date_str: "2026-06-07 10:23:57" -> "2026-06-07"
        notice_date_part = date_str.split(" ")[0]
        
        # 이번 주 일정 템플릿의 날짜와 매칭되는지 확인
        for day_index, item in enumerate(schedule):
            if item["full_date_str"] == notice_date_part:
                # 방송 시간 또는 휴방 키워드 파싱
                time_val = "방송 진행 (공지 확인)"
                
                if "휴방" in content or "휴뱅" in content or "휴방" in title or "휴뱅" in title:
                    time_val = "휴방"
                else:
                    # regex로 시간 추출
                    time_pattern = r'(오후|오전)\s*(\d+)\s*시(?:\s*(\d+)\s*분)?'
                    matches = re.findall(time_pattern, content)
                    if matches:
                        formatted_times = []
                        for ampm, hr, mn in matches:
                            min_part = f":{mn.strip()}" if mn else ":00"
                            formatted_times.append(f"{ampm} {hr}{min_part}")
                        time_val = " / ".join(formatted_times) + " 방송"
                        
                # 일정 상세 내용 간략히 요약
                detail_val = "소통 방송"
                detail_keywords = ["CK", "배그", "종겜", "합방", "음주", "술먹방", "여우도시", "고래시티", "방셀"]
                matched_details = []
                for kw in detail_keywords:
                    if kw in content or kw in title:
                        matched_details.append(kw)
                if matched_details:
                    detail_val = ", ".join(matched_details)
                    
                # 만약 기존에 분석된 구체적인 방송 시간 정보가 있고 이번 글은 일반 공지글인 경우, 덮어쓰지 않음
                current_time = schedule[day_index]["time"]
                if current_time != "공지 대기" and time_val == "방송 진행 (공지 확인)":
                    pass
                else:
                    schedule[day_index]["time"] = time_val

                # 상세 요약 정보도 구체적인 정보가 있으면 일반 fallback으로 덮어쓰지 않음
                current_detail = schedule[day_index]["detail"]
                if current_detail != "소통 방송" and detail_val == "소통 방송":
                    pass
                else:
                    schedule[day_index]["detail"] = detail_val
                    
    # 프론트엔드로 전달할 데이터에서는 매핑용 임시 필드 제거
    for item in schedule:
        del item["full_date_str"]
        
    return schedule


def crawl_fanart_images(driver, fanart_board_url, max_images=9):
    """
    최신 팬아트 게시판 글들을 순회하며 이미지 URL들을 수집합니다.
    """
    print(f"[3.5/5] 팬아트 게시판({fanart_board_url})에서 최신 팬아트 탐색 중...")
    post_urls = crawl_latest_post_urls(driver, fanart_board_url, max_count=6)
    
    if not post_urls:
        print("[경고] 팬아트 게시글 목록을 가져오지 못했습니다.")
        return []
        
    image_urls = []
    for idx, post_url in enumerate(post_urls):
        print(f"팬아트 글 [{idx+1}/{len(post_urls)}] 로딩 중: {post_url}")
        driver.get(post_url)
        time.sleep(2.5)  # 이미지 렌더링 대기
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        content_selectors = [
            ".soop-editor-content",
            "[class*='postContent_postContent']",
            "div.txt_area", 
            "div.post_content", 
            "div.view_content", 
            "div.contents_area", 
            "div.view_area"
        ]
        
        post_body = None
        for selector in content_selectors:
            post_body = soup.select_one(selector)
            if post_body:
                inner_body = post_body.select_one("div.txt_area") or post_body.select_one("div.post_content")
                if inner_body:
                    post_body = inner_body
                break
                
        if not post_body:
            post_body = soup.find("div", {"id": "bbs_content"}) or soup.find("div", {"id": "write_content"})
            
        if post_body:
            # 본문 영역에서 불필요한 댓글 영역, 프로필 이미지 영역 삭제
            trash_selectors = [
                "div.reply_area", "div.comment_area", "div.reply_wrap", "div.comment_wrap",
                "div.list_wrap", "table.board_list", ".post_list_all", "div.list_wrap_all",
                "div.view_list", ".writer_info", ".post_info"
            ]
            for trash_sel in trash_selectors:
                for trash in post_body.select(trash_sel):
                    trash.decompose()
                    
            images = post_body.find_all("img")
            for img in images:
                src = img.get("src") or img.get("data-src")
                if src:
                    if src.startswith("//"):
                        src = "https:" + src
                    elif src.startswith("/"):
                        src = "https://www.sooplive.com" + src
                    
                    # 이모티콘 및 프로필 이미지 제외
                    if "emoji" not in src and "emoticon" not in src and "profile" not in src:
                        if src not in image_urls:
                            image_urls.append(src)
                            
        if len(image_urls) >= max_images:
            break
            
    print(f"총 {len(image_urls)}개의 팬아트 이미지를 성공적으로 추출했습니다.")
    return image_urls[:max_images]


def update_my_post(driver, modify_url, notice_text, schedule_images):
    """
    본인의 개인 유저 게시판 글 수정 페이지로 이동하여 수집한 텍스트와 이미지 정보를 덮어씁니다.
    """
    print(f"[4/5] 내 유저 게시글 수정 페이지로 이동 중: {modify_url}")
    driver.get(modify_url)
    
    wait = WebDriverWait(driver, 15)
    time.sleep(4)  # 에디터 로드 대기

    # 에디터에 주입할 최종 본문 내용 조립
    final_content = notice_text + "\n\n"
    if schedule_images:
        final_content += "\n[주간 일정표 이미지]\n"
        for img_url in schedule_images:
            final_content += f"- {img_url}\n"
            
    editor_updated = False
    
    # --- 시도 1: 스마트에디터(iframe 'se2_iframe') 구조 대응 ---
    try:
        iframe_element = wait.until(EC.presence_of_element_located((By.ID, "se2_iframe")))
        driver.switch_to.frame(iframe_element)
        editor_body = driver.find_element(By.TAG_NAME, "body")
        
        # 전체 삭제
        editor_body.send_keys(Keys.CONTROL + "a")
        editor_body.send_keys(Keys.BACKSPACE)
        
        # HTML 형식으로 본문 줄바꿈 처리하여 주입
        html_formatted = final_content.replace("\n", "<br>")
        driver.execute_script("arguments[0].innerHTML = arguments[1];", editor_body, html_formatted)
        
        driver.switch_to.default_content()
        editor_updated = True
        print("스마트에디터(iframe) 본문 업데이트를 완료했습니다.")
    except Exception as e:
        driver.switch_to.default_content()
        print(f"스마트에디터(iframe) 진입 실패 또는 패스: {e}")

    # --- 시도 2: 일반 textarea 혹은 contenteditable div 구조 대응 ---
    if not editor_updated:
        try:
            text_selectors = [
                "textarea#write_content", 
                "textarea.write_content", 
                "div.editor_body", 
                "[contenteditable='true']"
            ]
            target_editor = None
            for sel in text_selectors:
                try:
                    target_editor = driver.find_element(By.CSS_SELECTOR, sel)
                    if target_editor:
                        break
                except Exception:
                    continue
            
            if target_editor:
                target_editor.click()
                target_editor.send_keys(Keys.CONTROL + "a")
                target_editor.send_keys(Keys.BACKSPACE)
                target_editor.send_keys(final_content)
                editor_updated = True
                print("일반 텍스트 영역 본문 업데이트를 완료했습니다.")
            else:
                print("[에러] 에디터 입력 요소를 발견하지 못했습니다. 주소가 글 수정(modify) 페이지가 맞는지 확인해 주세요.")
                return False
        except Exception as e:
            print(f"[에러] 일반 본문 입력 오류: {e}")
            return False

    # 3. 등록(수정완료) 버튼 클릭
    print("[5/5] '수정완료/등록' 버튼을 찾아 클릭하는 중...")
    submit_selectors = [
        "a#btn_ok", 
        "button#btn_ok",
        "a.btn_confirm", 
        "button.btn_confirm",
        "a#btn_write", 
        "button#btn_write",
        "//button[contains(text(), '등록')]", 
        "//a[contains(text(), '등록')]",
        "//button[contains(text(), '수정')]",
        "//a[contains(text(), '수정')]",
        "//button[contains(text(), '확인')]",
        "//a[contains(text(), '확인')]"
    ]

    button_clicked = False
    for selector in submit_selectors:
        try:
            if selector.startswith("//"):
                submit_btn = driver.find_element(By.XPATH, selector)
            else:
                submit_btn = driver.find_element(By.CSS_SELECTOR, selector)
                
            if submit_btn and submit_btn.is_displayed():
                driver.execute_script("arguments[0].scrollIntoView(true);", submit_btn)
                time.sleep(1)
                submit_btn.click()
                button_clicked = True
                print(f"등록 버튼 클릭 성공! (적용 Selector: {selector})")
                break
        except Exception:
            continue

    if not button_clicked:
        print("[경고] 등록 완료 버튼을 자동으로 클릭하지 못했습니다. 수동으로 등록 버튼을 눌러주세요.")
        print("15초간 대기합니다...")
        time.sleep(15)
        return True
    
    time.sleep(5)
    return True


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass
            
def main():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass
            
    print("========================================================")
    print("      SOOP 2개 게시판 크롤링 & 블로그 업데이트 매크로      ")
    print("========================================================")
    
    login_check_file = os.path.join(USER_DATA_DIR, ".login_done")
    is_github_actions = os.environ.get("GITHUB_ACTIONS") is not None
    
    # 로그인 완료 파일이 있거나 GitHub Actions 환경이면 백그라운드(headless)로 구동하여 화면 팝업을 차단합니다.
    use_headless = is_github_actions or os.path.exists(login_check_file)
    driver = None
    try:
        driver = setup_chrome_driver(USER_DATA_DIR, PROFILE_DIR, headless=use_headless)
        
        # 최초 1회 수동 로그인 대기 프로세스 (GitHub Actions가 아닐 때만 작동)
        if not is_github_actions and not os.path.exists(login_check_file):
            print("\n[최초 실행 감지] SOOP 로그인 세션 구축을 시작합니다.")
            print("1. 열린 크롬 브라우저 창에서 SOOP(아프리카TV)에 로그인해 주세요.")
            print("2. 로그인이 완료되면, 터미널 창으로 돌아와 'Y'를 누른 뒤 엔터를 입력해 주세요.")
            print("========================================================")
            driver.get("https://www.sooplive.com")
            
            while True:
                user_confirm = input("로그인을 완료하셨습니까? (Y/N): ").strip().upper()
                if user_confirm == 'Y':
                    with open(login_check_file, "w") as f:
                        f.write("login_completed")
                    print("로그인 세션이 안전하게 저장되었습니다. 작업을 계속 진행합니다...\n")
                    break
                else:
                    print("로그인을 완료하신 후 'Y'를 입력해 주세요.")
        
        # 1. 6월 공지사항들 크롤링
        june_notices = crawl_june_notices(driver, NOTICE_BOARD_URL)
        
        # 2. 6월 공지사항들을 반영하여 주간 일정표 컴파일
        schedule_data = compile_weekly_schedule(june_notices)
        
        # 2.5. 최신 팬아트 이미지 크롤링
        fanart_images = crawl_fanart_images(driver, FANART_BOARD_URL)
        
        # 2.7. 생방송 상태 체크 (방송국 홈 이동)
        driver.get("https://www.sooplive.com/station/rariruro")
        time.sleep(2.5)
        is_live = check_live_status(driver)
        print(f"[알림] 생방송 여부 감지 완료: {'방송 중' if is_live else '방종 상태'}")
        
        # 3. 내 블로그 글에 조립해서 덮어쓰기
        if june_notices or fanart_images:
            notice_text = june_notices[0]["content"] if june_notices else ""
            # 수집된 데이터를 로컬 웹 블로그가 불러갈 수 있도록 data.json 파일에 저장
            collected_data = {
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "is_live": is_live,
                "notice_text": notice_text,
                "images": [],
                "notices": june_notices,
                "schedule": schedule_data,
                "fanarts": fanart_images
            }
            json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json")
            js_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.js")
            try:
                # 1. JSON 파일 저장
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(collected_data, f, ensure_ascii=False, indent=4)
                print(f"[알림] 수집된 데이터가 data.json에 보존되었습니다: {json_path}")
                
                # 2. JS 변수 파일 저장 (로컬 브라우저 CORS 보안 정책 우회용)
                with open(js_path, "w", encoding="utf-8") as f:
                    f.write(f"const JERRY_DATA = {json.dumps(collected_data, ensure_ascii=False, indent=4)};\n")
                print(f"[알림] 수집된 데이터가 data.js에 보존되었습니다: {js_path}")
            except Exception as e:
                print(f"[경고] 데이터 파일 저장 중 에러 발생: {e}")

            if is_github_actions:
                print("\n[알림] GitHub Actions 환경이 감지되었습니다.")
                print("로그인 세션이 필요한 SOOP 블로그 글(유저게시판 포스트) 수정 연동은 생략하고 로컬 데이터만 빌드하여 갱신합니다.\n")
            elif MY_POST_MODIFY_URL == "https://www.sooplive.com/station/본인아이디/post/게시글번호/modify" or "rariruro" in MY_POST_MODIFY_URL and "board" not in MY_POST_MODIFY_URL:
                print("\n[경고] 본인의 실제 '글 수정(modify) URL'이 등록되어 있지 않습니다.")
                print("임시로 크롤링된 정보만 화면에 출력합니다. 실제 적용을 위해선 수정 주소를 입력해야 합니다.\n")
                print("--- [수집된 최신 공지 텍스트] ---")
                print(notice_text)
                print("\n--- [수집된 주간 일정표 데이터] ---")
                for item in schedule_data:
                    print(f"  {item['day']}({item['date']}): {item['time']} ({item['detail']})")
                print("\n--- [수집된 팬아트 이미지 링크] ---")
                for img in fanart_images:
                    print(img)
            else:
                success = update_my_post(driver, MY_POST_MODIFY_URL, notice_text, [])
                if success:
                    print("[완료] 매크로 작업이 성공적으로 완수되었습니다!")
                else:
                    print("[오류] 업데이트 작업에 실패했습니다.")
        else:
            print("[오류] 공지사항 및 팬아트를 수집하는 데 실패했습니다.")
            
    except Exception as e:
        print(f"[오류 발생] 전체 프로세스 진행 중 에러가 발생했습니다: {e}")
        
    finally:
        if driver:
            print("브라우저 세션을 종료합니다.")
            try:
                driver.quit()
            except Exception:
                pass
        print("========================================================\n")


if __name__ == "__main__":
    main()
