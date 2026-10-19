# NCC Authentication API

NestJS authentication API using PostgreSQL and TypeORM. Next.js consumes the API and does not connect to PostgreSQL directly.

## Run locally

1. Copy `.env.example` to `.env` and enter your local PostgreSQL credentials.
2. Create the database named by `VNA_DB_DATABASE`.
3. Run `npm install --legacy-peer-deps` and `npm run start:dev`.
4. In a second terminal, run `npm run seed:auth`.
5. Send API requests to `http://localhost:3001/api/v1`.

The seed command only runs when `NODE_ENV=development`. It creates `so_admin` with role `SO` and `dn_demo` with role `DOANH_NGHIEP`; both use `AUTH_DEMO_PASSWORD` (default `Test@123456`). Passwords are stored as Argon2 hashes.

Set `AUTH_DEMO_SO_EMAIL` and `AUTH_DEMO_DN_EMAIL` to real inboxes before running the seed. Rerunning the seed updates those demo account email addresses without changing their passwords.

Request body:

```json
{
  "username": "so_admin",
  "password": "Test@123456",
  "rememberMe": false
}
```

Swagger docs: `http://localhost:3001/api/v1/api-docs`.

## Authentication endpoints

- `POST /auth/login`: returns a 15-minute access token and a refresh token. `rememberMe` controls refresh session lifetime (1 or 30 days).
- `GET /auth/me`: current account; requires `Authorization: Bearer <accessToken>`.
- `POST /auth/refresh`: accepts `{ "refreshToken": "..." }`, rotates it, and issues a new access token.
- `POST /auth/logout`: revokes the current session; requires a bearer access token.
- `POST /auth/forgot-password`: sends a one-time reset link by email.
- `POST /auth/reset-password`: consumes the reset token and revokes existing sessions.
- `PATCH /auth/change-password`: requires a bearer access token and current/new password; revokes all sessions after success.

Refresh tokens are stored only as hashes in the `auth_sessions` table. Access tokens expire after 15 minutes. Logout and password changes revoke the corresponding database sessions, so protected requests reject those tokens immediately.

The application validates DTOs globally and rejects unknown request fields. Swagger includes request schema examples.

For development, `VNA_DB_SYNCHRONIZE=true` creates/updates tables automatically. For a database managed by migrations, set `VNA_DB_SYNCHRONIZE=false` and `VNA_DB_MIGRATIONS_RUN=true`; the auth session migration creates `auth_sessions`.

## Password reset email

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` in `.env`. Port 587 normally uses `SMTP_SECURE=false`; port 465 normally uses `true`. Use the SMTP credentials or app password supplied by your email provider. Set `FRONTEND_RESET_PASSWORD_URL` to the page that reads the `token` and `email` query parameters.

Request a reset with `POST /api/v1/auth/forgot-password`:

```json
{ "email": "your-inbox@example.com" }
```

The reset link expires after 15 minutes and can be used once. The frontend submits it to `POST /api/v1/auth/reset-password`:

```json
{
  "email": "your-inbox@example.com",
  "token": "token-from-the-email-link",
  "newPassword": "NewTest@123456"
}
```

`VNA_DB_SYNCHRONIZE=true` is for a disposable local development database only. The old project migrations were removed with the sample business modules; do not enable schema synchronization in production.
