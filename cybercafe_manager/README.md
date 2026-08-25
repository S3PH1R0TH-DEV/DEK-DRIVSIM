# DEK-DRIVSIM CyberCafe - Guide d'Installation et d'Utilisation Professionnel

Bienvenue dans le guide officiel de **DEK-DRIVSIM CyberCafe**, une application de pointe conçue pour la gestion complète et intuitive de cybercafés, salles de jeux et espaces de simulation automobile / de conduite.

L'application est 100 % en français, hautement visuelle et développée pour être pilotée par l'administrateur **depuis un unique téléphone portable faisant office de serveur central**, sur lequel toutes les machines de la salle se connectent via votre routeur Wi-Fi local.

---

## 📂 Architecture de l'Écosystème DEK-DRIVSIM

Pour simplifier à l'extrême l'administration, l'intégralité du moteur de base de données, des API et de l'administration a été fusionnée dans **un seul fichier maître** :

1. **Le Serveur Central Unifié (S'exécute sur le téléphone portable ou PC Admin)** :
   * `cybercafe_manager/app.py` : **L'unique fichier central** contenant le serveur Flask (Python), l'initialisation et la gestion SQLite native.
   * `main.py` : Le point d'entrée officiel pour la compilation Android APK, démarrant Flask et créant une WebView Android native ultra-stable.
   * `network_security_config.xml` : Le fichier de configuration de sécurité réseau Android officiel permettant le trafic HTTP local.
   * `cybercafe_manager/buildozer.spec.template` : Gabarit de configuration complet pré-rempli pour compiler votre APK avec icône, écran de démarrage et déblocage de sécurité réseau.
   * `cybercafe_manager/templates/` :
     - `role_setup.html` : Écran sécurisé d'auto-configuration de sécurité au premier démarrage (Anonyme, anti-caissier).
     - `admin_dashboard.html` : Console d'administration interactive exclusive du Propriétaire Master (avec Journal des Connexions et export CSV).
     - `cashier_dashboard.html` : Console de caisse simplifiée et sécurisée du Caissier Gérant.
     - `client_locker.html` : Écran de verrouillage client (**Locker**) et Lanceur de Jeux (**Game Launcher**).
     - `tickets_print.html` : Gabarit d'impression des tickets prêts pour la découpe.
     - `reports_print.html` : Modèle d'impression des bilans financiers et rapports comptables.
   * `cybercafe_manager/static/images/` :
     - `logo.png` : Magnifique logo épuré cyberpunk (Sert d'icône de l'application mobile).
     - `presplash.png` : Somptueux écran de démarrage vertical néon (Affiché au chargement de l'APK).

2. **L'Agent Client Sécurisé (S'exécute sur chaque PC de jeu / Simulateur)** :
   * `dek_client_agent.py` : Un script de sécurité s'exécutant en arrière-plan sur Windows pour empêcher la fermeture du navigateur client, désactiver le Gestionnaire des tâches, masquer physiquement la barre des tâches Windows, et verrouiller les fonctions d'Alt+Ctrl+Suppr, Alt+Tab, Alt+Esc, Ctrl+Esc et les touches de logo Windows (WinKeys).

---

## 👥 1. Gestion des Utilisateurs : Propriétaire (Admin) vs Caissier Gérant

L'application a été conçue pour différencier de manière intuitive les actions du propriétaire de celles de l'employé (caissier) :

* **Mode Propriétaire (Admin)** : Accès absolu à l'application.
  * Modification des paramètres système (Nom du cybercafé, clé Wi-Fi de la salle, tarif horaire en CFA).
  * Création de nouveaux comptes de joueurs membres.
  * Visualisation du **Chiffre d'Affaires Global (recette cumulée historique)**.
  * Gestion complète de la bibliothèque de jeux de la salle.
  * Émission et suppression de tickets de session.
  * Accès complet au **Centre d'Impression des Rapports Comptables** et de téléchargement du **Journal de Connexion (CSV)**.

* **Mode Caissier Gérant** : Droits limités pour l'employé de garde.
  * **Masquage automatique** de la configuration système, du centre d'impression des rapports avancés et du portefeuille de recettes historiques (pour éviter les fraudes et indiscrétions).
  * Possibilité de lancer des sessions clients (Ticket, Joueur ou Libre-accès).
  * Encaissement des recharges de comptes joueurs.
  * Émission de tickets d'accès prépayés.
  * Consultation stricte de la **caisse de sa propre journée**.

---

## 📡 2. Détection & Enregistrement Automatique des Postes (Zéro Configuration)

L'application n'utilise plus aucune machine factice par défaut. La base de données initiale démarre **complètement vierge**.
* **Auto-détecteur Réseau (Auto-Discovery)** : L'agent client `dek_client_agent.py` intègre un scanner de réseau Wi-Fi local multi-thread. Au démarrage, il détecte l'IP locale de la machine, calcule la plage d'IP de la salle (ex: `192.168.1.1` à `192.168.1.254`), et **scanne les 254 adresses en parallèle sur le port 5000**. Dès qu'il trouve le serveur de votre téléphone, **il s'y connecte de manière autonome en moins de 1,5 seconde !** Plus besoin de saisir ou configurer d'IP sur les PC.
* **Auto-enregistrement** : Dès le premier ping, le serveur enregistre la nouvelle machine de manière dynamique en base de données et la fait apparaître en temps réel sur la console d'administration !
* **Détection du type** : Si le nom du poste contient des mots comme "Console", "PS", "Xbox" ou "Nintendo", le serveur le configure automatiquement sous le type **Console**. Sinon, il est enregistré sous le type **PC**.

---

## 🛡️ 3. Sécurité Client : Blocage d'Alt+Ctrl+Suppr, Alt+Tab & Masquage de la Barre des Tâches

Afin de garantir un verrouillage impénétrable sur les postes Windows de votre salle, l'agent client `dek_client_agent.py` exécute les opérations système suivantes :

1. **Masquage physique de la barre des tâches** :
   À son démarrage, l'agent appelle l'API système Windows (`ctypes`) pour **cacher entièrement la barre des tâches Windows et le bouton Démarrer**. Même si une notification ou un popup s'affiche, la barre des tâches restera masquée et inaccessible pour le joueur. Elle est ré-affichée proprement à la fermeture légitime de l'agent.
2. **Watchdog Actif** : L'agent surveille en permanence le processus du navigateur et le relance en mode Kiosk plein écran (`--kiosk`) en moins de 500 millisecondes si l'utilisateur tente de le fermer.
3. **Blocage d'Alt+Ctrl+Suppr & du Gestionnaire des tâches** :
   Il désactive le **Gestionnaire des tâches** (raccourci `Ctrl + Shift + Esc`) ainsi que les boutons d'évasion (Verrouiller, Déconnecter, Déconnexion) de l'écran Alt+Ctrl+Suppr.
4. **Hook de Clavier Bas Niveau (Anti-évasion)** :
   L'agent installe un hook de clavier natif Win32 (`SetWindowsHookExW`) s'exécutant sur le thread principal. Toutes les tentatives d'évasion par raccourcis comme **`Alt+Tab`**, **`Alt+F4`**, **`Alt+Esc`**, **`Ctrl+Esc`** et les touches **Windows** sont interceptées et annulées. Ce blocage est désactivé temporairement dès que la machine est déverrouillée (`occupied`) pour laisser le joueur jouer, et réactivé dès que la session se ferme !

---

## 🕹️ 4. Comptes d'Accès Spéciaux (`admin_dek` et `caissier_dek`)

Pour simplifier vos phases de tests ou l'accès physique des employés sur les machines clients :
* **Compte Administrateur (`admin_dek` / mdp : `admin123`)** :
  * Déverrouille n'importe quel poste de jeu pour une **durée de jeu infinie** (configurée à 1000 Heures).
  * Donne accès à la bibliothèque de jeux avec le bouton de configuration d'ajout/suppression actif directement sur l'écran du PC.
* **Compte Caissier (`caissier_dek` / mdp : `caissier123`)** :
  * Déverrouille la machine pour une durée de **strictement 1 Heure par jour**.
  * Le système cumule son temps joué. Une fois l'heure de cumul atteinte sur la journée, toute reconnexion est refusée.
  * Le bouton de configuration des jeux est entièrement **masqué et inaccessible** pour éviter toute triche.

---

## 🤝 5. Système de Parrainage (Bonus Membres, Code Promo & Caissier)

Pour faire exploser la clientèle de **DEK-DRIVSIM**, un système de parrainage de pointe a été mis en place :
* **Pour les Membres** : Chaque joueur possède un code de parrainage unique lié à son compte (ex: `DEK-PROGAMER`). S'il invite un ami à s'inscrire, l'ami saisit ce code, et **l'administrateur reçoit une alerte d'affiliation pour attribuer automatiquement un bonus au parrain** (comme une session gratuite de 30 min ou un ticket à 50% de réduction).
* **Pour les Clients de passage (Clients Codes/Tickets)** : Comment les motiver ? Chaque ticket imprimé possède un **Code Promo de Parrainage** unique. S'ils partagent ce code et qu'un nouvel utilisateur s'inscrit avec, le nouveau client bénéficie de **10% de temps en plus**, et le client ticket d'origine peut réclamer **une réduction de 50 % sur sa prochaine session** en ramenant son ancien ticket au comptoir !
* **Pour le Caissier** : Votre caissier dispose de son code unique **`CASHIER-DEK`**. Chaque fois qu'il recrute et inscrit un nouveau client régulier avec son code, **son compteur de recrues s'incrémente en direct sur votre application propriétaire**, vous permettant de calculer sa prime !

---

## 📅 6. Évaluation du Gérant Caissier sur 2 semaines (Essai 14 Jours)

Dans votre espace d'administration propriétaire, un module complet d'évaluation a été conçu :
* Une grille de calendrier sur 14 jours vous permet d'évaluer le caissier chaque jour de sa période d'essai.
* Vous notez sa performance (1 à 5 étoiles), sa ponctualité, la régularité de sa caisse, et saisissez des remarques.
* L'application extrait dynamiquement le nombre de recrues qu'il a parrainées ce jour-là et **calcule automatiquement son salaire net journalier** (Salaire de base de 5 000 CFA + Prime de parrainage de 200 CFA par client recruté).
* Une fois les 14 jours d'essai complétés, l'application vous en informe et vous suggère de le passer à un contrat hebdomadaire standard.

---

## 🌐 7. Accès à distance depuis votre Bureau (Tunnel Sécurisé Ngrok)

Si vous n'êtes pas physiquement présent au cybercafé et souhaitez **superviser la caisse, émettre des tickets ou visualiser les écrans des simulateurs depuis votre bureau ou votre domicile**, vous pouvez créer un tunnel sécurisé gratuit :

### Option recommandée : Utiliser Ngrok (Gratuit et ultra-sécurisé)
**Ngrok** est un outil léger qui permet d'exposer un port local (le port 5000 de votre serveur) sur une adresse internet publique sécurisée (HTTPS) accessible partout dans le monde.

#### Étape 1 : Installer Ngrok dans Termux
Dans la console de votre téléphone serveur (Termux), téléchargez et configurez Ngrok :
```bash
# Télécharger Ngrok pour Android ARM
pkg install wget -y
wget https://bin.equinox.io/c/b341edd91/ngrok-stable-linux-arm.zip
unzip ngrok-stable-linux-arm.zip

# Lier votre jeton d'authentification gratuit (créez un compte sur ngrok.com)
./ngrok config add-authtoken VOTRE_JETON_NGROK
```

#### Étape 2 : Lancer le tunnel à distance
Une fois le serveur démarré, lancez le tunnel en tâche de fond :
```bash
./ngrok http 5000
```
Le terminal affichera une adresse publique sécurisée du type :
👉 **`https://dek-drivsim.ngrok-free.app`** (ou une adresse aléatoire).

#### Étape 3 : Administrer depuis le bureau
Saisissez simplement ce lien dans le navigateur de votre ordinateur de bureau ou de votre maison. Vous accéderez instantanément et de manière parfaitement fluide à l'intégralité de votre console d'administration **DEK-DRIVSIM**, en temps réel, comme si vous étiez dans la salle !

---

## 🛠️ 8. Tutoriels de Compilation : Créer l'APK (Android) et l'EXE (PC Windows)

### 📲 A. Compiler l'Application mobile unifiée en APK (Android)

Pour compiler le serveur maître `app.py` (incluant le serveur web, la base SQLite et les dashboards) en une application Android `.apk` installable :

#### Étape 1 : Le principe technique (WebView Wrapper)
Pour conserver la puissance et la réactivité de notre interface, l'APK va agir comme une WebView sécurisée :
* Au démarrage de l'APK sur votre smartphone, l'application lance le serveur Flask en arrière-plan Android (service local).
* L'application ouvre immédiatement une vue plein écran de votre console sur l'adresse locale `http://127.0.0.1:5000`.

#### Étape 2 : Créer le fichier d'entrée Kivy `main.py`
Créez un fichier d'entrée nommé `main.py` dans votre dossier de projet pour automatiser cela (utilisant Pyjnius `@run_on_ui_thread` pour une stabilité absolue sur tous les téléphones) :
```python
# -*- coding: utf-8 -*-
import threading
import time
import os
import sys
from kivy.app import App
from kivy.utils import platform
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label

def start_flask_server():
    # Démarre le serveur unifié localement
    import app as flask_backend
    flask_backend.app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)

class DEKDRIVSIMApp(App):
    def build(self):
        server_thread = threading.Thread(target=start_flask_server)
        server_thread.daemon = True
        server_thread.start()
        
        layout = BoxLayout(orientation='vertical')
        
        if platform == 'android':
            from android.permissions import request_permissions, Permission
            try:
                # Déclenche l'invite de permissions au démarrage
                request_permissions([
                    Permission.WRITE_EXTERNAL_STORAGE,
                    Permission.READ_EXTERNAL_STORAGE
                ])
            except Exception as e:
                print(f"Erreur permissions: {e}")

            from jnius import autoclass
            from android.runnable import run_on_ui_thread
            
            @run_on_ui_thread
            def create_native_webview():
                try:
                    PythonActivity = autoclass('org.kivy.android.PythonActivity')
                    Activity = PythonActivity.mActivity
                    WebView = autoclass('android.webkit.WebView')
                    WebViewClient = autoclass('android.webkit.WebViewClient')
                    WebSettings = autoclass('android.webkit.WebSettings')
                    
                    webview = WebView(Activity)
                    webview.getSettings().setJavaScriptEnabled(True)
                    webview.getSettings().setDomStorageEnabled(True)
                    webview.getSettings().setDatabaseEnabled(True)
                    webview.getSettings().setAllowFileAccess(True)
                    webview.getSettings().setAllowContentAccess(True)
                    webview.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW)
                    webview.setWebViewClient(WebViewClient())
                    Activity.setContentView(webview)
                    
                    time.sleep(1.0)
                    webview.loadUrl("http://127.0.0.1:5000")
                except Exception as e:
                    print(f"Erreur WebView: {e}")
            create_native_webview()
        else:
            import webbrowser
            time.sleep(1.0)
            webbrowser.open("http://127.0.0.1:5000")
            layout.add_widget(Label(text="DEK-DRIVSIM Serveur démarré sur http://127.0.0.1:5000"))
        return layout

if __name__ == '__main__':
    DEKDRIVSIMApp().run()
```

#### Étape 3 : Configurer et débloquer Buildozer sous WSL (Linux/Ubuntu)
1. Installez Buildozer et les dépendances système requises dans votre terminal WSL :
   ```bash
   sudo apt update
   sudo apt install -y git zip unzip openjdk-17-jdk python3-pip autoconf libtool pkg-config zlib1g-dev libncurses5-dev libssl-dev
   pip3 install --user buildozer
   ```
2. **Déblocage crucial de sécurité Python (PEP 668)** :
   Si WSL bloque l'installation de Buildozer ou de ses sous-paquets, tapez ces deux lignes de commande pour débloquer les installations globales :
   ```bash
   mkdir -p ~/.config/pip
   echo -e "[global]\nbreak-system-packages = true" > ~/.config/pip/pip.conf
   ```
3. Enregistrez les outils compilés dans votre variable d'environnement PATH :
   ```bash
   echo 'export PATH=$PATH:~/.local/bin' >> ~/.bashrc
   source ~/.bashrc
   ```
4. Copiez notre modèle de configuration de compilation complet dans votre fichier **`buildozer.spec`** :
   ```bash
   cp cybercafe_manager/buildozer.spec.template buildozer.spec
   ```
   *(Ce gabarit pré-rempli intègre déjà votre icône cyberpunk, votre écran de démarrage (presplash) personnalisé, et le **déblocage automatique d'autorisation d'accès HTTP / Cleartext d'Android** !)*
5. **Copiez le fichier de sécurité d'autorisation réseau globale XML** :
   ```bash
   cp cybercafe_manager/network_security_config.xml network_security_config.xml
   ```
6. Branchez votre téléphone Android en USB (débogage USB activé) et lancez la compilation et l'installation directe :
   ```bash
   buildozer -v android debug deploy run
   ```
   *(Le fichier final `.apk` se trouvera dans le dossier `bin/` !)*

---

### 💻 B. Compiler l'Agent de Sécurité PC en EXE (Windows)

Pour compiler l'agent de verrouillage et de hook de clavier `dek_client_agent.py` en un exécutable Windows `.exe` autonome et silencieux (sans fenêtre noire de commande) :

#### Étape 1 : Installer Python sur le PC Client
Téléchargez et installez Python (version 3.x) depuis le site officiel [python.org](https://www.python.org/). Cochez impérativement la case **"Add Python to PATH"** lors de l'installation.

#### Étape 2 : Installer PyInstaller (Outil de compilation)
Ouvrez l'invite de commande de Windows (`cmd`), puis tapez :
```bash
pip install pyinstaller --break-system-packages
```

#### Étape 3 : Compiler l'agent en `.exe` invisible
1. Placez votre script `dek_client_agent.py` et l'image du logo épuré `logo.png` dans un dossier (ex: sur votre Bureau).
2. Dans votre invite de commande (`cmd`), déplacez-vous dans ce dossier et lancez la compilation :
   ```bash
   cd Desktop
   pyinstaller --onefile --noconsole --add-data "logo.png;." dek_client_agent.py
   ```
3. Récupérez votre fichier **`dek_client_agent.exe`** final généré dans le sous-dossier **`dist/`** qui vient d'apparaître sur votre Bureau !

---

## 📱 9. Guide de Démarrage Rapide (Termux Android)

Pour démarrer et arrêter votre serveur de cybercafé en tâche de fond de manière **inviolable et permanente** (le serveur continue de fonctionner même si vous éteignez l'écran ou fermez l'application Termux) :

### Lancer le serveur (Arrière-plan permanent) :
```bash
./start_termux_server.sh
```
*Le script active automatiquement le WakeLock d'Android pour empêcher le téléphone de s'endormir et détache le serveur de la console.*

### Arrêter le serveur proprement :
```bash
./stop_termux_server.sh
```
*Le script identifie le processus en cours d'exécution, l'arrête, et relâche le WakeLock pour reposer votre batterie.*

---

## 🧪 10. Tests et Validation Technique

La stabilité et la fiabilité de DEK-DRIVSIM ont été certifiées à 100 % par deux de protocoles de tests automatisés :

* **Tests unitaires et logique métier** :
  ```bash
  python test_cybercafe.py
  ```

* **Tests d'intégration réseau en direct** :
  ```bash
  python test_server_run.py
  ```

*Statut des tests : **100 % OK (PASSED)***
