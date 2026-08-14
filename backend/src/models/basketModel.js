const { sql, getPool } = require('../config/db');

async function getOrCreate(customerId) {
  const pool = await getPool();
  const existing = await pool.request()
    .input('cid', sql.Int, customerId)
    .query('SELECT * FROM dbo.baskets WHERE customer_id = @cid');
  if (existing.recordset[0]) return existing.recordset[0];

  const created = await pool.request()
    .input('cid', sql.Int, customerId)
    .query('INSERT INTO dbo.baskets (customer_id) OUTPUT INSERTED.* VALUES (@cid)');
  return created.recordset[0];
}

/* The basket now spans several restaurants, so we return it grouped:
   one group per outlet, each with its own subtotal. Checkout turns
   each group into its own order. */
async function getWithItems(customerId) {
  const basket = await getOrCreate(customerId);
  const pool = await getPool();

  const rows = await pool.request()
    .input('basketId', sql.Int, basket.id)
    .query(`
      SELECT bi.id, bi.dish_id, bi.quantity, bi.note,
             d.title, d.price, d.image_url, d.is_available,
             (d.price * bi.quantity) AS line_total,
             o.id AS outlet_id, o.title AS outlet_title, o.is_open AS outlet_is_open
      FROM dbo.basket_items bi
      JOIN dbo.dishes d  ON d.id = bi.dish_id
      JOIN dbo.outlets o ON o.id = d.outlet_id
      WHERE bi.basket_id = @basketId
      ORDER BY o.title, bi.id
    `);

  const map = new Map();
  for (const r of rows.recordset) {
    if (!map.has(r.outlet_id)) {
      map.set(r.outlet_id, {
        outletId: r.outlet_id,
        outletTitle: r.outlet_title,
        outletIsOpen: r.outlet_is_open,
        items: [],
        subtotal: 0,
      });
    }
    const g = map.get(r.outlet_id);
    g.items.push({
      id: r.id,
      dish_id: r.dish_id,
      quantity: r.quantity,
      note: r.note,
      title: r.title,
      price: r.price,
      image_url: r.image_url,
      is_available: r.is_available,
      line_total: r.line_total,
    });
    g.subtotal += Number(r.line_total);
  }

  const groups = [...map.values()];
  return {
    basketId: basket.id,
    groups,
    itemCount: rows.recordset.reduce((n, r) => n + r.quantity, 0),
    total: groups.reduce((sum, g) => sum + g.subtotal, 0),
  };
}

async function addItem(basketId, dishId, quantity, note) {
  const pool = await getPool();
  await pool.request()
    .input('basketId', sql.Int, basketId)
    .input('dishId', sql.Int, dishId)
    .input('qty', sql.Int, quantity)
    .input('note', sql.NVarChar(300), note || null)
    .query(`
      MERGE dbo.basket_items AS target
      USING (SELECT @basketId AS basket_id, @dishId AS dish_id) AS src
        ON target.basket_id = src.basket_id AND target.dish_id = src.dish_id
      WHEN MATCHED THEN
        UPDATE SET quantity = target.quantity + @qty,
                   note = COALESCE(@note, target.note)
      WHEN NOT MATCHED THEN
        INSERT (basket_id, dish_id, quantity, note)
        VALUES (@basketId, @dishId, @qty, @note);
    `);
}

async function removeItem(basketId, itemId) {
  const pool = await getPool();
  await pool.request()
    .input('basketId', sql.Int, basketId)
    .input('itemId', sql.Int, itemId)
    .query('DELETE FROM dbo.basket_items WHERE id = @itemId AND basket_id = @basketId');
}

async function updateQuantity(basketId, itemId, quantity) {
  if (quantity <= 0) return removeItem(basketId, itemId);
  const pool = await getPool();
  await pool.request()
    .input('basketId', sql.Int, basketId)
    .input('itemId', sql.Int, itemId)
    .input('qty', sql.Int, quantity)
    .query('UPDATE dbo.basket_items SET quantity = @qty WHERE id = @itemId AND basket_id = @basketId');
}

async function clearAll(basketId) {
  const pool = await getPool();
  await pool.request()
    .input('basketId', sql.Int, basketId)
    .query('DELETE FROM dbo.basket_items WHERE basket_id = @basketId');
}

/* Used after checkout — only one restaurant's lines are removed
   if the customer chose to order from just that group. */
async function clearOutlet(basketId, outletId) {
  const pool = await getPool();
  await pool.request()
    .input('basketId', sql.Int, basketId)
    .input('outletId', sql.Int, outletId)
    .query(`
      DELETE bi FROM dbo.basket_items bi
      JOIN dbo.dishes d ON d.id = bi.dish_id
      WHERE bi.basket_id = @basketId AND d.outlet_id = @outletId
    `);
}

module.exports = {
  getOrCreate, getWithItems, addItem, removeItem,
  updateQuantity, clearAll, clearOutlet,
};