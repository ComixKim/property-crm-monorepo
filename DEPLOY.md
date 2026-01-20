# Deployment Guide

This project is a Monorepo containing:
- `apps/web-client`: Next.js User Frontend
- `apps/web-admin`: Next.js Admin Dashboard
- `apps/api`: NestJS Backend API

## 1. Git Setup

The project is now initialized as a Git repository. To save your current progress:

```bash
git add .
git commit -m "Initial commit"
```

Then push to GitHub/GitLab:

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

## 2. Deployment

### Vercel (Recommended for Client/Admin)

1.  **Create New Project**: Import your Git repository.
2.  **Configure `web-client`**:
    *   **Root Directory**: Edit to `apps/web-client`.
    *   **Build Command**: Enable **Override** and paste:
        ```bash
        cd ../.. && npx turbo run build --filter=web-client
        ```
    *   **Install Command**: Enable **Override** and paste:
        ```bash
        cd ../.. && npm install
        ```
    *   **Framework Preset**: Select Next.js.
    *   **Environment Variables**: Copy values from `apps/web-client/.env.example`.
3.  **Configure `web-admin`** (Optional):
    *   Create a NEW project in Vercel.
    *   **Root Directory**: `apps/web-admin`.
    *   **Build Command**: Enable **Override** and paste:
        ```bash
        cd ../.. && npx turbo run build --filter=web-admin
        ```
    *   **Install Command**: `cd ../.. && npm install`

## Troubleshooting

### Vercel: "Configuration Settings differ from Project Settings"
This warning appears after you change settings (like Root Directory or Build Command). It means the currently live site was built with old settings.
**Fix:** Go to the **Deployments** tab, click the three dots (`...`) next to your latest deployment, and select **Redeploy**. This will trigger a new build using your *new* settings.

### Vercel: 404 Not Found after Deploy
If the build succeeds but you see a 404:
1.  Check **Output Directory** in Vercel.
2.  Ensure **Root Directory** is set to `apps/web-client` (or `apps/web-admin`).
3.  If `Root Directory` is correct, try setting **Output Directory** override to `.next`.

### Netlify

1.  **Import from Git**: Connect your repository.
2.  **Base Directory**: Set to `apps/web-client`.
3.  **Build Command**: `npm run build` (or detected default).
4.  **Publish Directory**: `.next` (or detected default).
5.  **Environment Variables**: Add in Netlify UI.

### API Deployment (Important)

The `apps/api` is a NestJS application. While Vercel can host it with usage of Serverless Functions, it often requires specific configuration (`standalone` build or adaptation).

**Recommended: Render, Railway, or Heroku**

1.  **Render/Railway**: Connect your repo.
2.  **Root Directory**: Set to `apps/api`.
3.  **Build Command**: `npm install && npm run build`
4.  **Start Command**: `npm run start:prod`
5.  **Environment Variables**: From `apps/api/.env.example`.
    *   `PORT`: Usually provided by platform.
    *   `CORS_ORIGINS`: Set to your deployed Vercel frontend URLs (comma separated), e.g. `https://my-frontend.vercel.app,https://my-admin.vercel.app`.
