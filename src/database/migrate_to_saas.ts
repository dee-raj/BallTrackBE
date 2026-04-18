/**
 * migrate_to_saas.ts
 *
 * One-time migration script: assigns all existing (pre-SaaS) data to a default tenant.
 *
 * Run ONCE after `npx prisma migrate dev` has applied the new schema:
 *   npx ts-node src/database/migrate_to_saas.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting SaaS migration...\n');

  // ── 1. Create (or find) the default tenant ─────────────────────────────────
  const defaultSlug = 'default-org';
  const tenant = await prisma.tenant.upsert({
    where: { slug: defaultSlug },
    update: {},
    create: {
      name: 'Default Organization',
      slug: defaultSlug,
    },
  });
  console.log(`✅ Default tenant ready: ${tenant.id} (${tenant.name})`);

  // ── 2. Assign all users that have no tenant (legacy data) ──────────────────
  //    Skip users that are already assigned to a tenant (idempotent)
  const usersUpdated = await prisma.user.updateMany({
    where: { tenantId: null, role: { not: 'superadmin' } },
    data: { tenantId: tenant.id },
  });
  console.log(`✅ Users assigned to default tenant: ${usersUpdated.count}`);

  // ── 3. Assign all teams ────────────────────────────────────────────────────
  const teamsUpdated = await prisma.team.updateMany({
    where: { tenantId: 'default-org' },
    data: { tenantId: tenant.id },
  });
  console.log(`✅ Teams assigned: ${teamsUpdated.count}`);

  // ── 4. Assign all players ──────────────────────────────────────────────────
  const playersUpdated = await prisma.player.updateMany({
    where: { tenantId: 'default-org' },
    data: { tenantId: tenant.id },
  });
  console.log(`✅ Players assigned: ${playersUpdated.count}`);

  // ── 5. Assign all tournaments ──────────────────────────────────────────────
  const tournamentsUpdated = await prisma.tournament.updateMany({
    where: { tenantId: 'default-org' },
    data: { tenantId: tenant.id },
  });
  console.log(`✅ Tournaments assigned: ${tournamentsUpdated.count}`);

  // ── 6. Assign all matches ──────────────────────────────────────────────────
  const matchesUpdated = await prisma.match.updateMany({
    where: { tenantId: 'default-org' },
    data: { tenantId: tenant.id },
  });
  console.log(`✅ Matches assigned: ${matchesUpdated.count}`);

  console.log('\n🎉 SaaS migration complete!');
  console.log(`   Default Tenant ID: ${tenant.id}`);
  console.log('   All existing data is now owned by "Default Organization".');
  console.log('   You can rename this tenant later via the database directly.');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
