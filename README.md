# Warp9Net IPAM

This project currently runs as a React frontend with a managed backend integration.

## Planned self-hosted rewrite

To make deployment much simpler in Portainer, the rewrite will move to a standard self-hosted architecture:

- **Frontend:** existing React/Vite app
- **Backend API:** small REST API
- **Database:** MySQL
- **File uploads:** handled by the API and persisted on your server
- **Deployment:** Docker-friendly stack for Portainer

## Phased rewrite plan

### Phase 1 — Backend abstraction in the frontend
- Replace direct backend calls with a shared API client layer
- Keep the UI and workflows intact
- Define stable request/response types for:
  - auth
  - VLANs
  - devices
  - rack items
  - cable drops
  - PDU outlets
  - wireless networks
  - settings
  - profile
  - audit log
  - uploads

### Phase 2 — Self-hosted backend
- Build a small API service with:
  - login/logout/session auth
  - CRUD endpoints for all current resources
  - audit logging
  - file upload endpoints for avatars and PDFs

### Phase 3 — MySQL schema
- Create MySQL tables for:
  - users
  - profiles
  - app_settings
  - smtp_settings
  - vlans
  - devices
  - rack_items
  - cable_drops
  - pdu_outlets
  - wireless_networks
  - audit_log

### Phase 4 — Docker/Portainer deployment
- Create a simple stack with:
  - frontend
  - API
  - MySQL
- Add persistent volumes
- Add environment variable examples
- Document Portainer deployment clearly

## Notes

This rewrite is best done in small phases to control cost and reduce risk. The current app has direct coupling to the existing backend across auth, storage, settings, and CRUD flows, so replacing it in one step would be much riskier than a phased migration.
