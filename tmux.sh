#!/usr/bin/env bash

tmux new-session -c "$(dirname "$(realpath "$0")")" -d -s rzejbot

tmux new-window -d -c "$(dirname "$(realpath "$0")")"
tmux new-window -d -c "$(dirname "$(realpath "$0")")"
tmux new-window -d -c "$(dirname "$(realpath "$0")")"
tmux new-window -d -c "$(dirname "$(realpath "$0")")/packages/web/api-test"

tmux send-keys -t rzejbot:2 " alias pc='pnpm run precommit'; clear; echo root" C-m
tmux send-keys -t rzejbot:3 " alias pnpm='pnpm --filter @rzej/web '; clear; echo web" C-m
tmux send-keys -t rzejbot:4 " alias pnpm='pnpm --filter @rzej/bot '; clear; echo bot" C-m

tmux attach -t rzejbot
