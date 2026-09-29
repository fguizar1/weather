exports.up = (pgm) => {
  pgm.createTable('usuarios', {
    id: 'id',
    username: { type: 'varchar(50)', notNull: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    creado_en: { type: 'timestamp', default: pgm.func('now()') },
  });

  pgm.createIndex('usuarios', 'LOWER(username)', {
    name: 'usuarios_username_lower_unique',
    unique: true,
  });

  pgm.createTable('peticiones_clima', {
    id: 'id',
    usuario_id: { type: 'integer', references: 'usuarios' },
    ciudad_consultada: { type: 'varchar(100)' },
    fecha: { type: 'timestamp', default: pgm.func('now()') },
  });

  pgm.createTable('errores_log', {
    id: 'id',
    usuario_id: { type: 'integer', references: 'usuarios' },
    ciudad_consultada: { type: 'varchar(100)' },
    mensaje_error: { type: 'text' },
    fecha: { type: 'timestamp', default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('errores_log');
  pgm.dropTable('peticiones_clima');
  pgm.dropTable('usuarios');
};