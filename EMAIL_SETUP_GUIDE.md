# 📧 Gmail OTP Email Setup Guide

The project is now configured to use **Gmail App Password** (simpler than OAuth2).

## Quick Setup (2 minutes)

### 1. Get Gmail App Password
- Go to: https://myaccount.google.com/apppasswords
- Select **Mail** and **Windows Computer**
- Google will generate a **16-character password**
- Copy it

### 2. Update `backend/.env`

Replace `your_gmail_app_password_here` with the password from step 1:

```env
EMAIL_USER=sukaletrupti04@gmail.com
EMAIL_PASSWORD=your_gmail_app_password_here
```

### 3. Restart Backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ SMTP transporter ready (Gmail App Password)
```

---

## Testing OTP Email

1. Go to frontend: http://localhost:3000
2. Sign up with any email
3. The OTP will be:
   - **Sent to your email** (if setup correct)
   - **Logged in backend console** for testing (if email fails)
   - Valid for **10 minutes**

---

## Troubleshooting

### "SMTP transporter verification failed"
- ❌ EMAIL_PASSWORD is wrong or missing
- ✅ Copy the 16-char password again from Gmail

### "Email failed to send"
- Check if **2-Step Verification** is enabled: https://myaccount.google.com/security
- If not enabled, enable it first, then get App Password
- App Password only works with 2-Step Verification enabled

### "Login with app password not allowed"
- This means Gmail blocked the attempt (less secure app)
- Use **App Password** (16-char), not your Gmail password

---

## Email Configuration

**File**: `backend/.env`
```
EMAIL_USER=your_gmail@gmail.com          # Gmail address
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx      # 16-char App Password
```

**Transporter Type**: Basic (Gmail App Password)
- ✅ Simple setup
- ✅ Works reliably
- ✅ No OAuth2 complexity
- ✅ 10-minute OTP expiration

---

## What Changed

### Before (OAuth2 - Broken)
- Required: CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN
- Refresh tokens expire
- Complex Google Cloud setup

### After (App Password - Working)
- Required: EMAIL_USER, EMAIL_PASSWORD
- Simple 2-minute Gmail setup
- No expiration issues
- Works out of the box

---

Need help? Check backend logs:
```bash
npm run dev:backend
# Look for email status messages
```
