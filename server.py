"""
Warpigs local dev server.
Serves static files and accepts PUT requests to save JSON data files.
Usage: python server.py
"""
import http.server
import os
import sys

PORT = 8080
ALLOWED_FILES = {'schedule.json', 'story.json', 'contact.json', 'cities.json', 'venues.json', 'venues_info.json'}
ROOT = os.path.dirname(os.path.abspath(__file__))


class WarpigHandler(http.server.SimpleHTTPRequestHandler):
    """Extends SimpleHTTPRequestHandler with PUT support for JSON files."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_PUT(self):
        # Strip leading slash to get filename
        filename = self.path.lstrip('/')

        if filename not in ALLOWED_FILES:
            self.send_error(403, f'Not allowed to write: {filename}')
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        filepath = os.path.join(ROOT, filename)
        try:
            with open(filepath, 'wb') as f:
                f.write(body)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        except Exception as e:
            self.send_error(500, str(e))

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    with http.server.HTTPServer(('', PORT), WarpigHandler) as httpd:
        print(f'Warpigs dev server running at http://localhost:{PORT}')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nShutting down.')
            sys.exit(0)
