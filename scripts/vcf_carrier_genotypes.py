"""Read exact, requested carrier calls from the indexed original VCF.

This supplements the pinned processed release; it never relabels that release
or enumerates unrequested samples. The VCF is queried by one genomic position.
"""
from collections import Counter, defaultdict
from functools import lru_cache
import hashlib
import gzip
import json
from pathlib import Path
import re
import subprocess
import tempfile
from threading import RLock


def canonical_sample(value):
    return re.sub(r'_[EG]38$', '', str(value), flags=re.I)


@lru_cache(maxsize=100000)
def _alleles_at_depth(value, min_depth):
    gt, depth = value.rsplit(':', 1)
    if not depth.isdigit() or int(depth) < min_depth or not re.fullmatch(r'\d+(?:[/|]\d+)*', gt):
        return None
    return tuple(map(int, re.split(r'[/|]', gt)))


class VcfCarrierGenotypes:
    def __init__(self, filename, bcftools='bcftools', min_depth=20, cache_directory=None):
        self.filename = str(Path(filename).resolve())
        self.bcftools = bcftools
        self.min_depth = min_depth
        self.cache_directory = Path(cache_directory) if cache_directory else None
        self._quality_lock = RLock()

    def _query(self, args):
        result = subprocess.run([self.bcftools, *args, self.filename],
                                capture_output=True, text=True, timeout=180, check=True)
        return result.stdout

    def lookup(self, variant, sample_ids):
        stat = Path(self.filename).stat()
        stamp = (stat.st_size, stat.st_mtime_ns)
        return self._lookup(variant, tuple(sorted(set(sample_ids))), stamp)

    def qualify(self, variants, sample_ids):
        """Recompute cohort AF from fully called DP20 genotypes; return ALT carriers."""
        stat = Path(self.filename).stat()
        variants, sample_ids = tuple(sorted(set(variants))), tuple(sorted(set(sample_ids)))
        stamp = (stat.st_size, stat.st_mtime_ns)
        fingerprint = hashlib.sha256(json.dumps(['vcf-quality-v1', self.filename, stamp,
            self.min_depth, 0.01, variants, sample_ids], separators=(',', ':')).encode()).hexdigest()
        filename = self.cache_directory / (fingerprint + '.json.gz') if self.cache_directory else None
        if filename:
            try:
                with gzip.open(filename, 'rt') as handle:
                    cached = json.load(handle)
                payload = cached['payload']
                checksum = hashlib.sha256(json.dumps(payload, separators=(',', ':')).encode()).hexdigest()
                if cached.get('fingerprint') == fingerprint and cached.get('sha256') == checksum:
                    return payload
            except (OSError, ValueError, KeyError, TypeError):
                pass
        with self._quality_lock:
            result = self._qualify(variants, sample_ids, stamp)
        if filename:
            self.cache_directory.mkdir(mode=0o700, parents=True, exist_ok=True)
            payload = json.dumps(result, separators=(',', ':'))
            envelope = json.dumps({'fingerprint': fingerprint, 'payload': result,
                'sha256': hashlib.sha256(payload.encode()).hexdigest()}, separators=(',', ':'))
            temporary = None
            try:
                with tempfile.NamedTemporaryFile(dir=self.cache_directory, delete=False) as handle:
                    temporary = Path(handle.name)
                    handle.write(gzip.compress(envelope.encode(), compresslevel=1))
                temporary.replace(filename)
            finally:
                if temporary and temporary.exists():
                    temporary.unlink()
        return result

    @lru_cache(maxsize=20)
    def _qualify(self, variants, sample_ids, stamp):
        aliases, contigs = self._header(stamp)
        names = self._query(['query', '-l']).splitlines()
        requested = defaultdict(list)
        for sid in sample_ids:
            if len(aliases.get(canonical_sample(sid), [])) == 1:
                requested[canonical_sample(sid)].append(sid)
        targets = defaultdict(list)
        positions = set()
        for variant in variants:
            chrom, pos, ref, alt = variant.split(':')
            chrom = re.sub(r'^chr', '', chrom, flags=re.I)
            contig = next((c for c in (chrom, 'chr'+chrom) if c in contigs), None)
            if contig is None:
                raise ValueError('Requested variant contig is not in the VCF.')
            positions.add((contig, int(pos)))
            targets[(contig, pos, ref.upper())].append((variant, alt.upper()))
        found = {}
        with tempfile.NamedTemporaryFile(mode='w', suffix='.regions', encoding='utf-8') as handle:
            intervals = []
            for chrom, pos in sorted(positions):
                if intervals and intervals[-1][0] == chrom and pos <= intervals[-1][2] + 1000:
                    intervals[-1][2] = pos
                else:
                    intervals.append([chrom, pos, pos])
            for chrom, start, end in intervals:
                handle.write(f'{chrom}\t{start}\t{end}\n')
            handle.flush()
            text = self._query(['query', '-R', handle.name,
                                '-f', '%CHROM\t%POS\t%REF\t%ALT[\t%GT:%DP]\n'])
        for line in text.splitlines():
            fields = line.split('\t')
            matches = targets.get((fields[0], fields[1], fields[2].upper()), [])
            if not matches:
                continue
            alts = fields[3].upper().split(',')
            if len(fields) - 4 != len(names):
                raise ValueError('VCF genotype columns do not match the sample header.')
            counts = Counter(fields[4:])
            passing = {}
            for value in counts:
                alleles = _alleles_at_depth(value, self.min_depth)
                if alleles is None:
                    continue
                if max(alleles) > len(alts):
                    raise ValueError('Invalid VCF allele index.')
                passing[value] = alleles
            an = sum(len(alleles) * counts[value] for value, alleles in passing.items())
            for variant, alt in matches:
                if alt == fields[3].upper():
                    indices = set(range(1, len(alts)+1))
                elif alt in alts:
                    indices = {alts.index(alt)+1}
                else:
                    continue
                carrier_values = {value: sum(allele in indices for allele in alleles)
                                  for value, alleles in passing.items() if indices.intersection(alleles)}
                ac = sum(dosage * counts[value] for value, dosage in carrier_values.items())
                af = ac / an if an else None
                ids = sorted({sid for name, value in zip(names, fields[4:]) if value in carrier_values
                              for sid in requested.get(canonical_sample(name), [])}) if af is not None and af < 0.01 else []
                result = {'variant_id': variant, 'sample_ids': ids, 'ac': ac, 'an': an, 'af': af}
                if variant in found and found[variant] != result:
                    raise ValueError('Conflicting VCF records for the requested variant.')
                found[variant] = result
        if set(found) != set(variants):
            raise ValueError(f'{len(set(variants) - set(found))} requested variants are missing from the original VCF.')
        return {'variants': [found[variant] for variant in variants],
                'min_depth': self.min_depth, 'max_af_exclusive': 0.01,
                'source': {'kind': 'original_vcf_dp20_af001', 'source_file': self.filename,
                           'file_size': stamp[0], 'file_mtime_ns': stamp[1], 'build': 'GRCh38',
                           'af_method': 'ALT allele count / called allele count across full VCF cohort after DP>=20'}}

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
