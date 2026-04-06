# Déploiement via GitHub → cPanel

Ce guide explique comment déployer votre projet Django sur cPanel en utilisant GitHub comme intermédiaire.

## 🔄 Workflow de Déploiement

```
[Local] → [GitHub] → [cPanel Git™ Version Control] → [Production]
```

## 📋 Prérequis

- Compte GitHub
- Compte cPanel avec accès "Git™ Version Control"
- Clé SSH configurée (optionnel mais recommandé)

## 🚀 Étapes

### 1. Préparer le Repository GitHub

#### A. Créer le repository sur GitHub

1. Connectez-vous à [GitHub](https://github.com)
2. Cliquez sur **"New repository"**
3. Nom : `ConsolationEtPaixDivine` (ou autre nom)
4. Visibilité : **Private** (recommandé pour un projet d'église)
5. Ne cochez PAS "Initialize with README" (vous avez déjà un README)
6. Cliquez **"Create repository"**

#### B. Initialiser Git localement et pousser

```bash
# Dans le dossier du projet
cd c:\Users\Mupenda\Desktop\ConsolationEtPaixDivine

# Initialiser Git
git init

# Ajouter le remote GitHub (remplacez USERNAME par votre nom d'utilisateur)
git remote add origin https://github.com/USERNAME/ConsolationEtPaixDivine.git

# Ou avec SSH (recommandé) :
# git remote add origin git@github.com:USERNAME/ConsolationEtPaixDivine.git

# Créer un fichier .gitignore s'il n'existe pas
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv/
*.egg-info/
dist/
build/

# Django
*.log
local_settings.py
db.sqlite3-journal
media/
staticfiles/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environnement
.env
.env.local
.env.*.local

# Fichiers de test
.pytest_cache/
.coverage
htmlcov/

# Docker
docker-compose.override.yml
EOF

# Ajouter les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Projet Consolation et Paix Divine ready for deployment"

# Pousser vers GitHub
git push -u origin main
# Ou si votre branche par défaut est 'master' :
# git push -u origin master
```

### 2. Configurer cPanel avec Git

#### A. Accéder à Git™ Version Control dans cPanel

1. Connectez-vous à cPanel
2. Recherchez **"Git™ Version Control"** (souvent dans la section "Fichiers")
3. Cliquez sur **"Create"** ou **"Cloner"**

#### B. Cloner le Repository

1. **Clone URL** : `https://github.com/USERNAME/ConsolationEtPaixDivine.git`
   - Ou SSH : `git@github.com:USERNAME/ConsolationEtPaixDivine.git`
2. **Repository Path** : `/home/username/ConsolationEtPaixDivine`
3. **Repository Name** : `ConsolationEtPaixDivine`
4. Cochez **"Create a new repository"** si vous voulez un miroir
5. Cliquez **"Create"**

#### C. Configurer le Webhook (Déploiement Automatique)

Pour un déploiement automatique lors des push :

1. Dans cPanel, notez l'URL du webhook (souvent affichée après le clone)
2. Sur GitHub, allez dans **Settings → Webhooks → Add webhook**
3. **Payload URL** : L'URL fournie par cPanel
4. **Content type** : `application/json`
5. **Events** : Sélectionnez "Just the push event"
6. Cliquez **"Add webhook"**

### 3. Configuration Post-Déploiement cPanel

#### A. Setup Python App

1. Dans cPanel, cherchez **"Setup Python App"**
2. Créez une nouvelle application :
   - **Python Version** : 3.9 ou 3.10
   - **Application Root** : `/home/username/ConsolationEtPaixDivine/backend`
   - **Application URL** : Votre domaine
   - **Application Entry Point** : `passenger_wsgi`
3. Cliquez **"Create"**

#### B. Installation des Dépendances

Dans le terminal cPanel ou via "Setup Python App" :

```bash
cd /home/username/ConsolationEtPaixDivine/backend
pip install -r requirements.txt
```

Ou avec un virtualenv :

```bash
cd /home/username/ConsolationEtPaixDivine
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

#### C. Configuration .htaccess

Créez/modifiez le fichier `.htaccess` à la racine de votre domaine :

```apache
PassengerEnabled On
PassengerPython /home/username/virtualenv/bin/python3

RewriteEngine On

# Fichiers statiques
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# API Django
RewriteRule ^api/(.*)$ passenger_wsgi.py/$1 [QSA,L]
RewriteRule ^admin/(.*)$ passenger_wsgi.py/admin/$1 [QSA,L]

# Tout vers l'application
RewriteRule ^(.*)$ passenger_wsgi.py/$1 [QSA,L]
```

#### D. Finalisation

```bash
cd /home/username/ConsolationEtPaixDivine/backend

# Collecter les fichiers statiques
python manage.py collectstatic --noinput

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser
```

### 4. Workflow de Développement

#### A. Développement Local → GitHub

```bash
# Modifier le code
# ... modifications ...

# Tester en local
python manage.py runserver

# Commit et push
git add .
git commit -m "Description des modifications"
git push origin main
```

#### B. Déploiement Automatique

Si le webhook est configuré, le push déclenche automatiquement le déploiement sur cPanel.

#### C. Déploiement Manuel (si pas de webhook)

Dans cPanel, section **"Git™ Version Control"** :
1. Sélectionnez votre repository
2. Cliquez sur **"Pull"** ou **"Update from Remote"**
3. Redémarrez l'application Python si nécessaire

### 5. Gestion des Environnements

#### A. Variables d'Environnement

Créez un fichier `.env` à la racine du backend (ne pas commiter !) :

```bash
# /home/username/ConsolationEtPaixDivine/backend/.env
DJANGO_SECRET_KEY=votre-cle-secrete-tres-longue-et-aleatoire
DEBUG=False
ALLOWED_HOSTS=votredomaine.com,www.votredomaine.com
```

Modifiez `settings.py` pour utiliser python-decouple :

```python
from decouple import config

SECRET_KEY = config('DJANGO_SECRET_KEY', default='django-insecure-change-me')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')
```

#### B. Fichiers Sensibles (pas sur GitHub)

Assurez-vous que `.env` et `db.sqlite3` sont dans `.gitignore` :

```gitignore
# Déjà dans .gitignore précédent
.env
db.sqlite3
media/
staticfiles/
```

### 6. Base de Données en Production

#### Option 1 : SQLite (Simple, pour débuter)

La base de données reste sur le serveur, pas sur GitHub.

#### Option 2 : MySQL (Recommandé pour production)

1. Créez une base MySQL dans cPanel
2. Modifiez `settings.py` :

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

3. Installez le driver : `pip install mysqlclient`
4. Migrez : `python manage.py migrate`

## 🔧 Dépannage GitHub → cPanel

### Problème : "Permission denied" lors du push

```bash
# Configurer l'authentification HTTPS
git remote set-url origin https://USERNAME:TOKEN@github.com/USERNAME/ConsolationEtPaixDivine.git

# Ou utiliser SSH (recommandé)
git remote set-url origin git@github.com:USERNAME/ConsolationEtPaixDivine.git
```

### Problème : "Could not resolve host"

Vérifiez la connectivité depuis cPanel :
```bash
ping github.com
```

### Problème : Les changements ne se déploient pas

1. Vérifiez le webhook sur GitHub (Settings → Webhooks)
2. Dans cPanel, faites un pull manuel : Git™ Version Control → Pull
3. Redémarrez l'application Python

### Problème : "Module not found" après déploiement

```bash
cd /home/username/ConsolationEtPaixDivine
source venv/bin/activate
pip install -r backend/requirements.txt --upgrade
```

## 📚 Commandes Utiles

### Status et Logs

```bash
# Voir le statut Git
git status

# Voir l'historique
git log --oneline -10

# Voir les différences
git diff
```

### Branches

```bash
# Créer une branche de développement
git checkout -b develop

# Pousser la branche
git push -u origin develop

# Fusionner dans main
git checkout main
git merge develop
git push origin main
```

### Rollback

```bash
# Revenir à un commit précédent
git log --oneline
git revert abc123  # Remplacez abc123 par le hash du commit

# Ou réinitialiser (attention, perte de données)
git reset --hard abc123
git push origin main --force
```

## ✅ Checklist Avant Déploiement

- [ ] `.env` configuré sur le serveur (pas sur GitHub)
- [ ] `db.sqlite3` dans `.gitignore`
- [ ] `DEBUG = False` en production
- [ ] `ALLOWED_HOSTS` contient le domaine de production
- [ ] Clé secrète Django changée et forte
- [ ] Fichiers statiques collectés (`collectstatic`)
- [ ] Migrations appliquées (`migrate`)
- [ ] Superutilisateur créé
- [ ] HTTPS activé sur le domaine

## 🆘 Support

En cas de problème :
1. Vérifiez les logs d'erreur dans cPanel
2. Vérifiez l'état du webhook sur GitHub
3. Essayez un pull manuel depuis cPanel
4. Vérifiez les permissions des fichiers

## 🔗 Liens Utiles

- [GitHub Docs - Creating a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [cPanel - Git Version Control](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-set-up-access/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)
