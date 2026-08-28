# GitHub Secrets — DEK-DRIVSIM

Ce document explique comment créer le keystore `dekdrivsim` et configurer les secrets GitHub pour builder le **PC (.exe)** et l'**APK Capacitor** en CI.

---

## 1. Créer le keystore (une seule fois, en local)

> **Alias imposé : `dekdrivsim`**

```bash
keytool -genkeypair \
  -alias dekdrivsim \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -keystore dekdrivsim.keystore \
  -storepass "VOTRE_STORE_PASSWORD" \
  -keypass "VOTRE_KEY_PASSWORD" \
  -dname "CN=DEK-DRIVSIM, OU=CyberCafe, O=DEK-DRIVSIM, L=Dakar, ST=Dakar, C=SN"
```

Vérifier :
```bash
keytool -list -keystore dekdrivsim.keystore -alias dekdrivsim
```

**Ne jamais committer `dekdrivsim.keystore` !** Il est ignoré par `.gitignore`.

---

## 2. Encoder en base64 pour GitHub

### Windows (PowerShell)
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("dekdrivsim.keystore")) | Set-Content keystore.b64 -NoNewline
# Copier le contenu de keystore.b64
```

### Linux / macOS
```bash
base64 -w 0 dekdrivsim.keystore > keystore.b64
# ou
openssl base64 -A -in dekdrivsim.keystore -out keystore.b64
```

---

## 3. Configurer les Secrets GitHub

Aller sur GitHub → Settings → Secrets and variables → Actions → **New repository secret**

| Secret | Valeur | Exemple |
|--------|--------|---------|
| `KEYSTORE_BASE64` | Contenu de `keystore.b64` (une seule ligne) | `MIIK...AA==` |
| `KEYSTORE_PASSWORD` | `storepass` du keytool | `MonStore123!` |
| `KEY_PASSWORD` | `keypass` du keytool (souvent identique) | `MonKey123!` |
| `KEY_ALIAS` | `dekdrivsim` | `dekdrivsim` |

> `KEY_ALIAS` est déjà hardcodé à `dekdrivsim` dans les workflows. Le secret n'est nécessaire que si tu veux le surcharger.

**Optionnel** : Si tu utilises Buildozer legacy, les mêmes secrets sont réutilisés.

---

## 4. Workflows

| Workflow | Fichier | Déclencheur | Sortie |
|----------|---------|-------------|--------|
| **PC Kiosk (.exe)** | `.github/workflows/build-pc.yml` | push sur `main` touchant `dek-drivsim-pc/` ou `cybercafe_manager/` | `dist-electron/*.exe` (NSIS) |
| **APK Capacitor** | `.github/workflows/build-capacitor-apk.yml` | push sur `main` touchant `dek-drivsim-pc/` | `android/app/build/outputs/apk/release/*.apk` signé `dekdrivsim` |
| **Legacy Buildozer** | `.github/workflows/build-apk.yml` | manuel uniquement (`workflow_dispatch`) | `bin/*.apk` |

Tous les builds sont aussi disponibles en **Artifacts** (14 jours) et en **Release** si tu pousses un tag `v*` :

```bash
git tag v2.0.0 && git push origin v2.0.0
```

---

## 5. Tester en local (sans CI)

### PC (.exe)
```bash
cd dek-drivsim-pc
npm ci
npm run build
npm run build:electron:win
# → dist-electron/DEK-DRIVSIM CyberCafe Setup 2.0.0.exe
```

### APK Capacitor
```bash
cd dek-drivsim-pc
npm ci
npm run build
npx cap sync android
# Créer android/keystore.properties :
# storeFile=../../dekdrivsim.keystore
# storePassword=...
# keyAlias=dekdrivsim
# keyPassword=...
cd android && ./gradlew assembleRelease
```

### Vérifier signature APK
```bash
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
```

---

## 6. Sécurité

- Le keystore est décodé uniquement en mémoire CI (`release.keystore` temporaire) puis `shred`/`rm` à la fin du job.
- Ne jamais logger les passwords (`::add-mask::` est automatique pour les secrets).
- Rotation : si compromis, régénère un nouveau keystore **mais** tu perdras la possibilité de mettre à jour l'app sur Play Store (même keystore requis).

---

## 7. Checklist avant `git push`

- [ ] `dekdrivsim.keystore` **non** présent dans `git status`
- [ ] `android/keystore.properties` **non** commité
- [ ] Secrets GitHub créés et testés (`Actions` → workflow → Run)
- [ ] Tag `v2.0.0` poussé si release souhaitée
