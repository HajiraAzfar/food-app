const basketModel = require('../models/basketModel');
const dishModel = require('../models/dishModel');

async function getBasket(req, res, next) {
  try {
    res.json(await basketModel.getWithItems(req.user.id));
  } catch (err) { next(err); }
}

async function addItem(req, res, next) {
  try {
    const { dishId, quantity = 1, note } = req.body;
    if (!dishId) return res.status(400).json({ message: 'dishId is required' });
    if (Number(quantity) < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const dish = await dishModel.findById(dishId);
    if (!dish) return res.status(404).json({ message: 'Dish not found' });
    if (!dish.is_available) {
      return res.status(409).json({ message: 'This dish is currently unavailable' });
    }

    // No more clearing — dishes from any number of restaurants can sit together
    const basket = await basketModel.getOrCreate(req.user.id);
    await basketModel.addItem(basket.id, dish.id, Number(quantity), note);

    res.json(await basketModel.getWithItems(req.user.id));
  } catch (err) { next(err); }
}

async function updateItem(req, res, next) {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) {
      return res.status(400).json({ message: 'quantity is required' });
    }
    const basket = await basketModel.getOrCreate(req.user.id);
    await basketModel.updateQuantity(basket.id, req.params.itemId, Number(quantity));
    res.json(await basketModel.getWithItems(req.user.id));
  } catch (err) { next(err); }
}

async function removeItem(req, res, next) {
  try {
    const basket = await basketModel.getOrCreate(req.user.id);
    await basketModel.removeItem(basket.id, req.params.itemId);
    res.json(await basketModel.getWithItems(req.user.id));
  } catch (err) { next(err); }
}

async function clear(req, res, next) {
  try {
    const basket = await basketModel.getOrCreate(req.user.id);
    await basketModel.clearAll(basket.id);
    res.json(await basketModel.getWithItems(req.user.id));
  } catch (err) { next(err); }
}

module.exports = { getBasket, addItem, updateItem, removeItem, clear };