"""Read the approved CRDC metadata table and reject accidental worksheet exports."""
import csv
import logging
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

REQUIRED = {'sample_id', 'age', 'sex', 'affected'}
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


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
