const purchaseModel = require('../models/purchaseModel');
const basketModel = require('../models/basketModel');
const outletModel = require('../models/outletModel');

/* An order can only move along this path. Anything else is rejected —
   without this, an owner could jump a new order straight to delivered. */
const OWNER_TRANSITIONS = {
  pending: ['accepted', 'rejected'],
  accepted: ['preparing'],
  preparing: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

async function checkout(req, res, next) {
  try {
    const { deliveryAddress, paymentMethod } = req.body;
    if (!deliveryAddress || !deliveryAddress.trim()) {
      return res.status(400).json({ message: 'Delivery address is required' });
    }

    const basket = await basketModel.getOrCreate(req.user.id);

    // Comes back as an array — one order per restaurant in the basket
    const orders = await purchaseModel.createFromBasket({
      customerId: req.user.id,
      basketId: basket.id,
      deliveryAddress: deliveryAddress.trim(),
      paymentMethod,
    });

    res.status(201).json({ orders });
  } catch (err) { next(err); }
}

async function myPurchases(req, res, next) {
  try {
    res.json(await purchaseModel.listByCustomer(req.user.id));
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const purchase = await purchaseModel.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Order not found' });

    const isCustomer = purchase.customer_id === req.user.id;
    const isOwner = purchase.owner_id === req.user.id;
    if (!isCustomer && !isOwner) {
      return res.status(403).json({ message: "This isn't your order" });
    }

    res.json({ ...purchase, items: await purchaseModel.getItems(purchase.id) });
  } catch (err) { next(err); }
}

async function outletPurchases(req, res, next) {
  try {
    const outlet = await outletModel.findById(req.params.outletId);
    if (!outlet) return res.status(404).json({ message: 'Restaurant not found' });
    if (outlet.owner_id !== req.user.id) {
      return res.status(403).json({ message: "This isn't your restaurant" });
    }

    const purchases = await purchaseModel.listByOutlet(outlet.id, req.query.status);
    const withItems = await Promise.all(
      purchases.map(async (p) => ({ ...p, items: await purchaseModel.getItems(p.id) }))
    );
    res.json(withItems);
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const purchase = await purchaseModel.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Order not found' });
    if (purchase.owner_id !== req.user.id) {
      return res.status(403).json({ message: "This isn't your restaurant" });
    }

    const allowed = OWNER_TRANSITIONS[purchase.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `An order that is "${purchase.status}" can't move straight to "${status}"`,
      });
    }

    res.json(await purchaseModel.updateStatus(purchase.id, status));
  } catch (err) { next(err); }
}

/* Customers can only cancel while nothing has been cooked yet. */
async function cancel(req, res, next) {
  try {
    const purchase = await purchaseModel.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Order not found' });
    if (purchase.customer_id !== req.user.id) {
      return res.status(403).json({ message: "This isn't your order" });
    }
    if (purchase.status !== 'pending') {
      return res.status(400).json({ message: 'This order can no longer be cancelled' });
    }
    res.json(await purchaseModel.updateStatus(purchase.id, 'cancelled'));
  } catch (err) { next(err); }
}

async function stats(req, res, next) {
  try {
    const outlet = await outletModel.findById(req.params.outletId);
    if (!outlet) return res.status(404).json({ message: 'Restaurant not found' });
    if (outlet.owner_id !== req.user.id) {
      return res.status(403).json({ message: "This isn't your restaurant" });
    }
    res.json(await purchaseModel.statsForOutlet(outlet.id));
  } catch (err) { next(err); }
}

module.exports = {
  checkout, myPurchases, getOne, outletPurchases,
  updateStatus, cancel, stats,
};