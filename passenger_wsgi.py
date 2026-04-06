#!/usr/bin/env python
"""
passenger_wsgi.py - Configuration pour le déploiement sur cPanel avec Passenger WSGI
Ce fichier doit être placé à la racine du projet (au même niveau que manage.py)
"""

import os
import sys

# Chemin vers le répertoire du projet
# Modifier selon votre chemin sur le serveur
INTERP = "/usr/bin/python3"  # Ou le chemin de votre virtualenv Python
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Ajouter le répertoire du projet au path
# Remplacez '/home/username/ConsolationEtPaixDivine' par votre chemin réel
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)
sys.path.insert(0, os.path.join(project_dir, 'backend'))

# Configuration de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

# Créer l'application WSGI
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
