# REC LostLink - Production Deployment Guide

Deploying the LostLink ecosystem requires hosting three different components and building the mobile app. Here is the step-by-step recommended approach for a scalable, production-ready deployment.

---

## 1. Database: MongoDB
**Recommended Platform:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available, fully managed)

1. Create a free cluster on MongoDB Atlas.
2. In the Security tab, whitelist your IP address (or allow `0.0.0.0/0` for cloud backends).
3. Create a Database User and save the password.
4. Click **Connect** -> **Connect your application** and copy the Connection String (looks like `mongodb+srv://<username>:<password>@cluster0.mongodb.net/`).

---

## 2. Backend: FastAPI
**Recommended Platform:** [Render](https://render.com/) or [Railway](https://railway.app/) (Easy PaaS deployments)

1. **Prepare for Deployment:**
   Your FastAPI backend is already prepared. It uses `uvicorn` and `.env` variables.
2. **Create a New Web Service (e.g., on Render):**
   - Connect your GitHub repository.
   - Set the Root Directory to `fastapi-backend`.
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables:**
   Add these in the deployment platform dashboard:
   - `MONGODB_URL`: Your MongoDB Atlas connection string.
   - `DATABASE_NAME`: `lostlink_db_prod`
   - `SECRET_KEY`: A long, secure random string.
4. **Deploy** and save the provided live URL (e.g., `https://lostlink-api.onrender.com`).

---

## 3. Admin Web Portal: React
**Recommended Platform:** [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/) (Free, optimized for React)

1. **Connect Repository:**
   - Create a project on Vercel/Netlify and connect your GitHub repo.
   - Set the Root Directory to `admin-dashboard`.
2. **Environment Variables:**
   Add this crucial variable during setup:
   - `REACT_APP_API_URL`: Your deployed FastAPI URL (e.g., `https://lostlink-api.onrender.com/api`).
3. **Deploy:**
   Vercel will automatically run `npm run build` and host the static files on a global CDN.

---

## 4. Mobile App: Expo React Native
**Recommended Platform:** [EAS Build](https://expo.dev/eas) (Expo Application Services)

Before building, you must update the Mobile App to point to the production backend instead of your local machine.

### Step 4a: Update API URL
In `frontend/src/services/api.js`, update the fallback `defaultIp` or explicitly hardcode the production URL:
```javascript
// Change this to your live backend URL
const BASE_URL = 'https://lostlink-api.onrender.com';
```

### Step 4b: Build the App (Android APK/AAB or iOS)
1. Install EAS CLI globally on your machine:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Initialize EAS in the `frontend` directory:
   ```bash
   cd frontend
   eas build:configure
   ```
4. Build an Android APK (for direct installation):
   ```bash
   eas build --profile preview --platform android
   ```
   *(Wait for the build to finish in the cloud. Expo will provide a link to download the `.apk` file.)*
5. Build for Google Play Store (.aab):
   ```bash
   eas build --profile production --platform android
   ```

---

## 🚀 Post-Deployment Checklist
- [ ] Visit your Vercel Admin Dashboard and log in using the default admin credentials.
- [ ] Open the `/docs` URL on your live FastAPI backend to ensure the Swagger UI works.
- [ ] Install the `.apk` on an Android phone and ensure it can connect and fetch data successfully.
- [ ] Ensure that CORS origins in `fastapi-backend/main.py` include your new Vercel domain to prevent blocked requests.

done ✅