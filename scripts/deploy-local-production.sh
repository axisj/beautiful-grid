#!/usr/bin/env bash

set -Eeuo pipefail

deploy_sha="${1:-}"
project_dir="${PROJECT_DIR:-/Users/user/.local/share/beautiful-grid-deploy}"
edge_project_dir="${EDGE_PROJECT_DIR:-/Users/user/.local/share/axisj-edge}"
edge_caddy_container="${BEAUTIFUL_GRID_EDGE_CADDY_CONTAINER:-axisj-edge-caddy}"
compose_project="${COMPOSE_PROJECT_NAME:-beautiful-grid}"
compose_file="$project_dir/docker-compose.prod.yml"
deployed_sha_file="$project_dir/.deployed-sha"
previous_deployed_sha_file="$project_dir/.previous-deployed-sha"

if [[ ! "$deploy_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "::error::Deployment SHA is invalid."
  exit 64
fi

for required_file in "$compose_file" "$edge_project_dir/Caddyfile"; do
  if [ ! -f "$required_file" ] || [ -L "$required_file" ]; then
    echo "::error::Required deployment file is missing or unsafe: $required_file"
    exit 66
  fi
done

if ! grep -q 'bgrid\.axisj\.com' "$edge_project_dir/Caddyfile" \
  || ! grep -q 'beautiful-grid-site:80' "$edge_project_dir/Caddyfile"; then
  echo "::error::The shared Caddy configuration does not contain the DataGrid site route."
  exit 66
fi

if ! docker network inspect axstaff_default >/dev/null 2>&1; then
  echo "::error::The shared axstaff_default Docker network is unavailable."
  exit 69
fi

if [ "$(
  docker inspect "$edge_caddy_container" \
    --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}' \
    2>/dev/null || true
)" != healthy ]; then
  echo "::error::Production edge Caddy is not healthy."
  exit 69
fi

mkdir -p "$project_dir"
chmod 700 "$project_dir"

previous_sha="$(cat "$deployed_sha_file" 2>/dev/null || true)"
retired_sha="$(cat "$previous_deployed_sha_file" 2>/dev/null || true)"

run_compose() {
  local image_tag="$1"
  shift
  env \
    BEAUTIFUL_GRID_IMAGE_TAG="$image_tag" \
    docker compose \
      -p "$compose_project" \
      -f "$compose_file" \
      "$@"
}

remove_sha_image() {
  local sha="$1"
  [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || return 0
  docker image rm "beautiful-grid-site:${sha}" >/dev/null 2>&1 || true
}

remove_retired_images() {
  local current_sha="$1"
  local previous_sha="$2"
  local tag
  while IFS= read -r tag; do
    [[ "$tag" =~ ^[0-9a-f]{40}$ ]] || continue
    if [ "$tag" = "$current_sha" ] || [ "$tag" = "$previous_sha" ]; then
      continue
    fi
    docker image rm "beautiful-grid-site:${tag}" >/dev/null 2>&1 || true
  done < <(docker image ls beautiful-grid-site --format '{{.Tag}}' | sort -u)
}

require_http_200() {
  local url="$1"
  shift
  local status
  status="$(
    curl \
      --silent \
      --show-error \
      --output /dev/null \
      --write-out '%{http_code}' \
      --max-time 15 \
      "$@" \
      "$url"
  )" || return
  if [ "$status" != 200 ]; then
    echo "::error::Endpoint returned HTTP ${status}: ${url}"
    return 1
  fi
}

refresh_edge_proxy() {
  docker exec "$edge_caddy_container" \
    caddy validate \
      --config /etc/caddy/Caddyfile \
      --adapter caddyfile
  docker exec "$edge_caddy_container" \
    caddy reload \
      --force \
      --config /etc/caddy/Caddyfile \
      --adapter caddyfile
}

verify_public_https_after_cutover() {
  local datagrid_ip manualtalk_ip attempt
  datagrid_ip="$(dig +short A bgrid.axisj.com | tail -n 1)"
  manualtalk_ip="$(dig +short A manualtalk.axisj.com | tail -n 1)"
  if [ -z "$datagrid_ip" ] || [ "$datagrid_ip" != "$manualtalk_ip" ]; then
    echo "bgrid.axisj.com DNS has not moved to the production host; skipping public HTTPS verification."
    return 0
  fi

  for attempt in $(seq 1 18); do
    if require_http_200 \
      https://bgrid.axisj.com/health \
      --resolve bgrid.axisj.com:443:127.0.0.1 \
      && require_http_200 \
        https://bgrid.axisj.com/ \
        --resolve bgrid.axisj.com:443:127.0.0.1; then
      return 0
    fi
    echo "Waiting for public DataGrid HTTPS readiness (${attempt}/18)."
    sleep 5
  done
  return 1
}

verify_readiness() {
  local image_tag="$1"
  run_compose "$image_tag" exec -T site \
    wget -qO- --timeout=10 http://127.0.0.1/health \
    >/dev/null
  require_http_200 http://127.0.0.1:7195/health
  docker exec "$edge_caddy_container" \
    wget -qO- --timeout=10 http://beautiful-grid-site/health \
    >/dev/null
  refresh_edge_proxy
  verify_public_https_after_cutover
}

if [ "$deploy_sha" = "$previous_sha" ]; then
  verify_readiness "$deploy_sha"
  echo "Deployment ${deploy_sha} is already current and healthy."
  exit 0
fi

if ! docker image inspect "beautiful-grid-site:${deploy_sha}" >/dev/null 2>&1; then
  echo "::error::Deployment image is unavailable: beautiful-grid-site:${deploy_sha}"
  exit 66
fi

if [[ "$previous_sha" =~ ^[0-9a-f]{40}$ ]] \
  && ! docker image inspect "beautiful-grid-site:${previous_sha}" >/dev/null 2>&1; then
  echo "::error::N-1 deployment image is unavailable."
  exit 66
fi

rollback_on_failure() {
  local status=$?
  trap - ERR EXIT
  if [[ "$previous_sha" =~ ^[0-9a-f]{40}$ ]]; then
    echo "::error::Deployment failed; restoring ${previous_sha}."
    if run_compose "$previous_sha" up -d --wait --wait-timeout 120 site \
      && verify_readiness "$previous_sha"; then
      echo "Automatic rollback completed and passed readiness checks."
    else
      echo "::error::Automatic rollback failed."
    fi
  else
    echo "::error::Initial deployment failed; no local N-1 image exists."
    run_compose "$deploy_sha" down --remove-orphans || true
  fi
  remove_sha_image "$deploy_sha"
  exit "$status"
}
trap rollback_on_failure ERR

run_compose "$deploy_sha" up -d --wait --wait-timeout 120 site
verify_readiness "$deploy_sha"

trap - ERR

if [[ "$previous_sha" =~ ^[0-9a-f]{40}$ ]]; then
  printf '%s\n' "$previous_sha" > "${previous_deployed_sha_file}.next"
  mv "${previous_deployed_sha_file}.next" "$previous_deployed_sha_file"
fi
printf '%s\n' "$deploy_sha" > "${deployed_sha_file}.next"
mv "${deployed_sha_file}.next" "$deployed_sha_file"
chmod 600 "$deployed_sha_file"
if [ -f "$previous_deployed_sha_file" ]; then
  chmod 600 "$previous_deployed_sha_file"
fi

if [[ "$retired_sha" =~ ^[0-9a-f]{40}$ ]] \
  && [ "$retired_sha" != "$deploy_sha" ] \
  && [ "$retired_sha" != "$previous_sha" ]; then
  remove_sha_image "$retired_sha"
fi
remove_retired_images "$deploy_sha" "$previous_sha"
docker builder prune --all --force --filter 'until=24h' | tail -n 1 || true
docker image prune --force | tail -n 1 || true

run_compose "$deploy_sha" ps
