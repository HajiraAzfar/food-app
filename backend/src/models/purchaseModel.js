const { sql, getPool } = require('../config/db');

/* Turns the whole basket into ONE ORDER PER RESTAURANT.
   Everything runs inside a single transaction: either every order is
   created, or none is. A half-placed basket is worse than a failed one —
   the customer would think they ordered food nobody is cooking. */
async function createFromBasket({ customerId, basketId, deliveryAddress, paymentMethod }) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    // Prices are read from the database, never taken from the client
    const lines = await new sql.Request(tx)
      .input('basketId', sql.Int, basketId)
      .query(`
        SELECT bi.dish_id, bi.quantity, bi.note,
               d.title, d.price, d.is_available, d.outlet_id,
               o.title AS outlet_title, o.is_open
        FROM dbo.basket_items bi
        JOIN dbo.dishes d  ON d.id = bi.dish_id
        JOIN dbo.outlets o ON o.id = d.outlet_id
        WHERE bi.basket_id = @basketId
      `);

    if (lines.recordset.length === 0) {
      const err = new Error('Your basket is empty');
      err.status = 400;
      throw err;
    }

    const gone = lines.recordset.filter((l) => !l.is_available);
    if (gone.length) {
      const err = new Error(`No longer available: ${gone.map((g) => g.title).join(', ')}`);
      err.status = 409;
      throw err;
    }

    const closed = [...new Set(
      lines.recordset.filter((l) => !l.is_open).map((l) => l.outlet_title)
    )];
    if (closed.length) {
      const err = new Error(`Closed right now: ${closed.join(', ')}`);
      err.status = 409;
      throw err;
    }

    // Split the basket by restaurant
    const byOutlet = new Map();
    for (const line of lines.recordset) {
      if (!byOutlet.has(line.outlet_id)) byOutlet.set(line.outlet_id, []);
      byOutlet.get(line.outlet_id).push(line);
    }

    const created = [];

    for (const [outletId, group] of byOutlet) {
      const grandTotal = group.reduce((sum, l) => sum + Number(l.price) * l.quantity, 0);

      const result = await new sql.Request(tx)
        .input('customerId', sql.Int, customerId)
        .input('outletId', sql.Int, outletId)
        .input('total', sql.Decimal(10, 2), grandTotal)
        .input('address', sql.NVarChar(300), deliveryAddress)
        .input('payment', sql.NVarChar(30), paymentMethod || 'cash')
        .query(`
          INSERT INTO dbo.purchases
            (customer_id, outlet_id, status, grand_total, delivery_address, payment_method)
          OUTPUT INSERTED.*
          VALUES (@customerId, @outletId, 'pending', @total, @address, @payment)
        `);

      const purchase = result.recordset[0];

      // Snapshot: the name and price are copied, not linked, so this
      // order stays true even if the dish changes or disappears later.
      for (const line of group) {
        await new sql.Request(tx)
          .input('purchaseId', sql.Int, purchase.id)
          .input('dishId', sql.Int, line.dish_id)
          .input('title', sql.NVarChar(150), line.title)
          .input('price', sql.Decimal(10, 2), line.price)
          .input('qty', sql.Int, line.quantity)
          .input('note', sql.NVarChar(300), line.note || null)
          .query(`
            INSERT INTO dbo.purchase_items
              (purchase_id, dish_id, dish_title, unit_price, quantity, note)
            VALUES (@purchaseId, @dishId, @title, @price, @qty, @note)
          `);
      }

      created.push({ ...purchase, outlet_title: group[0].outlet_title });
    }

    await new sql.Request(tx)
      .input('basketId', sql.Int, basketId)
      .query('DELETE FROM dbo.basket_items WHERE basket_id = @basketId');

    await tx.commit();
    return created;                 // an array — one order per restaurant
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

async function findById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT p.*, o.title AS outlet_title, o.owner_id,
             u.full_name AS customer_name, u.phone AS customer_phone
      FROM dbo.purchases p
      JOIN dbo.outlets o ON o.id = p.outlet_id
      JOIN dbo.app_users u ON u.id = p.customer_id
      WHERE p.id = @id
    `);
  return result.recordset[0] || null;
}

async function getItems(purchaseId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('pid', sql.Int, purchaseId)
    .query(`
      SELECT id, dish_id, dish_title, unit_price, quantity, note, line_total
      FROM dbo.purchase_items WHERE purchase_id = @pid ORDER BY id
    `);
  return result.recordset;
}

async function listByCustomer(customerId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('cid', sql.Int, customerId)
    .query(`
      SELECT p.*, o.title AS outlet_title
      FROM dbo.purchases p
      JOIN dbo.outlets o ON o.id = p.outlet_id
      WHERE p.customer_id = @cid
      ORDER BY p.created_at DESC
    `);
  return result.recordset;
}

async function listByOutlet(outletId, status) {
  const pool = await getPool();
  const result = await pool.request()
    .input('oid', sql.Int, outletId)
    .input('status', sql.NVarChar(30), status || '')
    .query(`
      SELECT p.*, u.full_name AS customer_name, u.phone AS customer_phone
      FROM dbo.purchases p
      JOIN dbo.app_users u ON u.id = p.customer_id
      WHERE p.outlet_id = @oid
        AND (@status = '' OR p.status = @status)
      ORDER BY p.created_at DESC
    `);
  return result.recordset;
}

async function updateStatus(id, status) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('status', sql.NVarChar(30), status)
    .query(`
      UPDATE dbo.purchases SET status = @status, updated_at = SYSDATETIME()
      OUTPUT INSERTED.* WHERE id = @id
    `);
  return result.recordset[0] || null;
}

async function statsForOutlet(outletId) {
  const pool = await getPool();
  const summary = await pool.request()
    .input('oid', sql.Int, outletId)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM dbo.purchases
          WHERE outlet_id = @oid AND CAST(created_at AS DATE) = CAST(SYSDATETIME() AS DATE)) AS orders_today,
        (SELECT ISNULL(SUM(grand_total), 0) FROM dbo.purchases
          WHERE outlet_id = @oid AND status = 'delivered'
            AND CAST(created_at AS DATE) = CAST(SYSDATETIME() AS DATE)) AS revenue_today,
        (SELECT COUNT(*) FROM dbo.purchases
          WHERE outlet_id = @oid AND status = 'pending') AS pending_orders
    `);

  const top = await pool.request()
    .input('oid', sql.Int, outletId)
    .query(`
      SELECT TOP 5 pi.dish_title, SUM(pi.quantity) AS sold
      FROM dbo.purchase_items pi
      JOIN dbo.purchases p ON p.id = pi.purchase_id
      WHERE p.outlet_id = @oid AND p.status NOT IN ('rejected','cancelled')
      GROUP BY pi.dish_title
      ORDER BY sold DESC
    `);

  return { ...summary.recordset[0], top_dishes: top.recordset };
}

module.exports = {
  createFromBasket, findById, getItems, listByCustomer,
  listByOutlet, updateStatus, statsForOutlet,
};