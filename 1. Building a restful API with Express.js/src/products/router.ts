import express from 'express';
import { ProductController } from './controller';

const router = express.Router();
const productController = new ProductController();

// GET all products
router.get('/', (req, res) => productController.getAllProducts(req, res));

// GET product by ID
router.get('/:id', (req, res) => productController.getProductById(req, res));

// CREATE new product
router.post('/', (req, res) => productController.createProduct(req, res));

// UPDATE product
router.put('/:id', (req, res) => productController.updateProduct(req, res));

// DELETE product
router.delete('/:id', (req, res) => productController.deleteProduct(req, res));

export default router;