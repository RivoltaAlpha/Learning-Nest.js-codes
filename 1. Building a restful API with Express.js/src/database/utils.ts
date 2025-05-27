import db, { executeQuery } from './index';
import fs from 'fs';

// Database utility functions for migrations and maintenance

export class DbUtils {
    // Run all migrations to set up database schema

    static async runMigrations(): Promise<void> {
        console.log('Running database migrations...');

        try {
            // Check if tables already exist before creating them
            const tablesExist = await executeQuery(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'users'
                );
            `);

            if (!tablesExist.rows[0].exists) {
                // Create users table
                await executeQuery(`
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        age INTEGER,
                        avatar TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);
            }

            // Check if products table exists
            const productsExist = await executeQuery(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'products'
                );
            `);

            if (!productsExist.rows[0].exists) {
                // Create products table
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

            console.log('Migrations completed successfully');
        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }   

    // Get database information
    static async getDbInfo(): Promise<any> {
        try {
            // Get database info
            const versionResult = await executeQuery('SELECT version();');

            // Get table list
            const tablesResult = await executeQuery(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_type = 'BASE TABLE';
            `);

            const tables = tablesResult.rows.map((row: any) => row.table_name);

            return {
                database: {
                    version: versionResult.rows[0].version
                },
                tables: tables
            };
        } catch (error) {
            console.error('Failed to get database info:', error);
            throw error;
        }
    }
}
