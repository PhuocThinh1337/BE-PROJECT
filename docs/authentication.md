# Login API

The project is now limited to the authentication flow and the `users`/`roles` tables.

## Start

1. Copy `.env.example` to `.env`; set the PostgreSQL credentials and a private JWT secret.
2. Create the database named by `VNA_DB_DATABASE`.
3. Run `npm install --legacy-peer-deps`, then `npm run start:dev`.
4. Run `npm run seed:reference`, then `npm run seed:auth` in a second terminal.

The seed command is development-only and upserts demo users and enterprise records. SO usernames are `VNA00000001` and `VNA00000002`; enterprise usernames/tax codes are `0312345678` and `0101234567890`. All accounts use the `AUTH_DEMO_PASSWORD` value, defaulting to `Test@123456`. Legacy demo usernames `so_admin` and `dn_demo` are renamed to their compliant usernames when found. Profile and enterprise fields are populated for list/detail/filter/update testing. Use actual multipart requests to test file upload fields.

## Test

`POST http://localhost:3001/api/v1/auth/login`

```json
{
  "username": "VNA00000001",
  "password": "Test@123456",
  "rememberMe": false
}
```

Login success returns a 15-minute access token, refresh token, and user role. Missing fields return 400, invalid credentials 401, and locked accounts 403. Refresh session lifetime is 30 days when `rememberMe` is true and one day otherwise.

Swagger is available at `http://localhost:3001/api/v1/api-docs`.

## Email password reset

Set the SMTP variables in `.env` and use an email address you can receive in `AUTH_DEMO_SO_EMAIL` or `AUTH_DEMO_DN_EMAIL`. Rerun `npm run seed:auth` to attach that address to the demo account. `SMTP_FROM` must be an address your SMTP provider permits. Port 587 usually uses STARTTLS (`SMTP_SECURE=false`); port 465 usually uses TLS (`SMTP_SECURE=true`).

`POST /api/v1/auth/forgot-password` accepts `{ "email": "..." }`. A valid, registered email receives a six-digit OTP. Unknown addresses return 404; malformed email addresses return 400. The email includes the account username and the OTP's five-minute expiry. `POST /api/v1/auth/resend-forgot-password-otp` accepts the same body to issue a new code. Submit `{ "email": "...", "otpCode": "123456", "newPassword": "NewTest@123456", "confirmNewPassword": "NewTest@123456" }` to `POST /api/v1/auth/reset-password`. The backend stores an HMAC of the OTP, allows at most five incorrect attempts, and hashes the new password with Argon2. The UI should return the user to login after a successful reset.

## Session and password endpoints

All endpoints below are under `/api/v1`:

- `GET /auth/me`: bearer access token required.
- `POST /auth/refresh`: body `{ "refreshToken": "..." }`; rotates the refresh token.
- `POST /auth/logout`: bearer access token required; revokes its session.
- `PATCH /auth/change-password`: bearer access token required; body `{ "currentPassword": "...", "newPassword": "..." }`. A successful password change revokes all sessions.
- `POST /auth/change-email/request-otp`: bearer access token required; sends an OTP to the current email address. Call this when opening the change-email form and again to resend after the 60-second cooldown.
- `POST /auth/change-email/verify-otp`: bearer access token required; body `{ "otpCode": "123456" }`. On success, the user has five minutes to submit the new address.
- `PATCH /auth/change-email`: bearer access token required; body `{ "newEmail": "new-address@example.com" }`; requires successful OTP verification.

The FE validates `confirmNewPassword` against `newPassword` for `PATCH /auth/change-password` and omits the confirmation field from the API request, matching its `ChangePasswordRequest` model.

Set both `VNA_TOKEN_SECRET_KEY` and `VNA_REFRESH_TOKEN_SECRET_KEY` to different random secrets. Refresh token hashes and session revocation state are stored in PostgreSQL's `auth_sessions` table. The auth-session migration is enabled with `VNA_DB_MIGRATIONS_RUN=true`; `VNA_DB_SYNCHRONIZE=true` can create it in disposable development databases.

`VNA_DB_SYNCHRONIZE=true` is intended only for a disposable development database. The sample project's unrelated migrations were removed.
