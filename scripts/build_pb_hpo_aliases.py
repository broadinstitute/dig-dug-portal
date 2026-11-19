"""Build unambiguous HPO alias mappings from the scoring matrix's OBO release."""
import argparse
import hashlib
import json
from pathlib import Path


def build(source):
    raw = Path(source).read_bytes()
    text = raw.decode('utf-8')
    version = next(line.split(': ', 1)[1] for line in text.splitlines() if line.startswith('data-version: '))
    candidates, active = {}, set()
    for block in text.split('[Term]')[1:]:
        fields = {}
        for line in block.splitlines():
            if ': ' in line:
                key, value = line.split(': ', 1)
                fields.setdefault(key, []).append(value.split(' ! ', 1)[0].strip())
        term = fields.get('id', [''])[0]
        if not term.startswith('HP:'):
            continue
        obsolete = fields.get('is_obsolete') == ['true']
        if not obsolete:
            active.add(term)
            for alias in fields.get('alt_id', []):
                candidates.setdefault(alias, set()).add(term)
        replacements = fields.get('replaced_by', [])
        if obsolete and len(replacements) == 1:
            candidates.setdefault(term, set()).add(replacements[0])
    aliases = {}
    for original in candidates:
        current, seen = original, set()
        while current in candidates and current not in seen and len(candidates[current]) == 1:
            seen.add(current)
            current = next(iter(candidates[current]))
        if current in active and current != original:
            aliases[original] = current
    return {'version': version, 'source': 'https://github.com/obophenotype/human-phenotype-ontology/releases/tag/v2026-02-16',
            'source_sha256': hashlib.sha256(raw).hexdigest(),
            'method': 'Unambiguous alt_id and single replaced_by chains ending in active terms; no consider mappings',
            'aliases': dict(sorted(aliases.items()))}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('destination')
    args = parser.parse_args()
    result = build(args.source)
    if result['version'] != 'hp/releases/2026-02-16':
        raise SystemExit('Expected the scoring matrix ontology release hp/releases/2026-02-16')
    Path(args.destination).write_text(json.dumps(result, indent=2) + '\n')
    print(f"Wrote {len(result['aliases'])} aliases from {result['version']}")
