#!/bin/sh
# Only writes inside this extension. Never installs tools or modifies the system.
umask 077
BASE=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd) || exit 1
mkdir -p "$BASE/results" || exit 1
LOCK="$BASE/results/.running"
mkdir "$LOCK" 2>/dev/null || exit 0
trap 'rmdir "$LOCK" 2>/dev/null' EXIT
RUN="$BASE/results/$(date +%Y%m%d-%H%M%S)-$$"
mkdir "$RUN" || exit 1
exec >>"$RUN/report.txt" 2>&1
printf 'Kindle Weather Check 1.1\nPublic sample location: Hangzhou (101210101)\nStart: '
date
printf 'UTC: '; date -u
printf 'Architecture: '; uname -m
printf 'Kernel: '; uname -r
printf 'No changes to Wi-Fi, certificates, firmware, services, or power settings.\n'
for version_file in /etc/prettyversion.txt /etc/version.txt; do
  if [ -r "$version_file" ]; then
    printf '\nVersion file %s:\n' "$version_file"
    head -c 1000 "$version_file"
    printf '\n'
  fi
done
CURL=$(command -v curl 2>/dev/null)
WGET=$(command -v wget 2>/dev/null)
PYTHON=''
for candidate in python3 /mnt/us/python3/bin/python3 /mnt/us/python3/bin/python3.9 /mnt/us/python3/bin/python3.11; do
  found=$(command -v "$candidate" 2>/dev/null)
  if [ -n "$found" ] && "$found" -c 'import sys; sys.exit(0 if sys.version_info >= (3,8) else 1)' >/dev/null 2>&1; then
    PYTHON="$found"
    break
  fi
done
printf '\nTools: curl=%s wget=%s python3.8+=%s\n' "$CURL" "$WGET" "$PYTHON"
if [ -n "$CURL" ]; then "$CURL" --version | head -n 2; fi
if [ -z "$CURL" ] && [ -z "$WGET" ]; then
  printf 'STOP: No curl or wget. Nothing was installed.\nDONE\n'
  exit 0
fi
probe() {
  name=$1
  url=$2
  referer=$3
  printf '\n[%s]\nURL: %s\n' "$name" "$url"
  if [ -n "$CURL" ]; then
    (
      ulimit -f 2048 2>/dev/null || exit 1
      exec "$CURL" --silent --show-error --compressed --connect-timeout 8 --max-time 18 \
        --max-filesize 1048576 --user-agent 'KindleCalendarCheck/1.1' --referer "$referer" \
        --dump-header "$RUN/$name.headers" --output "$RUN/$name.body" \
        --write-out 'HTTP_STATUS=%{http_code}\n' "$url"
    ) >"$RUN/$name.transport" 2>"$RUN/$name.error" &
  else
    (
      ulimit -f 2048 2>/dev/null || exit 1
      exec "$WGET" -T 15 -t 1 -U 'KindleCalendarCheck/1.1' --header "Referer: $referer" \
        -O "$RUN/$name.body" "$url"
    ) >"$RUN/$name.transport" 2>"$RUN/$name.error" &
  fi
  request_pid=$!
  (
    sleep 22
    if kill -0 "$request_pid" 2>/dev/null; then
      printf 'Request stopped after 22 seconds.\n' >>"$RUN/$name.error"
      kill "$request_pid" 2>/dev/null
    fi
  ) &
  watchdog_pid=$!
  wait "$request_pid"
  result=$?
  kill "$watchdog_pid" 2>/dev/null
  wait "$watchdog_pid" 2>/dev/null
  printf 'Exit code: %s\n' "$result"
  cat "$RUN/$name.transport"
  if [ -f "$RUN/$name.body" ]; then printf 'Response bytes: '; wc -c <"$RUN/$name.body"; fi
  if [ -s "$RUN/$name.error" ]; then head -c 2000 "$RUN/$name.error"; printf '\n'; fi
}
probe china-now 'https://d1.weather.com.cn/weather_index/101210101.html' 'https://m.weather.com.cn/'
probe china-daily 'https://d1.weather.com.cn/weixinfc/101210101.html' 'https://m.weather.com.cn/'
probe china-hourly 'https://d1.weather.com.cn/wap_180h/101210101.html' 'https://m.weather.com.cn/'
probe open-meteo 'https://api.open-meteo.com/v1/forecast?latitude=30.2741&longitude=120.1551&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&hourly=temperature_2m&forecast_days=15&timezone=Asia%2FShanghai' 'https://open-meteo.com/'
if [ -n "$PYTHON" ]; then
  printf '\n[DATA VALIDATION]\n'
  "$PYTHON" "$BASE/bin/summarize.py" "$RUN"
else
  printf '\nData validation skipped: Python 3.8+ not installed. Raw responses retained.\n'
fi
printf '\nEnd: '; date
printf 'DONE\n'
