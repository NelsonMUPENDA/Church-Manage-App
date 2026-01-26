@echo off
echo Lancement de l'application Consolation et Paix Divine
echo =====================================
echo.
echo 1. Demarrage du backend Django...
cd backend
start "Backend Django" cmd /k "python manage.py runserver 0.0.0.0:8000"
timeout /t 3 /nobreak >nul
echo.
echo 2. Demarrage du frontend React...
cd ../frontend
start "Frontend React" cmd /k "npm start"
timeout /t 5 /nobreak >nul
echo.
echo =====================================
echo Application lancee!
echo.
echo Acces:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo - Admin Django: http://localhost:8000/admin/
echo   Username: admin
echo   Password: admin123
echo.
echo Appuyez sur une touche pour ouvrir le navigateur...
pause >nul
start http://localhost:3000
echo.
echo Les serveurs tournent dans des fenetres separees.
echo Fermez les fenetres pour arreter les serveurs.
pause
