#!/usr/bin/env bash

demo_root=${PB_CONTEXT_DEMO_ROOT:-}
if [[ -z "$demo_root" ]]; then
  remote_home=$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$ssh_host" 'printf "%s\n" "$HOME"') || return $?
  demo_root="${remote_home%/}/.pb-context-demo"
fi
case "$demo_root" in
  /*/.pb-context-demo|/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/pb_context_demo/*) ;;
  *) echo 'Unexpected analysis deployment directory.' >&2; return 2 ;;
esac
if [[ "$demo_root" == *[!a-zA-Z0-9_./-]* || "$demo_root" == */../* || "$demo_root" == */./* ]]; then
  echo 'Invalid characters in analysis deployment directory.' >&2
  return 2
fi
