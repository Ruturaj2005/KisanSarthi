# 🔧 Email Troubleshooting Guide

## Issue: Not Receiving OTP Emails

### Quick Checklist

- [ ] Using **Gmail.com account** (not college/org email)
- [ ] **2-Step Verification** enabled: https://myaccount.google.com/security
- [ ] **App Password** is 16 characters with spaces: `xxxx xxxx xxxx xxxx`
- [ ] `backend/.env` has correct EMAIL_USER and EMAIL_PASSWORD
- [ ] Backend restarted after changing `.env`

---

## Step-by-Step Fix

### 1. Check Gmail Settings
Go to https://myaccount.google.com/security
- ✅ 2-Step Verification **must be ON**
- ✅ App passwords section should be available

### 2. Generate New App Password
1. https://myaccount.google.com/apppasswords
2. Select: **Mail** and **Windows Computer**
3. Copy the **16-character password** (includes spaces)
4. Example: `szxs jkpk usra jcpr`

### 3. Update `backend/.env`
```env
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=szxs jkpk usra jcpr
```
**Important**: Include the spaces in the password!

### 4. Test Email (Optional)
Run test script to verify setup:
```bash
cd backend
node test-email.js
```

Expected output:
```
✅ SMTP connection successful!
✅ Email sent successfully!
```

### 5. Restart Backend
```bash
npm run dev:backend
```

You should see:
```
✅ SMTP transporter ready (Gmail App Password)
```

---

## Common Errors

### Error: "Invalid credentials"
- EMAIL_PASSWORD is wrong or missing
- Password should be **16 characters** with spaces
- Try generating a new one

### Error: "Less secure app access"
- Using your Gmail password instead of App Password
- Delete EMAIL_PASSWORD value
- Generate new App Password from Gmail account

### Error: "2-Step Verification not enabled"
- Go to https://myaccount.google.com/security
- Click "2-Step Verification"
- Follow setup steps
- Then get App Password

### Email goes to Spam
- Check spam folder first
- Add `sukaletrupti04@gmail.com` to contacts
- Gmail will trust it better next time

---

## Important Notes

⚠️ **Do NOT use**:
- Your actual Gmail password
- Old OAuth2 tokens
- Passwords without spaces

✅ **Do use**:
- 16-character App Password with spaces
- Fresh Gmail account (not college email)
- Basic auth (not OAuth2)

---

## Still Not Working?

Check backend logs for details:
```bash
npm run dev:backend
# Look for email error messages
```

Enable verbose logging:
```bash
NODE_DEBUG=nodemailer npm run dev:backend
```

---

## Alternative: Use Different Email Provider

If Gmail continues to fail, use **Mailtrap** (free for testing):

1. Sign up: https://mailtrap.io
2. Get SMTP credentials
3. Update `backend/src/config/mailer.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: 'your_mailtrap_user',
    pass: 'your_mailtrap_pass',
  },
});
```

All emails go to Mailtrap inbox (no real emails sent).
