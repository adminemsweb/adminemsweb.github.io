#!/usr/bin/env bash
set -euo pipefail
exec 9>/opt/metallrack/deploy.lock
flock -w 600 9
cd /opt/metallrack/repo
git fetch origin main
git checkout --detach origin/main
export RELEASE_TAG="$(git rev-parse HEAD)"
docker build -t "metallrack:$RELEASE_TAG" .
docker stack deploy --resolve-image never -c deploy/stack.yml metallrack
for attempt in $(seq 1 60); do
  image=$(docker service inspect metallrack_web --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}')
  running=$(docker service ps metallrack_web --filter desired-state=running --format '{{.CurrentState}}' | head -1)
  if [[ "$image" == "metallrack:$RELEASE_TAG" && "$running" == Running* ]] && curl --fail --silent https://metallrack.com.br/ >/dev/null; then
    echo "Published $RELEASE_TAG at https://metallrack.com.br"
    exit 0
  fi
  sleep 5
done
echo 'Deployment did not pass HTTPS health check' >&2
exit 1
