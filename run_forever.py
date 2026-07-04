# -*- coding: utf-8 -*-
import subprocess
import time
import sys
import os
import http.server
import socketserver
import threading
import json

def write_pid():
    """자신의 프로세스 ID(PID)를 daemon.pid 파일에 저장합니다."""
    pid = os.getpid()
    pid_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "daemon.pid")
    try:
        with open(pid_path, "w", encoding="utf-8") as f:
            f.write(str(pid))
    except Exception as e:
        print(f"PID 파일 기록 실패: {e}")

def remove_pid():
    """저장된 daemon.pid 파일을 삭제합니다."""
    pid_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "daemon.pid")
    if os.path.exists(pid_path):
        try:
            os.remove(pid_path)
        except Exception:
            pass

class CustomAPIHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def start_web_server():
    port = 3000
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", port), CustomAPIHandler) as httpd:
            print(f"[로컬 서버] 포트 {port}번에서 가동을 시작했습니다! (수정사항 자동 저장 활성화)")
            httpd.serve_forever()
    except Exception as e:
        print(f"[로컬 서버 오류] 웹서버 가동 실패 (포트 {port}번 사용 중일 수 있음): {e}")

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    write_pid()

    # 웹 서버 스레드로 백그라운드 실행
    web_thread = threading.Thread(target=start_web_server, daemon=True)
    web_thread.start()

    macro_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "macro.py")

    try:
        while True:
            try:
                # macro.py를 서브프로세스로 실행
                subprocess.run([sys.executable, macro_path], check=True)
            except subprocess.CalledProcessError as e:
                pass
            except Exception as e:
                pass
                
            time.sleep(60)
    finally:
        remove_pid()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
