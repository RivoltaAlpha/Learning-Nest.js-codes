import { User } from '../src/users/service';
import { Product } from '../src/products/service';
import { DbUtils } from '../src/database/utils';
import db from '../src/database';
import { faker } from '@faker-js/faker';
import * as uuid from 'uuid';

// Function to generate fake products
async function generateFakeProducts(count: number): Promise<void> {
    console.log(`Inserting ${count} fake products...`);

    const categories = ["Electronics", "Clothing", "Books", "Food", "Home"];

    const client = await db.getPool().connect();
    try {
        await client.query('BEGIN');

        for (let i = 0; i < count; i++) {
            const productId = uuid.v4();
            await client.query(
                `INSERT INTO products (id, name, description, price, category, stock)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    productId,
                    `Product ${i + 1}`,
                    `Description for product ${i + 1}`,
                    Math.floor(Math.random() * 1000) + 1,
                    categories[Math.floor(Math.random() * categories.length)],
                    Math.floor(Math.random() * 100) + 1
                ]
            );
        }

        await client.query('COMMIT');
        console.log(`Successfully inserted ${count} fake products`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error generating fake products:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to generate fake users
async function generateFakeUsers(count: number): Promise<void> {
    console.log(`Inserting ${count} fake users...`);

    const client = await db.getPool().connect();
    try {
        await client.query('BEGIN');

        for (let i = 0; i < count; i++) {
            await client.query(
                `INSERT INTO users (id, name, email, age, avatar)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    uuid.v4(),
                    faker.person.fullName(),
                    faker.internet.email(),
                    faker.number.int({ min: 18, max: 80 }),
                    faker.image.avatar()
                ]
            );
        }

        await client.query('COMMIT');
        console.log(`Successfully inserted ${count} fake users`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error generating fake users:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Main seeding function
async function seedDatabase() {
    try {
        // First ensure database schema is up to date
        await DbUtils.runMigrations();

        // Initialize the services
        const userService = new User();
        const productService = new Product();

        // Clear existing data
        console.log('Clearing database...');
        await productService.clearProducts();
        await userService.clearUsers();
        console.log('Database cleared successfully');

        // Generate fake users
        await generateFakeUsers(10);

        // Generate fake products
        await generateFakeProducts(10);

        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // Close the database connection pool
        await db.getPool().end();
        console.log('Database connection closed');
    }
}

// Run the seeding process
seedDatabase();
