#!/bin/bash
echo "Lancement de l'application Consolation et Paix Divine"
echo "====================================="
echo ""
echo "1. Démarrage du backend Django..."
cd backend
gnome-terminal -- bash -c "python manage.py runserver 0.0.0.0:8000; exec bash" &
sleep 3
echo ""
echo "2. Démarrage du frontend React..."
cd ../frontend
gnome-terminal -- bash -c "npm start; exec bash" &
sleep 5
echo ""
echo "====================================="
echo "Application lancée!"
echo ""
echo "Accès:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- Admin Django: http://localhost:8000/admin/"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Ouverture du navigateur dans 5 secondes..."
sleep 5
xdg-open http://localhost:3000
echo ""
echo "Les serveurs tournent dans des terminaux séparés."
echo "Fermez les terminaux pour arrêter les serveurs."
