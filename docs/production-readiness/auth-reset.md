# Password reset (F7.10)

## Flow

1. `POST /api/v1/auth/password-reset/request` — generic response (no enumeration)
2. Hashed one-time token stored (`password_reset_tokens`), 30-minute expiry
3. `POST /api/v1/auth/password-reset/confirm` — password ≥10 chars, revoke staff sessions
4. Audit events written

## Email unavailable

Development returns `devResetToken` for controlled testing.  
Staging/production: use admin-assisted delivery of the token out-of-band until SMTP is wired. Do not edit password hashes in SQL as standard procedure.
