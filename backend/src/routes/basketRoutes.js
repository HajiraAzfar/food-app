const router = require('express').Router();
const c = require('../controllers/basketController');
const { authenticate, requireRole } = require('../middleware/auth');

// Poora basket sirf customer ke liye — ek hi jagah likh diya
router.use(authenticate, requireRole('customer'));

router.get('/', c.getBasket);
router.post('/items', c.addItem);
router.put('/items/:itemId', c.updateItem);
router.delete('/items/:itemId', c.removeItem);
router.delete('/', c.clear);

module.exports = router;