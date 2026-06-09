const mongoose = require('mongoose');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

// Get cart for a user
exports.getCart = async (req, res) => {
  const userId = req.user._id;
  try {
    const cart = await Cart.find({ user: userId }).populate('items.product');
    res.json(cart || { user: userId, items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add item(s) to cart
exports.addToCart = async (req, res) => {
  const { userId, items, value, status } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required and cannot be empty.' });
  }

  try {
    // Validate all product IDs and quantities first
    for (const item of items) {
      if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ error: `Invalid or missing product ID: ${item.product}` });
      }

      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ error: `Invalid quantity for product ${item.product}. Must be a number > 0.` });
      }

      // Check if product actually exists
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.product}` });
      }
    }

    // Save the Cart Details
    const cart = new Cart({ 
      user: userId, 
      items: [], 
      status: status || 'draft', 
      value: value 
    });

    for (const item of items) {
      const { product, quantity } = item;

      // Check if product already exists in cart
      const itemIndex = cart.items.findIndex(i =>
        i.product && i.product.toString() === product
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product, quantity });
      }
    }

    await cart.save();
    const populatedCart = await cart.populate('items.product');
    res.json(populatedCart);
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'An error occurred while adding items to the cart.' });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  const { cartId } = req.params;

  try {
    const cart = await Cart.findById(cartId);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await Cart.findByIdAndDelete(cartId);
    res.json({ message: 'Cart and all items deleted successfully.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Cart Details
exports.updateCart = async (req, res) => {
  const { cartId } = req.params;
  const { items, status } = req.body;

  try {
    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Items must be an array.' });
      }

      cart.items = []; // Clear current items

      for (const item of items) {
        if (!mongoose.Types.ObjectId.isValid(item.product)) {
          return res.status(400).json({ error: `Invalid product ID: ${item.product}` });
        }

        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          return res.status(400).json({ error: `Invalid quantity for product ${item.product}` });
        }

        const exists = await Product.exists({ _id: item.product });
        if (!exists) {
          return res.status(404).json({ error: `Product not found: ${item.product}` });
        }

        cart.items.push({
          product: item.product,
          quantity: item.quantity,
        });
      }
    }

    if (status) {
      cart.status = status;
    }

    // Auto delete cart if it becomes empty
    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cartId);
      return res.json({ message: 'Cart deleted because it became empty.' });
    }

    await cart.save();
    const populatedCart = await cart.populate('items.product');
    res.json(populatedCart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update product quantities after successful payment
exports.updateProductQuantities = async (cartId) => {
  try {
    const cart = await Cart.findById(cartId).populate('items.product');
    
    if (!cart) {
      throw new Error('Cart not found');
    }

    // Update quantities for each product in the cart
    for (const item of cart.items) {
      const product = item.product;
      const quantityPurchased = item.quantity;
      
      if (product.qty < quantityPurchased) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.qty}, Requested: ${quantityPurchased}`);
      }
      
      // Update the product quantity
      product.qty -= quantityPurchased;
      await product.save();
    }

    return { success: true, message: 'Product quantities updated successfully' };
  } catch (error) {
    console.error('Error updating product quantities:', error);
    throw error;
  }
};

// Confirm payment and update quantities
exports.confirmPayment = async (req, res) => {
  const { cartId } = req.params;

  try {
    // Update cart status to 'paid'
    const cart = await Cart.findByIdAndUpdate(
      cartId,
      { status: 'paid' },
      { new: true }
    ).populate('items.product');

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Update product quantities
    await exports.updateProductQuantities(cartId);

    res.json({
      success: true,
      message: 'Payment confirmed and product quantities updated',
      cart
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDraftCartCount = async (req, res) => {
  try {
    const draftCartCount = await Cart.countDocuments({ status: 'draft' });
    res.status(200).json(draftCartCount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDraftCarts = async (req, res) => {
  try {
    const draftOrders = await Cart.find({ status: 'draft' })
      .populate('user', 'name email')
      .populate('items.product', 'name price images description')
      .exec();
    
    res.status(200).json(draftOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllDraftCartsByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const draftOrders = await Cart.find({ user: userId, status: 'draft' }).populate('items.product');
    res.status(200).json(draftOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};