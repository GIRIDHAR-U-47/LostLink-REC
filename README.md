# REC LostLink 🔍
Digitalizing the Lost & Found Ecosystem at Rajalakshmi Engineering College.

<div align="center">

<a href="https://github.com/GIRIDHAR-U-47/LostLink-REC/releases">
  <img src="https://img.shields.io/github/downloads/GIRIDHAR-U-47/LostLink-REC/total?style=for-the-badge&logo=github&label=Downloads&color=3DDC84" alt="Total Downloads"/>
</a>
<a href="https://github.com/GIRIDHAR-U-47/LostLink-REC/releases/latest">
  <img src="https://img.shields.io/github/v/release/GIRIDHAR-U-47/LostLink-REC?style=for-the-badge&logo=react&logoColor=white&label=Latest&color=007AFF" alt="Latest Version"/>
</a>
<a href="https://github.com/GIRIDHAR-U-47/LostLink-REC/stargazers">
  <img src="https://img.shields.io/github/stars/GIRIDHAR-U-47/LostLink-REC?style=for-the-badge&logo=github&color=FFD700" alt="Stars"/>
</a>
<a href="https://github.com/GIRIDHAR-U-47/LostLink-REC/blob/main/LICENSE">
  <img src="https://img.shields.io/badge/License-MIT-orange?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="License"/>
</a>

</div>

## 🚀 Overview
**REC LostLink** is a comprehensive solution designed to streamline the lost and found process within the REC campus. It eliminates the manual hassle of tracking lost items by providing a centralized, secure, and automated platform for students and administrators.


> [!IMPORTANT]
> **Disclaimer**: This project is developed by a student of Rajalakshmi Engineering College as part of the **Design Thinking and Innovation (DTI)** academic coursework.
>
> This application is a student initiative and is **not** an official product of the college. It has been created solely for educational, research, and prototype purposes.
>
> Any future real-world deployment within the campus will be subject to formal approval and authorization from the college administration.
>
> The project does not claim ownership of institutional processes, branding, or authority and is intended only to demonstrate an innovative solution to a campus problem.


---


## 🏗 System Architecture
The project is built using a modern decoupled architecture:

1.  **Backend (FastAPI)**: High-performance Python API handling business logic, authentication, and data storage in MongoDB.
2.  **Admin Dashboard (React)**: Professional web interface for campus administrators to manage inventory and verify claims.
3.  **Mobile App (Expo Go)**: Cross-platform mobile application for students to report lost/found items and track their status.

> 💡 **Deep Dive**: For a detailed explanation of the system workflows, state transitions, and business logic, check out [LOGIC.md](./LOGIC.md).

---

## 🛠 Tech Stack
| Component | Technology |
| :--- | :--- |
| **Backend** | Python 3.12, FastAPI, MongoDB (Motor), JWT |
| **Admin Web** | React.js 18, Chart.js, Axios, Vanilla CSS |
| **Mobile App** | React Native, Expo, React Navigation |
| **Database** | MongoDB Community Edition |

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

You can set up the project automatically using the provided script (Windows) or follow the manual steps.

### 📥 0. Clone the Repository
```bash
git clone https://github.com/GIRIDHAR-U-47/LostLink-REC.git
cd LostLink-REC
```

### ⚡ Option A: Automated Setup (Windows Only)
We have provided a batch script to automate the installation of dependencies and database seeding.

1.  Double-click `setup_and_run.bat` (or run it from the terminal).
2.  Follow the on-screen instructions.
3.  Once setup is complete, you will need to open **3 separate terminals** to run each service.

---

### 🛠 Option B: Manual Setup

### 📋 Prerequisites
- **Node.js**: v18.0 or higher ([Download](https://nodejs.org/))
- **Python**: v3.12 or higher ([Download](https://www.python.org/))
- **MongoDB**: Community Edition ([Download](https://www.mongodb.com/try/download/community))
- **Expo Go App**: Install on your [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) or [iOS](https://apps.apple.com/app/expo-go/id982107779) device.

### Phase 1: Database Setup
1. Ensure **MongoDB** is running locally (default port: `27017`).
2. You don't need to create a database manually; the seed script will handle it.

---

### Phase 2: Backend Setup (Port 8080)

1.  **Navigate to the directory**:
    ```bash
    cd fastapi-backend
    ```

2.  **Create and activate virtual environment**:
    ```bash
    python -m venv venv
    # Windows:
    venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Seed the database**:
    ```bash
    python seed_data.py
    ```

5.  **Run the server**:
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8080
    ```
    *The API will be available at `http://localhost:8080`.*

---

### Phase 3: Admin Dashboard Setup (Port 3000)

1.  **Navigate to the directory**:
    ```bash
    cd admin-dashboard
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the dashboard**:
    ```bash
    npm start
    ```
    *The dashboard will automatically open at `http://localhost:3000`.*

---

### Phase 4: Mobile App Setup (Expo)

This is the most critical step for mobile device connection.

1.  **Find your Local IP Address**:
    - Windows: `ipconfig` (Look for IPv4 Address)
    - Mac/Linux: `ifconfig` or `ip a`

2.  **Update API Configuration**:
    - Open `frontend/src/services/api.js`.
    - Update `BASE_URL` with your IP address:
      ```javascript
      const BASE_URL = 'http://YOUR_IP_ADDRESS:8080/api';
      ```

3.  **Run the App**:
    ```bash
    cd frontend
    npm install
    npx expo start
    ```

4.  **Scan QR Code**: Use the **Expo Go** app to scan the QR code printed in your terminal.

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@rec.edu.in` | `admin123` |
| **Student** | `register` | 


---

##  Troubleshooting

### 1. "Could not connect to server" (Mobile)
- Ensure your phone and computer are on the **same Wi-Fi network**.
- Verify that your firewall allows traffic on port `8080`.
- Double-check the IP address in `frontend/src/services/api.js`.

### 2. Bcrypt / Password Errors
- If you encounter errors during login, ensure you ran `pip install "bcrypt<4.1.0"`.

### 3. MongoDB Connection
- Ensure `mongod` service is running. Use `mongosh` to verify you can connect to the local instance.

---

## 📸 Project Screenshots
Visuals of the interface can be found in the `docs/assets` directory. Key highlights include:
- **Interactive Dashboard**: Real-time stats and item tracking.
- **Reporting System**: Easy image-based reporting for students.
- **Claim Verification**: Secure process for returning items to owners.

---

## 🤝 Community & Legal

- **[Code of Conduct](./CODE_OF_CONDUCT.md)**: Expected behavior within our community.
- **[Contributing](./CONTRIBUTING.md)**: How to help the project grow.
- **[Security Policy](./SECURITY.md)**: How to report vulnerabilities.
- **[License](./LICENSE)**: MIT License details.

---


## 📄 License
Project developed for **Rajalakshmi Engineering College**. Distributed under the MIT License.

> [!IMPORTANT]
> **Disclaimer**: This project is developed by a student of Rajalakshmi Engineering College as part of the **Design Thinking and Innovation (DTI)** academic coursework.
>
> This application is a student initiative and is **not** an official product of the college. It has been created solely for educational, research, and prototype purposes.
>
> Any future real-world deployment within the campus will be subject to formal approval and authorization from the college administration.
>
> The project does not claim ownership of institutional processes, branding, or authority and is intended only to demonstrate an innovative solution to a campus problem.


