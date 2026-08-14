const outletModel = require('../models/outletModel');

async function list(req, res, next) {
  try {
    const { search = '' } = req.query;
    res.json(await outletModel.listAll({ search }));
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const outlet = await outletModel.findById(req.params.id);
    if (!outlet) return res.status(404).json({ message: 'Outlet nahi mila' });
    res.json(outlet);
  } catch (err) { next(err); }
}

async function myOutlets(req, res, next) {
  try {
    res.json(await outletModel.findByOwner(req.user.id));
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Outlet ka naam zaroori hai' });

    const outlet = await outletModel.create(req.user.id, req.body);
    res.status(201).json(outlet);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const outlet = await outletModel.findById(req.params.id);
    if (!outlet) return res.status(404).json({ message: 'Outlet nahi mila' });

    // Ye asli pehredaari hai — owner sirf apni outlet badal sakta hai
    if (outlet.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Ye aapka outlet nahi hai' });
    }

    const updated = await outletModel.update(outlet.id, { ...outlet, ...req.body });
    res.json(updated);
  } catch (err) { next(err); }
}

module.exports = { list, getOne, myOutlets, create, update };