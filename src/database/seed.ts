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
  console.log('🌱 Interactive Seeding सुरू...\n');

  const roleInput = await question('Enter role (admin/scorer): ');

  // Validate input
  if (!Object.values(UserRole).includes(roleInput as UserRole)) {
    throw new Error('Invalid role. Use "admin" or "scorer".');
  }
  const role = roleInput as UserRole;

  const email = await question('Enter email: ');
  // is valid email 
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email.');
  }

  const password = await question('Enter password: ');
  // is valid password 
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error('Invalid password.');
  }

  const fullName = await question('Enter full name: ');
  const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      fullName,
      passwordHash: hashedPassword,
      role,
    },
  });

  console.log('\n✅ User created successfully!');
  console.table({ email, fullName, role });

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
