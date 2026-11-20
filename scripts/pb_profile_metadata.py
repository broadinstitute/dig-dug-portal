import csv
import gzip
import json
import logging
import re
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

REQUIRED = {'sample_id', 'age', 'sex', 'affected'}
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def load_project_metadata(project_path):
    """Join a samples-info project snapshot, or the legacy cohort mapping.

    The snapshot retains the same clean_name and investigator fields used by
    Gene/Variant. Do not substitute the old cohort CSV for missing snapshot IDs.
    """
    path = Path(project_path)
    records = {}
    if path.name.endswith(('.jsonl', '.jsonl.gz')):
        opener = gzip.open if path.suffix == '.gz' else open
        with opener(path, 'rt', encoding='utf-8-sig') as handle:
            for line in handle:
                if not line.strip():
                    continue
                row = json.loads(line)
                vcf_id = str(row.get('SampleInVCF') or '').strip()
                canonical_id = re.sub(r'_[EG]38$', '', vcf_id, flags=re.I)
                sample_id = str(row.get('sample_id') or canonical_id).strip()
                if not sample_id or canonical_id and canonical_id != sample_id:
                    raise ValueError('Project metadata contains a missing or mismatched sample ID.')
                info = {key: str(row.get(key) or '').strip() for key in ('clean_name', 'investigator')}
                if sample_id in records and records[sample_id] != info:
                    raise ValueError('Project metadata contains conflicting labels for a sample ID.')
                records[sample_id] = info
        source = 'samples-info'
    else:
        with path.open(newline='', encoding='utf-8-sig') as handle:
            for row in csv.DictReader(handle):
                sample_id = str(row.get('de_identified_subject') or '').strip()
                name = str(row.get('clean_name') or '').strip()
                if sample_id and name and (sample_id not in records or row.get('cohort_type') == 'Primary'):
                    records[sample_id] = {'clean_name': name, 'investigator': str(row.get('investigator') or '').strip()}
        source = 'cohort-mapping'
    if not records:
        raise ValueError('Project metadata contains no sample records.')
    return records, source


def _xlsx_tables(path):
    with ZipFile(path) as archive:
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared = [''.join(node.itertext()) for node in
                      ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('s:si', NS)]
        for sheet in archive.namelist():
            if not sheet.startswith('xl/worksheets/sheet') or not sheet.endswith('.xml'):
                continue
            header = None
            records = []
            with archive.open(sheet) as handle:
                for _, row in ET.iterparse(handle, events=['end']):
                    if row.tag != '{' + NS['s'] + '}row':
                        continue
                    cells = {}
                    for cell in row.findall('s:c', NS):
                        col = ''.join(c for c in cell.get('r', '') if c.isalpha())
                        value = cell.find('s:v', NS)
                        text = value.text if value is not None else ''
                        if cell.get('t') == 's':
                            text = shared[int(text)]
                        elif cell.get('t') == 'inlineStr':
                            text = ''.join(cell.find('s:is', NS).itertext())
                        cells[col] = text or ''
                    if header is None:
                        header = {col: str(value).strip() for col, value in cells.items()}
                        if not REQUIRED.issubset(set(header.values())):
                            break
                    else:
                        records.append({name: cells.get(col, '') for col, name in header.items() if name})
                    row.clear()
            if header and REQUIRED.issubset(set(header.values())):
                yield sheet, records


def load_profile_metadata(metadata_path):
    path = Path(metadata_path)
    source = str(path)
    rows = None
    if path.suffix.lower() != '.xlsx':
        with path.open(newline='', encoding='utf-8-sig') as handle:
            reader = csv.DictReader(handle, delimiter='\t')
            if REQUIRED.issubset(set(reader.fieldnames or [])):
                rows = list(reader)
        if rows is None:
            workbook = path.with_suffix('.xlsx')
            if not workbook.is_file():
                raise ValueError('CRDC metadata requires sample_id, age, sex and affected columns.')
            logging.warning('Metadata TSV has an unexpected schema; reading the matching workbook metadata sheet: %s', workbook)
            path = workbook
    if rows is None:
        candidates = list(_xlsx_tables(path))
        if len(candidates) != 1:
            raise ValueError('CRDC workbook must contain exactly one metadata sheet with sample_id, age, sex and affected.')
        sheet, rows = candidates[0]
        source = f'{path}#{sheet}'
    records = {}
    for row in rows:
        sample_id = str(row.get('sample_id') or '').strip()
        if not sample_id:
            continue
        if sample_id in records:
            raise ValueError('CRDC metadata contains duplicate sample IDs.')
        records[sample_id] = row
    if not records:
        raise ValueError('CRDC metadata contains no sample records.')
    return records, source
