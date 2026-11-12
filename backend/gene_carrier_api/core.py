"""Standard-library implementation; no BioIndex calls run during page requests."""
import collections
import gzip
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sqlite3
import tempfile

GENE = re.compile(r"[A-Z0-9][A-Z0-9.-]{0,31}")
VARIANT = re.compile(r"chr(?:[0-9]{1,2}|X|Y|M|MT):[1-9][0-9]*:[ACGTN*.-]+:[ACGTN*.,-]+", re.I)
AGE_BANDS = ["0", "1-2", "3-5", "6-9", "10-13", "14-17", "18+", "Unknown"]
FORMAT_VERSION = 1


def encoded(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def records(filename):
    """Stream a raw BioIndex JSONL export, optionally gzip-compressed."""
    opener = gzip.open if str(filename).endswith(".gz") else open
    with opener(filename, "rt", encoding="utf-8") as source:
        for number, line in enumerate(source, 1):
            if not line.strip():
                continue
            row = json.loads(line)
            if not isinstance(row, dict):
                raise ValueError(f"Expected an object at line {number}")
            yield row


def first(row, keys):
    return next((row[key] for key in keys if row.get(key) is not None and str(row[key]).strip()), None)


def text(value):
    return str(value).strip() if value is not None and str(value).strip() else None


def age_band(value):
    try:
        age = float(value)
    except (TypeError, ValueError):
        return "Unknown"
    if not math.isfinite(age) or not 0 <= age <= 100:
        return "Unknown"
    for maximum, band in [(1, "0"), (3, "1-2"), (6, "3-5"), (10, "6-9"), (14, "10-13"), (18, "14-17")]:
        if age < maximum:
            return band
    return "18+"


def normalize(row):
    age = "Unknown"
    for key in ["age_at_enrollment", "age_for_portal", "age", "age_band"]:
        value = text(row.get(key))
        if value and re.fullmatch(r"\d+(?:\.\d+)?", value) and 0 <= float(value) <= 100:
            age = value
            break
    affected = str(first(row, ["initial_study_affected", "affected_flag", "affected", "is_affected"]) or "").lower().strip()
    affected = "Yes" if affected in ["y", "yes", "true", "1", "affected"] else "No" if affected in ["n", "no", "false", "0", "unaffected"] else None
    hpos = row.get("phenotypes")
    genes = row.get("genes")
    hpo_ids = set()
    if isinstance(hpos, list):
        for item in hpos:
            value = item if isinstance(item, str) else first(item, ["hpo_id", "hpoId", "id"]) if isinstance(item, dict) else ""
            value = str(value or "").upper()
            if re.fullmatch(r"HP:\d{7}", value):
                hpo_ids.add(value)
    return {
        "age": age,
        "sex": text(first(row, ["sex", "gender"])),
        "investigator": text(first(row, ["investigator", "cohort", "study", "study_code"])),
        "project": text(first(row, ["clean_name", "Project", "project", "project_name"])),
        "affected": affected,
        "proband": str(row.get("family_relationship") or "").lower().strip() == "proband",
        "hpoIds": sorted(hpo_ids) if isinstance(hpos, list) else None,
        "geneListAvailable": isinstance(genes, list),
        "genes": sorted({g.upper() for g in genes if isinstance(g, str) and re.fullmatch(r"[A-Z0-9.-]{1,40}", g, re.I)}) if isinstance(genes, list) else [],
    }


def variant_id(row):
    chromosome = str(first(row, ["chromosome", "CHROM", "chrom"]) or "")
    chromosome = re.sub(r"^chr", "", chromosome, flags=re.I)
    position = first(row, ["position", "POS", "pos"])
    reference = first(row, ["reference", "REF", "ref"])
    alternate = first(row, ["alt", "ALT", "alternate"])
    value = f"chr{chromosome}:{position}:{reference}:{alternate}"
    if not VARIANT.fullmatch(value):
        raise ValueError("Invalid variant identifier in input")
    return value


def summary(connection, gene, variant_ids=None, demographics_only=False):
    """One person is counted once across the union of selected variants."""
    clause = "gene=?"
    parameters = [gene]
    if variant_ids is not None:
        # A temporary table avoids SQLite's parameter-count limit for large selections.
        connection.execute("CREATE TEMP TABLE IF NOT EXISTS selection (id TEXT PRIMARY KEY)")
        connection.execute("DELETE FROM selection")
        connection.executemany("INSERT OR IGNORE INTO selection VALUES (?)", [(v,) for v in variant_ids])
        unknown = connection.execute("SELECT COUNT(*) FROM selection s WHERE NOT EXISTS (SELECT 1 FROM variants v WHERE v.gene=? AND v.id=s.id)", [gene]).fetchone()[0]
        if unknown:
            raise ValueError("A selected variant is unavailable for this gene")
        clause += " AND variant_id IN (SELECT id FROM selection)"
    column = "demographics" if demographics_only else "info"
    rows = connection.execute(f"SELECT m.{column} FROM (SELECT DISTINCT sample_id FROM carriers WHERE {clause}) c LEFT JOIN metadata m ON m.id=c.sample_id", parameters)
    counts = {key: collections.Counter() for key in ["age", "sex", "investigator", "project", "affected", "genes", "hpos"]}
    investigators = collections.defaultdict(set)
    total = matched = phenotype_count = gene_count = 0
    for (value,) in rows:
        total += 1
        if value is None:
            continue
        matched += 1
        info = json.loads(value)
        counts["age"][age_band(info["age"])] += 1
        for key in ["sex", "investigator", "project", "affected"]:
            if info[key]:
                counts[key][info[key]] += 1
        if info["project"] and info["investigator"]:
            investigators[info["project"]].add(info["investigator"])
        if not demographics_only:
            gene_count += int(info["geneListAvailable"])
            if info["hpoIds"] is not None:
                phenotype_count += 1
                counts["hpos"].update(info["hpoIds"])
            counts["genes"].update(g for g in info["genes"] if g != gene)
    def count_rows(key, label):
        return [{label: value, "count": count} for value, count in sorted(counts[key].items(), key=lambda item: (-item[1], item[0]))]
    result = {
        "status": "ready", "completed": total, "total": total,
        "carrierTotal": total, "matchedMetadataCount": matched,
        "geneCarrierDemographics": {
            "byAge": [{"band": band, "count": counts["age"][band]} for band in AGE_BANDS if counts["age"][band]],
            "bySex": count_rows("sex", "label"), "byAffected": count_rows("affected", "label"),
            "byInvestigator": count_rows("investigator", "inv"), "byProject": count_rows("project", "project"),
            "projectInvestigators": {project: sorted(names) for project, names in investigators.items()},
        },
    }
    if not demographics_only:
        result.update({"phenotypeMetadataCount": phenotype_count, "geneListMetadataCount": gene_count,
                       "observedPhenotypes": [dict(row, denominator=phenotype_count) for row in count_rows("hpos", "hpoId")],
                       "coCarrierGenes": [dict(row, denominator=total) for row in count_rows("genes", "gene")]})
    return result


def build_database(metadata_file, variants_file, output, provenance, allow_missing=False):
    """Build a complete new snapshot, then publish it with an atomic replacement."""
    for name in ["samples-info", "gene-variants-crdc"]:
        if not isinstance(provenance.get(name), dict) or not provenance[name].get("built") or not provenance[name].get("source"):
            raise ValueError(f"Provenance must specify {name}.source and {name}.built")
    output = Path(output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=output.name + ".", suffix=".building", dir=output.parent)
    os.close(descriptor)
    connection = None
    try:
        connection = sqlite3.connect(temporary)
        connection.executescript("""
            CREATE TABLE metadata (id TEXT PRIMARY KEY, info TEXT NOT NULL, demographics TEXT NOT NULL);
            CREATE TABLE variants (gene TEXT NOT NULL, id TEXT NOT NULL, PRIMARY KEY (gene,id));
            CREATE TABLE carriers (gene TEXT NOT NULL, variant_id TEXT NOT NULL, sample_id TEXT NOT NULL, PRIMARY KEY (gene,variant_id,sample_id));
            CREATE TABLE summaries (gene TEXT PRIMARY KEY, result TEXT NOT NULL);
            CREATE TABLE manifest (value TEXT NOT NULL);
        """)
        for row in records(metadata_file):
            sample_id = text(row.get("SampleInVCF"))
            if not sample_id:
                raise ValueError("Each metadata row must contain an exact SampleInVCF key")
            info = normalize(row)
            value = encoded(info)
            demographics = encoded({key: info[key] for key in ["age", "sex", "investigator", "project", "affected", "proband"]})
            old = connection.execute("SELECT info FROM metadata WHERE id=?", [sample_id]).fetchone()
            if old and old[0] != value:
                raise ValueError("Conflicting metadata rows for the same SampleInVCF key")
            connection.execute("INSERT OR IGNORE INTO metadata VALUES (?,?,?)", [sample_id, value, demographics])
        for row in records(variants_file):
            gene = str(first(row, ["gene", "gene_symbol", "SYMBOL"]) or "").upper()
            if not GENE.fullmatch(gene) or not isinstance(row.get("samples"), list):
                raise ValueError("Each variant needs a gene symbol and a samples array")
            vid = variant_id(row)
            connection.execute("INSERT OR IGNORE INTO variants VALUES (?,?)", [gene, vid])
            ids = row["samples"]
            if any(not isinstance(sid, str) or not sid.strip() for sid in ids):
                raise ValueError("Invalid carrier sample ID")
            connection.executemany("INSERT OR IGNORE INTO carriers VALUES (?,?,?)", [(gene, vid, sid) for sid in ids])
        missing = connection.execute("SELECT COUNT(DISTINCT c.sample_id) FROM carriers c LEFT JOIN metadata m ON m.id=c.sample_id WHERE m.id IS NULL").fetchone()[0]
        if missing and not allow_missing:
            raise ValueError(f"Metadata is missing for {missing} distinct carriers; previous snapshot was kept")
        genes = [row[0] for row in connection.execute("SELECT DISTINCT gene FROM variants ORDER BY gene")]
        if not genes:
            raise ValueError("No genes in the variant export; previous snapshot was kept")
        for gene in genes:
            connection.execute("INSERT INTO summaries VALUES (?,?)", [gene, encoded(summary(connection, gene))])
        hashes = {}
        for name, filename in [("samples-info", metadata_file), ("gene-variants-crdc", variants_file)]:
            digest = hashlib.sha256()
            with open(filename, "rb") as handle:
                for block in iter(lambda: handle.read(1024 * 1024), b""):
                    digest.update(block)
            hashes[name] = digest.hexdigest()
        manifest = {"formatVersion": FORMAT_VERSION, "sources": provenance, "inputSha256": hashes, "geneCount": len(genes),
                    "metadataCount": connection.execute("SELECT COUNT(*) FROM metadata").fetchone()[0], "missingMetadataCount": missing}
        connection.execute("INSERT INTO manifest VALUES (?)", [encoded(manifest)])
        connection.commit()
        if connection.execute("PRAGMA quick_check").fetchone()[0] != "ok":
            raise ValueError("Database integrity check failed")
        connection.close()
        connection = None
        with open(temporary, "rb") as handle:
            os.fsync(handle.fileno())
        os.replace(temporary, output)
        return manifest
    finally:
        if connection is not None:
            connection.close()
        if os.path.exists(temporary):
            os.unlink(temporary)


class CarrierStore:
    def __init__(self, database):
        self.database = Path(database).resolve()

    def connect(self):
        # Reopen per request so atomic source updates also reach existing workers.
        return sqlite3.connect(self.database.as_uri() + "?mode=ro", uri=True)

    def query(self, gene, variants=None, demographics_only=False):
        connection = self.connect()
        try:
            if variants is None:
                row = connection.execute("SELECT result FROM summaries WHERE gene=?", [gene]).fetchone()
                if row is None:
                    raise KeyError("Gene is unavailable in the prepared data")
                return json.loads(row[0])
            if not connection.execute("SELECT 1 FROM summaries WHERE gene=?", [gene]).fetchone():
                raise KeyError("Gene is unavailable in the prepared data")
            return summary(connection, gene, variants, demographics_only=demographics_only)
        finally:
            connection.close()

    def locus(self, gene, filters):
        start, end, bins = (int(filters.get(key, default)) for key, default in [("start", 0), ("end", 0), ("bins", 60)])
        layout = filters.get("layout", "public")
        scope = filters.get("scope", "All")
        sex = filters.get("sex", "All")
        if not (0 < start < end and 1 <= bins <= 120) or layout not in ["pb", "public"] or scope not in ["All", "Affected", "Proband"] or sex not in ["All", "Female", "Male", "n/a"]:
            raise ValueError("Invalid locus filter")
        age = filters.get("age", "All ages")
        investigator = filters.get("investigator", "All investigators")
        project = filters.get("project", "All projects")
        if any(not isinstance(v, str) or len(v) > limit for v, limit in [(age, 50), (investigator, 160), (project, 160)]):
            raise ValueError("Invalid locus filter")
        connection = self.connect()
        try:
            prepared = connection.execute("SELECT result FROM summaries WHERE gene=?", [gene]).fetchone()
            if prepared is None:
                raise KeyError("Gene is unavailable")
            total = json.loads(prepared[0])["carrierTotal"]
            rows = connection.execute("SELECT c.variant_id,c.sample_id,m.demographics FROM carriers c LEFT JOIN metadata m ON m.id=c.sample_id WHERE c.gene=?", [gene])
            density = [set() for _ in range(bins)]
            distinct = set()
            variant_counts = {vid: 0 for (vid,) in connection.execute("SELECT id FROM variants WHERE gene=?", [gene]) if start <= int(vid.split(":")[1]) <= end}
            for vid, sid, value in rows:
                position = int(vid.split(":")[1])
                if not start <= position <= end:
                    continue
                variant_counts.setdefault(vid, 0)
                if value is None:
                    continue
                info = json.loads(value)
                if scope == "Affected" and info["affected"] != "Yes" or scope == "Proband" and not info["proband"]:
                    continue
                if age != "All ages" and age_band(info["age"]) != age:
                    continue
                if layout == "pb" and investigator != "All investigators" and info["investigator"] != investigator:
                    continue
                if layout == "public" and project != "All projects" and info["project"] != project:
                    continue
                sample_sex = str(info["sex"] or "").lower().strip()
                if sex == "Female" and sample_sex not in ["f", "female"] or sex == "Male" and sample_sex not in ["m", "male"]:
                    continue
                if sex == "n/a" and sample_sex not in ["", "unknown", "na", "n/a", "unavailable"]:
                    continue
                variant_counts[vid] += 1
                distinct.add(sid)
                span = end - start + (1 if layout == "public" else 0)
                index = min(bins - 1, (position - start) * bins // span)
                density[index].add(sid)
            return {"status": "ready", "completed": total, "total": total, "distinctCarriers": len(distinct),
                    "carrierDensity": [len(ids) for ids in density], "variantCounts": variant_counts}
        finally:
            connection.close()


class CarrierAPI:
    """Framework-neutral handler. The host supplies its existing authorization check."""
    def __init__(self, database):
        self.store = CarrierStore(database)

    def handle(self, method, path, query, body, authorize):
        if (method, path) not in [("GET", "/__gene_carrier_summary__"), ("POST", "/__gene_carrier_demographics__"), ("GET", "/__gene_locus_filter__")]:
            return 404, {"error": "Unknown carrier endpoint"}
        payload = query if method == "GET" else body
        if not isinstance(payload, dict):
            return 400, {"error": "Expected a JSON object"}
        gene = str(payload.get("gene") or "").strip().upper()
        if not GENE.fullmatch(gene):
            return 400, {"error": "Enter a valid gene"}
        if authorize(gene) is not True:
            return 403, {"error": "Carrier data access denied"}
        variants = None
        if method == "POST":
            variants = payload.get("variant_ids")
            if not isinstance(variants, list) or len(variants) > 20000 or any(not isinstance(v, str) or not VARIANT.fullmatch(v) for v in variants):
                return 400, {"error": "Enter a valid variant selection"}
            variants = sorted(set(variants))
        elif payload.get("variant"):
            if not isinstance(payload["variant"], str) or not VARIANT.fullmatch(payload["variant"]):
                return 400, {"error": "Enter a valid variant"}
            variants = [payload["variant"]]
        try:
            if path == "/__gene_locus_filter__":
                return 200, self.store.locus(gene, payload)
            return 200, self.store.query(gene, variants, demographics_only=method == "POST")
        except KeyError:
            return 404, {"error": "Gene is unavailable in the prepared data"}
        except ValueError as error:
            return 400, {"error": str(error)}
        except (sqlite3.Error, OSError):
            return 503, {"error": "Prepared carrier data is unavailable"}
