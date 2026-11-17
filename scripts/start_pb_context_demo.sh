#!/bin/bash
# Reuse the running compute job, or submit a new one, then open its SSH tunnel.
ssh_host=${PB_CONTEXT_SSH_HOST:-e3}
allow_submit=${PB_CONTEXT_ALLOW_SUBMIT:-1}
if [[ ! "$ssh_host" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.@:-]*$ || ! "$allow_submit" =~ ^[01]$ ]]; then
  echo 'Invalid PB_CONTEXT_SSH_HOST or PB_CONTEXT_ALLOW_SUBMIT (use 0 or 1).' >&2
  exit 2
fi
demo_root=${PB_CONTEXT_DEMO_ROOT:-/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/pb_context_demo/20261007-5a9ab06cc}
case "$demo_root" in
  /lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/pb_context_demo/*) ;;
  *) echo 'Unexpected demo directory' >&2; exit 2 ;;
esac
if [[ "$demo_root" == *[!a-zA-Z0-9_./-]* ]]; then
  echo 'Invalid characters in demo directory' >&2; exit 2
fi
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd) || exit $?
submit_or_reuse_job() {
ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" bash -s -- "$demo_root" "$allow_submit" <<'REMOTE'
demo_root=$1
allow_submit=$2
cd "$demo_root" || exit $?
job_id=
for file in runtime/submitted_job_id runtime/job_id; do
  if [[ -f "$file" ]]; then job_id=$(cat "$file"); break; fi
done
if [[ "$job_id" =~ ^[0-9]+$ ]]; then
  state=$(squeue -h -j "$job_id" -o '%T') || exit $?
  case "$state" in
    RUNNING|PENDING|CONFIGURING) printf '%s\n' "$job_id"; exit 0 ;;
  esac
fi
if [[ "$allow_submit" == 0 ]]; then
  echo 'The shared analysis job is not running. Ask the maintainer to start it, then reconnect.' >&2
  exit 2
fi
job_id=$(sbatch --parsable --chdir="$demo_root" \
  --output="$demo_root/logs/slurm-%j.out" --error="$demo_root/logs/slurm-%j.err" \
  "$demo_root/scripts/run_pb_context_demo.sbatch" "$demo_root") || exit $?
job_id=${job_id%%;*}
printf '%s\n' "$job_id" > runtime/submitted_job_id || exit $?
printf '%s\n' "$job_id"
REMOTE
}
job_id=$(submit_or_reuse_job) || exit $?
if [[ ! "$job_id" =~ ^[0-9]+$ ]]; then
  echo "Unexpected job identifier: $job_id" >&2; exit 2
fi
echo "Compute job $job_id; waiting for its API node. Inputs persist after the job ends."
for ((attempt=0; attempt<120; attempt++)); do
  state=$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" "squeue -h -j '$job_id' -o '%T'") || exit $?
  case "$state" in
    RUNNING)
      ready_job=$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" "cat '$demo_root/runtime/job_id' 2>/dev/null")
      if [[ "$ready_job" == "$job_id" ]]; then
        export PB_CONTEXT_DEMO_ROOT="$demo_root"
        export PB_CONTEXT_SSH_HOST="$ssh_host"
        exec bash "$script_dir/connect_pb_context_demo.sh"
      fi
      ;;
    PENDING|CONFIGURING) ;;
    *) echo "Job $job_id is not active. Check $demo_root/logs/slurm-$job_id.err" >&2; exit 1 ;;
  esac
  echo "Job $job_id: ${state:-finished}; waiting..."
  sleep 5
done
echo 'The job is still waiting; run this command again later to reconnect.' >&2
exit 1
