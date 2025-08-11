# 🔐 CI/CD Setup Guide

This guide walks you through setting up the complete CI/CD pipeline for automated VS Code extension publishing.

## Step 1: Get VS Code Marketplace Token (VSCE_PAT)

### Create Publisher Account

1. **Go to** [Azure DevOps](https://dev.azure.com)
2. **Sign in** with your Microsoft account
3. **Navigate to** User settings → Personal access tokens
4. **Click** "New Token"

### Configure Token

```
Name: VS Code Extension Publishing
Organization: [Select your organization]
Expiration: 1 year (recommended)
Scopes: Custom defined
```

**Required Scopes:**

- ✅ **Marketplace** → **Publish**
- ✅ **Identity** → **Read** (optional, for verification)

### Save Token

1. **Copy the token immediately** (you won't see it again)
2. **Store securely** - you'll add it to GitHub secrets

## Step 2: Get Open VSX Registry Token (OVSX_PAT)

### Create Account

1. **Go to** [Open VSX Registry](https://open-vsx.org/)
2. **Sign in** with GitHub account
3. **Navigate to** your profile → Settings

### Create Access Token

1. **Go to** "Access Tokens" section
2. **Click** "Create New Token"
3. **Configure**:
   ```
   Name: VS Code Extension Publishing
   Description: GitHub Actions publishing for filetree-pro
   ```
4. **Select Scope**: `publish-extensions`
5. **Click** "Create Token"

### Save Token

1. **Copy the token immediately**
2. **Store securely** for GitHub secrets

## Step 3: Configure GitHub Secrets

### Access Repository Secrets

1. **Go to** your GitHub repository
2. **Click** Settings → Security → Secrets and variables → Actions
3. **Click** "New repository secret"

### Add Required Secrets

**Secret 1: VSCE_PAT**

```
Name: VSCE_PAT
Secret: [Paste your Azure DevOps token here]
```

**Secret 2: OVSX_PAT**

```
Name: OVSX_PAT
Secret: [Paste your Open VSX token here]
```

### Verify Secrets

After adding, you should see:

- ✅ `VSCE_PAT` (created X minutes ago)
- ✅ `OVSX_PAT` (created X minutes ago)

## Step 4: Set Up Publisher Profile

### VS Code Marketplace

1. **Go to** [Visual Studio Marketplace Publishing Portal](https://marketplace.visualstudio.com/manage)
2. **Create publisher** if needed:
   ```
   Publisher ID: 0xtanzim (must match package.json)
   Display Name: 0xTanzim
   Email: your-email@example.com
   ```

### Open VSX Registry

1. **Go to** [Open VSX Publisher Portal](https://open-vsx.org/user-settings)
2. **Verify profile** information matches your needs

## Step 5: Configure Production Environment

### Create Environment

1. **Go to** repository Settings → Environments
2. **Click** "New environment"
3. **Name**: `production`

### Add Protection Rules

1. **Check** "Required reviewers"
2. **Add yourself** as required reviewer
3. **Save protection rules**

This adds a manual approval gate before publishing to marketplaces.

## Step 6: Test the Pipeline

### Create Test Release

1. **Update version** in `package.json`:

   ```json
   {
     "version": "0.1.93"
   }
   ```

2. **Commit and push** to main:

   ```bash
   git add package.json
   git commit -m "bump version to 0.1.93"
   git push origin main
   ```

3. **Create release** on GitHub:

   ```bash
   git tag v0.1.93
   git push origin v0.1.93
   ```

   Or use GitHub UI → Releases → Create new release

### Monitor Pipeline

1. **Go to** Actions tab in GitHub
2. **Watch** the "CI/CD Pipeline" workflow
3. **Stages should complete**:
   - ✅ Build & Test
   - ✅ Package Extension
   - ⏳ Publish Extension (waiting for approval)
   - ⏳ Upload Release Asset

4. **Approve publishing** in production environment
5. **Verify** extension appears in both marketplaces

## 🔍 Verification Checklist

After successful run:

### VS Code Marketplace

- [ ] Extension visible at: `https://marketplace.visualstudio.com/items?itemName=0xtanzim.filetree-pro`
- [ ] Version number matches release
- [ ] Download works correctly
- [ ] README displays properly

### Open VSX Registry

- [ ] Extension visible at: `https://open-vsx.org/extension/0xtanzim/filetree-pro`
- [ ] Version number matches release
- [ ] Download works correctly
- [ ] Metadata displays properly

### GitHub Release

- [ ] Release created with correct tag
- [ ] VSIX file attached as asset
- [ ] Release notes included

## 🛠️ Troubleshooting

### Common Issues

**"Authentication failed" during publish:**

```bash
# Check secrets are set correctly
# Verify token hasn't expired
# Ensure publisher ID matches package.json
```

**"Extension not found" error:**

```bash
# First time publishing - extension needs to exist
# Manually publish once, then automation works
```

**Pipeline stuck at approval:**

```bash
# Go to Actions → workflow run → Review deployments
# Click "Approve and deploy"
```

### Test Tokens Locally

Before setting up CI/CD, test tokens work:

```bash
# Install tools
npm install -g @vscode/vsce ovsx

# Test VS Code Marketplace token
vsce login 0xtanzim
# Paste your VSCE_PAT when prompted

# Test Open VSX token
echo "YOUR_OVSX_PAT" | ovsx create-namespace 0xtanzim
```

## 📋 Maintenance

### Token Renewal

- **Azure DevOps tokens** expire after selected period
- **Open VSX tokens** don't expire but can be revoked
- **Set calendar reminders** to renew before expiration
- **Update GitHub secrets** with new tokens

### Monitoring

- **Watch for failed builds** via GitHub notifications
- **Monitor marketplace metrics** for download trends
- **Check security advisories** for dependency updates

## 🚀 Ready to Go!

Once everything is set up:

1. **Make your changes** to the extension
2. **Push to main** branch
3. **Create a release** when ready to publish
4. **Pipeline automatically** builds, tests, and publishes
5. **Extension appears** in both marketplaces within minutes

---

**Need help?** Create an issue in the repository with the "ci-cd" label.
