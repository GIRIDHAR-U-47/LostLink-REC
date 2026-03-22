# REC LostLink Core Logic

This document reflects the current logic implemented in `fastapi-backend/app/api` and the mobile/admin clients.

## Roles
- `USER`
- `ADMIN`

Role enforcement is done with JWT + `get_current_user` in protected routes.

## Main Domain Objects
### Item
Important fields:
- `type`: `LOST` or `FOUND`
- `status`: `OPEN`, `PENDING`, `AVAILABLE`, `CLAIMED`, `RETURNED`, `RESOLVED`, `ARCHIVED`, `DISPOSED`, `LOST`
- `Lost_ID` / `Found_ID`: generated tracking IDs
- admin metadata: `storage_location`, `admin_remarks`, `verified_by`, `verified_at`

### Claim
Important fields:
- `item_id`
- `claimant_id`
- `status`: `PENDING`, `APPROVED`, `REJECTED`
- `verificationDetails`
- `proofImageUrl`
- `Claim_ID`

### Notification
- Stored per user in `notifications` collection
- Read/unread tracking via `read`

## Active Workflows
### 1. User reports an item
- Endpoint: `POST /api/items/report`
- Mobile app submits multipart form.
- Current mobile screens send:
  - lost report: `type=LOST`, `status=PENDING`
  - found report: `type=FOUND`, `status=PENDING`
- Optional/required image behavior is handled in mobile UI.

### 2. Feed and discovery
- `GET /api/items/feed`: returns active items with statuses in `PENDING`, `OPEN`, `AVAILABLE`.
- `GET /api/items/found`: returns found items in `PENDING` or `AVAILABLE`.

### 3. Claims flow
- User submits claim: `POST /api/claims/submit`
- Admin reviews claims: `GET /api/claims/status`
- Admin decision: `PUT /api/claims/{id}/verify?status=APPROVED|REJECTED`
- On approval, item status is updated to `CLAIMED` and claimant gets a notification.

### 4. Admin operations
Implemented under `/api/admin`:
- Dashboard stats (`/stats/dashboard`, `/stats/category-breakdown`, `/stats/recovery-rate`)
- Search/filter items (`/items/search`)
- Assign storage (`/items/{item_id}/assign-storage`)
- Add found item directly (`/items/found`)
- Potential matches (`/items/matches`)
- Link lost/found (`/items/{item_id}/link`)
- Notify lost-item owner (`/items/{item_id}/notify-owner`)
- Physical handover (`/items/{item_id}/handover`) -> status `RETURNED`
- Archive/dispose (`/items/{item_id}/archive`, `/items/{item_id}/dispose`)
- Campus broadcast (`/broadcast`)
- Audit and profile routes

## Admin and User Clients
### Mobile app (`frontend`)
- Auth and role-based navigation in `src/navigation/AppNavigator.js`
- Uses `roles` array from login response
- Uses `src/services/adminApi.js` for admin features

### Web dashboard (`admin-dashboard`)
- Uses `src/services/adminService.js`
- Same backend routes with web UI

## Storage Paths
- Item images: `static/images/...`
- Claim proof images: `static/images/claims/...`
- Served by FastAPI static mount at `/static`

## Seeded Data
`fastapi-backend/seed_data.py` seeds:
- 1 admin user
- 2 student users
- sample lost/found items
- sample pending claim

## Notes
- `fastapi-backend/main.py` is the main app entry.
- `fastapi-backend/app/main.py` is a thin compatibility import wrapper.
