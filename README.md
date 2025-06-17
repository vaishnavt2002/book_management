# Book Management System

A full-stack web application for managing books, users, and reading lists built with Django REST Framework (backend) and React with Vite (frontend).

## Features

- **User Management**: Registration, login, and profile management
- **Book Management**: Create, view, update, and delete books
- **Reading Lists**: Create and manage personalized reading lists
- **Book Organization**: Add/remove books from reading lists with custom ordering
- **Authentication**: JWT-based authentication system


## Tech Stack

### Backend
- Django 4.2+
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Python 3.8+

### Frontend
- React 
- Vite
- Axios (for API calls)
- React Router (for navigation)



## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd book-management
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Database Setup
1. Create a PostgreSQL database:
```sql
CREATE DATABASE book_management;
CREATE USER book_admin WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE book_management TO book_admin;
```

2. Create `.env` file in the backend directory:
```env
SECRET_KEY=
DB_NAME=book_management
DB_USER=book_admin
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

EMAIL_USER=
EMAIL_PASSWORD=
```

#### Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

#### Start Backend Server
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd frontend
```

#### Install Dependencies
```bash
npm install
```

#### Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

