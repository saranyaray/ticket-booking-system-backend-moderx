#!/usr/bin/env node

/**
 * Database Migration Script
 * Runs SQL migration files against the database
 * Usage: node migrate.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  // Always use SSL for external databases (Render), but allow self-signed certs
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration(sqlFile) {
  try {
    const filePath = path.join(__dirname, sqlFile);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${sqlFile}`);
      return false;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`\n📝 Running migration: ${sqlFile}`);
    
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log(`✅ Migration completed: ${sqlFile}`);
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`❌ Migration failed for ${sqlFile}:`, err.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting database migrations...\n');
    
    // Run migrations in order
    const migrations = [
      'sql/schema.sql',
      'sql/feature_flags.sql',
    ];

    let allSuccess = true;
    for (const migration of migrations) {
      const success = await runMigration(migration);
      allSuccess = allSuccess && success;
    }

    if (allSuccess) {
      console.log('\n✅ All migrations completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some migrations failed');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
