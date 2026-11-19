#!/bin/bash
#SBATCH --job-name=pb_context_demo
#SBATCH --partition=bch-compute
#SBATCH --cpus-per-task=2
#SBATCH --mem=16G
#SBATCH --time=7-00:00:00

demo_root=${1:?Pass the persistent deployment directory}
release_root=${2:-$demo_root}
input_root=$demo_root
case "$demo_root" in
  "${HOME%/}/.pb-context-demo")
    input_root=/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/pb_context_demo/20261007-5a9ab06cc
    if [[ "$release_root" != "$demo_root/releases/"* || ! "${release_root##*/}" =~ ^[a-f0-9]{64}$ ]]; then
      echo 'Invalid staged analysis release.' >&2; exit 2
    fi ;;
  /lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/pb_context_demo/*) ;;
  *) echo 'Unexpected demo directory' >&2; exit 2 ;;
esac
umask 077
cd "$demo_root" || exit $?
api_pids=()
cleanup() {
  exit_status=$?
  trap - EXIT
  trap '' TERM INT
  # The launcher uses the same lock. Remove only metadata owned by this job.
  if [[ -d runtime ]]; then
    (
      exec 9> runtime/lifecycle.lock || exit $?
      flock -x -w 30 9 || exit $?
      if [[ "$(cat runtime/job_id 2>/dev/null)" == "$SLURM_JOB_ID" ]] ||
        [[ ! -e runtime/job_id && "$(cat runtime/submitted_job_id 2>/dev/null)" == "$SLURM_JOB_ID" ]]; then
        rm -f -- runtime/job_id runtime/node runtime/bioindex_host runtime/pid runtime/ports || exit $?
      fi
      if [[ -f runtime/submitted_job_id && "$(cat runtime/submitted_job_id)" == "$SLURM_JOB_ID" ]]; then
        rm -f -- runtime/submitted_job_id runtime/submitted_release_id || exit $?
      fi
    ) || echo 'Could not clear connection metadata; the next start will recover it.' >&2
  fi
  if [[ ${#api_pids[@]} -gt 0 ]]; then
    kill -TERM "${api_pids[@]}" 2>/dev/null
    for api_pid in "${api_pids[@]}"; do wait "$api_pid" 2>/dev/null; done
  fi
  if [[ -n "${boot_ports:-}" ]]; then
    rm -f -- "$boot_ports/"{gene,sample,variant,quality} "$boot_ports/ready"
    rmdir -- "$boot_ports"
  fi
  exit "$exit_status"
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
source /programs/biogrids.shrc || exit $?
export PYTHON_X=3.12.2 R_X=4.4.2 PYTHONNOUSERSITE=1 PYTHONUNBUFFERED=1
export OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2 MKL_NUM_THREADS=2
unset PYTHONPATH
python_bin=/programs/x86_64-linux/python/3.12.2/mamba/bin/python3
"$python_bin" -c 'import numpy, scipy' || exit $?
Rscript -e 'stopifnot(requireNamespace("data.table", quietly=TRUE))' || exit $?
mkdir -p runtime logs work || exit $?
export TMPDIR="$demo_root/work"

source_root=/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung
matrix=2025_crdc_15764sample_hpo_parent_expanded_binary.tsv.gz
metadata=CRDC20251009_updated_07142026_Aditi_confirmed_metadata_16366.tsv
if [[ "$input_root" == "$demo_root" && ! -f inputs.ready ]]; then
  mkdir -p source || exit $?
  cp -p "$source_root/browser_paper/data/$matrix" "source/$matrix" || exit $?
  cp -p "$source_root/browser_paper/data/$metadata" "source/$metadata" || exit $?
  cp -p "$source_root/browser_paper/pca_grm_15761_20260816/roster.tsv" source/roster.tsv || exit $?
  cp -p "$source_root/browser_paper/pca_grm_15761_20260816/results/pca_pc1_20.tsv" source/pca_pc1_20.tsv || exit $?
  cp -p "$source_root/share/dig-dug-portal/custom_hpo_regression/input/CRDC2025_step4_sample_gene_burden_nonsyn_dosage_LOFTEE_AM.tsv" source/gene_scores.tsv || exit $?
  "$python_bin" scripts/prepare_pb_gene_context_inputs.py \
    --hpo-matrix "$demo_root/source/$matrix" --metadata "$demo_root/source/$metadata" \
    --roster "$demo_root/source/roster.tsv" --pca "$demo_root/source/pca_pc1_20.tsv" \
    --output-dir "$demo_root/inputs" || exit $?
  sha256sum source/* inputs/roster.tsv inputs/covariates.tsv > inputs.sha256 || exit $?
  touch inputs.ready || exit $?
fi
for required in "source/$matrix" source/gene_scores.tsv inputs/roster.tsv inputs/covariates.tsv; do
  [[ -r "$input_root/$required" && -s "$input_root/$required" ]] || { echo "Missing input: $input_root/$required" >&2; exit 2; }
done
genotype_vcf=${PB_GENOTYPE_VCF_SOURCE:-/lab-share/RC-Data-Science-NR-e2/Groups/gnomad/helen/VEP_pipeline/cleanVCF/finalresult/Data_with_af_dp/combined_crdc.with_af_formatDP.vcf.gz}
bcftools=${PB_BCFTOOLS:-/programs/x86_64-linux/bcftools/1.22/bin/bcftools}
if [[ "$input_root" != "$demo_root" ]] && { [[ ! -r "$genotype_vcf" || ! -x "$bcftools" ]] || [[ ! -r "$genotype_vcf.tbi" && ! -r "$genotype_vcf.csi" ]]; }; then
  echo 'The original VCF, its index, or bcftools is unavailable on the compute node.' >&2; exit 2
fi
bioindex_host=http://100.80.30.199:5000
if ! curl -sS --connect-timeout 3 --max-time 5 -o /dev/null "$bioindex_host/"; then
  bioindex_host=http://127.0.0.1:18095
fi
printf '%s\n' "$bioindex_host" > runtime/bioindex_host || exit $?
hostname > runtime/node || exit $?
printf '%s\n' "$$" > runtime/pid || exit $?
gene_port=(--port 18092)
sample_port=(--port 18094)
variant_port=(--port 18096)
quality_port=(--port 18097)
if [[ "$input_root" != "$demo_root" ]]; then
  boot_ports=$(mktemp -d "$demo_root/runtime/ports.XXXXXXXX") || exit $?
  gene_port=(--port 0 --port-file "$boot_ports/gene")
  sample_port=(--port 0 --port-file "$boot_ports/sample")
  variant_port=(--port 0 --port-file "$boot_ports/variant")
  quality_port=(--port 0 --port-file "$boot_ports/quality")
fi
if [[ -f "$release_root/scripts/pb_sample_gene_scores.py" ]]; then
  (cd "$release_root" || exit $?
  exec "$python_bin" -m scripts.pb_sample_gene_scores \
    --gene-scores "$input_root/source/gene_scores.tsv" \
    --covariates "$input_root/inputs/covariates.tsv" --roster "$input_root/inputs/roster.tsv" \
    --host 127.0.0.1 "${sample_port[@]}") > "$demo_root/logs/sample-gene-scores-$SLURM_JOB_ID.log" 2>&1 &
  api_pids+=("$!")
fi
if [[ -f "$release_root/scripts/pb_vcf_quality_api.py" ]]; then
  (cd "$release_root" || exit $?
  exec "$python_bin" -m scripts.pb_vcf_quality_api \
    --vcf "$genotype_vcf" --bcftools "$bcftools" --cache-directory "$demo_root/quality-cache" \
    --host 127.0.0.1 "${quality_port[@]}") > "$demo_root/logs/vcf-quality-$SLURM_JOB_ID.log" 2>&1 &
  api_pids+=("$!")
fi
variant_api_root=${PB_VARIANT_API_ROOT:-$release_root}
(cd "$variant_api_root" || exit $?
exec "$python_bin" -m scripts.pb_gene_context_api_server \
  --hpo-matrix "$input_root/source/$matrix" --overlap-roster "$input_root/inputs/roster.tsv" \
  --covariates "$input_root/inputs/covariates.tsv" --gene-scores "$input_root/source/gene_scores.tsv" \
  --genotype-vcf "$genotype_vcf" --bcftools "$bcftools" \
  --bioindex-host "$bioindex_host" --host 127.0.0.1 "${variant_port[@]}") > "$demo_root/logs/variant-genotype-$SLURM_JOB_ID.log" 2>&1 &
api_pids+=("$!")
(cd "$release_root" || exit $?
exec "$python_bin" -m scripts.pb_gene_context_api_server \
  --hpo-matrix "$input_root/source/$matrix" --overlap-roster "$input_root/inputs/roster.tsv" \
  --covariates "$input_root/inputs/covariates.tsv" --gene-scores "$input_root/source/gene_scores.tsv" \
  --bioindex-host "$bioindex_host" --host 127.0.0.1 "${gene_port[@]}") &
api_pids+=("$!")
published=0
boot_deadline=$((SECONDS + 120))
while :; do
  for api_pid in "${api_pids[@]}"; do
    if ! kill -0 "$api_pid" 2>/dev/null; then
      wait "$api_pid"
      api_status=$?
      echo "Analysis API process $api_pid exited ($api_status); stopping job $SLURM_JOB_ID." >&2
      if [[ "$api_status" -eq 0 ]]; then api_status=1; fi
      exit "$api_status"
    fi
  done
  if [[ "$published" == 0 ]]; then
    if [[ -z "${boot_ports:-}" || ( -s "$boot_ports/gene" && -s "$boot_ports/sample" && -s "$boot_ports/variant" && -s "$boot_ports/quality" ) ]]; then
      if [[ -n "${boot_ports:-}" ]]; then
        paste -d ' ' "$boot_ports/gene" "$boot_ports/sample" "$boot_ports/variant" "$boot_ports/quality" > "$boot_ports/ready" || exit $?
        mv -- "$boot_ports/ready" runtime/ports || exit $?
      fi
      printf '%s\n' "$SLURM_JOB_ID" > runtime/job_id || exit $?
      published=1
    elif (( SECONDS >= boot_deadline )); then
      echo 'Analysis services did not publish their ports. Check the job logs.' >&2
      exit 2
    fi
  fi
  sleep 5
done
