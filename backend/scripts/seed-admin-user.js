#!/usr/bin/env node

/**
 * Seed Admin User Script (API-based)
 *
 * Creates an admin user in the local-user system via Strapi API.
 * Uses the master API token for authentication (same as WooCommerce importer).
 *
 * Usage: npm run seed:admin
 *        or: node scripts/seed-admin-user.js
 *
 * Admin Details:
 * - Phone: 09100000000
 * - Password: Set via ADMIN_PASSWORD env var or prompt (default: ADMIN_PASSWORD)
 * - Role: Admin (ID: 2)
 * - Verified: true
 * - Active: true
 *
 * Environment Variables:
 * - ADMIN_PASSWORD: Admin password (optional, will prompt if not set)
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

async function seedAdmin() {
  try {
    console.log('\n🌱 Infinity Admin User Seeder (API)');
    console.log('═'.repeat(60));

    // Get configuration
    const strapiUrl = await prompt('\n📍 Strapi API URL (default: http://localhost:1337/api): ');
    const apiUrl = strapiUrl || 'http://localhost:1337/api';

    const token = await prompt('🔑 Strapi Master API Token: ');
    if (!token) {
      console.error('❌ Token is required');
      process.exit(1);
    }

    // Create API client
    const apiClient = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('\n🔍 Checking for admin role...');

    // Verify admin role exists
    let adminRoleId = 2;
    try {
      const rolesResponse = await apiClient.get('/local-user-roles');
      const adminRole = rolesResponse.data.data?.find(r => r.id === adminRoleId);

      if (!adminRole) {
        console.error('❌ Admin role (ID: 2) not found in Strapi');
        process.exit(1);
      }

      console.log(`✅ Found admin role: "${adminRole.Title}"`);
    } catch (error) {
      console.error('❌ Failed to fetch roles:', error.response?.data?.message || error.message);
      process.exit(1);
    }

    // Check if admin user already exists
    console.log('\n🔍 Checking if admin user already exists...');
    let existingUser = null;

    try {
      const usersResponse = await apiClient.get('/local-users?filters[Phone][$eq]=09100000000');
      existingUser = usersResponse.data.data?.[0];
    } catch (error) {
      // Continue even if fetch fails
    }

    if (existingUser) {
      console.log(`⚠️  Admin user already exists (ID: ${existingUser.id})`);
      console.log(`   Phone: ${existingUser.Phone}`);
      console.log(`   Verified: ${existingUser.IsVerified}`);
      console.log(`   Active: ${existingUser.IsActive}`);

      const resetChoice = await prompt('\n🔄 Reset password to "ADMIN_PASSWORD"? (y/n): ');

      if (resetChoice.toLowerCase() === 'y') {
        console.log('\n💾 Updating admin user...');

        // Get password from environment or prompt
        let adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
          adminPassword = await prompt('🔐 Admin password (default: ADMIN_PASSWORD): ');
          adminPassword = adminPassword || 'ADMIN_PASSWORD';
        }

        try {
          const updateResponse = await apiClient.put(`/local-users/${existingUser.id}`, {
            data: {
              Password: adminPassword,
              IsVerified: true,
              IsActive: true,
              user_role: adminRoleId,
            },
          });

          console.log('✅ Admin user updated successfully!');
          displayUserInfo(updateResponse.data.data);
        } catch (error) {
          console.error('❌ Failed to update user:', error.response?.data?.message || error.message);
          process.exit(1);
        }
      }

      rl.close();
      process.exit(0);
    }

    // Create new admin user
    console.log('\n📝 Creating admin user...');
    console.log(`   Phone: 09100000000`);
    
    // Get password from environment or prompt
    let adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      adminPassword = await prompt('🔐 Admin password (default: ADMIN_PASSWORD): ');
      adminPassword = adminPassword || 'ADMIN_PASSWORD';
    }
    
    console.log(`   Password: ${adminPassword.replace(/./g, '*')}`); // Mask password in output
    console.log(`   Role: Admin`);

    try {
      // 1. Create local-user
      const userResponse = await apiClient.post('/local-users', {
        data: {
          Phone: '09100000000',
          Password: adminPassword,
          IsVerified: true,
          IsActive: true,
          user_role: adminRoleId,
        },
      });

      const adminUser = userResponse.data.data;
      console.log(`✅ Created local-user (ID: ${adminUser.id})`);

      // 2. Create local-user-info
      try {
        await apiClient.post('/local-user-infos', {
          data: {
            user: adminUser.id,
            FirstName: 'Admin',
            LastName: 'User',
          },
        });
        console.log(`✅ Created local-user-info`);
      } catch (error) {
        // May fail if user_info is auto-created
        console.log(`⚠️  User info (may have been auto-created)`);
      }

      // 3. Create local-user-wallet
      try {
        await apiClient.post('/local-user-wallets', {
          data: {
            user: adminUser.id,
            Balance: 0,
          },
        });
        console.log(`✅ Created local-user-wallet`);
      } catch (error) {
        // May fail if wallet is auto-created
        console.log(`⚠️  User wallet (may have been auto-created)`);
      }

      // 4. Create cart
      try {
        await apiClient.post('/carts', {
          data: {
            user: adminUser.id,
          },
        });
        console.log(`✅ Created cart`);
      } catch (error) {
        // May fail if cart is auto-created
        console.log(`⚠️  Cart (may have been auto-created)`);
      }

      console.log('\n' + '═'.repeat(60));
      console.log('🎉 Admin User Created Successfully!');
      console.log('═'.repeat(60));

      displayUserInfo(adminUser);

    } catch (error) {
      console.error('❌ Failed to create admin user:', error.response?.data?.message || error.message);
      if (error.response?.data?.error?.details) {
        console.error('Details:', error.response.data.error.details);
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function displayUserInfo(user) {
  console.log('\n📋 Admin User Details:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Phone: ${user.Phone}`);
  console.log(`   Password: ADMIN_PASSWORD`);
  console.log(`   Verified: ${user.IsVerified ? '✅ Yes' : '❌ No'}`);
  console.log(`   Active: ${user.IsActive ? '✅ Yes' : '❌ No'}`);
  if (user.user_role) {
    console.log(`   Role: ${user.user_role.Title} (ID: ${user.user_role.id})`);
  }
  if (user.user_info) {
    console.log(`   Name: ${user.user_info.FirstName} ${user.user_info.LastName}`);
  }
  if (user.user_wallet) {
    console.log(`   Wallet Balance: ${user.user_wallet.Balance} IRR`);
  }
  if (user.cart) {
    console.log(`   Cart: Created (ID: ${user.cart.id})`);
  }
  console.log('═'.repeat(60));
  console.log('\n⚠️  Important: Change the default password after first login!');
  console.log('   Login with: Phone: 09100000000, Password: ADMIN_PASSWORD\n');
}

// Allow execution as standalone script
if (require.main === module) {
  seedAdmin()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
