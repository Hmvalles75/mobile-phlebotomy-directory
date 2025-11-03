# Admin Dashboard Guide

## Accessing the Admin Dashboard

1. Navigate to: `http://localhost:3000/admin` (or your production URL)
2. Enter the admin password
3. Click "Login"

## Setting Your Admin Password

The admin password is stored in `.env.local`:

```bash
ADMIN_PASSWORD=your_secure_password_here
```

**⚠️ IMPORTANT**: Change this to a strong, unique password before deploying to production!

### Default Password (Development Only)

If no password is set in `.env.local`, the system falls back to: `admin123`

This is **INSECURE** and only for development. Always set a proper password!

## How It Works

### 1. Provider Submits Application

When a provider fills out the form at `/add-provider`, their submission is:
- ✅ Saved to `data/pending-submissions.json` (not in git)
- ✅ Marked as "pending" status
- ✅ IP address and timestamp recorded for security

### 2. You Review in Admin Dashboard

The dashboard shows:
- **Pending** submissions (awaiting your review)
- **Approved** submissions (already added to directory)
- **Rejected** submissions (declined applications)

### 3. Take Action

For each submission, you can:

#### **Approve**
- Automatically converts submission data to CSV format
- Validates exactly 37 fields (prevents misalignment)
- Appends to `cleaned_providers.csv`
- Marks submission as "approved"
- Provider immediately appears in directory (after page reload)

#### **Reject**
- Marks submission as "rejected"
- Keeps the record for your reference
- Provider does NOT appear in directory

#### **Delete**
- Permanently removes the submission from the system
- Cannot be undone

## Admin Dashboard Features

### Summary Stats
At the top of the dashboard, you'll see:
- **Pending**: Submissions awaiting review
- **Approved**: Submissions you've added to the directory
- **Rejected**: Submissions you've declined

### Submission List (Left Side)
- Shows all submissions sorted by date
- Color-coded by status (yellow = pending, green = approved, red = rejected)
- Click any submission to view full details

### Submission Details (Right Side)
Shows complete information:
- Business name
- Contact person
- Email, phone, website
- Location and service area
- Description
- Years of experience
- Licensing and insurance status
- Certifications and specialties
- Submission timestamp and IP address

## Security Features

### Session Management
- Login creates a 24-hour session
- Session stored in secure HTTP-only cookie
- Auto-logout after 24 hours

### Password Protection
- Password stored in environment variable (never in code)
- No password visible in browser or logs
- Failed login attempts logged to console

### Data Protection
- Pending submissions stored outside git repo
- IP addresses tracked to prevent spam/abuse
- Admin-only access to all submission data

## Workflow Example

1. **Provider submits** application via `/add-provider`
2. **You receive** notification (submission appears in dashboard)
3. **You review** submission details:
   - Check contact information
   - Verify licensing claims
   - Review description and credentials
4. **You approve** → Provider instantly added to directory
5. **Dev server auto-reloads** → Changes appear immediately
6. **You commit to git** when ready to deploy

## Best Practices

### ✅ DO:
- Review all submissions within 24-48 hours
- Verify licensing and insurance before approving
- Check for duplicate providers
- Commit approved changes to git regularly
- Use a strong, unique admin password
- Keep `.env.local` secure and never commit it

### ❌ DON'T:
- Approve submissions without verifying credentials
- Share your admin password
- Commit `.env.local` or `data/pending-submissions.json` to git
- Use the default password in production
- Delete submissions unless absolutely necessary

## Troubleshooting

### "Unauthorized" error after login
**Cause**: Session expired or cookie was deleted

**Fix**: Simply log in again

### Submission doesn't appear after approval
**Cause**: Dev server needs to reload data

**Fix**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Or restart dev server: `npm run dev`

### Provider appears with incorrect data
**Cause**: CSV field misalignment (very rare with new system)

**Fix**:
1. Run `node scripts/validate-csv.js` to check
2. Manually edit the CSV row if needed
3. Delete and re-approve the submission

### Can't access admin dashboard
**Cause**: Admin route not set up or password not configured

**Fix**:
1. Ensure `.env.local` exists with `ADMIN_PASSWORD` set
2. Restart dev server to reload environment variables
3. Clear browser cookies and try again

## Data Storage

### `data/pending-submissions.json`
- Contains all submissions (pending, approved, rejected)
- JSON format for easy reading/editing
- **NOT in git** (added to `.gitignore`)
- Safe to delete old approved/rejected submissions

### `cleaned_providers.csv`
- Production provider database
- Approved submissions automatically added here
- **IS in git** - changes are version controlled
- 37 fields per row (strictly validated)

## Security Considerations

### Production Deployment

Before deploying to production:

1. **Set strong password** in `.env.local`:
   ```bash
   ADMIN_PASSWORD=your_very_secure_random_password_here
   ```

2. **Use HTTPS** (required for secure cookies)

3. **Consider rate limiting** to prevent brute force attacks

4. **Enable monitoring** to track login attempts

### Future Enhancements

For even better security, consider:
- Two-factor authentication (2FA)
- Email notifications when new submissions arrive
- Audit log of all admin actions
- Role-based access (multiple admin users)
- Integration with NextAuth.js or similar

## Support

If you encounter issues:
1. Check this guide first
2. Review browser console for error messages
3. Check dev server logs
4. Ensure all required files exist
5. Verify `.env.local` is configured correctly
