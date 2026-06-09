const Payment = require('../models/paymentModel');
const Cart = require('../models/cartModel');
const sendEmail = require('../helpers/emailSend');
const Stripe = require('stripe');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);   //get the secret from the .env file

class PaymentController {
 // Record payment after confirmation from frontend -1
  static async createPayment(req, res) {
  try {
    const {
      cartId,
      paymentIntentId,
      email,
      userId,
      cardHolder: cardHolderFromBody,
    } = req.body;

    if (!cartId || !paymentIntentId) {
      return res.status(400).json({ message: "cartId and paymentIntentId required" });
    }

    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    //Stripe function / catch the strip ID - 3rd step finaly save in mongodb
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not completed yet" });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(intent.payment_method);
    const card = paymentMethod.card || {};

    const cardHolder =
      intent.charges?.data?.[0]?.billing_details?.name?.trim() ||
      cardHolderFromBody?.trim() ||
      null;

    if (!cardHolder) {
      return res.status(400).json({ message: "Card holder name is missing." });
    }

    const newPayment = new Payment({
      cart: cart._id,
      payment: intent.amount / 100,
      card_holder: cardHolder,
      card_number: card.last4 ? `**** **** **** ${card.last4}` : "N/A",
      exp_date:
        card.exp_month && card.exp_year
          ? `${card.exp_month}/${card.exp_year}`
          : "N/A",
      user: userId,
      stripePaymentIntentId: intent.id,
    });

    const savedPayment = await newPayment.save();
    //Send email confirmation / Email body is created /helper function neing called
    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: "Payment Confirmation",
          text: `Dear ${cardHolder}, your payment of $${newPayment.payment} succeeded.`,
          html: `<p>Dear ${cardHolder},</p><p>Your payment of <strong>$${newPayment.payment}</strong> has been processed successfully.</p>`,
        });
      } catch (e) {
        console.warn("Email sending failed:", e.message);
      }
    }

    res.status(201).json(savedPayment);
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ message: error.message });
  }
}

  //Get payment by ID
  static async getPaymentById(req, res) {
    try {
      const payment = await Payment.findById(req.params.id).populate('cart');
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update payment by ID
  static async updatePayment(req, res) {
    try {
      const updatedPayment = await Payment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!updatedPayment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      res.json(updatedPayment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Delete payment by ID
  static async deletePayment(req, res) {
    try {
      const deletedPayment = await Payment.findByIdAndDelete(req.params.id);
      if (!deletedPayment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get all payments
  static async getAllPayments(req, res) {
    try {
      const payments = await Payment.find().populate('cart');
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get payments by user ID
  static async getPaymentByUserId(req, res) {
    try {
      const userId = req.params.userId;
      const carts = await Cart.find({ user: userId });
      const cartIds = carts.map(cart => cart._id);
      const payments = await Payment.find({ cart: { $in: cartIds } });
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get sells count
  static async getSellsCount(req, res) {
    try {
      const sellsCount = await Payment.countDocuments();
      res.status(200).json({ sellsCount });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get all payments with product details
  static async getAllPaymentsWthProductDetails(req, res) {
    try {
      const payments = await Payment.find()
        .populate({
          path: 'cart',
          populate: {
            path: 'items.product',
            model: 'Product',
          },
        });

      res.status(200).json({ payments });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Create Stripe PaymentIntent - 2nd 
  static async createPaymentIntent(req, res) {
    try {
      const { amount, email } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency: 'usd',
        receipt_email: email,
        automatic_payment_methods: { enabled: true },
      });

      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = PaymentController;
