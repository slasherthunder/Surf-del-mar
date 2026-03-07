# Firebase setup (free plan only)

This project uses **Firebase Spark (free)**. You only need **Firestore** (no Storage). No billing or Blaze plan is required.

---

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name it (e.g. `surf-del-mar`), turn off Google Analytics if you don’t need it, then **Create project**.

---

## 2. Enable Firestore

1. In the left sidebar, open **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Start in test mode** (we’ll lock it down with rules next).
4. Pick a location (e.g. `us-central1`) and confirm.

---

## 3. Get your web app config (for the site)

1. Click the **gear icon** next to “Project Overview” → **Project settings**.
2. Under **Your apps**, click the **</>** (web) icon to add a web app.
3. Register the app (e.g. name “Surf Del Mar”), no Firebase Hosting needed.
4. Copy the `firebaseConfig` object. You’ll use it in `.env` like this:

```env
PUBLIC_FIREBASE_API_KEY=your_api_key_here
PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
PUBLIC_FIREBASE_APP_ID=your_app_id
```

(Use the same admin password as your popup, e.g. `surfdelmar`.)

```env
PUBLIC_ADMIN_PASSWORD=surfdelmar
```

---

## 4. Create a service account key (for Netlify only)

This is used only by the Netlify Functions that **write** to Firestore and Storage. It never runs in the browser.

1. In **Project settings**, open the **Service accounts** tab.
2. Click **Generate new private key** → confirm. A JSON file will download.
3. **Do not commit this file.** You’ll paste its contents into a Netlify env var (see below).

---

## 5. Deploy Firestore rules (stay on free plan)

We use **read-only** rules for the data the site reads; only the server (Netlify + service account) can write. **Storage is not used**—image overrides are stored in Firestore as data URLs.

1. In the console go to **Firestore Database → Rules**.
2. Replace everything with this, then click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /content/schedule {
      allow read: if true;
      allow write: if false;
    }
    match /content/imageOverrides {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 6. Set env vars in Netlify

In your Netlify site: **Site configuration → Environment variables** (or **Build & deploy → Environment**).

Add:

| Variable | Value | Notes |
|----------|--------|--------|
| `ADMIN_PASSWORD` | e.g. `surfdelmar` | Same as your login popup password. |
| `FIREBASE_SERVICE_ACCOUNT` | Entire JSON from step 5 | Paste the whole file content (as one line is fine). |
| `PUBLIC_FIREBASE_API_KEY` | From step 4 | So the site can read Firestore. |
| `PUBLIC_FIREBASE_AUTH_DOMAIN` | From step 4 | |
| `PUBLIC_FIREBASE_PROJECT_ID` | From step 4 | |
| `PUBLIC_FIREBASE_STORAGE_BUCKET` | From step 4 | |
| `PUBLIC_FIREBASE_APP_ID` | From step 4 | |
| `PUBLIC_ADMIN_PASSWORD` | Same as `ADMIN_PASSWORD` | Optional; defaults to `surfdelmar` in code. |

Redeploy the site after changing env vars so the build and functions see them.

---

## Free plan limits (Spark)

- **Firestore:** 1 GiB storage, 50K reads / 20K writes / 20K deletes per day.

Image overrides are stored as data URLs inside Firestore (no Storage). Each document is limited to 1MB, so keep the number/size of replaced images modest (e.g. a few small images). For a single festival site this is enough on the free plan.

---

## Quick checklist

- [ ] Firebase project created  
- [ ] Firestore created (test mode then rules updated)  
- [ ] Web app added and config copied into `.env` / Netlify  
- [ ] Service account key generated and pasted into Netlify as `FIREBASE_SERVICE_ACCOUNT`  
- [ ] All env vars set in Netlify and site redeployed  
- [ ] Log in as admin once and click **Save changes** on the schedule to seed Firestore  
