#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
storyboard_dir="$project_dir/src/static/storyboards"
frames_root="$project_dir/src/static/frames"
video_dir="$project_dir/src/static/videos"

mkdir -p "$video_dir"

crop_sheet() {
  local sheet="$1"
  local output_dir="$2"
  mkdir -p "$output_dir"

  local index=1
  local row col
  for row in 0 1; do
    for col in 0 1 2 3; do
      local filename
      filename="$(printf '%02d.png' "$index")"
      ffmpeg -hide_banner -loglevel error -y \
        -i "$sheet" \
        -vf "crop=trunc(iw/4)-6:trunc(ih/2)-6:trunc(iw/4)*${col}+3:trunc(ih/2)*${row}+3" \
        -frames:v 1 "$output_dir/$filename"
      index=$((index + 1))
    done
  done
}

build_motion() {
  local frames_dir="$1"
  local output="$2"
  local transition_duration="$3"
  local flash_expression="$4"
  shift 4
  local durations=("$@")
  local frame_numbers=(01 02 03 04 05 06 07 08 01)

  local input_args=()
  local filter_complex=""
  local i
  for i in "${!frame_numbers[@]}"; do
    input_args+=(
      -loop 1
      -t "${durations[$i]}"
      -i "$frames_dir/${frame_numbers[$i]}.png"
    )

    filter_complex+="[$i:v]split=2[bg${i}][fg${i}];"
    filter_complex+="[bg${i}]scale=720:600:force_original_aspect_ratio=increase,crop=720:600,gblur=sigma=28[bgf${i}];"
    filter_complex+="[fg${i}]scale=720:600:force_original_aspect_ratio=decrease[fgf${i}];"
    filter_complex+="[bgf${i}][fgf${i}]overlay=(W-w)/2:(H-h)/2,scale=760:634,crop=720:600:x='20+5*sin(t*0.9+${i})':y='17+3*sin(t*0.7+${i})',fps=60,format=yuv420p,settb=AVTB,setsar=1[v${i}];"
  done

  local current="v0"
  local offset
  offset="$(awk -v d="${durations[0]}" -v t="$transition_duration" 'BEGIN { printf "%.3f", d-t }')"

  for i in 1 2 3 4 5 6 7 8; do
    filter_complex+="[${current}][v${i}]xfade=transition=fade:duration=${transition_duration}:offset=${offset}[x${i}];"
    current="x${i}"
    if [[ "$i" -lt 8 ]]; then
      offset="$(awk -v o="$offset" -v d="${durations[$i]}" -v t="$transition_duration" 'BEGIN { printf "%.3f", o+d-t }')"
    fi
  done

  filter_complex+="[${current}]drawbox=x=0:y=0:w=iw:h=ih:color=0xFFE7A3@0.14:t=fill:enable='${flash_expression}'[outv]"

  ffmpeg -hide_banner -loglevel error -y \
    "${input_args[@]}" \
    -filter_complex "$filter_complex" \
    -map "[outv]" \
    -an -r 60 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
    -movflags +faststart "$output"
}

crop_sheet \
  "$storyboard_dir/baduanjin-cinematic-v2.png" \
  "$frames_root/baduanjin-cinematic-v2"

crop_sheet \
  "$storyboard_dir/resistance-cinematic-v2.png" \
  "$frames_root/resistance-cinematic-v2"

crop_sheet \
  "$storyboard_dir/singing-cinematic-v2.png" \
  "$frames_root/singing-cinematic-v2"

build_motion \
  "$frames_root/baduanjin-cinematic-v2" \
  "$video_dir/magpie-baduanjin-cinematic-v2.mp4" \
  0.16 \
  "between(t,2.30,2.43)" \
  0.85 0.58 0.58 0.58 0.58 1.00 0.75 0.90 0.60

build_motion \
  "$frames_root/resistance-cinematic-v2" \
  "$video_dir/magpie-resistance-cinematic-v2.mp4" \
  0.10 \
  "between(t,1.06,1.18)+between(t,2.44,2.60)" \
  0.75 0.55 0.45 0.45 0.50 0.45 0.65 1.00 0.60

build_motion \
  "$frames_root/singing-cinematic-v2" \
  "$video_dir/magpie-singing-cinematic-v2.mp4" \
  0.08 \
  "between(t,0.56,0.70)+between(t,2.46,2.60)" \
  0.65 0.55 0.45 0.38 0.45 0.48 0.58 1.00 0.60

printf '%s\n' \
  "$video_dir/magpie-baduanjin-cinematic-v2.mp4" \
  "$video_dir/magpie-resistance-cinematic-v2.mp4" \
  "$video_dir/magpie-singing-cinematic-v2.mp4"
