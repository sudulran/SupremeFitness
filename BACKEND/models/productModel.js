const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        minlength: [2, 'Product name must be at least 2 characters long'],
        maxlength: [100, 'Product name must be under 100 characters'],
    },
    price:{
        type: Number,
        required: true,
        min: [0.01, 'Price must be greater than 0'],
    },
    description:{
        type: String,
        required: true,
    },
    category:{
        type: String,
        required: true,
    },
    qty:{
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Quantity cannot be negative'],
    },
    date_of_purchase: {
        type: Date,
        default: Date.now,
    },
    expiry_date: {
        type: Date,
        required: true,
    },
    img: {
        data: Buffer,
        contentType: String
    },
    restock_level: {
        type: Number,
        required: true,
        default: 10,
    }
})

module.exports = mongoose.model('Product', productSchema);