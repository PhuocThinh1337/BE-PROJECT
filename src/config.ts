export const load = () => ({
  jwt: {
    secret: process.env.VNA_TOKEN_SECRET_KEY,
    refreshSecret: process.env.VNA_REFRESH_TOKEN_SECRET_KEY,
  },
  port: Number(process.env.VNA_PORT || 3001),
  mail: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },
});
