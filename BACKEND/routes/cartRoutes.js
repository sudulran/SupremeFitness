const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

const { protect } = require('../middlewares/authMiddleware');
router.use(protect); 

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.delete('/remove/:cartId', cartController.removeFromCart);
router.put('/update/:cartId', cartController.updateCart);
router.post('/confirm-payment/:cartId', cartController.confirmPayment);

// These might not need auth depending on your use case
router.get('/draft-orders', cartController.getDraftCarts);
router.get('/get-draft-count', cartController.getDraftCartCount);
router.get('/drafts/user/:userId', cartController.getAllDraftCartsByUser);

module.exports = router;