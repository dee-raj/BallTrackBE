# BallTrack Backend

Cricket scoring backend API built with Node.js, Express, and Prisma.

## Setup Instructions

### 1. Prerequisite
Ensure you have Node.js and PostgreSQL installed.

### 2. Environment Setup
Create a `.env` file in the `backend` root and add your database URL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/balltrack"
JWT_SECRET="your_secret_key"
```

### 3. Database Initialization
Run the following commands to set up your database schema:

```bash
# Generate Prisma Client
npx prisma generate --schema src/database/schema.prisma

# Sync schema with database
npx prisma db push --schema src/database/schema.prisma --accept-data-loss
```

### 4. Running the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

## Troubleshooting

### "Argument tenant is missing" or Schema Issues
If you encounter errors related to missing arguments or schema mismatches:
1. Stop the running server (Ctrl+C).
2. Regenerate the Prisma client:
   ```bash
   npx prisma generate --schema src/database/schema.prisma
   ```
3. Restart the server.

### Database Migration
If you need to apply existing data to the new SaaS multi-tenant architecture, run:
```bash
npx ts-node src/database/migrate_to_saas.ts
```
