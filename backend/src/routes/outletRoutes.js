const router = require('express').Router();
const c = require('../controllers/outletController');
const { authenticate, requireRole } = require('../middleware/auth');

// Ye upar honi chahiye — warna "mine" ko id samjha jayega
router.get('/mine', authenticate, requireRole('owner'), c.myOutlets);

router.post('/', authenticate, requireRole('owner'), c.create);
router.put('/:id', authenticate, requireRole('owner'), c.update);

router.get('/', c.list);
router.get('/:id', c.getOne);

module.exports = router;