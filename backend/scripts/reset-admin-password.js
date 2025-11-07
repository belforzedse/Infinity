#!/usr/bin/env node

/**
 * Reset Strapi Admin Password
 *
 * Usage: node reset-admin-password.js <email> [new-password]
 *
 * If new-password is not provided, a random one will be generated.
 * The new password will be displayed in the console.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const email = process.argv[2];
const newPassword = process.argv[3] || generateRandomPassword();

if (!email) {
  console.error('❌ Usage: node reset-admin-password.js <email> [new-password]');
  process.exit(1);
}

/**
 * Generate a random strong password
 */
function generateRandomPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Connect to the database and reset password
 */
async function resetAdminPassword() {
  let pool;

  try {
    // Get database configuration from environment
    const databaseUrl = process.env.DATABASE_URL;
    const databaseClient = process.env.DATABASE_CLIENT || 'postgres';

    if (!databaseUrl && databaseClient === 'postgres') {
      console.error('❌ Missing DATABASE_URL environment variable');
      process.exit(1);
    }

    console.log(`🔍 Connecting to ${databaseClient} database...`);

    // Create database pool
    const poolConfig = databaseUrl
      ? { connectionString: databaseUrl }
      : {
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT) || 5432,
          database: process.env.DATABASE_NAME || 'strapi',
          user: process.env.DATABASE_USERNAME || 'strapi',
          password: process.env.DATABASE_PASSWORD || 'strapi',
        };

    pool = new Pool(poolConfig);

    // Test connection
    const testConnection = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Find admin user by email
    console.log(`🔍 Looking for admin user with email: ${email}`);
    const userResult = await pool.query(
      'SELECT id, email FROM admin_users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ Admin user not found with email: ${email}`);
      console.log('\n📋 Available admin users:');
      const allUsers = await pool.query('SELECT id, email FROM admin_users');
      allUsers.rows.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`);

    // Hash the new password
    console.log('🔐 Hashing new password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    console.log('💾 Updating password in database...');
    const updateResult = await pool.query(
      'UPDATE admin_users SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, updated_at',
      [hashedPassword, user.id]
    );

    if (updateResult.rows.length === 0) {
      console.error('❌ Failed to update password');
      process.exit(1);
    }

    console.log('✅ Password updated successfully!\n');

    // Display results
    console.log('═'.repeat(60));
    console.log('🎉 Admin Password Reset Complete');
    console.log('═'.repeat(60));
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔐 New Password: ${newPassword}`);
    console.log(`📅 Updated at: ${updateResult.rows[0].updated_at}`);
    console.log('═'.repeat(60));
    console.log('\n⚠️  Make sure to save this password in a secure location!');
    console.log('   You can now log in to the Strapi admin panel with these credentials.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Database connection refused. Check if:');
      console.error('   - Database is running');
      console.error('   - DATABASE_URL is correct');
      console.error('   - Database credentials are valid');
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the reset
resetAdminPassword();
