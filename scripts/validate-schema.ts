#!/usr/bin/env ts-node
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('📋 Validating database schema...');

const schemaPath = join(process.cwd(), 'supabase', 'schema.sql');
const migrationsDir = join(process.cwd(), 'supabase', 'migrations');

if (!existsSync(schemaPath)) {
  console.error('❌ Schema file not found at:', schemaPath);
  process.exit(1);
}

if (!existsSync(migrationsDir)) {
  console.error('❌ Migrations directory not found at:', migrationsDir);
  process.exit(1);
}

try {
  const schema = readFileSync(schemaPath, 'utf-8');
  
  // Basic validation checks
  const requiredTables = ['worlds', 'world_arcs', 'world_beats', 'world_events'];
  const missingTables = requiredTables.filter(table => !schema.includes(`CREATE TABLE ${table}`));
  
  if (missingTables.length > 0) {
    console.error('❌ Missing required tables:', missingTables.join(', '));
    process.exit(1);
  }
  
  console.log('✅ Schema validation passed');
  process.exit(0);
} catch (error) {
  console.error('❌ Error validating schema:', error);
  process.exit(1);
}