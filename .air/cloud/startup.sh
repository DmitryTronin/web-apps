#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
fixture=$(cat "$script_dir/airc1324-marker.txt")
head=$(git -C "$script_dir" rev-parse HEAD)
utc=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
record="AIRC1324_STARTUP repo=web-apps mode=${AIR_STARTUP_MODE:-unset} utc=$utc head=$head pwd=$(pwd) fixture=$fixture"
printf '%s\n' "$record"
printf '%s\n' "$record" >> /tmp/airc1324-startup.log
exit 0
