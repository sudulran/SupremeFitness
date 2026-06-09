const express = require('express');

const router = express.Router();

const auth = require('../middlewares/authMiddleware');

// Importing the product controller
const {                       
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getAllProductsCount,
    getProductCountsByCategory
} = require('../controllers/productController'); 

// Route to create a new product
router.post('/create', createProduct);

// Route to get all products
router.get('/', getAllProducts);

// -------------------------------------------------------------------------------
// Get Counts
router.get('/get-product-count', getAllProductsCount);
// Get Counts by Category
router.get('/get-product-count-by-category', getProductCountsByCategory);

// -------------------------------------------------------------------------------
// Route to get a product by ID
router.get('/:id', getProductById);

// Route to update a product by ID
router.put('/update/:id', updateProduct);

// Route to delete a product by ID
router.delete('/delete/:id', deleteProduct);


//Exporting the router
module.exports = router;