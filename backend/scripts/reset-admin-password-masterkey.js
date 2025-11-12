#!/usr/bin/env node

/**
 * Reset Strapi Admin Password using Master Key
 *
 * Usage: node reset-admin-password-masterkey.js <email> <strapi-url> <master-key> [new-password]
 *
 * Example:
 * node reset-admin-password-masterkey.js yazdannaderi@hotmail.com https://api.infinitycolor.co/api <token> MyNewPassword123
 */

const axios = require('axios');
const email = process.argv[2];
const strapiUrl = process.argv[3];
const masterKey = process.argv[4];
const newPassword = process.argv[5] || generateRandomPassword();

if (!email || !strapiUrl || !masterKey) {
  console.error('❌ Usage: node reset-admin-password-masterkey.js <email> <strapi-url> <master-key> [new-password]');
  console.error('\nExample:');
  console.error('  node reset-admin-password-masterkey.js yazdannaderi@hotmail.com https://api.infinitycolor.co/api YOUR_TOKEN MyPassword123');
  process.exit(1);
}

function generateRandomPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function resetAdminPassword() {
  try {
    console.log('\n🔐 Strapi Admin Password Reset (Master Key)');
    console.log('═'.repeat(60));

    const apiClient = axios.create({
      baseURL: strapiUrl,
      headers: {
        'Authorization': `Bearer ${masterKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Find admin user by email
    console.log(`\n🔍 Looking for admin user: ${email}`);

    let adminUserId;
    try {
      // Try the admin API endpoint
      const response = await apiClient.get('/admin/users');
      const user = response.data.data?.find(u => u.email === email);

      if (!user) {
        console.error(`❌ Admin user not found: ${email}`);
        console.log('\n📋 Available admin users:');
        response.data.data?.forEach(u => {
          console.log(`   - ${u.email}`);
        });
        process.exit(1);
      }

      adminUserId = user.id;
      console.log(`✅ Found user: ${user.email} (ID: ${adminUserId})`);
    } catch (error) {
      console.error('❌ Failed to fetch admin users:', error.response?.data?.message || error.message);
      process.exit(1);
    }

    // Update the password
    console.log(`\n💾 Updating password for ${email}...`);
    try {
      const updateResponse = await apiClient.put(
        `/admin/users/${adminUserId}`,
        { password: newPassword }
      );

      console.log('✅ Password updated successfully!\n');

      // Display results
      console.log('═'.repeat(60));
      console.log('🎉 Admin Password Reset Complete');
      console.log('═'.repeat(60));
      console.log(`📧 Email: ${email}`);
      console.log(`🔐 New Password: ${newPassword}`);
      console.log('═'.repeat(60));
      console.log('\n⚠️  Make sure to save this password in a secure location!');
      console.log('   You can now log in to the Strapi admin panel with these credentials.\n');

    } catch (error) {
      console.error('❌ Failed to update password:', error.response?.data?.message || error.message);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
