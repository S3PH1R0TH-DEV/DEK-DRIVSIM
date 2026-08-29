# MEMOIRE — KIOSK_DEKDRIVSIM (PC Kiosk + APK Télécommande) — Reprise discussion

**Date figée :** 28 août 2026 — état `e9adf08` + correctifs Jellow → PC+APK + sécurité + branding + CI
**Origine :** `C:\Users\AdministrateurX\Downloads\Jellow` (monolithe Flask `cybercafe_manager/app.py` 1561 lignes, 13 tables, Buildozer/Kivy) cloner en **PC = serveur+client** + **APK Capacitor = télécommande**
**Repos :** `S3PH1R0TH-DEV/KIOSK_DEKDRIVSIM` (prod) + `DEK-DRIVSIM` (miroir), `main` = `e9adf08` (kiosk fullscreen)

---

## 1. Architecture cible validée

```
PC Kiosk (dekdrivsim.exe)  <--- Wi-Fi LAN 192.168.x.x:5000 --->  APK (dekdrivsim.apk)
Electron (HashRouter) + React Vite + Flask 0.0.0.0:5000 + SQLite  <--->  Capacitor WebView
        | 127.0.0.1:5000 (client local)          |  http://<IP_PC>:5000 (configurable)
        +--- DB %APPDATA%\DEK-DRIVSIM\cybercafe.db (writable, migré depuis Program Files)
```

- **Jellow** : Téléphone = serveur `0.0.0.0:5000` + WebView `127.0.0.1`, PCs = clients navigateur `http://<IP_TEL>:5000/client/PC-01`. Buildozer fragile.
- **Nouveau** : **PC = serveur+client** (`electron-main.cjs` spawn `python cybercafe_manager/app.py` via `process.resourcesPath`, `waitForFlask` `GET /api/settings`, `vite proxy /api→5000` en dev). **APK = télécommande pure** (plus de Flask embarqué, plus de `main.py`/`buildozer.spec`).

## 2. Ce qui a été corrigé pour que ça fonctionne **maintenant**

### P0 — Bloquants Jellow → PC+APK (faits dans cette session)

| Fichier:ligne | Fix |
|---|---|
| `dek-drivsim-pc/index.html:7` | Supprimé `<base href="/%">` (cassait `file://` Electron) |
| `dek-drivsim-pc/src/main.tsx:3` | `BrowserRouter` → `HashRouter` (nécessaire `file://`/`capacitor://`) |
| `dek-drivsim-pc/src/api.ts:5` | `getApiBaseUrl()` : respecte `VITE_API_BASE`, `localStorage['DEK_API_BASE']` pour APK, `window.electronAPI.getApiBaseUrl()`, fallback `127.0.0.1:5000` |
| `dek-drivsim-pc/src/pages/LoginPage.tsx:14,85` | Ajout config IP APK : champ `192.168.1.100` + bouton `OK` → `localStorage.setItem('DEK_API_BASE', 'http://<ip>:5000')` + `setApiBaseUrl()` (visible uniquement `isCapacitor`) |
| `dek-drivsim-pc/src/main.tsx` + `public/logo.png` | `copy assets/icon.png → public/logo.png` (404 fix `Admin/Cashier/Player` headers) |
| `dek-drivsim-pc/android/app/src/main/AndroidManifest.xml:10` | Ajout `android:usesCleartextTraffic="true"` (Android 9+ `targetSdk 36` bloquait `http://192.168.x:5000`) |
| `cybercafe_manager/app.py:40` | `_get_db_path()` : `Program Files` read-only → `%APPDATA%\DEK-DRIVSIM\cybercafe.db` + migration `shutil.copy2` (fix `attempt to write a readonly database` sur `C:\Program Files\...`) |
| `cybercafe_manager/app.py:76` | `ADMIN_PWD_PATH` suit `DB_PATH` (même dossier inscriptible) |
| `dek-drivsim-pc/electron-main.cjs:9` | `KIOSK_MODE = app.isPackaged` par défaut (prod plein écran, dev fenêtré) + `kiosk:true`+`fullscreen:true` |
| `dek-drivsim-pc/electron-main.cjs:30,42` | `getFlaskScriptPath` cherche `process.resourcesPath/cybercafe_manager/app.py` + logs + dialog si introuvable (fix `can't open file ...\cybercafe_manager\app.py`) |
| `dek-drivsim-pc/electron-main.cjs:102` | `delete PYTHONHOME/PYTHONPATH` (fix `Could not find platform independent libraries`) |
| `dek-drivsim-pc/electron-main.cjs:7,38` | `MASTERCODE=DEK-EXIT-2026` + `globalShortcut` `Ctrl+Alt+Q`/`Ctrl+Shift+Alt+X`/`F12` + IPC `verify-mastercode` |

### Sécurité (fait avant)

- `app.py:20` `_generate_strong_admin_password()` 16c `secrets` + `app.py:218` génération au 1er install + `app.py:242` migration `admin123`→fort + `admin_password.txt` hors git (`.gitignore:11`), `caissier123` inchangé volontairement.
- `app.py:1126` plus de fallback `admin123`, `app.py:30` `secret_key` via `DEK_SECRET_KEY`.

### Branding

- `dek-drivsim-pc/assets/icon.png` 512 + `icon.ico` multi-size + `android/mipmap-*` (48→192) + `drawable-*/splash.png` `#04050a` générés depuis `Jellow/cybercafe_manager/static/images/logo.png` via `Pillow`.
- `package.json:53` `artifactName: "dekdrivsim.${ext}"` → `dekdrivsim.exe`, `android/app/build.gradle:15` rename `app-release.apk`→`dekdrivsim.apk`, `capacitor.config.json` splash `#04050a`.

### CI

- `build-pc.yml` / `build-capacitor-apk.yml` : Node 22, Java 21, `setup-python` sans cache, `setup-java@v5`, `repository` + `publish:null` + `--publish never`, `usesCleartextTraffic`, `artifactName`, rename APK, `permissions: contents:write`, `Releases/latest` sur `push main` + `tag v*`.
- `cybercafe_manager/app.py:1691` `host 0.0.0.0`, `CORS`, `MAX_CONTENT_LENGTH 2M`.
- Fixes précédents : `762`, `324`, `181` lignes de couverture (DB, kiosk, CI).

## 3. Rôles — état actuel

- **Propriétaire** (`/admin`) : fort aléatoire (ex `pdtq7*8h6QcUM0!N` dans `%APPDATA%\DEK-DRIVSIM\admin_password.txt`), `device_roles` IP, `MASTERCODE` sortie Kiosk.
- **Caissier** (`/cashier`) : `caissier123`, évaluation 14j, `CASHIER-DEK`.
- **Joueur** (`/player`, `/client/<name>`) : ticket 6c `secrets` (à passer de `random`), `player`/`driving_school`/`postpaid`.
- **Manque cloning exigence 2** : rotation quotidienne `cashier_password` non implémentée (actuellement statique). À faire : `daily_codes` table + `POST /api/admin/rotate`.

## 4. Flux à tester (après ce commit)

1. PC : installer `Releases/latest` `dekdrivsim.exe` sur `C:` → lance → plein écran → `Code d'activation` → saisir fort admin → `/admin` → générer tickets → noter IP LAN affichée (à ajouter : QR dans Admin).
2. Téléphone : installer `dekdrivsim.apk` → ouvrir → saisir IP PC dans champ ambre → `OK` → saisir `caissier123` → `/cashier` → télécommande `start/pause/stop` + `generateTickets`.
3. Vérifier `GET http://<IP_PC>:5000/api/dashboard/stats` depuis téléphone → 200.

## 5. Reste à faire (priorisé)

**P0 (bloquant prod si non fait) :**
- `device_roles` IP spoofable (`data.get('ip')` `app.py:1171`) → passer à cookie/token JWT + `request.remote_addr` seul.
- API ouvertes sans `require_role('admin')` (`app.py:1493` etc.) → décorateur auth.
- `players.admin_dek` toujours `admin123` (`app.py:265`) → migrer vers hash du `admin_password`.
- `BrowserRouter` déjà fixé, mais `src/App.tsx:27` guard `/player` non strict + double `setupRole` (`App.tsx:37` + `LoginPage:17`) à dédupliquer.

**P1 :**
- Rotation quotidienne caissier, `tickets` `secrets` au lieu de `random`, `tick` pause gelé, `CORS` restrictif `192.168.*`, `secret_key` aléatoire persisté, `Menu.setApplicationMenu(null)`, `webContentsDebuggingEnabled:false`.

**P2 :**
- QR code IP LAN dans Admin, `concurrency` CI, `LICENSE.txt`, `extraResources` filtrer `*.db`.

## 6. Commandes reprise

```bash
# Dev PC
cd dek-drivsim-pc && npm ci && npm run build && npx cap sync android
npm run dev:electron # ou npm run build:electron:win -> dist-electron/dekdrivsim.exe

# APK
cd dek-drivsim-pc/android && ./gradlew assembleRelease # -> dekdrivsim.apk
# PC Flask seul
python cybercafe_manager/app.py # DB dans %APPDATA%\DEK-DRIVSIM\ si Program Files

# Secrets
# KEYSTORE_BASE64, KEYSTORE_PASSWORD, KEY_PASSWORD, KEY_ALIAS=dekdrivsim dans GitHub Secrets
# DEK_ADMIN_PASSWORD / DEK_MASTERCODE / DEK_KIOSK env
```

## 7. Fichiers clés à lire en reprise

- `cybercafe_manager/app.py:40` `_get_db_path`, `app.py:20` password, `app.py:1166` `api_setup_role`, `app.py:895` `tick_all_sessions`
- `dek-drivsim-pc/electron-main.cjs:30` Flask spawn, `dek-drivsim-pc/src/api.ts:5` base URL, `src/main.tsx:3` HashRouter, `src/pages/LoginPage.tsx:14` IP config
- `Jellow/cybercafe_manager/app.py:288` terminals JOIN, `Jellow/dek_client_agent.py:207` hook kiosk (à fusionner)
- `.github/workflows/build-*.yml`, `capacitor.config.json`, `android/app/build.gradle:11` signing

---
*Mémoire mise à jour 28/08/2026 13:xx — prête pour autre discussion. Prochaine étape : corriger P0 restants puis test E2E PC+APK sur LAN réel.*
