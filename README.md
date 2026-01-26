# Consolation et Paix Divine - Church Management System

## Overview
This is a comprehensive web application for the complete management of the church "Consolation et Paix Divine". The system modernizes administrative and spiritual management, improves internal communication, facilitates pastoral follow-up of members, automates financial management, and leverages artificial intelligence for decision support.

## Architecture
- **Frontend**: React.js with Tailwind CSS (PWA-enabled)
- **Backend**: Django with Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT with refresh token
- **Security**: RBAC, CSRF/XSS protection, audit logs
- **Deployment**: Docker/Docker Compose ready

## Features

### User Management
- Multi-role system: Super Admin, Admin, Department Head, Treasurer, Secretary, Member, Visitor
- Secure registration, login/logout
- Fine-grained permissions
- Complete audit log

### Member Management
- Complete profiles with photos and personal information
- Spiritual status tracking
- Family and group assignments
- Pastoral follow-up
- Attendance tracking
- Import/Export functionality

### Event Management
- Interactive calendar
- Service planning
- Special events management
- QR code attendance tracking
- Automatic notifications
- Detailed activity history

### Financial Management
- Transparent management of offerings, tithes, donations
- Clear financial categories
- Dynamic financial dashboards
- Automated reports (monthly/annual)
- PDF/Excel export
- Role-restricted access

### Communication
- Announcement management
- Automatic notifications
- Internal messaging
- Sermon archiving (audio, video, PDF)
- Official document management

### Dashboard
- Real-time statistics
- Dynamic charts
- Attendance rates
- Member growth
- Spiritual evolution
- Donation analysis
- KPI indicators

### AI Features
- Attendance prediction
- Activity recommendations
- At-risk member detection
- Internal chatbot
- Automated report generation
- Intelligent reminders

## Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL 12+
- Git

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure database settings in `settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'consolation_et_paix_divine',
           'USER': 'postgres',
           'PASSWORD': 'your_password',
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Docker Setup
1. Build and start all services:
   ```bash
   docker-compose up --build
   ```

## Default Credentials
- **Admin Panel**: 
  - Username: `admin`
  - Password: `admin123`
  - URL: `http://localhost:8000/admin/`

## API Documentation
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`

## Project Structure
```
ConsolationEtPaixDivine/
├── backend/
│   ├── church_management/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── admin.py
│   ├── settings.py
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Security Features
- Password hashing
- CSRF/XSS protection
- Role-based access control
- Complete audit logging
- Automatic backups
- Secure session management

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License
This project is licensed under the MIT License.

## Support
For support and questions, please contact the development team.

## Future Roadmap
- Mobile app development
- Multi-church SaaS platform
- Advanced AI analytics
- Integration with third-party services
- Enhanced reporting capabilities
