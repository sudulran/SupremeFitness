const mongoose = require('mongoose');

// Model for One Cart Item
const catItemSchema = new mongoose.Schema ({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
});

// Model for Cart Details with Items Array
const cartSchema = new mongoose.Schema ({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'draft',
    },
    items: [catItemSchema],
    value: {
        type: Number,
        required: true
    }
}, 
{
    timestamps: true, // Created At and Updated At fields
}
);

module.exports = mongoose.model('Cart', cartSchema);