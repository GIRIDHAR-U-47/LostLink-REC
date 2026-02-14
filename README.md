# REC LostLink 🔍

## 🚀 About the Project
REC LostLink is a complete **Lost & Found ecosystem** tailored for **Rajalakshmi Engineering College (REC)**. It digitalizes the campus lost and found process, connecting finders with losers through a secure and verified system.

The system consists of three main components:
1.  **FastAPI Backend**: A high-performance Python-based REST API with MongoDB.
2.  **Web Admin Dashboard**: A premium React.js interface for campus administrators to manage inventory and verify claims.
3.  **Mobile Application**: A cross-platform Expo (React Native) app for students to report and track items.

---

## ✨ Key Features
- **Student App**: Secure registration, report lost/found items with photos, real-time status tracking, and personalized history.
- **Web Admin Dashboard**: Comprehensive analytics (items returned today, high-risk items), searchable inventory, automated claim management, and storage location tracking.
- **Security**: JWT-based authentication, role-based access control (Admin vs. Student), and password hashing (Bcrypt).
- **Automation**: Email notification triggers and smart category breakdown charts.

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Database**: MongoDB (Motor Async Driver)
- **Auth**: Python-JOSE, Passlib (Bcrypt)

### Admin Web Portal
- **Framework**: React.js 18
- **UI/Charts**: Vanilla CSS (Premium Dark/Purple Theme), Chart.js
- **API Client**: Axios with interceptors

### Student Mobile App
- **Framework**: React Native (Expo Go)
- **Navigation**: React Navigation (Stack/Tabs)

---

## 🏗 Project Structure
```text
rec-lostlink/
├── fastapi-backend/      # Python API (Port 8080)
│   ├── app/              # Core logic, models, and routes
│   ├── static/           # Item image uploads
│   ├── main.py           # Entry point
│   ├── seed_data.py      # Dummy data population script
│   └── requirements.txt
├── admin-dashboard/      # React Web Portal (Port 3000)
│   ├── src/
│   │   ├── services/     # API integration logic
│   │   ├── pages/        # Dashboard, Claims, Inventory
│   │   └── styles/       # Premium CSS design
├── frontend/             # Mobile App (Expo)
│   ├── src/
│   │   ├── screens/      # Login, Report, My Activity
│   │   └── context/      # Global Authentication state
└── README.md
```

---

## 🚥 Quick Start Guide

### 1. Prerequisite Setup
- Install **Node.js** (v18+)
- Install **Python** (v3.12+)
- Install **MongoDB** (Local Community Edition recommended)

### 2. Backend Setup
```bash
cd fastapi-backend

# 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate # Mac/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Securely downgrade bcrypt for compatibility
pip install "bcrypt<4.1.0"

# 4. Initialize the database with demo data
python seed_data.py

# 5. Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

### 3. Admin Dashboard Setup
```bash
cd admin-dashboard
npm install
npm start
```
The dashboard will open at `http://localhost:3000`.

### 4. Mobile App Setup
```bash
cd frontend
npm install

# Update API IP in src/services/api.js to your local machine IP
# e.g., const BASE_URL = 'http://192.168.1.10:8080/api';

npx expo start
```
Scan the QR code with **Expo Go** on your mobile device.

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@rec.edu.in` | `admin123` |
| **Student** | `john@rec.edu.in` | `student123` |

---

## 📡 API Overview
- `POST /api/auth/login` - Authenticate users
- `POST /api/items/report` - Submit new lost/found report
- `GET /api/admin/stats/dashboard` - Admin overview statistics
- `PUT /api/claims/{id}/verify` - Handle claim approvals

---

## 📸 Screenshots / Visuals
Check the `docs/assets` folder for high-resolution snapshots of the interactive dashboard and mobile UI components.

---

## 📄 License
This project is built for **Rajalakshmi Engineering College**.
Distributed under the MIT License.
