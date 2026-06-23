# Push all code to Git — steps

## 1. Create a new repo on GitHub/GitLab

- **GitHub:** https://github.com/new → enter repo name → **Create repository** (empty).
- Keep the repo empty.

---

## 2. Add, commit, remote, and push

In PowerShell or CMD, go to the project folder and run:

```powershell
cd d:\Playwright_old\playwright-ts
git add .
git commit -m "Initial commit: Playwright tests, Jenkinsfile, config"
git remote add origin https://github.com/YOUR-USERNAME/playwright-ts.git
git branch -M main
git push -u origin main
```

Replace `https://github.com/YOUR-USERNAME/playwright-ts.git` with **your repo URL** (username and repo name).

---

## 3. First-time push

- GitHub/GitLab will ask for login or a **Personal access token**.
- Token: GitHub → **Settings → Developer settings → Personal access tokens** → Generate new token.

---

## 4. Push future changes

```powershell
git add .
git commit -m "Describe what you changed"
git push
```
