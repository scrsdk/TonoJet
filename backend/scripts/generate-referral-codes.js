#!/usr/bin/env node

// Script to generate referral codes for existing users who don't have one

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AV8R-${code}`;
}

async function generateCodesForExistingUsers() {
  try {
    // Find users without referral codes
    const usersWithoutCodes = await prisma.user.findMany({
      where: {
        referralCode: null
      }
    });

    console.log(`Found ${usersWithoutCodes.length} users without referral codes`);

    for (const user of usersWithoutCodes) {
      let referralCode;
      let codeExists = true;
      
      // Generate unique code
      while (codeExists) {
        referralCode = generateReferralCode();
        const existing = await prisma.user.findUnique({
          where: { referralCode }
        });
        codeExists = !!existing;
      }

      // Update user with new code
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode }
      });

      console.log(`✅ Generated code ${referralCode} for user ${user.username}`);
    }

    console.log('✅ All users now have referral codes!');
  } catch (error) {
    console.error('❌ Error generating referral codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateCodesForExistingUsers();
