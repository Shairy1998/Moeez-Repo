# Run this script after installing Azure CLI: https://learn.microsoft.com/cli/azure/install-azure-cli
# Usage: .\azure\setup-resources.ps1

$ErrorActionPreference = "Stop"

$ResourceGroup = "riverside-hms-rg"
$Location = "eastus"
$AppName = "hospital-management-system-$((Get-Random -Maximum 99999))"
$PlanName = "riverside-hms-plan"
$DbServer = "riverside-hms-db-$((Get-Random -Maximum 99999))"
$DbName = "riverside_hms"
$DbAdmin = "riversideadmin"
$DbPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
$JwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

Write-Host "Logging in to Azure..."
az login | Out-Null

Write-Host "Creating resource group: $ResourceGroup"
az group create --name $ResourceGroup --location $Location | Out-Null

Write-Host "Creating PostgreSQL Flexible Server (this may take several minutes)..."
az postgres flexible-server create `
  --resource-group $ResourceGroup `
  --name $DbServer `
  --location $Location `
  --admin-user $DbAdmin `
  --admin-password $DbPassword `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --storage-size 32 `
  --version 16 `
  --public-access 0.0.0.0 `
  --yes | Out-Null

Write-Host "Creating database: $DbName"
az postgres flexible-server db create `
  --resource-group $ResourceGroup `
  --server-name $DbServer `
  --database-name $DbName | Out-Null

Write-Host "Creating App Service plan..."
az appservice plan create `
  --resource-group $ResourceGroup `
  --name $PlanName `
  --location $Location `
  --sku B1 `
  --is-linux | Out-Null

Write-Host "Creating Web App: $AppName"
az webapp create `
  --resource-group $ResourceGroup `
  --plan $PlanName `
  --name $AppName `
  --runtime "NODE:20-lts" | Out-Null

$DatabaseUrl = "postgresql://${DbAdmin}:${DbPassword}@${DbServer}.postgres.database.azure.com:5432/${DbName}?sslmode=require"
$AppUrl = "https://${AppName}.azurewebsites.net"

Write-Host "Configuring app settings..."
az webapp config appsettings set `
  --resource-group $ResourceGroup `
  --name $AppName `
  --settings `
    NODE_ENV=production `
    DATABASE_URL="$DatabaseUrl" `
    JWT_SECRET="$JwtSecret" `
    CLIENT_ORIGIN="$AppUrl" `
    SCM_DO_BUILD_DURING_DEPLOYMENT=true `
    WEBSITE_NODE_DEFAULT_VERSION="~20" | Out-Null

Write-Host "Setting startup command..."
az webapp config set `
  --resource-group $ResourceGroup `
  --name $AppName `
  --startup-file "npm run start:azure" | Out-Null

Write-Host ""
Write-Host "Azure resources created successfully."
Write-Host "App URL: $AppUrl"
Write-Host "Web App name: $AppName"
Write-Host "Database server: $DbServer"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Download publish profile from Azure Portal -> Web App -> Get publish profile"
Write-Host "2. Add GitHub secret AZURE_WEBAPP_PUBLISH_PROFILE with the XML content"
Write-Host "3. Update .github/workflows/azure-webapps-node.yml AZURE_WEBAPP_NAME to: $AppName"
Write-Host "4. Push to main branch to trigger deployment"
Write-Host ""
Write-Host "Default login after deploy: admin@riverside.local / Admin123!"
