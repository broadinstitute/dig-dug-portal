import tempfile
import unittest
import json
from pathlib import Path
from zipfile import ZipFile

from scripts.pb_profile_metadata import load_profile_metadata, load_project_metadata


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

    def test_samples_info_project_and_investigator_join(self):
        path = self.path.with_suffix('.jsonl')
        rows = [
            {'SampleInVCF': 'sample1_E38', 'clean_name': 'Clinical Sequencing', 'investigator': 'clinical_sequencing'},
            {'SampleInVCF': 'sample2_G38', 'sample_id': 'sample2', 'clean_name': 'Primary Immunodeficiency', 'investigator': 'janet_chou'},
            {'sample_id': 'sample3', 'clean_name': None, 'investigator': None},
        ]
        path.write_text(''.join(json.dumps(row) + '\n' for row in rows))
        records, source = load_project_metadata(path)
        self.assertEqual(source, 'samples-info')
        self.assertEqual(records['sample1'], {'clean_name': 'Clinical Sequencing', 'investigator': 'clinical_sequencing'})
        self.assertEqual(records['sample2']['investigator'], 'janet_chou')
        self.assertEqual(records['sample3'], {'clean_name': '', 'investigator': ''})
        self.assertNotIn('unmapped', records)

    def test_project_id_mismatch_and_conflicting_duplicates_fail(self):
        path = self.path.with_suffix('.jsonl')
        path.write_text(json.dumps({'sample_id': 'sample2', 'SampleInVCF': 'sample1_G38'}))
        with self.assertRaisesRegex(ValueError, 'mismatched'):
            load_project_metadata(path)
        path.write_text('\n'.join(json.dumps({'SampleInVCF': key, 'clean_name': project}) for key, project in [
            ('sample1_E38', 'Project A'), ('sample1_G38', 'Project B')]))
        with self.assertRaisesRegex(ValueError, 'conflicting'):
            load_project_metadata(path)

    def test_legacy_mapping_selects_project_and_investigator_from_same_row(self):
        path = self.path.with_suffix('.csv')
        path.write_text('de_identified_subject,clean_name,investigator,cohort_type\n'
                        'sample1,Secondary,inv_secondary,NA\n'
                        'sample1,Primary project,inv_primary,Primary\n')
        records, source = load_project_metadata(path)
        self.assertEqual(source, 'cohort-mapping')
        self.assertEqual(records['sample1'], {'clean_name': 'Primary project', 'investigator': 'inv_primary'})


if __name__ == '__main__':
    unittest.main()
