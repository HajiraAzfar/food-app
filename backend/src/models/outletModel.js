const { sql, getPool } = require('../config/db');

async function listAll({ search = '' } = {}) {
  const pool = await getPool();
  const result = await pool.request()
    .input('search', sql.NVarChar(150), `%${search}%`)
    .query(`
      SELECT id, owner_id, title, about, cuisine, address, image_url, is_open, created_at
      FROM dbo.outlets
      WHERE (@search = '%%' OR title LIKE @search OR cuisine LIKE @search)
      ORDER BY is_open DESC, title ASC
    `);
  return result.recordset;
}

async function findById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM dbo.outlets WHERE id = @id');
  return result.recordset[0] || null;
}

async function findByOwner(ownerId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('ownerId', sql.Int, ownerId)
    .query('SELECT * FROM dbo.outlets WHERE owner_id = @ownerId ORDER BY title');
  return result.recordset;
}

async function create(ownerId, { title, about, cuisine, address, image_url }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('ownerId', sql.Int, ownerId)
    .input('title', sql.NVarChar(150), title)
    .input('about', sql.NVarChar(500), about || null)
    .input('cuisine', sql.NVarChar(60), cuisine || null)
    .input('address', sql.NVarChar(300), address || null)
    .input('image', sql.NVarChar(500), image_url || null)
    .query(`
      INSERT INTO dbo.outlets (owner_id, title, about, cuisine, address, image_url)
      OUTPUT INSERTED.*
      VALUES (@ownerId, @title, @about, @cuisine, @address, @image)
    `);
  return result.recordset[0];
}

async function update(id, { title, about, cuisine, address, image_url, is_open }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('title', sql.NVarChar(150), title)
    .input('about', sql.NVarChar(500), about || null)
    .input('cuisine', sql.NVarChar(60), cuisine || null)
    .input('address', sql.NVarChar(300), address || null)
    .input('image', sql.NVarChar(500), image_url || null)
    .input('isOpen', sql.Bit, is_open ? 1 : 0)
    .query(`
      UPDATE dbo.outlets
      SET title = @title, about = @about, cuisine = @cuisine,
          address = @address, image_url = @image, is_open = @isOpen
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  return result.recordset[0] || null;
}

module.exports = { listAll, findById, findByOwner, create, update };