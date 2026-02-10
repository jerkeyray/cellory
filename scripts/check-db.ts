/**
 * Check database connection and tables
 */

import { prisma } from '../app/lib/prisma';

async function checkDatabase() {
  try {
    console.log('Checking database connection...\n');

    // Try to query sessions table
    const sessionCount = await prisma.session.count();
    console.log(`✅ Sessions table exists: ${sessionCount} sessions`);

    // Try to query users table
    const userCount = await prisma.user.count();
    console.log(`✅ Users table exists: ${userCount} users`);

    // Try to query calls table
    const callCount = await prisma.call.count();
    console.log(`✅ Calls table exists: ${callCount} calls`);

    console.log('\n✅ Database connection is working!');
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
