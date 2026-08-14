const router = require('express').Router();
const c = require('../controllers/dishController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/outlet/:outletId', c.listForOutlet);
router.post('/outlet/:outletId', authenticate, requireRole('owner'), c.create);
router.put('/:id', authenticate, requireRole('owner'), c.update);
router.delete('/:id', authenticate, requireRole('owner'), c.remove);

module.exports = router;