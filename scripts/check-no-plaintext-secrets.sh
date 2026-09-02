#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if git ls-files | rg '(^|/)(\.env($|\.)|.*\.(pem|key|p12|pfx)$)' | rg -v '^\.env\.example$'; then
  echo 'ERRO: possível arquivo de segredo está versionado.' >&2
  exit 1
fi

if find public -type f \( -name '*.json' -o -name '*.html' -o -name '*.js' -o -name '*.css' \) -print0 | xargs -0 rg -n -i \
  "(password_hash|senha_hash|session_secret|authorization[[:space:]]*[:=]|bearer[[:space:]]+[A-Za-z0-9._~+/-]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)"; then
  echo 'ERRO: possível credencial ou hash encontrado em public/.' >&2
  exit 1
fi

echo 'Nenhum padrão de segredo em texto puro foi encontrado.'
