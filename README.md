# KIOSK_DEKDRIVSIM — PC Kiosk + Android Capacitor

Cybercafé **DEK-DRIVSIM** : application Kiosk Windows (`.exe` Electron) + application Android Capacitor pour **Propriétaire** et **Caissier**. Le PC fait office de **serveur Flask** (`:5000`) et de **client Kiosk** ; l'APK se connecte au PC via le réseau local.

```
PC Kiosk (Electron + React + Flask :5000)  <--- Wi-Fi --->  APK Android (Capacitor)
         |  dekdrivsim.exe (NSIS x64)                 |  dekdrivsim.apk (signed dekdrivsim)
         +---> API Flask + SQLite (cybercafe.db) <----+
```

## Structure

```
.
├── cybercafe_manager/app.py          # Backend Flask + SQLite (API /api/*)
├── dek-drivsim-pc/                   # Frontend React + Electron + Capacitor
│   ├── src/                          # 3 rôles: Admin / Cashier / Player
│   ├── electron-main.cjs / preload.cjs
│   ├── capacitor.config.json
│   └── android/                      # Projet Android (généré, build via Gradle)
├── .github/workflows/
│   ├── build-pc.yml                  # Build Windows dekdrivsim.exe
│   └── build-capacitor-apk.yml       # Build Android dekdrivsim.apk (signé dekdrivsim)
├── docs/GITHUB_SECRETS.md            # Guide keystore + secrets
└── scripts/encode-keystore.*         # Helper base64 keystore
```

Seuls ces fichiers sont nécessaires aux deux builds. Tout le legacy Buildozer/Kivy a été supprimé.

## Builds GitHub (CI)

| Workflow | Runner | Artefact | Release |
|---|---|---|---|
| `build-pc.yml` | `windows-latest` | `dekdrivsim.exe` | `Releases/latest` + sur tag `v*` |
| `build-capacitor-apk.yml` | `ubuntu-latest` (Java 21) | `dekdrivsim.apk` | `Releases/latest` + sur tag `v*` |

Déclenchement : `push` sur `main` touchant `dek-drivsim-pc/**` ou `cybercafe_manager/**`, ou `workflow_dispatch`. Sur `push` tag `v*.*.*`, création d'une Release versionnée.

Artefacts conservés 14j, Releases avec `make_latest: true`.

## Secrets GitHub

Créer dans **Settings → Secrets and variables → Actions** :

| Secret | Valeur |
|---|---|
| `KEYSTORE_BASE64` | `base64 -w0 dekdrivsim-release.keystore` (une ligne) |
| `KEYSTORE_PASSWORD` | storepass |
| `KEY_PASSWORD` | keypass |
| `KEY_ALIAS` | `dekdrivsim` (optionnel, déjà hardcodé) |

Fichier keystore local : `dekdrivsim-release.keystore` (alias `dekdrivsim`) — **ne jamais committer** (ignoré par `.gitignore`).

Voir `docs/GITHUB_SECRETS.md` pour la procédure complète + commandes `keytool` et vérification `apksigner verify`.

## Génération keystore (local, une fois)

```bash
keytool -genkeypair -alias dekdrivsim -keyalg RSA -keysize 2048 -validity 10000 \
  -keystore dekdrivsim-release.keystore -storepass "****" -keypass "****" \
  -dname "CN=DEK-DRIVSIM, OU=CyberCafe, O=DEK-DRIVSIM, L=Dakar, ST=Dakar, C=SN"

# Encoder pour GitHub
powershell -File scripts/encode-keystore.ps1 -KeystorePath dekdrivsim-release.keystore
# ou
bash scripts/encode-keystore.sh dekdrivsim-release.keystore
```

## Développement local

### PC Kiosk (Electron)
```bash
cd dek-drivsim-pc
npm ci
npm run build          # Vite
npm run build:electron:win  # -> dist-electron/dekdrivsim.exe
# Dev avec hot-reload + Electron
npm run dev:electron
```

Le `electron-main.cjs` lance automatiquement Flask (`cybercafe_manager/app.py` via `extraResources`) et attend `http://127.0.0.1:5000/api/settings`.

### APK Capacitor
```bash
cd dek-drivsim-pc
npm ci
npm run build
npx cap sync android
# Configurer android/keystore.properties (voir docs/GITHUB_SECRETS.md)
cd android && ./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/dekdrivsim.apk
```

## Rôles

| Rôle | Route | Accès |
|---|---|---|
| **Admin/Propriétaire** | `/admin` | Dashboard complet, terminaux, tickets, auto-écoles, évaluations, logs, settings |
| **Caissier** | `/cashier` | Vente tickets, recharges, évaluation 14j |
| **Joueur** | `/player` | Catalogue jeux, déverrouillage ticket/compte |

Détection automatique par `IP` (`/api/setup-role`) + mémorisation `device_roles`. Codes par défaut : `admin123` / `caissier123`.

## Releases

- **latest** : mise à jour à chaque `push` sur `main` → contient `dekdrivsim.exe` + `dekdrivsim.apk`
- **v*.*.*** : `git tag v2.0.0 && git push origin v2.0.0` → Release versionnée avec notes auto

Téléchargement : onglet **Releases** du repo.
