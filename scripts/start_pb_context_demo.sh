#!/bin/bash
ssh_host=${PB_CONTEXT_SSH_HOST:-e3}
if [[ ! "$ssh_host" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.@:-]*$ ]]; then
  echo 'Invalid PB_CONTEXT_SSH_HOST.' >&2
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
ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" bash -s -- "$demo_root" <<'REMOTE'
demo_root=$1
cd "$demo_root" || exit $?
mkdir -p runtime logs || exit $?
# Serialize reconnects and cleanup so two terminals cannot submit duplicate jobs.
exec 9> runtime/lifecycle.lock || exit $?
if ! flock -x -w 30 9; then
  echo 'Another analysis start/cleanup is in progress. Run this command again shortly.' >&2
  exit 1
fi
# Look up saved IDs in the active queue. Querying an expired ID directly makes
# squeue fail, even though an expired job is an expected reason to submit again.
active_jobs=$(squeue -h -o '%i %T') || exit $?
job_id=
for file in runtime/submitted_job_id runtime/job_id; do
  if [[ ! -f "$file" ]]; then continue; fi
  job_id=$(cat "$file") || exit $?
  if [[ ! "$job_id" =~ ^[0-9]+$ ]]; then continue; fi
  state=
  while read -r active_id active_state; do
    if [[ "$active_id" == "$job_id" ]]; then state=$active_state; break; fi
  done <<< "$active_jobs"
  case "$state" in
    RUNNING|PENDING|CONFIGURING|COMPLETING|SUSPENDED|RESIZING)
      printf '%s\n' "$job_id"; exit 0 ;;
  esac
done
# A killed/expired batch shell may not have run its exit trap. Clear only its
# connection metadata here; inputs, results and logs remain available.
rm -f -- runtime/submitted_job_id runtime/job_id runtime/node runtime/bioindex_host runtime/pid || exit $?
echo 'No active analysis job; starting a new job with a 7-day limit.' >&2
job_id=$(sbatch --parsable --time=7-00:00:00 --chdir="$demo_root" \
  --output="$demo_root/logs/slurm-%j.out" --error="$demo_root/logs/slurm-%j.err" \
  "$demo_root/scripts/run_pb_context_demo.sbatch" "$demo_root") || exit $?
job_id=${job_id%%;*}
if [[ ! "$job_id" =~ ^[0-9]+$ ]]; then
  echo "Unexpected submitted job identifier: $job_id" >&2; exit 2
fi
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
  active_jobs=$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" "squeue -h -o '%i %T'") || exit $?
  state=
  while read -r active_id active_state; do
    if [[ "$active_id" == "$job_id" ]]; then state=$active_state; break; fi
  done <<< "$active_jobs"
  case "$state" in
    RUNNING)
      ready_job=$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" "cat '$demo_root/runtime/job_id' 2>/dev/null")
      if [[ "$ready_job" == "$job_id" ]]; then
        export PB_CONTEXT_DEMO_ROOT="$demo_root"
        export PB_CONTEXT_SSH_HOST="$ssh_host"
        exec bash "$script_dir/connect_pb_context_demo.sh"
      fi
      ;;
    PENDING|CONFIGURING|COMPLETING|SUSPENDED|RESIZING) ;;
    *) echo "Job $job_id is not active. Check $demo_root/logs/slurm-$job_id.err" >&2; exit 1 ;;
  esac
  echo "Job $job_id: ${state:-finished}; waiting..."
  sleep 5
done
echo 'The job is still waiting; run this command again later to reconnect.' >&2
exit 1
