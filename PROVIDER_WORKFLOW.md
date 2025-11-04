# Provider Submission & Deployment Workflow

## Overview

This document explains the automated workflow for managing new provider submissions and deploying them to production.

## How It Works

### 1. Provider Submits Application

When a provider fills out the form at `/add-provider`:

- ✅ Submission is **automatically saved** to `data/pending-submissions.json`
- ✅ You receive an **email notification** at `hector@mobilephlebotomy.org`
- ✅ Provider sees confirmation message

### 2. Admin Reviews Submission

Go to your admin dashboard:
- **Local:** http://localhost:3000/admin
- **Production:** https://yourdomain.com/admin

**Login with:** Password from `.env.local` (`ADMIN_PASSWORD`)

In the dashboard you can:
- View all pending submissions
- See submission details (contact info, services, credentials)
- **Approve** - Adds to directory
- **Reject** - Marks as rejected
- **Delete** - Permanently removes

### 3. Approve Provider (Automatic)

When you click "Approve & Add to Directory":

1. ✅ Provider data is added to `cleaned_providers.csv`
2. ✅ `py convert_csv.py` runs automatically (rebuilds `data/providers.json`)
3. ✅ Provider is now in your local database
4. ✅ Status changes to "approved"

### 4. Deploy to Production

Two options:

#### Option A: One-Click Deploy (Recommended)
1. Click the **"🚀 Deploy Changes"** button in the admin header
2. Confirms you want to deploy
3. Automatically commits and pushes changes
4. Vercel/your hosting detects the push and deploys

#### Option B: Manual Deploy
```bash
node scripts/auto-deploy.js
```

Or manually:
```bash
git add cleaned_providers.csv data/providers.json public/data/providers.json
git commit -m "Add approved provider"
git push
```

## Email Notifications Setup

To enable email notifications, you need a Resend API key:

1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Get your API key
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_your_key_here
   ```
4. Restart your dev server

### Email Domain Setup (Production)

For production emails from `noreply@mobilephlebotomy.org`:

1. Add domain in Resend dashboard
2. Add DNS records (they'll provide)
3. Verify domain
4. Update the "from" address in `app/api/submit-provider/route.ts` if needed

**Without Resend configured:** Submissions still save to dashboard, just no email notifications.

## File Structure

```
📁 Project Root
├── 📄 data/pending-submissions.json      # Pending submissions (gitignored)
├── 📄 cleaned_providers.csv              # Main provider database
├── 📄 data/providers.json                # JSON version for site
├── 📄 public/data/providers.json         # Public JSON version
├── 📁 app/
│   ├── 📁 add-provider/
│   │   └── page.tsx                      # Provider submission form
│   ├── 📁 admin/
│   │   └── page.tsx                      # Admin dashboard
│   └── 📁 api/
│       ├── 📁 submit-provider/
│       │   └── route.ts                  # Handles form submission + email
│       └── 📁 admin/
│           ├── 📁 submissions/
│           │   ├── route.ts              # Get all submissions
│           │   └── [id]/route.ts         # Approve/reject/delete
│           └── 📁 deploy/
│               └── route.ts              # Trigger deployment
├── 📁 scripts/
│   ├── auto-deploy.js                    # Auto-deploy script
│   └── convert_csv.py                    # CSV to JSON converter
└── 📁 lib/
    ├── pending-submissions.ts            # Submission CRUD operations
    └── admin-auth.ts                     # Admin authentication
```

## Complete Workflow Example

### Scenario: New provider "Mobile Labs Pro" applies

1. **Provider fills form** → Submission saved + email sent ✅
2. **You receive email** at 12:02pm with all details ✅
3. **You log into admin** at http://localhost:3000/admin ✅
4. **You see submission** in "Pending" list ✅
5. **You click submission** to review details ✅
6. **You click "Approve"** → Added to CSV + JSON rebuilt ✅
7. **You click "🚀 Deploy Changes"** → Git commit + push ✅
8. **Vercel deploys** → Live in 2-3 minutes ✅

## Troubleshooting

### "No submissions in dashboard"
- Check `data/pending-submissions.json` exists and has content
- Try refreshing the page
- Check browser console for errors

### "Approval doesn't rebuild JSON"
- Manually run: `py convert_csv.py`
- Check Python is installed: `py --version`
- Check for errors in server logs

### "Deploy button doesn't work"
- Check git is configured: `git status`
- Ensure you have push access to the repository
- Try manual deploy: `node scripts/auto-deploy.js`

### "No email notifications"
- Check `RESEND_API_KEY` is in `.env.local`
- Restart dev server after adding key
- Check server logs for email errors
- Verify key is valid in Resend dashboard

## Security Notes

- Admin password is stored in `.env.local` (never commit this file)
- Sessions expire after 24 hours
- Pending submissions are gitignored (not in repository)
- IP addresses are logged for security tracking

## Future Improvements

Potential enhancements:
- [ ] Email provider when approved/rejected
- [ ] Bulk approve multiple submissions
- [ ] Image upload for logos
- [ ] Preview provider page before approval
- [ ] Analytics dashboard for submissions
- [ ] Automatic duplicate detection

---

**Questions?** Contact: hector@mobilephlebotomy.org
