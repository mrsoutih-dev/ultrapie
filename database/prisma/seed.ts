import { PrismaClient, Role, PlanTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Ultrapie database...');

  // 1. Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ultrapie.com' },
    update: {},
    create: {
      email: 'admin@ultrapie.com',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyEvJbLd/5h1fQo03W9.gJ.zXUe8Z2K6', // changeme
      name: 'Ultrapie Admin',
    },
  });

  // 2. Create primary organization
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: 'ultrapie-hq' },
    update: {},
    create: {
      name: 'Ultrapie HQ',
      slug: 'ultrapie-hq',
      planTier: PlanTier.PRO,
      memberships: {
        create: {
          userId: adminUser.id,
          role: Role.OWNER,
        },
      },
    },
  });

  // 3. Create demo project
  const demoProject = await prisma.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: defaultOrg.id,
        slug: 'landing-vibe',
      },
    },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Landing Vibe Showcase',
      slug: 'landing-vibe',
      description: 'First demo project generated with Gemini',
      framework: 'vite-react',
      status: 'active',
      domains: {
        create: {
          hostname: 'landing-vibe.ultrapie.com',
          verificationStatus: 'verified',
          sslStatus: 'active',
        },
      },
    },
  });

  console.log(`✅ Seed finished! Org: ${defaultOrg.name}, Project: ${demoProject.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
