const { time } = require("node:console");

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    username: { type: 'varchar(50)', notNull: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  });

  pgm.createIndex('users', 'LOWER(username)', {
    name: 'users_username_lower_unique',
    unique: true,
  });

  pgm.createTable('weather_petition', {
    id: 'id',
    user_id: { type: 'integer', references: 'users' },
    city_consulted: { type: 'varchar(100)' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  });

  pgm.createTable('error_log', {
    id: 'id',
    user_id: { type: 'integer', references: 'users' },
    city_consulted: { type: 'varchar(100)' },
    message_error: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('error_log');
  pgm.dropTable('weather_petition');
  pgm.dropTable('users');
};
