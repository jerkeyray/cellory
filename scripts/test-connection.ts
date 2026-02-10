/**
 * Test database connection
 */

import { prisma } from '../app/lib/prisma';

async function testConnection() {
  console.log('Testing database connection...\n');

  try {
    // Simple query to wake up the database
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful!\n');

    // Test session table specifically
    const sessionCount = await prisma.session.count();
    console.log(`✅ Sessions table accessible: ${sessionCount} sessions`);

    // Test user table
    const userCount = await prisma.user.count();
    console.log(`✅ Users table accessible: ${userCount} users`);

    console.log('\n✅ All database tables are accessible!');
  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);

    if (error.message?.includes("Can't reach database")) {
      console.error('\n💡 Your Neon database may be suspended.');
      console.error('   Solutions:');
      console.error('   1. Wait 30 seconds and try again (auto-wakes)');
      console.error('   2. Visit your Neon dashboard to wake it manually');
      console.error('   3. Check your DATABASE_URL is correct');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
