# Git वर सगळा code push करणे – steps

## 1. GitHub/GitLab वर नवीन repo बनवा

- **GitHub:** https://github.com/new → repo नाव द्या → **Create repository** (empty).
- Repo empty ठेवा.

---

## 2. सगळे add + commit + remote + push

PowerShell किंवा CMD मध्ये project folder मध्ये जा आणि हे commands चालवा:

```powershell
cd d:\Playwright_old\playwright-ts
git add .
git commit -m "Initial commit: Playwright tests, Jenkinsfile, config"
git remote add origin https://github.com/TUMCHA-USERNAME/playwright-ts.git
git branch -M main
git push -u origin main
```

**तुमचा repo URL** ऐवजी `https://github.com/TUMCHA-USERNAME/playwright-ts.git` बदला (username आणि repo नाव).

---

## 3. पहिल्यांदा push करताना

- GitHub/GitLab login किंवा **Personal access token** मागेल.
- Token: GitHub → **Settings → Developer settings → Personal access tokens** → Generate new token.

---

## 4. पुढे बदल push करायचे असल्यास

```powershell
git add .
git commit -m "काय बदल केला ते लिहा"
git push
```
