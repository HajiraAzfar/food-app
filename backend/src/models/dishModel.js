const { sql, getPool } = require('../config/db');

async function listByOutlet(outletId, { onlyAvailable = false } = {}) {
  const pool = await getPool();
  const result = await pool.request()
    .input('outletId', sql.Int, outletId)
    .input('onlyAvailable', sql.Bit, onlyAvailable ? 1 : 0)
    .query(`
      SELECT id, outlet_id, title, about, category, price, image_url, is_available
      FROM dbo.dishes
      WHERE outlet_id = @outletId
        AND (@onlyAvailable = 0 OR is_available = 1)
      ORDER BY category, title
    `);
  return result.recordset;
}

async function findById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM dbo.dishes WHERE id = @id');
  return result.recordset[0] || null;
}

async function create(outletId, { title, about, category, price, image_url, is_available }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('outletId', sql.Int, outletId)
    .input('title', sql.NVarChar(150), title)
    .input('about', sql.NVarChar(500), about || null)
    .input('category', sql.NVarChar(60), category || null)
    .input('price', sql.Decimal(10, 2), price)
    .input('image', sql.NVarChar(500), image_url || null)
    .input('avail', sql.Bit, is_available === false ? 0 : 1)
    .query(`
      INSERT INTO dbo.dishes (outlet_id, title, about, category, price, image_url, is_available)
      OUTPUT INSERTED.*
      VALUES (@outletId, @title, @about, @category, @price, @image, @avail)
    `);
  return result.recordset[0];
}

async function update(id, { title, about, category, price, image_url, is_available }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('title', sql.NVarChar(150), title)
    .input('about', sql.NVarChar(500), about || null)
    .input('category', sql.NVarChar(60), category || null)
    .input('price', sql.Decimal(10, 2), price)
    .input('image', sql.NVarChar(500), image_url || null)
    .input('avail', sql.Bit, is_available === false ? 0 : 1)
    .query(`
      UPDATE dbo.dishes
      SET title = @title, about = @about, category = @category,
          price = @price, image_url = @image, is_available = @avail
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  return result.recordset[0] || null;
}

/* Dish mitane se history nahi tootni chahiye:
   pehle zinda baskets se hataao, phir purani purchase lines se
   reference kaato (unke paas apna naam/daam mojood hai),
   phir dish mitao. Teenon ek transaction mein. */
async function remove(id) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await new sql.Request(tx).input('id', sql.Int, id)
      .query('DELETE FROM dbo.basket_items WHERE dish_id = @id');
    await new sql.Request(tx).input('id', sql.Int, id)
      .query('UPDATE dbo.purchase_items SET dish_id = NULL WHERE dish_id = @id');
    await new sql.Request(tx).input('id', sql.Int, id)
      .query('DELETE FROM dbo.dishes WHERE id = @id');
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

module.exports = { listByOutlet, findById, create, update, remove };