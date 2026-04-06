# Guide de Déploiement sur cPanel - Consolation et Paix Divine

## 📋 Prérequis

- Compte cPanel avec accès SSH (recommandé)
- Python 3.8+ installé sur le serveur
- Node.js 18+ pour le build du frontend (si build local)
- Accès au gestionnaire de fichiers cPanel ou FTP

## 📁 Structure du Projet

```
ConsolationEtPaixDivine/
├── backend/              # Django Backend
│   ├── church_management/  # Application Django
│   ├── settings.py
│   ├── manage.py
│   └── requirements.txt
├── frontend/             # React Frontend (optionnel pour build)
│   ├── src/
│   ├── public/
│   └── package.json
├── passenger_wsgi.py   # Point d'entrée WSGI
├── .htaccess          # Configuration Apache
└── db.sqlite3         # Base de données SQLite
```

## 🚀 Étapes de Déploiement

### 1. Préparation en Local

#### A. Configuration du Backend

1. **Modifier `backend/settings.py`** pour la production :
   ```python
   # Ajoutez votre domaine dans ALLOWED_HOSTS
   ALLOWED_HOSTS = [
       'localhost',
       '127.0.0.1',
       'votredomaine.com',        # ← Votre domaine
       'www.votredomaine.com',    # ← Version www
   ]
   
   # Configuration CORS pour le domaine de production
   CORS_ALLOWED_ORIGINS = [
       'https://votredomaine.com',      # ← Votre domaine HTTPS
       'https://www.votredomaine.com',
   ]
   ```

2. **Collecter les fichiers statiques** :
   ```bash
   cd backend
   python manage.py collectstatic --noinput
   ```

3. **Appliquer les migrations** :
   ```bash
   python manage.py migrate
   ```

4. **Créer un superutilisateur** (optionnel) :
   ```bash
   python manage.py createsuperuser
   ```

#### B. Build du Frontend (si vous servez depuis Django)

```bash
cd frontend
npm install
npm run build
```

Copiez le contenu du dossier `build/` vers `backend/staticfiles/` ou servez-le séparément.

### 2. Upload sur cPanel

#### Option A : Via SSH (Recommandé)

```bash
# Sur votre machine locale, compressez le projet
zip -r ConsolationEtPaixDivine.zip ConsolationEtPaixDivine -x "*.pyc" -x "__pycache__/*" -x "frontend/node_modules/*" -x "backend/.venv/*"

# Upload via SCP ou FTP
scp ConsolationEtPaixDivine.zip username@yourserver.com:/home/username/

# Sur le serveur, extrayez
unzip ConsolationEtPaixDivine.zip
```

#### Option B : Via Gestionnaire de Fichiers cPanel

1. Connectez-vous à cPanel
2. Ouvrez "Gestionnaire de Fichiers"
3. Naviguez vers `/home/username/` ou le répertoire de votre domaine
4. Upload le fichier ZIP et extrayez-le

### 3. Configuration cPanel

#### A. Configuration Python App (Setup Python App)

1. Dans cPanel, recherchez **"Setup Python App"** ou **"Application Python"**
2. Créez une nouvelle application :
   - **Python Version** : 3.8, 3.9, 3.10 ou 3.11
   - **Application Root** : `/home/username/ConsolationEtPaixDivine/backend`
   - **Application URL** : Votre domaine ou sous-domaine
   - **Application Entry Point** : `passenger_wsgi.py`
   
3. Cliquez sur "Create"

#### B. Installation des Dépendances

Dans le terminal SSH ou via le gestionnaire Python de cPanel :

```bash
cd /home/username/ConsolationEtPaixDivine/backend
pip install -r requirements.txt
```

Ou créez un virtualenv (recommandé) :

```bash
cd /home/username/ConsolationEtPaixDivine
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

#### C. Configuration du fichier .htaccess

Modifiez le fichier `.htaccess` à la racine de votre domaine (pas dans le sous-dossier) :

```apache
# Activer Passenger
PassengerEnabled On
PassengerPython /home/username/virtualenv/bin/python3

# Ou si vous utilisez la version système Python :
# PassengerPython /usr/bin/python3

# Redirection des requêtes API vers Django
RewriteEngine On

# Ne pas réécrire les fichiers statiques et médias existants
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# API et Admin Django
RewriteRule ^api/(.*)$ passenger_wsgi.py/$1 [QSA,L]
RewriteRule ^admin/(.*)$ passenger_wsgi.py/admin/$1 [QSA,L]
RewriteRule ^static/(.*)$ static/$1 [L]
RewriteRule ^media/(.*)$ media/$1 [L]

# Tout le reste vers l'application (React build ou Django)
RewriteRule ^(.*)$ passenger_wsgi.py/$1 [QSA,L]
```

### 4. Configuration des Permissions

Dans le terminal SSH :

```bash
cd /home/username/ConsolationEtPaixDivine

# Permissions pour les fichiers
find . -type f -exec chmod 644 {} \;

# Permissions pour les dossiers
find . -type d -exec chmod 755 {} \;

# Permissions spéciales pour db.sqlite3 et media
chmod 664 db.sqlite3
chmod -R 775 media/
chmod -R 775 staticfiles/

# Assurez-vous que le groupe est correct (remplacez par votre groupe)
chown -R username:username .
```

### 5. Finalisation

#### A. Collecter les fichiers statiques (si pas fait en local)

```bash
cd /home/username/ConsolationEtPaixDivine/backend
python manage.py collectstatic --noinput
```

#### B. Appliquer les migrations (si base de données SQLite)

```bash
cd /home/username/ConsolationEtPaixDivine/backend
python manage.py migrate
```

#### C. Créer le superutilisateur

```bash
cd /home/username/ConsolationEtPaixDivine/backend
python manage.py createsuperuser
```

### 6. Vérification

Accédez à votre site :
- **Site principal** : `https://votredomaine.com`
- **Admin Django** : `https://votredomaine.com/admin`
- **API** : `https://votredomaine.com/api/`

## 🔧 Dépannage

### Problème : "Internal Server Error"

1. Vérifiez les logs d'erreur dans cPanel (Error Logs)
2. Vérifiez les permissions des fichiers
3. Assurez-vous que `passenger_wsgi.py` est exécutable

### Problème : "Module not found"

```bash
# Réinstallez les dépendances
pip install -r backend/requirements.txt --upgrade
```

### Problème : Fichiers statiques non chargés

1. Vérifiez que `STATIC_ROOT` est configuré dans settings.py
2. Lancez `collectstatic` à nouveau
3. Vérifiez que Whitenoise est installé et configuré

### Problème : CORS errors

Ajoutez votre domaine dans `CORS_ALLOWED_ORIGINS` dans `settings.py` :

```python
CORS_ALLOWED_ORIGINS = [
    'https://votredomaine.com',
    'https://www.votredomaine.com',
]
```

### Problème : Base de données en lecture seule

```bash
chmod 664 /home/username/ConsolationEtPaixDivine/db.sqlite3
chown username:username /home/username/ConsolationEtPaixDivine/db.sqlite3
```

## 📝 Notes Importantes

1. **Base de données** : Le projet utilise SQLite par défaut. Pour une production à fort trafic, envisagez MySQL/PostgreSQL.

2. **Fichiers médias** : Les uploads utilisateur sont stockés dans `media/`. Assurez-vous que ce dossier a les bonnes permissions.

3. **Clé secrète** : En production, définissez une clé secrète forte via les variables d'environnement :
   ```bash
   export DJANGO_SECRET_KEY="votre-cle-secrete-tres-longue-et-aleatoire"
   ```

4. **DEBUG** : Assurez-vous que `DEBUG = False` en production.

5. **HTTPS** : Utilisez toujours HTTPS en production. Activez SSL dans cPanel.

## 🆘 Support

En cas de problème :
1. Consultez les logs d'erreur dans cPanel
2. Vérifiez les permissions des fichiers
3. Assurez-vous que toutes les dépendances sont installées

## 📚 Ressources

- [Documentation Django Deployment](https://docs.djangoproject.com/en/4.2/howto/deployment/)
- [cPanel Python App Documentation](https://docs.cpanel.net/knowledge-base/web-services/python-web-applications/)
