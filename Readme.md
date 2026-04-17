npx prisma generate --schema=src/database/schema.prisma

npx prisma db push --schema=src/database/schema.prisma --accept-data-loss
