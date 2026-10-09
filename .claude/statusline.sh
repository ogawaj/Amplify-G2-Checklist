#!/usr/bin/env bash
# Claude Code statusline: context window + rate limits (Fine Bar + Gradient).
# stdin から JSON を受け取り、1 行のグラフィカル表示を stdout に出力する。

input=$(cat)

SESSION=$(printf '%s' "$input" | jq -r '.session_name // empty')
CTX=$(printf '%s' "$input" | jq -r '.context_window.used_percentage // 0')
MODEL=$(printf '%s' "$input" | jq -r '.model.display_name // empty')
FIVE=$(printf '%s' "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
WEEK=$(printf '%s' "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')
FIVE_RESET=$(printf '%s' "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
WEEK_RESET=$(printf '%s' "$input" | jq -r '.rate_limits.seven_day.resets_at // empty')

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

# resets_at(Unix秒) → リセットまでの残り時間を "1時間42分" / "2日18時間" 形式で返す（ダイアログ用）
remain_ja() {
  awk -v target="$1" -v now="$(date +%s)" 'BEGIN{
    s = target - now; if (s < 0) s = 0;
    d = int(s/86400); h = int((s%86400)/3600); m = int((s%3600)/60);
    if (d > 0) printf "%d日%d時間", d, h;
    else if (h > 0) printf "%d時間%d分", h, m;
    else printf "%d分", m;
  }'
}

# resets_at(Unix秒) → リセットまでの残り時間を "1h42m" / "2d18h" 形式で返す
remain() {
  awk -v target="$1" -v now="$(date +%s)" 'BEGIN{
    s = target - now; if (s < 0) s = 0;
    d = int(s/86400); h = int((s%86400)/3600); m = int((s%3600)/60);
    if (d > 0) printf "%dd%dh", d, h;
    else printf "%dh%02dm", h, m;
  }'
}

CTX_INT=$(printf '%.0f' "$CTX")
COLOR=$(gradient "$CTX")
BAR=$(fine_bar "$CTX")

out="${COLOR}${BAR}${RESET} ${BOLD}${CTX_INT}%${RESET} ${DIM}ctx${RESET}"

# 1 行目: セッション名 │ モデル名（両方無ければ行ごと省略）
header=""
[ -n "$SESSION" ] && header="${BOLD}${SESSION}${RESET}"
if [ -n "$MODEL" ]; then
  [ -n "$header" ] && header="${header} ${DIM}│${RESET} ${BOLD}${MODEL}${RESET}" || header="${BOLD}${MODEL}${RESET}"
fi

if [ -n "$FIVE" ]; then
  FIVE_INT=$(printf '%.0f' "$FIVE")
  out="${out} ${DIM}│${RESET} $(gradient "$FIVE")5h: ${FIVE_INT}%${RESET}"
  [ -n "$FIVE_RESET" ] && out="${out} ${DIM}(↻$(remain "$FIVE_RESET"))${RESET}"
fi

# ---- 5h 枠の消費ペース監視（リセット前に枯渇するペースなら macOS 通知） ----
# 直近 WINDOW 秒の used% の増分からペースを算出し、
# 「枯渇予測時刻 < リセット時刻」の場合のみ警告する（固定閾値では判定しない）。
BURN_LOG="$HOME/.claude/statusline-burn.log"
BURN_NOTIFIED="$HOME/.claude/statusline-burn.notified"
BURN_WINDOW=900   # ペース算出の観測窓（秒）
BURN_MIN_SPAN=300 # 予測に必要な最小観測時間（秒）
BURN_COOLDOWN=600 # 通知間隔の下限（秒）

if [ -n "$FIVE" ] && [ -n "$FIVE_RESET" ]; then
  now=$(date +%s)
  printf '%s %s\n' "$now" "$FIVE" >> "$BURN_LOG"
  # 観測窓外の行を破棄（リセット直後は増分が負になり予測が自然に止まる）
  awk -v now="$now" -v w="$BURN_WINDOW" '$1 >= now - w' "$BURN_LOG" \
    > "$BURN_LOG.tmp" 2>/dev/null && mv "$BURN_LOG.tmp" "$BURN_LOG"
  read -r t0 u0 < "$BURN_LOG"
  span=$((now - t0))
  if [ "$span" -ge "$BURN_MIN_SPAN" ]; then
    # 出力: "枯渇までの残り(表示用) ペース%/h" （警告不要なら空）
    WARN=$(awk -v u0="$u0" -v u1="$FIVE" -v span="$span" -v now="$now" -v reset="$FIVE_RESET" 'BEGIN{
      rate = (u1 - u0) / span;
      if (rate <= 0) exit;
      exhaust = (100 - u1) / rate;
      to_reset = reset - now;
      if (to_reset <= 0 || exhaust >= to_reset) exit;
      h = int(exhaust/3600); m = int(exhaust%3600/60);
      if (h > 0) printf "%d時間%d分 %.0f", h, m, rate*3600;
      else printf "%d分 %.0f", m, rate*3600;
    }')
    if [ -n "$WARN" ]; then
      exhaust_str=${WARN% *}
      rate_h=${WARN#* }
      RED=$'\033[1;31m'
      out="${out} ${RED}⚠ 枯渇~${exhaust_str}${RESET}"
      last=$(cat "$BURN_NOTIFIED" 2>/dev/null || echo 0)
      if [ $((now - last)) -ge "$BURN_COOLDOWN" ]; then
        printf '%s' "$now" > "$BURN_NOTIFIED"
        afplay /System/Library/Sounds/Sosumi.aiff >/dev/null 2>&1 &
        # display alert は OK を押すまで表示が残る（30 分後に自動クローズ）
        osascript -e "display alert \"⏱ あと約${exhaust_str}でトークン上限\" message \"リセット（$(remain_ja "$FIVE_RESET")後）より先に使い切るペースです。\" & return & return & \"現在の消費: ${FIVE_INT}%\" & return & \"消費ペース: ${rate_h}%/h\" as critical giving up after 1800" >/dev/null 2>&1 &
      fi
    fi
  fi
fi
if [ -n "$WEEK" ]; then
  WEEK_INT=$(printf '%.0f' "$WEEK")
  out="${out} ${DIM}│${RESET} $(gradient "$WEEK")7d: ${WEEK_INT}%${RESET}"
  [ -n "$WEEK_RESET" ] && out="${out} ${DIM}(↻$(remain "$WEEK_RESET"))${RESET}"
fi

[ -n "$header" ] && printf '%s\n' "$header"
printf '%s\n' "$out"
