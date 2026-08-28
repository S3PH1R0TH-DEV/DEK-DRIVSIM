# MEMOIRE — KIOSK_DEKDRIVSIM

**Projet :** Cybercafé DEK-DRIVSIM — Application PC Kiosk Windows (`.exe` Electron) + Application Android Capacitor (APK) pour Propriétaire et Caissier.  
**Date :** 28 août 2026  
**Repo :** `S3PH1R0TH-DEV/KIOSK_DEKDRIVSIM` (miroir `DEK-DRIVSIM`)  
**Auteur :** S3PH1R0TH-DEV + Muse Spark

---

## 1. Contexte et objectif

Transformer l'ancien projet Kivy/Buildozer Android (WebView + Flask sur `0.0.0.0:5000`) en :
- **PC Kiosk** : le PC de jeu est à la fois **serveur Flask** et **client Electron** (React). Au lancement, choix de rôle.
- **3 rôles** : **Admin Propriétaire** (dashboard complet, création comptes, liste codes du jour), **Caissier** (vente tickets, recharges, évaluation 14j), **Joueur** (catalogue jeux, déverrouillage ticket/compte).
- **APK Capacitor** : même React packagé en APK, se connecte au PC via Wi-Fi local (`http://<IP_PC>:5000`) pour actions admin/caissier à distance.
- **Contrainte** : le caissier ne doit pas deviner le mot de passe propriétaire.

## 2. Architecture finale

```
PC Kiosk (dekdrivsim.exe)  <--- Wi-Fi LAN --->  APK Android (dekdrivsim.apk)
Electron + React (Vite)  +  Flask :5000 + SQLite
        |                           |
        +------ API /api/* ----------+
```

- **Frontend** : `dek-drivsim-pc/` React 18 + Vite + TypeScript + React Router + Axios + Tailwind (CDN) + FontAwesome
- **Backend** : `cybercafe_manager/app.py` Flask + SQLite (`cybercafe.db`, busy_timeout 30s, FK ON) + CORS
- **Desktop** : `electron-main.cjs` (Node, single-instance, Flask spawn, globalShortcut mastercode) + `preload.cjs` (contextBridge)
- **Mobile** : Capacitor 8.5 + Android (Gradle 8.14, Java 21, compileSdk 36)

Seuls `cybercafe_manager/app.py` + `dek-drivsim-pc/` + `.github/workflows/` + `docs/` + `scripts/` sont conservés (legacy Buildozer/Kivy supprimé).

## 3. Rôles et accès (après sécurisation)

| Rôle | Route | Code device | Compte joueur | Notes |
|---|---|---|---|---|
| **Propriétaire** | `/admin` | **fort aléatoire 16c** ex: `pdtq7*8h6QcUM0!N` généré à l'install, stocké `cybercafe_manager/admin_password.txt` (jamais partagé) | `admin_dek` / `admin123` (distinct) | Mémorisé par IP `device_roles`, `DEK_ADMIN_PASSWORD` pour l'imposer |
| **Caissier** | `/cashier` | `caissier123` **inchangé** | `caissier_dek` / `caissier123` | Bonus `CASHIER-DEK` |
| **Joueur** | `/player` / `/client/<name>` | ticket 6c ou `username`/`password` | `DEK-<USERNAME>` | Solde → durée `hourly_rate` |

Mastercode sortie Kiosk PC : `DEK-EXIT-2026` (fallback `admin123` si besoin), surchargeable `DEK_MASTERCODE`, raccourcis globaux `Ctrl+Alt+Q` / `Ctrl+Shift+Alt+X` / `F12` (`electron-main.cjs:38`, `preload.cjs:6`). `DEK_KIOSK=1` active `kiosk:true`+`fullscreen`.

Ancien `admin123` révoqué : migration auto `app.py:242` si `admin123` détecté → remplacé par fort aléatoire + log + `admin_password.txt`.

## 4. Sécurité

- `_generate_strong_admin_password()` : 16c `a-zA-Z0-9!@#$%*` avec min 1 maj/min/chiffre/symbole, jamais devinable.
- `app.py:1126` `settings.get('admin_password')` sans fallback `admin123`; whitelist `app.py:1558` pour `UPDATE settings`.
- `app.py:20` `CORS(..., origins="*", supports_credentials=False)` (wildcard + credentials invalide corrigé), `MAX_CONTENT_LENGTH 2M`.
- `app.py:20` `secret_key` via `DEK_SECRET_KEY` env, `admin_password.txt` ignoré par `.gitignore`.
- Login UI masque code propriétaire (`••••••••`, `LoginPage.tsx:104`) affiche seulement `caissier123`.

## 5. Branding

- Logo source `cybercafe_manager/static/images/logo.png` (2.3M) → généré `Pillow` :
  - `dek-drivsim-pc/assets/icon.png` 512 + `icon.ico` (16→256)
  - Android `mipmap-*` (48→192) + `drawable-*/splash.png` fond `#04050a` logo centré
- `package.json:53` `artifactName: "dekdrivsim.${ext}"` → `dekdrivsim.exe`
- `app/build.gradle:15` rename `app-release.apk` → `dekdrivsim.apk` après `assembleRelease`

## 6. Builds & CI

### PC (.exe)
`dek-drivsim-pc/package.json:17` `build:electron:win` → `electron-builder --win --x64 --publish never` (`publish:null`, `repository` ajoutée). Workflow `.github/workflows/build-pc.yml` :
- `windows-latest`, Node 22 (Capacitor/Electron >=22.12), Python 3.11 (sans cache pip)
- `npm ci` → `vite build` → `electron-builder`
- Artefact `dekdrivsim.exe` + Release `latest` (et sur tag `v*`)

### APK (Capacitor)
`dek-drivsim-pc/capacitor.config.json` sans `server.url` hardcodé (cleartext). Workflow `build-capacitor-apk.yml` :
- `ubuntu-latest`, Node 22, Java 21 Temurin, Android SDK
- `npm ci` → `build` → `cap sync android` → décode `KEYSTORE_BASE64` → `release.keystore` (alias `dekdrivsim`) → `android/keystore.properties` → `./gradlew assembleRelease` avec `KEYSTORE_PATH`/`KEY_ALIAS=dekdrivsim` → rename `dekdrivsim.apk` → `apksigner verify` → artefact + Release `latest`
- `android/app/build.gradle:11` `signingConfigs.release` lit `KEYSTORE_PATH` ou `keystore.properties`

Ancien `build-apk.yml` (Buildozer) supprimé.

## 7. Secrets GitHub

| Secret | Valeur |
|---|---|
| `KEYSTORE_BASE64` | `base64 -w0 dekdrivsim-release.keystore` |
| `KEYSTORE_PASSWORD` | storepass |
| `KEY_PASSWORD` | keypass |
| `KEY_ALIAS` | `dekdrivsim` (optionnel) |

Keystore local `dekdrivsim-release.keystore` (alias `dekdrivsim`) : `keytool -genkeypair -alias dekdrivsim ...` puis `scripts/encode-keystore.ps1/.sh`. Voir `docs/GITHUB_SECRETS.md`.

## 8. Développement local

```bash
# PC Kiosk
cd dek-drivsim-pc && npm ci && npm run build
npm run build:electron:win  # -> dist-electron/dekdrivsim.exe
npm run dev:electron        # hot-reload + Flask auto

# APK
cd dek-drivsim-pc && npm ci && npm run build && npx cap sync android
# créer android/keystore.properties puis
cd android && ./gradlew assembleRelease  # -> dekdrivsim.apk
```

Flask seul : `python cybercafe_manager/app.py` → `http://127.0.0.1:5000` (+ `0.0.0.0` pour LAN).

## 9. Nettoyage repo

Supprimés (46 fichiers) : `buildozer.spec`, `main.py`, `p4a-recipes/`, `android_assets/`, `bin/`, `dek_client_agent.py`, `run_*.sh`, `test_*.py`, `uploads/`, `cybercafe_manager/templates|static|certs|*.db|*.template`, workflow legacy. Conservés : `app.py` + `dek-drivsim-pc/` + workflows + `docs/` + `scripts/` + `.gitignore` (ignore `*.keystore`, `admin_password.txt`, `*.db`, `dist*`).

`README.md` documente archi, builds, secrets, dev, rôles, releases (`latest` sur `main`, versionnée sur `v*`).

## 10. Points d'attention

- Changer `DEK_MASTERCODE` et `DEK_ADMIN_PASSWORD` via env si besoin, ne jamais committer `admin_password.txt`.
- En kiosk `DEK_KIOSK=1`, tester sortie `Ctrl+Alt+Q` → prompt mastercode.
- Prochaines améliorations possibles : hash bcrypt pour `admin_password`, rate-limit `/api/setup-role`, 2FA admin, rotation keystore.

---
*Mémoire générée le 28/08/2026 — à conserver à la racine `MEMOIRE.md`*
