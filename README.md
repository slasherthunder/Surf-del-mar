# Surf-del-mar

Website for the Surf Del Mar festival — celebrating surf culture, history, and community. Built for the Del Mar Historical Society by Torrey Pines students (Aaron Nayki, Jervis Fernandes, Keshav Bhaskar, Cole Chapman).

## Setup

```sh
npm install
npm run dev
```

Runs at `localhost:4321`.

## Commands

| Command           | Action                          |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start dev server                |
| `npm run build`   | Build for production (`./dist/`)|
| `npm run preview` | Preview production build       |

## Stack

Astro, coastal vintage design. Long-scroll event template with hero, reunion section, schedule, and sponsors.

## Firebase + Netlify (permanent save)

Schedule and image overrides are stored in **Firebase Firestore** only (no Storage) and written via **Netlify Functions**, so edits persist for everyone.

### 1. Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore** (Storage is not used).
3. In **Project settings > General**, copy the config and add to `.env` (see `.env.example`).
4. In **Firestore**, deploy rules from `firestore.rules`.
5. In **Project settings > Service accounts**, generate a new private key. You’ll use this in Netlify.

### 2. Netlify

1. Deploy the site to Netlify (build command: `npm run build`, publish: `dist`).
2. In **Site settings > Environment variables** add:
   - `ADMIN_PASSWORD` = same as your popup password (e.g. `surfdelmar`).
   - `FIREBASE_SERVICE_ACCOUNT` = full contents of the service account JSON (single line or paste the whole object).
3. Add the same `PUBLIC_FIREBASE_*` and `PUBLIC_ADMIN_PASSWORD` vars so the client can read from Firestore and send the password when saving.

### 3. Local testing with functions

```sh
npm install
npx netlify dev
```

Use `http://localhost:8888` (or the URL Netlify prints). Schedule save and image upload will hit the local functions.

### 4. First-time seed

After deploy, log in as admin (password in popup), go to **Edit calendar** and click **Save changes** once to write the default schedule to Firestore.
