import { executeQuery } from '../database';

export interface TProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    created_at?: string;
}

export class Product {
    constructor() {
        this.initializeTable();
    }

    private async initializeTable(): Promise<void> {
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT,
                stock INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    async insertProduct(product: Omit<TProduct, 'created_at'>): Promise<string> {
        const result = await executeQuery(
            `INSERT INTO products (id, name, description, price, category, stock)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [
                product.id,
                product.name,
                product.description,
                product.price,
                product.category,
                product.stock
            ]
        );

        console.log(`Inserted product: ${product.name}`);
        return result.rows[0].id;
    }

    async getAllProducts(): Promise<TProduct[]> {
        const result = await executeQuery("SELECT * FROM products;");
        return result.rows;
    }

    async getProductById(id: string): Promise<TProduct | null> {
        const result = await executeQuery("SELECT * FROM products WHERE id = $1;", [id]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async updateProduct(id: string, productData: Partial<TProduct>): Promise<boolean> {
        // First get the existing product
        const existingProduct = await this.getProductById(id);
        if (!existingProduct) return false;

        // Merge existing data with updates
        const updatedProduct = { ...existingProduct, ...productData };

        const result = await executeQuery(
            `UPDATE products
             SET name = $1, description = $2, price = $3, category = $4, stock = $5
             WHERE id = $6;`,
            [
                updatedProduct.name,
                updatedProduct.description,
                updatedProduct.price,
                updatedProduct.category,
                updatedProduct.stock,
                id
            ]
        );

        return (result.rowCount ?? 0) > 0;
    }

    async deleteProduct(id: string): Promise<boolean> {
        const result = await executeQuery("DELETE FROM products WHERE id = $1;", [id]);
        return (result.rowCount ?? 0) > 0;
    }

    async clearProducts(): Promise<void> {
        await executeQuery("DELETE FROM products;");
    }   
}