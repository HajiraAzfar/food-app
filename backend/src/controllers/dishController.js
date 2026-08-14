const dishModel = require('../models/dishModel');
const outletModel = require('../models/outletModel');

/* Sanjha check: kya ye outlet is banday ka hai?
   Teen jagah chahiye tha, isliye ek jagah likha. */
async function assertOwnership(outletId, userId) {
  const outlet = await outletModel.findById(outletId);
  if (!outlet) {
    const err = new Error('Outlet nahi mila');
    err.status = 404;
    throw err;
  }
  if (outlet.owner_id !== userId) {
    const err = new Error('Ye aapka outlet nahi hai');
    err.status = 403;
    throw err;
  }
  return outlet;
}

async function listForOutlet(req, res, next) {
  try {
    // ?all=true sirf owner ke liye kaam ka hai — band dishes bhi dikhati hai
    const onlyAvailable = req.query.all !== 'true';
    res.json(await dishModel.listByOutlet(req.params.outletId, { onlyAvailable }));
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    await assertOwnership(req.params.outletId, req.user.id);

    const { title, price } = req.body;
    if (!title) return res.status(400).json({ message: 'Dish ka naam zaroori hai' });
    if (price === undefined || price === null || Number(price) < 0) {
      return res.status(400).json({ message: 'Sahi daam zaroori hai' });
    }

    res.status(201).json(await dishModel.create(req.params.outletId, req.body));
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const dish = await dishModel.findById(req.params.id);
    if (!dish) return res.status(404).json({ message: 'Dish nahi mili' });

    await assertOwnership(dish.outlet_id, req.user.id);

    res.json(await dishModel.update(dish.id, { ...dish, ...req.body }));
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const dish = await dishModel.findById(req.params.id);
    if (!dish) return res.status(404).json({ message: 'Dish nahi mili' });

    await assertOwnership(dish.outlet_id, req.user.id);

    await dishModel.remove(dish.id);
    res.json({ message: 'Dish mita di gayi' });
  } catch (err) { next(err); }
}

module.exports = { listForOutlet, create, update, remove };