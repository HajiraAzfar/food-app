const router = require('express').Router();
const c = require('../controllers/purchaseController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// customer
router.post('/checkout', requireRole('customer'), c.checkout);
router.get('/mine', requireRole('customer'), c.myPurchases);
router.put('/:id/cancel', requireRole('customer'), c.cancel);

// owner
router.get('/outlet/:outletId', requireRole('owner'), c.outletPurchases);
router.get('/outlet/:outletId/stats', requireRole('owner'), c.stats);
router.put('/:id/status', requireRole('owner'), c.updateStatus);

// dono — ownership controller mein check hoti hai
router.get('/:id', c.getOne);

module.exports = router;