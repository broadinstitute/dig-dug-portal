"""Private original-VCF quality API; no phenotype model or matrix is loaded."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import re
from pathlib import Path
from scripts.vcf_carrier_genotypes import VcfCarrierGenotypes


def create_server(address, source):

    class Handler(BaseHTTPRequestHandler):
        def send_json(self, status, payload):
            body = json.dumps(payload, allow_nan=False, separators=(',', ':')).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'private, no-store')
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            self.send_json(200 if self.path == '/health' else 404,
                           {'status': 'ok'} if self.path == '/health' else {'error': 'not_found'})

        def do_POST(self):
            if self.path != '/phenotype-analyzer-api/gene-variant-quality':
                self.send_json(404, {'error': 'not_found'})
                return
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 2 * 1024 * 1024:
                    raise ValueError('Invalid body size')
                payload = json.loads(self.rfile.read(length))
                variants = payload.get('variant_ids') if isinstance(payload, dict) else None
                ids = payload.get('sample_ids') if isinstance(payload, dict) else None
                if (not isinstance(variants, list) or not 1 <= len(variants) <= 20000 or
                        any(not isinstance(v, str) or not re.fullmatch(r'chr(?:[0-9]{1,2}|X|Y|M|MT):[1-9][0-9]*:[ACGTN*.-]+:[ACGTN*.,-]+', v, re.I) for v in variants) or
                        not isinstance(ids, list) or len(ids) > 50000 or
                        any(not isinstance(sid, str) or not re.fullmatch(r'[A-Za-z0-9_.-]{1,150}', sid) for sid in ids)):
                    raise ValueError('Valid variants and authorized samples are required')
            except (ValueError, TypeError):
                self.send_json(400, {'error': 'invalid_quality_request'})
                return
            try:
                result = source.qualify(variants, ids)
                self.send_json(200, result)
            except Exception as error:
                self.log_error('VCF quality failed: %s', error)
                self.send_json(502, {'error': 'original_vcf_quality_unavailable'})

    return ThreadingHTTPServer(address, Handler)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--vcf', required=True)
    parser.add_argument('--bcftools', default='bcftools')
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=18097)
    parser.add_argument('--port-file', type=Path)
    parser.add_argument('--cache-directory', default=str(Path.cwd() / 'quality-cache'))
    args = parser.parse_args()
    server = create_server((args.host, args.port), VcfCarrierGenotypes(args.vcf, bcftools=args.bcftools,
                           cache_directory=args.cache_directory))
    if args.port_file:
        args.port_file.write_text(f'{server.server_port}\n')
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
