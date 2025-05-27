import { Request, Response } from 'express';
import { Product, TProduct } from './service';
import * as uuid from 'uuid';

// Initialize product service
const productService = new Product();

export class ProductController {
    // Get all products

    public async getAllProducts(req: Request, res: Response): Promise<void> {
        try {
            const products = await productService.getAllProducts();
            res.json(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ error: 'Failed to retrieve products' });
        }
    }

    //  Get product by ID

    public async getProductById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const product = await productService.getProductById(id);

            if (!product) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }

            res.json(product);
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ error: 'Failed to retrieve product' });
        }
    }

    // Create a new product

    public async createProduct(req: Request, res: Response): Promise<void> {
        try {
            const { name, description, price, category, stock } = req.body;

            if (!name || !price) {
                res.status(400).json({ error: 'Name and price are required' });
                return;
            }

            // Create a new product with the provided data
            const newProduct: Omit<TProduct, 'created_at'> = {
                id: uuid.v4(),
                name,
                description: description || '',
                price: Number(price),
                category: category || 'Uncategorized',
                stock: Number(stock) || 0
            };

            await productService.insertProduct(newProduct);

            // Return the newly created product
            const product = await productService.getProductById(newProduct.id);
            res.status(201).json(product);
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    }

    // Update an existing product

    public async updateProduct(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, description, price, category, stock } = req.body;

            const productData: Partial<TProduct> = {};

            if (name) {
                productData.name = name;
            }

            if (description !== undefined) {
                productData.description = description;
            }

            if (price !== undefined) {
                productData.price = Number(price);
            }

            if (category !== undefined) {
                productData.category = category;
            }

            if (stock !== undefined) {
                productData.stock = Number(stock);
            }

            const updated = await productService.updateProduct(id, productData);

            if (!updated) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }

            const product = await productService.getProductById(id);
            res.json(product);
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ error: 'Failed to update product' });
        }
    }

    // Delete a product

    public async deleteProduct(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const product = await productService.getProductById(id);

            if (!product) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }

            await productService.deleteProduct(id);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ error: 'Failed to delete product' });
        }
    }
}

