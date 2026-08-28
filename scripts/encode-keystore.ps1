param(
  [Parameter(Mandatory=$true)][string]$KeystorePath = "dekdrivsim.keystore",
  [string]$OutPath = "keystore.b64"
)
if (-not (Test-Path $KeystorePath)) { Write-Error "Fichier introuvable: $KeystorePath"; exit 1 }
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $KeystorePath)))
Set-Content -Path $OutPath -Value $b64 -NoNewline
Write-Host "OK: $OutPath ($($b64.Length) chars)" -ForegroundColor Green
Write-Host "Copie ce contenu dans GitHub Secret KEYSTORE_BASE64" -ForegroundColor Yellow
Write-Host "Vérif alias:" -ForegroundColor Cyan
try { keytool -list -keystore $KeystorePath -alias dekdrivsim -storepass (Read-Host "storepass" -AsSecureString | ForEach-Object { [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($_)) }) | Select-Object -First 5 } catch {}
