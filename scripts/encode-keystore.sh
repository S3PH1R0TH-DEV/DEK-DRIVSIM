#!/usr/bin/env bash
set -euo pipefail
KEYSTORE="${1:-dekdrivsim.keystore}"
OUT="${2:-keystore.b64}"
if [ ! -f "$KEYSTORE" ]; then echo "Fichier introuvable: $KEYSTORE" >&2; exit 1; fi
if command -v base64 >/dev/null; then
  base64 -w 0 "$KEYSTORE" > "$OUT" 2>/dev/null || base64 -b 0 "$KEYSTORE" > "$OUT" || openssl base64 -A -in "$KEYSTORE" -out "$OUT"
else
  openssl base64 -A -in "$KEYSTORE" -out "$OUT"
fi
echo "OK: $OUT ($(wc -c < "$OUT") chars)"
echo "Copie ce contenu dans GitHub Secret KEYSTORE_BASE64"
echo "Vérif alias dekdrivsim:"
keytool -list -keystore "$KEYSTORE" -alias dekdrivsim 2>&1 | head -5 || true
