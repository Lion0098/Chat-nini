#!/bin/sh
set -eu
cd /workspace
if ! [ -x /workspace/.tools/php ]; then
  mkdir -p /workspace/.tools /tmp
  curl -fsSL -o /tmp/php-cli.tgz "https://dl.static-php.dev/static-php-cli/bulk/php-8.3.32-cli-linux-x86_64.tar.gz"
  tar --no-same-owner -xzf /tmp/php-cli.tgz -C /workspace/.tools
fi
if curl -sf --max-time 2 http://127.0.0.1:8080/api/health | grep -q chat-nini; then
  exit 0
fi
for p in /proc/[0-9]*; do
  cmd=$(tr "\0" " " < "$p/cmdline" 2>/dev/null || true)
  echo "$cmd" | grep -q "[v]ite dev" && kill "$(basename "$p")" 2>/dev/null || true
  echo "$cmd" | grep -q "router.php" && kill "$(basename "$p")" 2>/dev/null || true
done
sleep 1
CHATNINI_DEBUG=1 /workspace/.tools/php -S 0.0.0.0:8080 -t /workspace/hosting /workspace/hosting/router.php >>/tmp/app-startup.log 2>&1 &
