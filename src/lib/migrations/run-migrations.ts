import { supabase } from '../supabase';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir);

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        console.log(`Running migration: ${file}`);
        const { error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
          console.error(`Error running migration ${file}:`, error);
        } else {
          console.log(`Successfully ran migration: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

runMigrations(); 