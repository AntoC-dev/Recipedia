#!/bin/bash
set -e

MAESTRO_VERSION="${1:-2.0.10}"
MAX_RETRIES=3

export MAESTRO_VERSION

for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i of $MAX_RETRIES: Installing Maestro CLI v${MAESTRO_VERSION}..."

  if curl -Ls "https://get.maestro.mobile.dev" | bash; then
    echo "Installation successful!"
    exit 0
  fi

  if [ $i -eq $MAX_RETRIES ]; then
    echo "Failed to install Maestro after $MAX_RETRIES attempts"
    exit 1
  fi

  RETRY_DELAY=$((10 * i))
  echo "Installation failed, retrying in ${RETRY_DELAY}s..."
  sleep $RETRY_DELAY
done
