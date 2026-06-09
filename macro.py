# -*- coding: utf-8 -*-
"""
SOOP(구 아프리카TV) 스트리머 공지사항 자동 크롤링 및 유저 게시글 업데이트 매크로 프로그램
"""

import os
import sys
import time
import json
import re
import traceback
from datetime import datetime, timedelta, timezone

def get_kst_now():
    return datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=9)))
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
# [사용자 설정 변수]
# ==============================================================================
USER_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chrome_profile")
PROFILE_DIR = "Default"
NOTICE_BOARD_URL = "https://www.sooplive.com/station/rariruro/board/111790159"
SCHEDULE_BOARD_URL = "https://www.sooplive.com/station/rariruro/board/90430481"
FANART_BOARD_URL = "https://www.sooplive.com/station/rariruro/board/123988475"
MY_POST_MODIFY_URL = "https://www.sooplive.com/station/본인아이디/post/게시글번호/modify"
# ==============================================================================

def setup_chrome_driver(user_data_dir, profile_dir, headless=False):
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
    print("생방송(LIVE) 진행 상태를 확인하는 중...")
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
                    if "LIVE" in txt or "방송" in txt or txt == "":
                        return True
        except Exception:
            continue
            
    try:
        elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'LIVE') or contains(text(), '방송중')]")
        for elem in elements:
            if elem.is_displayed() and len(elem.text.strip()) <= 6:
                return True
    except Exception:
        pass
        
    return False

def crawl_latest_post_urls(driver, board_url, max_count=8):
    print(f"게시판({board_url}) 로드 시도 중...")
    driver.get(board_url)
    
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/post/']"))
        )
    except Exception as e:
        print(f"[경고] 게시판 요소 로딩 대기 시간 초과: {e}")
        print(f"현재 브라우저 타이틀: '{driver.title}'")
        
    post_elements = []
    
    # 1. 메인 포스트 리스트 영역에서 먼저 탐색 시도 (SOOP의 최신 게시판 구조 대응)
    try:
        post_elements = driver.find_elements(By.CSS_SELECTOR, "[class*='PostListSection_sectionBox'] a[href*='/post/']")
    except Exception:
        pass
        
    # 2. 기존 클래스 목록 순차 매칭 시도
    if not post_elements:
        list_containers = [
            "ul.post_list", "div.post_list", "table.board_list", "div.board_list_all",
            "div.list_wrap", "div.post_list_all", "ul.bbs_list", "div.board_list"
        ]
        for container in list_containers:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, f"{container} a[href*='/post/']")
                if elements:
                    post_elements = elements
                    break
            except Exception:
                continue
                
    # 3. 찾지 못한 경우 페이지 전체에서 모든 post 링크 탐색 (최종 폴백)
    if not post_elements:
        try:
            post_elements = driver.find_elements(By.CSS_SELECTOR, "a[href*='/post/']")
        except Exception as e:
            print(f"[에러] 게시글 링크 수집 실패: {e}")
        
    if not post_elements:
        print("[경고] 게시글 요소를 하나도 찾을 수 없습니다. 페이지 소스 확인이 필요합니다.")
        return []
        
    valid_urls = []
    for elem in post_elements:
        try:
            href = elem.get_attribute("href")
            if href and "/post/" in href:
                # 썸네일형(팬아트) 게시판 대응: 텍스트 제목이 없어도 real post URL이면 수집되도록 완화
                # 단, 댓글 개수 링크 및 글 번호로 오인될 수 있는 아주 짧은 숫자 전용 링크만 필터링
                if href not in valid_urls:
                    post_id_match = re.search(r'/post/(\d+)', href)
                    if post_id_match:
                        pid = post_id_match.group(1)
                        # 중복 post_id 등록 방지
                        if not any(pid in u for u in valid_urls):
                            valid_urls.append(href)
                if len(valid_urls) >= max_count:
                    break
        except Exception as e:
            print(f"[경고] 링크 필터링 도중 예외 발생: {e}")
            continue
            
    print(f"수집된 유효 글 주소 ({len(valid_urls)}개): {valid_urls}")
    return valid_urls

def crawl_june_notices(driver, notice_board_url):
    print(f"[2/5] 공지사항 게시판({notice_board_url})에서 6월 공지글 수집 중...")
    post_urls = []
    try:
        post_urls = crawl_latest_post_urls(driver, notice_board_url, max_count=30)
    except Exception as e:
        print(f"[오류] 공지사항 목록 가져오기 실패: {e}")
        traceback.print_exc()
        
    if not post_urls:
        print("[경고] 공지글 목록이 비어있습니다. 수집을 진행하지 않습니다.")
        return []
        
    june_notices = []
    
    for idx, post_url in enumerate(post_urls):
        try:
            print(f"공지글 [{idx+1}/{len(post_urls)}] 로딩 중: {post_url}")
            driver.get(post_url)
            time.sleep(2.5)
            
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            
            # 1. 제목 추출
            title_elem = soup.select_one("[class*='PostTitle_title']") or soup.select_one("[class*='Title_title']") or soup.select_one(".title") or soup.select_one("h2")
            title = title_elem.text.strip() if title_elem else "제목 없음"
            
            # 제목에서 '공지', '[공지]', 'Notice' 등 접두사 제거
            title = re.sub(r'^\[?공지\]?\s*', '', title)
            title = re.sub(r'^\[?Notice\]?\s*', '', title, flags=re.IGNORECASE)
            title = title.strip()
            
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
                print(f"[경고] 본문 요소를 찾을 수 없습니다. (URL: {post_url}) | 타이틀: {driver.title}")
                
            # 날짜 검증: 6월 1일 이후 글인지 확인
            if date_text:
                try:
                    post_date = datetime.strptime(date_text.split(" ")[0], "%Y-%m-%d").date()
                    limit_date = datetime.strptime("2026-06-01", "%Y-%m-%d").date()
                    if post_date < limit_date:
                        print(f"6월 이전 글 감지 ({date_text}). 수집을 중단합니다.")
                        break
                except Exception:
                    pass
            else:
                print("[경고] 작성 날짜가 비어 있습니다. 오늘 작성 글로 가정합니다.")
                
            june_notices.append({
                "title": title,
                "date": date_text if date_text else get_kst_now().strftime("%Y-%m-%d %H:%M:%S"),
                "url": post_url,
                "content": content_text
            })
        except Exception as e:
            print(f"[오류] 공지글 상세 수집 중 에러 발생 ({post_url}): {e}")
            traceback.print_exc()
            continue
            
    print(f"총 {len(june_notices)}개의 6월 공지사항을 성공적으로 수집했습니다.")
    return june_notices

def compile_weekly_schedule(notices):
    today = get_kst_now().date()
    monday = today - timedelta(days=today.weekday())
    
    days_of_week = ["월", "화", "수", "목", "금", "토", "일"]
    schedule = []
    for i in range(7):
        day_date = monday + timedelta(days=i)
        schedule.append({
            "day": days_of_week[i],
            "date": f"{day_date.month}/{day_date.day}",
            "time": "공지 대기",
            "detail": "소통 방송",
            "full_date_str": day_date.strftime("%Y-%m-%d")
        })
        
    if not notices:
        for item in schedule:
            del item["full_date_str"]
        return schedule
        
    sorted_notices = sorted(notices, key=lambda x: x.get("date", ""))
    
    for notice in sorted_notices:
        date_str = notice.get("date", "")
        content = notice.get("content", "")
        title = notice.get("title", "")
        
        if not date_str or not content:
            continue
            
        notice_date_part = date_str.split(" ")[0]
        
        for day_index, item in enumerate(schedule):
            if item["full_date_str"] == notice_date_part:
                time_val = "방송 진행 (공지 확인)"
                
                if "휴방" in content or "휴뱅" in content or "휴방" in title or "휴뱅" in title:
                    time_val = "휴방"
                else:
                    time_pattern = r'(오후|오전)\s*(\d+)\s*시(?:\s*(\d+)\s*분)?'
                    matches = re.findall(time_pattern, content)
                    if matches:
                        formatted_times = []
                        for ampm, hr, mn in matches:
                            min_part = f":{mn.strip()}" if mn else ":00"
                            formatted_times.append(f"{ampm} {hr}{min_part}")
                        time_val = " / ".join(formatted_times) + " 방송"
                        
                detail_val = "소통 방송"
                detail_keywords = ["CK", "배그", "종겜", "합방", "음주", "술먹방", "여우도시", "고래시티", "방셀"]
                matched_details = []
                for kw in detail_keywords:
                    if kw in content or kw in title:
                        matched_details.append(kw)
                if matched_details:
                    detail_val = ", ".join(matched_details)
                    
                current_time = schedule[day_index]["time"]
                if current_time != "공지 대기" and time_val == "방송 진행 (공지 확인)":
                    pass
                else:
                    schedule[day_index]["time"] = time_val

                current_detail = schedule[day_index]["detail"]
                if current_detail != "소통 방송" and detail_val == "소통 방송":
                    pass
                else:
                    schedule[day_index]["detail"] = detail_val
                    
    # 지난 요일 중 "공지 대기" 상태인 것을 "휴방"으로 일괄 변경
    for item in schedule:
        item_date_part = item.get("full_date_str", "")
        if item_date_part:
            try:
                item_date = datetime.strptime(item_date_part, "%Y-%m-%d").date()
                if item_date < today and item.get("time") == "공지 대기":
                    item["time"] = "휴방"
            except Exception:
                pass

    for item in schedule:
        if "full_date_str" in item:
            del item["full_date_str"]
        
    return schedule

def crawl_fanart_images(driver, fanart_board_url, max_images=9):
    print(f"[3.5/5] 팬아트 게시판({fanart_board_url})에서 최신 팬아트 탐색 중...")
    post_urls = []
    try:
        post_urls = crawl_latest_post_urls(driver, fanart_board_url, max_count=10)
    except Exception as e:
        print(f"[오류] 팬아트 게시글 목록 가져오기 실패: {e}")
        traceback.print_exc()
        
    if not post_urls:
        print("[경고] 팬아트 게시글 목록이 비어있습니다.")
        return []
        
    image_urls = []
    for idx, post_url in enumerate(post_urls):
        try:
            print(f"팬아트 글 [{idx+1}/{len(post_urls)}] 로딩 중: {post_url}")
            driver.get(post_url)
            time.sleep(2.5)
            
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
                        
                        if "emoji" not in src and "emoticon" not in src and "profile" not in src:
                            if src not in image_urls:
                                image_urls.append(src)
            else:
                print(f"[경고] 팬아트 본문 탐색 실패 (URL: {post_url}) | 타이틀: {driver.title}")
        except Exception as e:
            print(f"[오류] 개별 팬아트 이미지 추출 중 에러 발생 ({post_url}): {e}")
            continue
            
        if len(image_urls) >= max_images:
            break
            
    print(f"총 {len(image_urls)}개의 팬아트 이미지를 성공적으로 추출했습니다.")
    return image_urls[:max_images]

def update_my_post(driver, modify_url, notice_text, schedule_images):
    print(f"[4/5] 내 유저 게시글 수정 페이지로 이동 중: {modify_url}")
    driver.get(modify_url)
    
    wait = WebDriverWait(driver, 15)
    time.sleep(4)

    final_content = notice_text + "\n\n"
    if schedule_images:
        final_content += "\n[주간 일정표 이미지]\n"
        for img_url in schedule_images:
            final_content += f"- {img_url}\n"
            
    editor_updated = False
    
    try:
        iframe_element = wait.until(EC.presence_of_element_located((By.ID, "se2_iframe")))
        driver.switch_to.frame(iframe_element)
        editor_body = driver.find_element(By.TAG_NAME, "body")
        
        editor_body.send_keys(Keys.CONTROL + "a")
        editor_body.send_keys(Keys.BACKSPACE)
        
        html_formatted = final_content.replace("\n", "<br>")
        driver.execute_script("arguments[0].innerHTML = arguments[1];", editor_body, html_formatted)
        
        driver.switch_to.default_content()
        editor_updated = True
        print("스마트에디터(iframe) 본문 업데이트를 완료했습니다.")
    except Exception as e:
        driver.switch_to.default_content()
        print(f"스마트에디터(iframe) 진입 실패 또는 패스: {e}")

    if not editor_updated:
        try:
            text_selectors = [
                "textarea#write_content", "textarea.write_content", 
                "div.editor_body", "[contenteditable='true']"
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
                print("[에러] 에디터 입력 요소를 발견하지 못했습니다.")
                return False
        except Exception as e:
            print(f"[에러] 일반 본문 입력 오류: {e}")
            return False

    print("[5/5] '수정완료/등록' 버튼을 찾아 클릭하는 중...")
    submit_selectors = [
        "a#btn_ok", "button#btn_ok", "a.btn_confirm", "button.btn_confirm",
        "a#btn_write", "button#btn_write",
        "//button[contains(text(), '등록')]", "//a[contains(text(), '등록')]",
        "//button[contains(text(), '수정')]", "//a[contains(text(), '수정')]",
        "//button[contains(text(), '확인')]", "//a[contains(text(), '확인')]"
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
        print("[경고] 등록 완료 버튼을 자동으로 클릭하지 못했습니다. 수동 완료를 위해 15초 대기합니다.")
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
            
    print("========================================================")
    print("      SOOP 2개 게시판 크롤링 & 블로그 업데이트 매크로      ")
    print("========================================================")
    
    login_check_file = os.path.join(USER_DATA_DIR, ".login_done")
    is_github_actions = os.environ.get("GITHUB_ACTIONS") is not None
    use_headless = is_github_actions or os.path.exists(login_check_file)
    
    driver = None
    try:
        driver = setup_chrome_driver(USER_DATA_DIR, PROFILE_DIR, headless=use_headless)
        
        if not is_github_actions and not os.path.exists(login_check_file):
            print("\n[최초 실행 감지] SOOP 로그인 세션 구축을 시작합니다.")
            driver.get("https://www.sooplive.com")
            
            while True:
                user_confirm = input("로그인을 완료하셨습니까? (Y/N): ").strip().upper()
                if user_confirm == 'Y':
                    with open(login_check_file, "w") as f:
                        f.write("login_completed")
                    print("로그인 세션이 안전하게 저장되었습니다.\n")
                    break
                else:
                    print("로그인을 완료하신 후 'Y'를 입력해 주세요.")
        
        # --- [1] 공지사항 크롤링 (예외 차단 격리) ---
        june_notices = []
        try:
            june_notices = crawl_june_notices(driver, NOTICE_BOARD_URL)
        except Exception as e:
            print(f"[오류] 공지사항 크롤링 단계 실패: {e}")
            traceback.print_exc()

        # --- [2] 주간 일정표 컴파일 (예외 차단 격리) ---
        schedule_data = []
        try:
            schedule_data = compile_weekly_schedule(june_notices)
        except Exception as e:
            print(f"[오류] 일정 컴파일 단계 실패: {e}")
            traceback.print_exc()

        # --- [3] 최신 팬아트 이미지 크롤링 (예외 차단 격리) ---
        fanart_images = []
        try:
            fanart_images = crawl_fanart_images(driver, FANART_BOARD_URL)
        except Exception as e:
            print(f"[오류] 팬아트 이미지 크롤링 단계 실패: {e}")
            traceback.print_exc()

        # --- [4] 생방송 상태 체크 (예외 차단 격리) ---
        is_live = False
        try:
            driver.get("https://www.sooplive.com/station/rariruro")
            time.sleep(2.5)
            is_live = check_live_status(driver)
            print(f"[알림] 생방송 여부 감지 완료: {'방송 중' if is_live else '방종 상태'}")
        except Exception as e:
            print(f"[오류] 생방송 상태 확인 실패: {e}")
            traceback.print_exc()

        # --- [5] 데이터 보존 처리 (일부 모듈 실패 시에도 안전하게 실행) ---
        notice_text = june_notices[0]["content"] if june_notices else ""
        
        # 파일 저장 경로 설정
        json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json")
        js_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.js")
        
        # 기존 데이터 로드하여 주간 일정 아카이브(schedules) 보존
        existing_schedules = {}
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    old_data = json.load(f)
                    existing_schedules = old_data.get("schedules", {})
                    # 기존 schedules 가 비어있고 schedule 항목이 있는 경우 마이그레이션
                    if not existing_schedules and "schedule" in old_data and old_data["schedule"]:
                        today_temp = get_kst_now().date()
                        monday_temp = today_temp - timedelta(days=today_temp.weekday())
                        existing_schedules[monday_temp.strftime("%Y-%m-%d")] = old_data["schedule"]
            except Exception as e:
                print(f"[경고] 기존 data.json 로딩 오류 (히스토리 보존 스킵): {e}")

        # 현재 주의 월요일 구하기
        today = get_kst_now().date()
        monday = today - timedelta(days=today.weekday())
        current_week_key = monday.strftime("%Y-%m-%d")
        
        # 현재 주 일정을 아카이브에 갱신/추가
        if schedule_data:
            existing_schedules[current_week_key] = schedule_data
            
        collected_data = {
            "updated_at": get_kst_now().strftime("%Y-%m-%d %H:%M:%S"),
            "is_live": is_live,
            "notice_text": notice_text,
            "images": [],
            "notices": june_notices,
            "schedule": schedule_data,
            "schedules": existing_schedules,
            "fanarts": fanart_images
        }
        
        try:
            # 1. JSON 파일 저장
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(collected_data, f, ensure_ascii=False, indent=4)
            print(f"[알림] 수집된 데이터가 data.json에 보존되었습니다: {json_path}")
            
            # 2. JS 변수 파일 저장
            with open(js_path, "w", encoding="utf-8") as f:
                f.write(f"const JERRY_DATA = {json.dumps(collected_data, ensure_ascii=False, indent=4)};\n")
            print(f"[알림] 수집된 데이터가 data.js에 보존되었습니다: {js_path}")
        except Exception as e:
            print(f"[경고] 데이터 파일 저장 중 에러 발생: {e}")
            traceback.print_exc()

        # --- [6] 외부 블로그 포스트 업로드 단계 (로컬 실행 전용) ---
        if is_github_actions:
            print("\n[알림] GitHub Actions 환경이 감지되어 개인 포스팅 수정 과정은 생략합니다.\n")
        elif MY_POST_MODIFY_URL == "https://www.sooplive.com/station/본인아이디/post/게시글번호/modify" or "rariruro" in MY_POST_MODIFY_URL and "board" not in MY_POST_MODIFY_URL:
            print("\n[경고] 본인의 실제 '글 수정(modify) URL'이 등록되어 있지 않습니다. 수집 결과만 출력합니다.\n")
        else:
            try:
                success = update_my_post(driver, MY_POST_MODIFY_URL, notice_text, [])
                if success:
                    print("[완료] 블로그 포스팅 수정이 완수되었습니다!")
                else:
                    print("[오류] 블로그 포스팅 수정에 실패했습니다.")
            except Exception as e:
                print(f"[오류] 포스팅 수정 프로세스 예외 발생: {e}")
                traceback.print_exc()
                
    except Exception as e:
        print(f"[오류 발생] 전체 프로세스 예외 발생: {e}")
        traceback.print_exc()
        
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
