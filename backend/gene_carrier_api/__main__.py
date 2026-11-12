"""Build prepared data or run a loopback-only HTTP preview."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from .core import CarrierAPI, build_database, encoded


def preview(database, port):
    api = CarrierAPI(database)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass  # Do not write query values or sample information into access logs.

        def do_GET(self):
            self.respond()

        def do_POST(self):
            self.respond()

        def respond(self):
            parts = urlsplit(self.path)
            query = {key: values[0] for key, values in parse_qs(parts.query).items()}
            body = None
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 <= length <= 1024 * 1024:
                    self.send_result(413, {"error": "Request body is too large"})
                    return
                if self.command == "POST":
                    body = json.loads(self.rfile.read(length))
            except (ValueError, UnicodeError):
                self.send_result(400, {"error": "Invalid JSON request"})
                return
            # Preview is restricted to loopback. Production calls handle() from
            # its authenticated route and supplies its real authorization callback.
            status, result = api.handle(self.command, parts.path, query, body, authorize=lambda gene: True)
            self.send_result(status, result)

        def send_result(self, status, result):
            data = encoded(result).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "private, no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(data)

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Carrier API preview: http://127.0.0.1:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    build = commands.add_parser("build")
    build.add_argument("--metadata", required=True, help="Raw samples-info JSONL or JSONL.gz")
    build.add_argument("--variants", required=True, help="Raw gene-variants-crdc JSONL or JSONL.gz")
    build.add_argument("--provenance", required=True, help="Source/build metadata JSON")
    build.add_argument("--output", required=True, help="Prepared SQLite database")
    build.add_argument("--allow-missing-metadata", action="store_true")
    serve = commands.add_parser("preview")
    serve.add_argument("--database", required=True)
    serve.add_argument("--port", type=int, default=8099)
    args = parser.parse_args()
    if args.command == "build":
        provenance = json.loads(Path(args.provenance).read_text(encoding="utf-8"))
        result = build_database(args.metadata, args.variants, args.output, provenance, args.allow_missing_metadata)
        print(encoded(result))
    else:
        preview(args.database, args.port)


if __name__ == "__main__":
    main()
