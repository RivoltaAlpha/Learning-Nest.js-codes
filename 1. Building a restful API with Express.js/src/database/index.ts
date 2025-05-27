// src/config/database.ts
import env from './env'
import { Pool, PoolConfig, QueryResult } from 'pg'

class Database {
    private pool: Pool;

    constructor() {
        const poolConfig: PoolConfig = {
            host: env.host,
            port: env.port,
            user: env.user,
            password: env.password,
            database: env.database,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            // For production with SSL:
            // ssl: {
            //   rejectUnauthorized: false
            // }
        };

        this.pool = new Pool(poolConfig);

        this.pool.on('connect', () => {
            console.log('Connected to PostgreSQL database');
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }

    getPool(): Pool {
        return this.pool;
    }

    // Execute a SQL query
    async executeQuery(text: string, params: any[] = []): Promise<QueryResult> {
        const client = await this.pool.connect();
        try {
            return await client.query(text, params);
        } finally {
            client.release();
        }
    }

    // Execute a SQL query within a transaction    
    async executeTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }    // Initialize database tables

    async initializeTables(): Promise<void> {
        console.log('Initializing database tables...');

        try {
            // Check if tables already exist before creating them
            const tablesExist = await this.executeQuery(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'users'
                );
            `);

            if (!tablesExist.rows[0].exists) {
                // Create users table
                await this.executeQuery(`
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
            const productsExist = await this.executeQuery(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'products'
                );
            `);

            if (!productsExist.rows[0].exists) {
                // Create products table
                await this.executeQuery(`
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

            console.log('Database tables initialized successfully');
        } catch (error) {
            console.error('Table initialization failed:', error);
            throw error;
        }
    }
}

// Create singleton instance
const db = new Database();

// Export instance methods
export const executeQuery = (text: string, params: any[] = []) => db.executeQuery(text, params);
export const initializeTables = () => db.initializeTables();
export default db;
