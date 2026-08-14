const { sql, getPool } = require('../config/db');

async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.NVarChar(200), email)
    .query('SELECT * FROM dbo.app_users WHERE email = @email');
  return result.recordset[0] || null;
}

async function findById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT id, full_name, email, role, phone, created_at
      FROM dbo.app_users WHERE id = @id
    `);
  return result.recordset[0] || null;
}

async function create({ fullName, email, passwordHash, role, phone }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('fullName', sql.NVarChar(120), fullName)
    .input('email', sql.NVarChar(200), email)
    .input('hash', sql.NVarChar(255), passwordHash)
    .input('role', sql.NVarChar(20), role)
    .input('phone', sql.NVarChar(30), phone || null)
    .query(`
      INSERT INTO dbo.app_users (full_name, email, password_hash, role, phone)
      OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.role, INSERTED.phone
      VALUES (@fullName, @email, @hash, @role, @phone)
    `);
  return result.recordset[0];
}

module.exports = { findByEmail, findById, create };