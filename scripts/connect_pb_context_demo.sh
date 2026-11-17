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
  echo 'Invalid characters in demo directory' >&2
  exit 2
fi
compute_user=${PB_CONTEXT_COMPUTE_USER:-}
if [[ -z "$compute_user" ]]; then
  compute_user=$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" 'id -un') || exit $?
fi
if [[ ! "$compute_user" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_-]*$ ]]; then
  echo 'Invalid compute SSH user; check PB_CONTEXT_COMPUTE_USER or your SSH login.' >&2
  exit 2
fi
node=$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" "cat '$demo_root/runtime/node'") || exit $?
job_id=$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" "cat '$demo_root/runtime/job_id'") || exit $?
if [[ ! "$node" =~ ^[a-zA-Z0-9.-]+$ || ! "$job_id" =~ ^[0-9]+$ ]]; then
  echo 'The compute job has not published a valid node/job yet.' >&2
  exit 2
fi
state=$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" "squeue -h -j '$job_id' -o '%T'") || exit $?
if [[ "$state" != RUNNING ]]; then
  echo "Compute job $job_id is not running ($state). Submit the batch script again first." >&2
  exit 2
fi
bioindex_host=$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" "cat '$demo_root/runtime/bioindex_host'") || exit $?
forward_args=()
for port_pair in 8092:18092 8094:18094 8095:18096; do
  local_port=${port_pair%%:*}
  remote_port=${port_pair##*:}
  forwarding="127.0.0.1:$local_port:127.0.0.1:$remote_port"
  listeners=$(lsof -nP -iTCP:"$local_port" -sTCP:LISTEN -t)
  listener_status=$?
  if [[ $listener_status -gt 1 ]]; then
    echo "Cannot inspect localhost:$local_port listeners." >&2
    exit 1
  fi
  if [[ -z "$listeners" ]]; then
    forward_args+=(-L "$forwarding")
    continue
  fi
  for pid in $listeners; do
    command=$(ps -p "$pid" -o comm=) || exit $?
    arguments=$(ps -p "$pid" -o args=) || exit $?
    if [[ "${command##*/}" != ssh || " $arguments " != *" -L $forwarding "* || " $arguments " != *" $compute_user@$node "* ]]; then
      echo "localhost:$local_port is occupied by PID $pid, not the requested SSH tunnel to $node:$remote_port." >&2
      echo 'Stop that tunnel in its original terminal, then run this script again.' >&2
      exit 2
    fi
  done
  if ! curl --noproxy '*' -fsS --connect-timeout 3 --max-time 10 "http://127.0.0.1:$local_port/health" > /dev/null; then
    echo "The existing localhost:$local_port tunnel is not healthy. Check the compute job/API and reconnect that tunnel." >&2
    exit 1
  fi
  echo "Reusing healthy localhost:$local_port tunnel to $node:$remote_port."
done
if [[ ${#forward_args[@]} -eq 0 ]]; then
  echo "All API tunnels are already available (job $job_id). Keep their original terminals open."
  exit 0
fi
echo "Opening missing API tunnels to $node (job $job_id). Keep this terminal open."
reverse_args=()
if [[ "$bioindex_host" == http://127.0.0.1:18095 ]]; then
  reverse_args=(-R 127.0.0.1:18095:100.80.30.199:5000)
fi
exec ssh -N -J "$ssh_host" -o BatchMode=yes -o ConnectTimeout=10 -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  "${forward_args[@]}" \
  "${reverse_args[@]}" "$compute_user@$node"
