import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import readline from 'readline';
import { UserRole } from '../shared/constants';
import { config } from '../config';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('🌱 Interactive Seeding Started...\n');

  const roleInput = await question('Enter role (superadmin/admin/scorer): ');

  if (!Object.values(UserRole).includes(roleInput as UserRole)) {
    throw new Error('Invalid role. Use "superadmin", "admin", or "scorer".');
  }
  const role = roleInput as UserRole;

  const email = await question('Enter email: ');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email.');
  }

  const password = await question('Enter password: ');
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error(
      'Invalid password. Must be ≥8 chars with uppercase, lowercase, digit, and special character.'
    );
  }

  const fullName = await question('Enter full name: ');
  const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

  let tenantId: string | null = null;

  if (role === UserRole.superadmin) {
    // ── Superadmin: platform-level user with NO tenant ──────────────────────
    console.log('\n⚡ Creating superadmin (no tenant)...');

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        fullName,
        passwordHash: hashedPassword,
        role: UserRole.superadmin,
        tenantId: null,
      },
    });

    console.log('\n✅ Superadmin created successfully!');
    console.table({ email: user.email, fullName: user.fullName, role: user.role, tenantId: 'none' });

  } else {
    // ── Admin / Scorer: belongs to a tenant ────────────────────────────────
    const orgName = await question('Enter organization name: ');
    const slug =
      orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now();

    const tenant = await prisma.tenant.upsert({
      where: { slug },
      update: {},
      create: { name: orgName, slug },
    });
    tenantId = tenant.id;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        fullName,
        passwordHash: hashedPassword,
        role,
        tenantId: tenant.id,
      },
    });

    console.log('\n✅ User created successfully!');
    console.table({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: orgName,
      tenantId: tenant.id,
    });
  }

  rl.close();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
