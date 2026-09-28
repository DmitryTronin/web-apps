#!/bin/sh
set -eu

printf '%s\n' 'AIAE441:WEB_APPS:START' >> /tmp/aiae441-startup.log
sleep 0.25
printf '%s\n' 'AIAE441:WEB_APPS:END' >> /tmp/aiae441-startup.log
