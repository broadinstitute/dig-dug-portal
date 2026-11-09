import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

from scripts.pb_profile_metadata import load_profile_metadata


class MetadataTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'metadata.tsv'

    def workbook(self, sheets=1):
        # A missing B2 must not shift sex or affected into the age column.
        sheet = '''<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
        <row r="1"><c r="A1" t="inlineStr"><is><t>sample_id</t></is></c><c r="B1" t="inlineStr"><is><t>age</t></is></c><c r="C1" t="inlineStr"><is><t>sex</t></is></c><c r="D1" t="inlineStr"><is><t>affected</t></is></c></row>
        <row r="2"><c r="A2" t="s"><v>0</v></c><c r="C2" t="inlineStr"><is><t>female</t></is></c><c r="D2" t="inlineStr"><is><t>Y</t></is></c></row>
        </sheetData></worksheet>'''
        with ZipFile(self.path.with_suffix('.xlsx'), 'w') as archive:
            archive.writestr('xl/sharedStrings.xml', '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>sample1</t></si></sst>')
            for n in range(sheets):
                archive.writestr(f'xl/worksheets/sheet{n + 1}.xml', sheet)

    def test_tsv_and_zero_age(self):
        self.path.write_text('sample_id\tage\tsex\taffected\nsample1\t0\tmale\tY\n')
        self.assertEqual(load_profile_metadata(self.path)[0]['sample1']['age'], '0')

    def test_wrong_schema_fails_without_workbook(self):
        self.path.write_text('CRDC2025\tCRDC2024\n1\t2\n')
        with self.assertRaisesRegex(ValueError, 'requires'):
            load_profile_metadata(self.path)

    def test_fallback_preserves_sparse_columns(self):
        self.path.write_text('wrong\tsheet\n')
        self.workbook()
        records, source = load_profile_metadata(self.path)
        self.assertEqual(records['sample1'], {'sample_id': 'sample1', 'age': '', 'sex': 'female', 'affected': 'Y'})
        self.assertIn('.xlsx#', source)

    def test_ambiguous_workbook_fails(self):
        self.workbook(2)
        with self.assertRaisesRegex(ValueError, 'exactly one'):
            load_profile_metadata(self.path.with_suffix('.xlsx'))

    def test_duplicate_ids_fail(self):
        self.path.write_text('sample_id\tage\tsex\taffected\nsample1\t2\tmale\tY\nsample1\t3\tfemale\tN\n')
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            load_profile_metadata(self.path)


if __name__ == '__main__':
    unittest.main()
