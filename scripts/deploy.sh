#!/usr/bin/env bash

set -euf -o pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ENV_FILE="${SCRIPT_DIR}/../.env"
DIST_DIR="${SCRIPT_DIR}/../dist"

if [ -f "${ENV_FILE}" ]; then
  export $(cat "${ENV_FILE}" | xargs)
fi

yarn run build
aws s3 sync "${DIST_DIR}" "s3://${S3_BUCKET}/" --delete
aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths /index.html
