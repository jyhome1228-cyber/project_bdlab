# BDLab Client Access Setup

## Implemented

- `client.html`: client registration request + approved access code entry
- `admin.html`: client request list, approve/reject, access-code issuance
- `js/client-data.js`: shared data adapter
- `js/firebase-config.js`: Firebase web config slot
- `firestore.rules`: public request creation, admin-only review, non-enumerable access-code validation
- `css/altos.css`: editorial visual system + responsive header rules

## Prototype mode

When `window.BDLAB_FIREBASE_CONFIG` is `null`, the client/admin system uses local browser storage only. This is for UI/flow review and is not a shared production database.

## Production activation

1. Create a dedicated Firebase project for BDLab.
2. Enable Firestore Database.
3. Enable Email/Password Authentication.
4. Create the admin account with email `jyhome1228@gmail.com`.
5. Replace `window.BDLAB_FIREBASE_CONFIG = null` in `js/firebase-config.js` with the Firebase web app config.
6. Deploy `firestore.rules` to the BDLab Firebase project.
7. Verify client request submission from another device and admin approval.
8. In `js/main.js`, change `CLIENT_GATE_ENABLED` to `true` only after the backend works.

## Security note

GitHub Pages is a static host. A JavaScript redirect can provide the intended client UX, but it cannot make existing static project HTML/image URLs truly private. For strict confidentiality, protected project content/assets should be moved behind authenticated Firebase Hosting/Storage (or another server-side authorization layer) before enabling the final gate.
