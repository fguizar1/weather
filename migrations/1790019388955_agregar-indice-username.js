/**
 * Add a case-insensitive unique index to usernames.
 */

export const shorthands = undefined;

export async function up(pgm) {
  pgm.createIndex('usuarios', 'LOWER(username)', {
    name: 'usuarios_username_lower_unique',
    unique: true,
  });
}

export async function down(pgm) {
  pgm.dropIndex('usuarios', 'usuarios_username_lower_unique');
}
