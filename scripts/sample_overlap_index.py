"""Private overlap counts from the existing pinned, gene-keyed GT index.

Counts describe recorded evidence in the processed release, not genetic
similarity, clinical significance or normal genotypes outside that release.
"""
import gzip
import hashlib
import json
import re
from collections import OrderedDict
from pathlib import Path
from threading import RLock

from scripts.build_pb_genotype_index import SOURCE_SHA256, DATA_VERSION


def canonical_sample(value):
    return re.sub(r'_[EG]38$', '', str(value), flags=re.I)


def canonical_variant(value):
    return re.sub(r'^chr', '', str(value), flags=re.I).upper()


class SampleOverlapIndex:
    def __init__(self, directory, *, expected_sha256=SOURCE_SHA256):
        self.directory = Path(directory)
        self.manifest = json.loads((self.directory / 'manifest.json').read_text())
        m = self.manifest
        if (m.get('format') != 1 or m.get('source_sha256') != expected_sha256
                or not re.fullmatch(r'genotypes-[a-f0-9]{64}\.bin', m.get('packed_file', ''))):
            raise ValueError('Unexpected processed genotype index.')
        self.filename = self.directory / m['packed_file']
        digest = hashlib.sha256()
        with self.filename.open('rb') as handle:
            for block in iter(lambda: handle.read(1024 * 1024), b''):
                digest.update(block)
        if digest.hexdigest() != m['packed_sha256']:
            raise ValueError('Processed genotype index checksum mismatch.')
        self.genes = list(m['genes'])
        self.gene_ids = {gene: index for index, gene in enumerate(self.genes)}
        self.sample_genes = {}
        self._lock = RLock()
        self._counts = OrderedDict()
        row_count = 0
        with self.filename.open('rb') as handle:
            for index, gene in enumerate(self.genes):
                calls = self._read_gene(gene, handle)
                row_count += len(calls)
                bit = 1 << index
                for sample in {canonical_sample(row[0]) for row in calls}:
                    self.sample_genes[sample] = self.sample_genes.get(sample, 0) | bit
        if row_count != m['rows']:
            raise ValueError('Incomplete processed genotype index.')

    def _read_gene(self, gene, handle):
        offset, length, count = self.manifest['genes'][gene]
        handle.seek(offset)
        blob = handle.read(length)
        if len(blob) != length:
            raise ValueError('Incomplete genotype member.')
        rows = json.loads(gzip.decompress(blob))
        if len(rows) != count:
            raise ValueError('Genotype member row count mismatch.')
        return rows

    def _genes_for_mask(self, mask):
        return [gene for index, gene in enumerate(self.genes) if mask & (1 << index)]

    def counts(self, reference):
        reference = canonical_sample(reference)
        with self._lock:
            if reference in self._counts:
                self._counts.move_to_end(reference)
                return self._counts[reference]
            mask = self.sample_genes.get(reference)
            if mask is None:
                return None
            genes = self._genes_for_mask(mask)
            variants = set()
            with self.filename.open('rb') as handle:
                for gene in genes:
                    variants.update(canonical_variant(variant) for sample, variant, gt in self._read_gene(gene, handle)
                                    if canonical_sample(sample) == reference)
            bits = {variant: 1 << index for index, variant in enumerate(sorted(variants))}
            shared = {}
            with self.filename.open('rb') as handle:
                for gene in genes:
                    for sample, variant, gt in self._read_gene(gene, handle):
                        bit = bits.get(canonical_variant(variant))
                        if bit is not None:
                            sample = canonical_sample(sample)
                            shared[sample] = shared.get(sample, 0) | bit
            values = {sample: {'sharedGenes': (sample_mask & mask).bit_count(),
                               'sharedVariants': shared.get(sample, 0).bit_count()}
                      for sample, sample_mask in self.sample_genes.items()}
            result = {'by_sample': values, 'reference_gene_count': len(genes),
                      'reference_variant_count': len(variants), 'source': self.source}
            self._counts[reference] = result
            while len(self._counts) > 8:
                self._counts.popitem(last=False)
            return result

    @property
    def source(self):
        return {'data_version': self.manifest.get('data_version', DATA_VERSION),
                'source_sha256': self.manifest['source_sha256'],
                'scope': self.manifest.get('scope'), 'method': 'distinct recorded gene/variant intersection',
                'genetic_similarity_score': False}

    @staticmethod
    def _variant_rows(rows, sample):
        by_variant = {}
        for sid, variant, gt in rows:
            if canonical_sample(sid) != sample:
                continue
            key = canonical_variant(variant)
            if key not in by_variant:
                by_variant[key] = {'id': variant, 'gt': gt,
                                   'gtStatus': 'missing' if gt is None or '.' in gt else 'recorded'}
            elif by_variant[key]['gt'] != gt:
                by_variant[key].update(gt=None, gtStatus='conflict')
        return sorted(by_variant.values(), key=lambda row: row['id'])

    def details(self, reference, candidate, *, page=1, page_size=5, gene=None):
        reference, candidate = canonical_sample(reference), canonical_sample(candidate)
        if reference not in self.sample_genes or candidate not in self.sample_genes:
            return {'status': 'unavailable', 'total': None, 'rows': [], 'source': self.source}
        genes = sorted(self._genes_for_mask(self.sample_genes[reference] & self.sample_genes[candidate]))
        if gene is not None and gene not in genes:
            raise ValueError('The gene is not shared by these samples.')
        page_count = max(1, (len(genes) + page_size - 1) // page_size)
        page = max(1, min(page_count, page))
        selected = [gene] if gene else genes[(page - 1) * page_size:page * page_size]
        result = []
        with self.filename.open('rb') as handle:
            for symbol in selected:
                rows = self._read_gene(symbol, handle)
                a, b = self._variant_rows(rows, reference), self._variant_rows(rows, candidate)
                same = {canonical_variant(row['id']) for row in a} & {canonical_variant(row['id']) for row in b}
                item = {'gene': symbol, 'referenceVariantCount': len(a), 'candidateVariantCount': len(b),
                        'sharedVariantCount': len(same)}
                if gene:
                    item.update(referenceVariants=a, candidateVariants=b,
                                sharedVariantIds=sorted(same))
                result.append(item)
        return {'status': 'ready', 'total': len(genes), 'page': page, 'page_count': page_count,
                'page_size': page_size, 'rows': result, 'source': self.source}
