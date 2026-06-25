import http.server
import socketserver
import json
import urllib.request
import urllib.parse
import datetime
import sys
import os

# Server port configuration
PORT = 3000

# Telegram API Configuration
TELEGRAM_BOT_TOKEN = '8950884444:AAGgUj5dT6gbCxdEFPt285g9FxJWo5Es1VU'
OWNER_CHAT_IDS = ['8534469502'] # Forward report details to owners (test chat ID configured)

def send_telegram_message(bot_token, chat_id, text):
    """
    Sends an HTML-formatted message to the specified Telegram chat ID.
    """
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    data = urllib.parse.urlencode({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            return res.status == 200
    except Exception as e:
        print(f"Error sending Telegram message to {chat_id}: {e}")
        return False

class RefinedReportHandler(http.server.SimpleHTTPRequestHandler):
    """
    Custom HTTP Request Handler that serves the website static files 
    and handles the secure JSON API endpoint for submitting incident reports.
    """
    def do_GET(self):
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/report':
            self.handle_report()
        else:
            self.send_error(404, "Not Found")

    def handle_report(self):
        try:
            # Read JSON payload
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Extract textual report fields
            report_type = data.get('report-type', 'N/A')
            attacker_info = data.get('attacker-info', 'N/A')
            report_desc = data.get('report-desc', 'N/A')
            callback_info = data.get('callback-info', '')
            screenshots = data.get('report-screenshots', '')
            
            # Format the Telegram alert report message
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            callback_text = callback_info if callback_info.strip() else "Not provided"
            
            # Sanitize inputs to prevent breaking Telegram's HTML format parser
            def safe_html(text):
                return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

            screenshot_section = ""
            if screenshots.strip():
                screenshot_section = f"\n<b>Evidence Screenshot Links:</b>\n{safe_html(screenshots)}"
            else:
                screenshot_section = "\n<b>Evidence Screenshots:</b> None"

            telegram_text = (
                f"<b>[ FATAL.SH EMERGENCY INCIDENT REPORT ]</b>\n"
                f"------------------------------------\n"
                f"<b>Timestamp:</b> {safe_html(timestamp)}\n"
                f"<b>Threat Type:</b> {safe_html(report_type)}\n"
                f"<b>Extorter Handle:</b> {safe_html(attacker_info)}\n"
                f"<b>Victim Contact Handle:</b> {safe_html(callback_text)}\n\n"
                f"<b>Case Details:</b>\n"
                f"{safe_html(report_desc)}\n"
                f"{screenshot_section}"
            )
            
            # Forward the formatted alert to all configured owners
            success = True
            for chat_id in OWNER_CHAT_IDS:
                if not send_telegram_message(TELEGRAM_BOT_TOKEN, chat_id, telegram_text):
                    success = False
            
            # Respond to the client with JSON output
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {"success": success}
            if not success:
                response["error"] = "Could not deliver report to Telegram bot. Check server logs."
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error handling /api/report request: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))

if __name__ == '__main__':
    # Adjust working directory to the directory where server.py is located
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Configure the TCP server and initiate listening loop
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), RefinedReportHandler) as httpd:
        print(f"[*] Fatal.sh Server running locally at: http://localhost:{PORT}")
        print("[*] Serve directory: " + os.getcwd())
        print("[*] Press Ctrl+C to terminate...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            sys.exit(0)
