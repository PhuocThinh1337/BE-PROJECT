# NCC Authentication API

NestJS authentication API using PostgreSQL and TypeORM. Next.js consumes the API and does not connect to PostgreSQL directly.

## Run locally

1. Copy `.env.example` to `.env` and enter your local PostgreSQL credentials.
2. Create the database named by `VNA_DB_DATABASE`.
3. Run `npm install --legacy-peer-deps` and `npm run start:dev`.
4. In a second terminal, run `npm run seed:reference` and then `npm run seed:auth`.
5. Send API requests to `http://localhost:3001/api/v1`.

The demo seed only runs when `NODE_ENV=development`. It creates SO users `VNA00000001` and `VNA00000002`, plus enterprise users `0312345678` and `0101234567-890`; all usernames follow the current role-specific format. Each account has populated profile data, and the two enterprise accounts have full enterprise records linked by `userId`. All demo accounts use `AUTH_DEMO_PASSWORD` (default `Test@123456`). Passwords are stored as Argon2 hashes. File metadata remains empty so uploads can be tested with real multipart files.

Set `AUTH_DEMO_SO_EMAIL` and `AUTH_DEMO_DN_EMAIL` to real inboxes before running the seed. Rerunning the seed updates those demo account email addresses without changing their passwords.

Request body:

```json
{
  "username": "VNA00000001",
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
- `POST /auth/email-otp`: sends/resends an OTP; body `{ "email": "...", "purpose": "FORGOT_PASSWORD|CHANGE_EMAIL|REGISTER_ENTERPRISE" }`. `CHANGE_EMAIL` needs a bearer token. An SO may include `targetUserId` when requesting OTP for another account; when omitted, BE resolves the account from the current email.
- `POST /auth/reset-password`: validates the OTP and password confirmation, then revokes existing sessions.
- `PATCH /auth/change-password`: requires a bearer access token and current/new password; revokes all sessions after success.
- `POST /auth/change-email/verify-otp`: verifies the OTP sent to the account's current email, for example `{ "email": "current-address@example.com", "otpCode": "123456", "targetUserId": "<user-uuid>" }` when an SO is changing another account.
- `PATCH /auth/change-email`: saves `{ "newEmail": "new-address@example.com" }` after OTP verification.
- `PATCH /auth/change-email/:userId`: lets an SO account update another SO or DOANH_NGHIEP email without OTP; changing the signed-in account itself requires OTP.
- `POST /auth/:userId/initialize-password`: lets an SO account set the target user's password; only that user's sessions are revoked.
- `POST /auth/register-enterprise/verify-email-otp`: verifies `{ "email": "...", "otpCode": "123456" }` before public enterprise registration.
- `POST /enterprises` can be used publicly after email OTP verification, or by a logged-in SO account without OTP. `GET /business-types` and `GET /business-industries` are public for enterprise signup.
- `GET /enterprises/me` and `PUT /enterprises/me` return/update the logged-in `DOANH_NGHIEP` account's enterprise record.

## Accident reports

- The BE creates `SIX_MONTHS` and `FULL_YEAR` report records for each enterprise for the current year. Missing records for a requested year are created when the report list is requested.
- `GET /accident-reports` lists all enterprises' reports for the SO role. `GET /accident-reports/me` lists only the signed-in enterprise's reports. Both accept `page`, `size`, `name`, `taxCode`, `reportPeriod`, `status`, `province`, `ward`, and `year`; when `year` is omitted the newest report year is used.
- `GET /accident-reports/:id` returns report details. SO can view all reports; DOANH_NGHIEP can view only its own.
- `PUT /accident-reports/:id` saves report progress as `IN_PROGRESS`. Include a `stampedReport` PDF to submit it and move it to `ACCEPTED`. Accepted reports cannot be edited. Declined reports can be corrected and resubmitted.
- `GET /accident-reports/:id/summary` returns the per-report aggregates. `GET /accident-reports/summary?year=` returns totals for accepted reports only. SO can export individual reports with `GET /accident-reports/:id/export` and the annual aggregate with `GET /accident-reports/summary/export?year=` (Word-compatible `.doc`).
- `GET /categories?type=INJURY_FACTOR|INJURY_TYPE|OCCUPATION` returns active reporting categories.
- Reporting configuration: authenticated `GET /report-configurations` returns period deadlines, enabled state, required fields, and the supported field keys. SO can update a period with `PUT /report-configurations/SIX_MONTHS` or `PUT /report-configurations/FULL_YEAR`; body properties are `enabled`, `deadlineMonth`, `deadlineDay`, `requiredFields`, and `description`; statutory periods cannot be disabled. SO can add categories with `POST /categories/:type` and edit/deactivate them with `PATCH /categories/:id`.
- Apply migration `CreateAccidentReports1810000000000` before starting the report module with schema synchronization disabled.
- Apply migration `CreateReportConfiguration1850000000000` to create default six-month (July 5) and full-year (January 10) settings. Required fields are configurable from the existing report fields; adding entirely new data fields still requires a code and database change. Apply `AddAccidentReportAudit1860000000000` to record submission and review metadata.

Refresh tokens are stored only as hashes in the `auth_sessions` table. Access tokens expire after 15 minutes. Logout and password changes revoke the corresponding database sessions, so protected requests reject those tokens immediately.

The application validates DTOs globally and rejects unknown request fields. Swagger includes request schema examples.

For local development, the example env uses `VNA_DB_SYNCHRONIZE=true` to create/update tables. Point it at a new or empty development database. If TypeORM reports `column "taxCode" ... contains null values`, the database already has enterprise rows from an older schema; create a separate empty database and update `VNA_DB_DATABASE` to use it, so existing data is preserved. For a database managed by migrations, set `VNA_DB_SYNCHRONIZE=false` and `VNA_DB_MIGRATIONS_RUN=true`.

## Password reset email

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` in `.env`. Port 587 normally uses `SMTP_SECURE=false`; port 465 normally uses `true`. Use the SMTP credentials or app password supplied by your email provider. The API emails a six-digit OTP for the frontend reset form.

Request or resend a reset OTP with `POST /api/v1/auth/email-otp`:

```json
{ "email": "your-inbox@example.com", "purpose": "FORGOT_PASSWORD" }
```

The OTP expires after 5 minutes and can be used once. Unknown email addresses return 404, and malformed addresses return 400. The recovery email includes the account username and expiry. The frontend submits the OTP to `POST /api/v1/auth/reset-password`:

```json
{
  "email": "your-inbox@example.com",
  "otpCode": "123456",
  "newPassword": "NewTest@123456",
  "confirmNewPassword": "NewTest@123456"
}
```

`VNA_DB_SYNCHRONIZE=true` is for a disposable local development database only. The old project migrations were removed with the sample business modules; do not enable schema synchronization in production.
