#!/usr/bin/env bash
# Claude Code statusline: context window + rate limits (Fine Bar + Gradient).
# stdin から JSON を受け取り、1 行のグラフィカル表示を stdout に出力する。

input=$(cat)

CTX=$(printf '%s' "$input" | jq -r '.context_window.used_percentage // 0')
FIVE=$(printf '%s' "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
WEEK=$(printf '%s' "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')

RESET=$'\033[0m'
BOLD=$'\033[1m'
DIM=$'\033[2m'

# 0-100 を 緑→黄→赤 の 24bit truecolor エスケープに変換
gradient() {
  awk -v p="$1" 'BEGIN{
    if (p < 50) { r = int(p*5.1); printf "\033[38;2;%d;200;80m", r }
    else { g = int(200 - (p-50)*4); if (g<0) g=0; printf "\033[38;2;255;%d;60m", g }
  }'
}

# 1% 精度 Fine Bar（端の 1 セルを 1/8 刻みで描画）
fine_bar() {
  awk -v p="$1" 'BEGIN{
    if (p<0) p=0; if (p>100) p=100;
    blocks[0]=" "; blocks[1]="▏"; blocks[2]="▎"; blocks[3]="▍";
    blocks[4]="▌"; blocks[5]="▋"; blocks[6]="▊"; blocks[7]="▉";
    filled = p*10/100; full = int(filled); frac = int((filled-full)*8);
    bar = "";
    for (i=0; i<full; i++) bar = bar "█";
    if (full < 10) { bar = bar blocks[frac]; for (i=0; i<10-full-1; i++) bar = bar "░"; }
    print bar
  }'
}

CTX_INT=$(printf '%.0f' "$CTX")
COLOR=$(gradient "$CTX")
BAR=$(fine_bar "$CTX")

out="${COLOR}${BAR}${RESET} ${BOLD}${CTX_INT}%${RESET} ${DIM}ctx${RESET}"

if [ -n "$FIVE" ]; then
  FIVE_INT=$(printf '%.0f' "$FIVE")
  out="${out} ${DIM}│${RESET} $(gradient "$FIVE")5h: ${FIVE_INT}%${RESET}"
fi
if [ -n "$WEEK" ]; then
  WEEK_INT=$(printf '%.0f' "$WEEK")
  out="${out} ${DIM}│${RESET} $(gradient "$WEEK")7d: ${WEEK_INT}%${RESET}"
fi

printf '%s\n' "$out"
