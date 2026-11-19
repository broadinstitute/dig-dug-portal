"""Stage the analysis server code in the SSH user's private runtime directory."""
import hashlib
import io
from pathlib import Path
import shlex
import subprocess
import sys
import tarfile

REPO = Path(__file__).resolve().parents[1]
SERVER_FILES = (
    'context_api_fast.py', 'gene_score_association.R', 'gene_score_context_runner.py',
    'pb_gene_context_api_server.py', 'pb_gene_context_validation.py', 'pb_sample_gene_scores.py',
    'pb_vcf_quality_api.py', 'rphers_fast.py', 'rphers_standardization.py',
    'run_gene_score_lm.R', 'run_gene_score_lmm.R', 'run_pb_context_demo.sbatch',
    'variant_association.py', 'vcf_carrier_genotypes.py',
)
INSTALL = '''
root=$1
release=$2
[[ "$root" == "${HOME%/}/.pb-context-demo" ]] || exit 2
umask 077
mkdir -p -- "$root/releases" || exit $?
[[ -O "$root" && ! -L "$root" && ! -L "$root/releases" ]] || exit 2
destination="$root/releases/$release"
if [[ -d "$destination" ]]; then cat >/dev/null; exit $?; fi
staged=$(mktemp -d "$root/releases/.staging.XXXXXXXX") || exit $?
trap 'rm -rf -- "$staged"' EXIT
tar -xf - -C "$staged" || exit $?
mv -T -- "$staged" "$destination" || [[ -d "$destination" ]]
'''


def stage(host, remote_root):
    archive = io.BytesIO()
    digest = hashlib.sha256()
    with tarfile.open(fileobj=archive, mode='w') as bundle:
        for name in SERVER_FILES:
            relative = 'scripts/' + name
            source = (REPO / relative).read_bytes()
            digest.update(relative.encode() + b'\0' + source + b'\0')
            member = tarfile.TarInfo(relative)
            member.size = len(source)
            member.mode = 0o600
            bundle.addfile(member, io.BytesIO(source))
    release = digest.hexdigest()
    command = shlex.join(['bash', '-c', INSTALL, 'pb-stage', remote_root, release])
    subprocess.run(['ssh', '-T', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', host, command],
                   input=archive.getvalue(), stdout=sys.stderr, check=True)
    return release


if __name__ == '__main__':
    try:
        print(stage(*sys.argv[1:]))
    except (OSError, subprocess.SubprocessError) as error:
        sys.exit(f'Could not stage the analysis service: {error}')
