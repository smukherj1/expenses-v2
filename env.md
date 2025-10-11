Redaction .env

```shell
# SQLite

DB_FILE_NAME=file:data/local.db

# Better Auth

# Generated with `openssl rand -base64 32`
BETTER_AUTH_SECRET=<secret>
BETTER_AUTH_URL=http://localhost:3000

# Better Auth: Google Oauth. Can be skipped if you don't
# plan to use Google Auth login.
GOOGLE_OAUTH_CLIENT_ID=""
GOOGLE_OAUTH_CLIENT_SECRET=""

# Better Auth: Microsoft Oauth (Expires: dd/mm/yyyy). Can be
# skipped if you don't plan to use Microsoft login.
MICROSOFT_OAUTH_CLIENT_ID=""
MICROSOFT_OAUTH_CLIENT_SECRET=""

# Postgres
POSTGRES_USER=""
POSTGRES_ADDR="db"
POSTGRES_DB=""
# Password generated with openssl rand -hex 32
POSTGRES_PASSWORD=""
# Should be in the format postgresql://username:password@localhost:5432/database_name
POSTGRES_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_ADDR}:5432/${POSTGRES_DB}"

# Cloud flare tunnel
CLOUDFLARE_TUNNEL_TOKEN=""
```
