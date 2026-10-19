# Login API

The project is now limited to the authentication flow and the `users`/`roles` tables.

## Start

1. Copy `.env.example` to `.env`; set the PostgreSQL credentials and a private JWT secret.
2. Create the database named by `VNA_DB_DATABASE`.
3. Run `npm install --legacy-peer-deps`, then `npm run start:dev`.
4. Run `npm run seed:auth` in a second terminal.

The seed command is development-only and inserts demo users only when their usernames do not already exist. `so_admin` has role `SO`; `dn_demo` has role `DOANH_NGHIEP`. Both use the `AUTH_DEMO_PASSWORD` value, defaulting to `Test@123456`.

## Test

`POST http://localhost:3001/api/v1/auth/login`

```json
{
  "username": "so_admin",
  "password": "Test@123456",
  "rememberMe": false
}
```

Login success returns a 15-minute access token, refresh token, and user role. Missing fields return 400, invalid credentials 401, and locked accounts 403. Refresh session lifetime is 30 days when `rememberMe` is true and one day otherwise.

Swagger is available at `http://localhost:3001/api/v1/api-docs`.

## Email password reset

Set the SMTP variables in `.env` and use an email address you can receive in `AUTH_DEMO_SO_EMAIL` or `AUTH_DEMO_DN_EMAIL`. Rerun `npm run seed:auth` to attach that address to the demo account. `SMTP_FROM` must be an address your SMTP provider permits. Port 587 usually uses STARTTLS (`SMTP_SECURE=false`); port 465 usually uses TLS (`SMTP_SECURE=true`).

`POST /api/v1/auth/forgot-password` accepts `{ "email": "..." }`. The email contains a 15-minute link to `FRONTEND_RESET_PASSWORD_URL` with `token` and `email` query values. The frontend then posts `{ "email": "...", "token": "...", "newPassword": "..." }` to `POST /api/v1/auth/reset-password`. The backend stores only a hash of the one-time token and hashes the new password with Argon2.

## Session and password endpoints

All endpoints below are under `/api/v1`:

- `GET /auth/me`: bearer access token required.
- `POST /auth/refresh`: body `{ "refreshToken": "..." }`; rotates the refresh token.
- `POST /auth/logout`: bearer access token required; revokes its session.
- `PATCH /auth/change-password`: bearer access token required; body `{ "currentPassword": "...", "newPassword": "..." }`. A successful password change revokes all sessions.

Set both `VNA_TOKEN_SECRET_KEY` and `VNA_REFRESH_TOKEN_SECRET_KEY` to different random secrets. Refresh token hashes and session revocation state are stored in PostgreSQL's `auth_sessions` table. The auth-session migration is enabled with `VNA_DB_MIGRATIONS_RUN=true`; `VNA_DB_SYNCHRONIZE=true` can create it in disposable development databases.

`VNA_DB_SYNCHRONIZE=true` is intended only for a disposable development database. The sample project's unrelated migrations were removed.
