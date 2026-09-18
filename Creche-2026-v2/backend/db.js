import sql from 'mssql';

const config = {
  server: 'localhost',
  database: 'CrecheManager',
  port: 1433,
  user: 'creche_app',
  password: 'Creche2026!',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

let pool = null;

export async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('✅ Connecté à SQL Server — CrecheManager');
  }
  return pool;
}

export { sql };