# Deployment Guide — Netlify, Hostinger, Vercel & Cloudflare Pages

This portfolio is a **100% static production React + Vite SPA** powered by **Firebase Firestore & Google Authentication** (no custom Node.js backend required in production). Running `npm run build` produces a self-contained `dist/` folder that already includes routing, security, caching, and compression configs for every major hosting provider.

---

## Prerequisites

- **Node.js 22** (pinned automatically via `.nvmrc`, `netlify.toml`, and `package.json`)
- Build command: `npm run build` (or `npm run build:prod` to type-check before building)
- Output directory: `dist`

---

## 1. Deploy on Netlify

### Option A — Git Auto-Deploy (Recommended)
1. Push this project to GitHub, GitLab, or Bitbucket.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Netlify automatically reads `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** `22`
   - SPA fallback redirects, asset caching, and Google Sign-In popup headers are preconfigured.
4. Click **Deploy site**.

### Option B — Manual Drag & Drop
1. Run `npm install && npm run build` locally.
2. Open [Netlify Drop](https://app.netlify.com/drop) and drag the generated **`dist/`** folder onto the page.
3. `dist/_redirects` and `dist/_headers` are automatically included in the build.

---

## 2. Deploy on Hostinger

### Option A — Standard Web Hosting (`public_html` File Manager / FTP)
1. Run `npm install && npm run build` locally.
2. Open **Hostinger hPanel → Files → File Manager → `public_html`**.
3. Upload **all contents inside the `dist/` folder** (including the hidden `.htaccess` file, `index.html`, `favicon.svg`, `assets/`, and `src/`).
   - Enable **"Show Hidden Files"** in File Manager to confirm `.htaccess` is inside `public_html`.
   - `.htaccess` automatically configures Apache/LiteSpeed SPA routing, Gzip compression, static asset caching, and Google Sign-In popup headers.

### Option B — Hostinger Node.js / Git Web Hosting
1. Connect your Git repository in Hostinger hPanel.
2. Set:
   - **Node version:** `22` (reads `.nvmrc`)
   - **Build command:** `npm run build`
   - **Publish / Output directory:** `dist`

---

## 3. Deploy on Vercel or Cloudflare Pages

- **Vercel:** Import your Git repo — `vercel.json` automatically sets the Vite framework, `dist` output, SPA rewrite, and headers.
- **Cloudflare Pages:** Import your Git repo, set **Build command** to `npm run build`, **Build output directory** to `dist`, and environment variable `NODE_VERSION=22`. `dist/_redirects` and `dist/_headers` are applied automatically.

---

## 4. Required One-Time Step: Authorize Your Live Domain in Firebase

Your public portfolio content and Contact Inquiry form work immediately after deployment.  
To sign into the hidden **Admin Studio (`/#admin` or `Ctrl/Cmd + Shift + A`)** on your new domain, authorize the domain in Firebase:

1. Open [Firebase Console](https://console.firebase.google.com/) and select your project.
2. Go to **Authentication → Settings → Authorized domains**.
3. Click **Add domain** and add your live hostname(s), for example:
   - `your-site.netlify.app`
   - `yourdomain.com` and `www.yourdomain.com`
4. Reload your site and sign in via `/#admin` with your authorized admin Google account.

---

## 5. Optional Environment Variables

By default, Firebase connects using `firebase-applet-config.json`. If you ever migrate to a different Firebase project or host under a subpath, you can configure optional `VITE_*` variables listed in `.env.example` directly in your hosting provider's dashboard.
