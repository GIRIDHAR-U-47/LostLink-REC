# Admin Setup

This guide matches the current admin implementation in `frontend/src/screens/admin` and backend `/api/admin` routes.

## Admin Access
Admin login requires an account with role `ADMIN`.

Default seeded admin:
- Email: `admin@rec.edu.in`
- Password: `admin123`

## Role-Based Navigation
In mobile app (`frontend/src/navigation/AppNavigator.js`):
- If roles include `ADMIN` or `ROLE_ADMIN` -> `AdminNavigator`
- Else -> user navigator

## Mobile Admin Screens
- `AdminHomeScreen`
- `AdminFoundItemsScreen`
- `AdminLostItemsScreen`
- `AdminClaimsScreen`
- `AdminNotificationsScreen`
- `AdminProfileScreen`
- `AdminBroadcastScreen`

## Admin API Endpoints Used
### Dashboard
- `GET /api/admin/stats/dashboard`
- `GET /api/admin/stats/category-breakdown`
- `GET /api/admin/stats/recovery-rate`

### Item Management
- `GET /api/admin/items/search`
- `PUT /api/admin/items/{item_id}/assign-storage`
- `POST /api/admin/items/found`
- `GET /api/admin/items/{item_id}/context`
- `PUT /api/admin/items/{item_id}/link`
- `POST /api/admin/items/{item_id}/notify-owner`
- `POST /api/admin/items/{item_id}/handover`
- `POST /api/admin/items/{item_id}/archive`
- `POST /api/admin/items/{item_id}/dispose`

### Claims
- `GET /api/claims/status`
- `GET /api/claims/item/{item_id}`
- `PUT /api/claims/{id}/verify?status=APPROVED|REJECTED`

### Notifications and Broadcast
- `GET /api/admin/notifications`
- `PUT /api/admin/notifications/{notification_id}/read`
- `POST /api/admin/broadcast`

### Profile and Logs
- `GET /api/admin/profile`
- `GET /api/admin/login-history`
- `GET /api/admin/audit-logs`

## Run Admin Flows
1. Start backend:
```bash
cd fastapi-backend
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```
2. Start mobile app:
```bash
cd frontend
npm start
```
3. Login with admin credentials.
4. Open admin screens from Admin Home.

## Important Config
- Mobile app backend URL is in `frontend/src/services/api.js`.
- Update it when your machine/LAN IP changes.
