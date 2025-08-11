# 🚀 Quick CI/CD Reference

## 🔧 One-Time Setup

1. **Get Tokens** 📋
   - VSCE_PAT: [Azure DevOps](https://dev.azure.com) → Personal Access Tokens
   - OVSX_PAT: [Open VSX](https://open-vsx.org) → Settings → Access Tokens

2. **Add GitHub Secrets** 🔐
   - Repository Settings → Secrets → Actions
   - Add `VSCE_PAT` and `OVSX_PAT`

3. **Create Production Environment** 🛡️
   - Settings → Environments → New environment: "production"
   - Add required reviewers (yourself)

## 📝 Publishing Commands

### Automated Publishing (Recommended)

```bash
# 1. Update version in package.json
npm version patch  # or minor/major

# 2. Push changes
git push origin main

# 3. Create release
git tag v0.1.94
git push origin v0.1.94

# Or use GitHub UI → Releases → Create new release
```

### Manual Publishing (Fallback)

```bash
# Install tools
npm install -g @vscode/vsce ovsx

# Package
vsce package

# Publish to VS Code Marketplace
vsce publish

# Publish to Open VSX Registry
ovsx publish *.vsix -p $OVSX_PAT
```

## 🔍 Pipeline Status

**Triggers:**

- ✅ **Push/PR**: Build & Test only
- ✅ **Release**: Full pipeline (Build → Package → Publish)

**Stages:**

1. 🧪 Build & Test (always runs)
2. 📦 Package (main branch + releases)
3. 🚀 Publish (releases only, needs approval)
4. 📎 Upload Asset (releases only)

## 💡 Quick Commands

```bash
# Local development
pnpm test        # Run tests
pnpm run lint    # Check code style
pnpm run compile # Build TypeScript

# Version management
npm version patch   # 0.1.93 → 0.1.94
npm version minor   # 0.1.93 → 0.2.0
npm version major   # 0.1.93 → 1.0.0

# Emergency publish
vsce publish --packagePath *.vsix
```

## 🚨 Troubleshooting

**Pipeline fails?**

- Check Actions tab for details
- Verify secrets are set
- Test locally first

**Publishing stuck?**

- Go to Actions → Review deployments
- Approve production deployment

**Token expired?**

- Regenerate in Azure DevOps/Open VSX
- Update GitHub secrets

---

📖 **Full docs:** [CI-CD-SETUP.md](./CI-CD-SETUP.md)
