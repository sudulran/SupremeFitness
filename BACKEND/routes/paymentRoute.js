const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

router.post('/add', PaymentController.createPayment);
router.get('/get/:id', PaymentController.getPaymentById);
router.put('/update/:id', PaymentController.updatePayment);
router.delete('/delete/:id', PaymentController.deletePayment);
router.get('/', PaymentController.getAllPayments);
router.get('/purchase-history/:userId', PaymentController.getPaymentByUserId);
router.get('/get-sells-count', PaymentController.getSellsCount);
router.get('/get-sells-with-products', PaymentController.getAllPaymentsWthProductDetails);
router.post('/create-intent', PaymentController.createPaymentIntent);


module.exports = router;
