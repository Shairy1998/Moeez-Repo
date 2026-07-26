# Deploy Riverside HMS to Azure

This project deploys as a **single Azure App Service** (Node.js 20) with **Azure Database for PostgreSQL**.

Frontend and API run on the same URL, so no extra CORS setup is needed.

## Architecture

- **Azure App Service (Linux)** — serves React frontend + Express API
- **Azure Database for PostgreSQL Flexible Server** — production database
- **GitHub Actions** — automatic deploy on push to `main`

## Option A: Automated setup (recommended)

### 1. Install Azure CLI

Download: https://learn.microsoft.com/cli/azure/install-azure-cli

Then sign in:

```powershell
az login
```

### 2. Create Azure resources

From the project root:

```powershell
.\azure\setup-resources.ps1
```

Save the output (app name, URL, database details).

### 3. Connect GitHub Actions

1. Open [Azure Portal](https://portal.azure.com) → your Web App → **Get publish profile**
2. Copy the entire XML file
3. On GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Value: paste the publish profile XML
4. Edit `.github/workflows/azure-webapps-node.yml` and set `AZURE_WEBAPP_NAME` to your app name from step 2

### 4. Deploy

Push to the `main` branch. GitHub Actions builds the frontend and deploys to Azure.

After deployment, open your app URL:

- **URL:** `https://<your-app-name>.azurewebsites.net`
- **Login:** `admin@riverside.local` / `Admin123!`

---

## Option B: Manual setup in Azure Portal

### 1. Create PostgreSQL database

1. **Create a resource** → **Azure Database for PostgreSQL flexible server**
2. Choose **Burstable B1ms** (low cost for testing)
3. Set admin username/password
4. Enable public access (or use VNet for production)
5. Create a database named `riverside_hms`

Connection string format:

```
postgresql://USER:PASSWORD@SERVER.postgres.database.azure.com:5432/riverside_hms?sslmode=require
```

### 2. Create App Service

1. **Create a resource** → **Web App**
2. Runtime: **Node 20 LTS**
3. OS: **Linux**
4. Plan: **Basic B1** (or Free F1 for testing — limited)

### 3. Configure App Service settings

Go to **Configuration → Application settings** and add:

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `JWT_SECRET` | At least 32 random characters |
| `CLIENT_ORIGIN` | `https://<your-app-name>.azurewebsites.net` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~20` |

Go to **Configuration → General settings** and set **Startup Command**:

```
npm run start:azure
```

### 4. Deploy from GitHub

1. Web App → **Deployment Center**
2. Source: **GitHub**
3. Organization/repo: `moeezjavaid0-eng/hospital-management-system-for-new`
4. Branch: `main`
5. Azure runs `npm install` and `npm run build` automatically

Or use the GitHub Actions workflow (Option A, step 3).

---

## Local development (PostgreSQL)

The app now uses PostgreSQL instead of SQLite. Run a local database:

```powershell
docker run --name riverside-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```

Copy `backend/.env.example` to `backend/.env`, then:

```powershell
npm install
npm run db:push
npm run db:seed
npm run dev:all
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| App shows default Azure page | Check startup command is `npm run start:azure` |
| Database connection failed | Verify `DATABASE_URL` and PostgreSQL firewall allows Azure services |
| 502 Bad Gateway | Check **Log stream** in Azure Portal for Node errors |
| Login fails | Ensure `db:seed` ran — check startup logs for seed output |

## Estimated monthly cost (Basic tier)

- App Service B1: ~$13/month
- PostgreSQL B1ms: ~$12/month
- **Total:** ~$25/month (use Free F1 + smaller DB for testing only)
