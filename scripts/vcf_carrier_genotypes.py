"""Read exact, requested carrier calls from the indexed original VCF.

This supplements the pinned processed release; it never relabels that release
or enumerates unrequested samples. The VCF is queried by one genomic position.
"""
from collections import defaultdict
from functools import lru_cache
import hashlib
from pathlib import Path
import re
import subprocess
import tempfile


def canonical_sample(value):
    return re.sub(r'_[EG]38$', '', str(value), flags=re.I)


class VcfCarrierGenotypes:
    def __init__(self, filename, bcftools='bcftools', min_depth=20):
        self.filename = str(Path(filename).resolve())
        self.bcftools = bcftools
        self.min_depth = min_depth

    def _query(self, args):
        result = subprocess.run([self.bcftools, *args, self.filename],
                                capture_output=True, text=True, timeout=60, check=True)
        return result.stdout

    def lookup(self, variant, sample_ids):
        stat = Path(self.filename).stat()
        stamp = (stat.st_size, stat.st_mtime_ns)
        return self._lookup(variant, tuple(sorted(set(sample_ids))), stamp)

    @lru_cache(maxsize=2)
    def _header(self, stamp):
        names = self._query(['query', '-l']).splitlines()
        aliases = defaultdict(list)
        for name in names:
            aliases[canonical_sample(name)].append(name)
        contigs = {line.split('\t')[0] for line in self._query(['index', '-s']).splitlines()}
        return aliases, contigs

    @lru_cache(maxsize=64)
    def _lookup(self, variant, sample_ids, stamp):
        chrom, pos, ref, alt = variant.split(':')
        chrom = re.sub(r'^chr', '', chrom, flags=re.I)
        aliases, contigs = self._header(stamp)
        contig = next((name for name in (chrom, 'chr'+chrom) if name in contigs), None)
        if contig is None:
            raise ValueError('The requested chromosome is not in the genotype VCF.')
        requested = {sid: aliases.get(canonical_sample(sid), []) for sid in sample_ids}
        raw_names = sorted({names[0] for names in requested.values() if len(names) == 1})
        calls = {}
        if raw_names:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.samples', encoding='utf-8') as handle:
                handle.write('\n'.join(raw_names)+'\n')
                handle.flush()
                text = self._query(['query', '-r', f'{contig}:{pos}-{pos}', '-S', handle.name,
                                    '-f', '%CHROM\t%POS\t%REF\t%ALT[\t%SAMPLE=%GT:%DP]\n'])
            for line in text.splitlines():
                fields = line.split('\t')
                if fields[1] != pos or fields[2].upper() != ref.upper():
                    continue
                alts = fields[3].upper().split(',')
                if alt.upper() == fields[3].upper():
                    target_indices = set(range(1, len(alts)+1))
                elif alt.upper() in alts:
                    target_indices = {alts.index(alt.upper())+1}
                else:
                    continue
                for item in fields[4:]:
                    name, value = item.split('=', 1)
                    gt, depth = value.rsplit(':', 1)
                    status = 'matched'
                    if not re.fullmatch(r'\d+(?:[/|]\d+)*', gt):
                        status = 'no_call'
                    elif not depth.isdigit() or int(depth) < self.min_depth:
                        status = 'low_or_missing_depth'
                    elif not target_indices.intersection(map(int, re.split(r'[/|]', gt))):
                        status = 'not_target_carrier'
                    call = {'gt': gt if status == 'matched' else None, 'status': status}
                    if name in calls and calls[name] != call:
                        calls[name] = {'gt': None, 'status': 'conflict'}
                    else:
                        calls[name] = call
        rows = []
        for sid, names in requested.items():
            call = ({'gt': None, 'status': 'ambiguous_sample'} if len(names) > 1
                    else calls.get(names[0]) if names else None)
            rows.append({'variant_id': variant, 'sample_id': sid,
                         **(call or {'gt': None, 'status': 'not_in_vcf'})})
        digest = hashlib.sha256(repr([(r['sample_id'],r['gt'],r['status']) for r in rows]).encode()).hexdigest()
        return {'variant_id': variant, 'rows': rows, 'source': {
            'kind': 'original_vcf', 'source_file': self.filename, 'build': 'GRCh38',
            'scope': f'exact requested variant and carriers; DP>={self.min_depth}; no AF filter',
            'file_size': stamp[0], 'file_mtime_ns': stamp[1], 'selected_calls_sha256': digest,
        }}
