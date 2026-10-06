import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../shared/db.js";

interface SeedUser {
  username: string;
  password: string;
}

const DefaultUsers: SeedUser[] = [
  { username: 'alex', password: 'alex1234' },
  { username: 'juan', password: 'juan1234' },
  { username: 'maria', password: 'maria1234' },
  { username: 'paco', password: 'paco1234' },
  { username: 'ana', password: 'ana1234' },
];

async function seed() {
  console.log('Starting user seeder...\n');

  for (const usuario of DefaultUsers) {
    const existe = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [usuario.username]);

    if (existe.rows.length > 0) {
      console.log(`${usuario.username} already exists, skipping`);
      continue;
    }

    const hash = await bcrypt.hash(usuario.password, 10);

    await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [usuario.username, hash]);

    console.log(` ${usuario.username} created`);
  }

  console.log('\nSeeder finished.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Error running the seeder:', err);
  process.exit(1);
});
