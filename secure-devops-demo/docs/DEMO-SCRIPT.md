# GitHub Copilot + Secure DevOps — Live Demo Script
## Speaker Notes & Step-by-Step Guide

---

## Pre-Demo Setup Checklist

- [ ] VS Code open with `leaveController.js` in main pane
- [ ] GitHub Copilot extension enabled and signed in
- [ ] Terminal open at project root
- [ ] Browser tab 1: GitHub repo → Pull Requests
- [ ] Browser tab 2: GitHub repo → Security → Code scanning
- [ ] Browser tab 3: GitHub Actions pipeline (last run)
- [ ] Presenter note: Keep `vulnerable-example.js` closed initially

---

## Opening Narrative (1 min)

> "We're going to build a Leave Management microservice today — not to show you the app,
> but to show you what the developer experience looks like when AI and security are both 
> built into the workflow from day one. Every step you'll see maps to a real enterprise 
> concern: developer velocity, code quality, and security compliance."

---

## ACT 1 — GitHub Copilot (15 min)

### Demo 1: Intent-to-Code (5 min)

**File:** `src/controllers/leaveController.js`

**Steps:**
1. Delete the body of `router.post('/request', ...)` — leave only the comment above it
2. Position cursor below the comment
3. Wait 2–3 seconds for Copilot suggestion to appear
4. Press `Tab` to accept
5. **Talk track:** *"I described what I want in plain English. Copilot understood the intent,
   generated the entire async handler — input validation, balance check, DB call, error handling.
   This is 40+ lines I didn't write."*

**What to highlight:** Copilot used context from `leaveService.js` — it knew the method names.

---

### Demo 2: Copilot Chat — Code Explanation (3 min)

**Steps:**
1. Open `src/middleware/auth.js`
2. Select the entire `authenticateJWT` function
3. Open Copilot Chat (Ctrl+Shift+I)
4. Type: `"Explain what this function does and identify any security considerations"`
5. **Talk track:** *"This is powerful for onboarding junior developers, or when you inherit 
   legacy code from a team member who has left. Copilot explains it like a senior engineer 
   doing a code walkthrough."*

---

### Demo 3: Test Generation (5 min)

**File:** `tests/leaveController.test.js`

**Steps:**
1. Create a new empty test file
2. Type comment: `// Write Jest tests for POST /api/leave/request covering success, insufficient balance, missing auth, and validation errors`
3. Accept Copilot suggestions block by block
4. **Talk track:** *"Test coverage is the first thing that drops under delivery pressure. 
   Copilot removes the friction — describe what you want to test, it writes the boilerplate. 
   The developer just needs to verify the assertions make sense."*

**Show metric:** Before Copilot: 0% coverage. After: 80%+ with 5 minutes of work.

---

### Demo 4: PR Summary with Copilot (2 min)

**Steps:**
1. Open any recent PR in the GitHub UI
2. Click "Copilot" icon in the PR description area
3. Generate the summary
4. **Talk track:** *"Every PR now has a clear, structured summary — what changed, what files 
   were touched, what the reviewer should focus on. This reduces review time and improves 
   audit trails for compliance."*

---

## ACT 2 — Secure DevOps (20 min)

### Demo 5: Secret Scanning — Push Protection (5 min)

**Steps:**
1. Open `src/vulnerable-example.js`
2. Show the hardcoded secrets block (lines 35–39)
3. Stage and attempt to commit + push to GitHub:
   ```bash
   git add src/vulnerable-example.js
   git commit -m "add config"
   git push origin feature/demo-secrets
   ```
4. GitHub **blocks the push** with a push protection alert
5. Show the alert in terminal and in GitHub UI
6. **Talk track:** *"The developer never even got to raise a PR. The secret was caught at 
   the push boundary — before it ever touched the remote repo, before any pipeline ran. 
   This is shift-left security in its most literal form."*

**Show the fix:**
```js
// BAD
apiKey: 'sk-live-xK92mNpQr7vL4wT8aB3cD6eF1gH0iJ5'

// GOOD
apiKey: process.env.API_KEY
```

---

### Demo 6: Dependency Review on PR (4 min)

**Steps:**
1. Create a branch and modify `package.json`:
   ```bash
   git checkout -b feature/upgrade-deps
   ```
2. Change a dependency to a known vulnerable version:
   ```json
   "express": "4.17.1"
   ```
3. Raise a PR to main
4. Show the **Dependency Review** check failing in the PR
5. Click the check — show the CVE details, severity, and the fix recommendation
6. **Talk track:** *"Supply chain attacks are now the #1 attack vector for enterprise software. 
   This check runs automatically on every PR. No developer needs to manually audit 
   npm advisories — the platform enforces it."*

---

### Demo 7: CodeQL SAST — SQL Injection Detection (6 min)

**Steps:**
1. Show `vulnerable-example.js` — `getUserByName_VULNERABLE` function
2. Open GitHub → Security → Code scanning alerts
3. Show the SQL Injection alert CodeQL has already flagged
4. Click through to: file location → line highlight → **description → fix recommendation**
5. **Talk track:** *"CodeQL doesn't just say 'line 18 has a problem.' It traces the entire 
   data flow — from where user input enters the system to where it reaches the dangerous 
   sink. That's what makes it different from basic linting."*

**Show the fix side by side:**
```js
// VULNERABLE: String concatenation
const query = `SELECT * FROM users WHERE username = '${username}'`

// SAFE: Parameterized query
const query = 'SELECT * FROM users WHERE username = ?'
await db.execute(query, [username])
```

---

### Demo 8: Branch Protection — Policy Enforcement (3 min)

**Steps:**
1. Go to GitHub → Settings → Branches → Branch protection rules
2. Show the rules configured for `main`:
   - Require status checks: `CodeQL SAST`, `Secret Scanning`, `Dependency Review`
   - Require PR reviews: minimum 1
   - Restrict pushes to main
3. Attempt a direct push to main: show it fail
4. **Talk track:** *"Policy is enforced by the platform, not by process documents. 
   A developer cannot merge code that hasn't passed security gates — regardless of deadline 
   pressure or who is asking."*

---

### Demo 9: SBOM — Compliance Evidence (2 min)

**Steps:**
1. Go to GitHub Actions → last successful run
2. Open the `sbom-report` artifact
3. Download and show the SPDX JSON file
4. **Talk track:** *"Regulators, enterprise clients, and ISO auditors increasingly require 
   a Software Bill of Materials. This is generated automatically on every build — no 
   manual inventory, no spreadsheet. One artifact that proves what's in your software."*

---

## Closing Summary — The Security Pipeline Map

```
Developer types code
       │
       ▼
[COPILOT] Generates secure patterns, suggests fixes inline
       │
       ▼
git push ──► [SECRET SCANNING] Blocks hardcoded credentials
       │
       ▼
Pull Request ──► [DEPENDENCY REVIEW] Blocks vulnerable packages
       │          [CODEQL SAST] Detects injection, traversal, XSS
       │          [UNIT TESTS] Validates business logic
       ▼
Merge to main ──► [BRANCH PROTECTION] Enforces all gates passed
       │
       ▼
Build ──► [SBOM GENERATION] Creates compliance artifact
       │
       ▼
Deploy (only if everything above passed)
```

---

## Q&A Prep — Likely Questions

**Q: Does Copilot send our code to the cloud?**  
A: GitHub Copilot for Business has data privacy controls — code snippets used for suggestions are not retained for model training. Enterprise plans offer additional isolation.

**Q: How does this integrate with our existing SIEM/ticketing?**  
A: GitHub Advanced Security integrates with Jira, ServiceNow, and Splunk via webhooks and REST APIs. CodeQL alerts can auto-create Jira tickets.

**Q: What's the licensing model?**  
A: Copilot is per-seat (~$19–39/user/month). GitHub Advanced Security is per active committer. Both ROI well against a single critical vulnerability remediated post-production.

**Q: Can we use this with Azure DevOps instead of GitHub?**  
A: Copilot works in VS Code regardless of the SCM. GitHub Advanced Security is GitHub-native, but Microsoft Defender for DevOps offers similar scanning for Azure DevOps pipelines.
