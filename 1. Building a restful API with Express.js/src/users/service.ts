import { executeQuery } from '../database';

export interface TUser {
    id: string;
    name: string;
    email: string;
    age?: number;
    avatar?: string;
    created_at?: string;
}

export class User {
    constructor() {
        this.initializeTable();
    }

    private async initializeTable(): Promise<void> {
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

    async insertUser(user: Omit<TUser, 'created_at'>): Promise<string> {
        const result = await executeQuery(
            `INSERT INTO users (id, name, email, age, avatar)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [
                user.id,
                user.name,
                user.email,
                user.age || null,
                user.avatar || null
            ]
        );

        console.log(`Inserted user: ${user.name}`);
        return result.rows[0].id;
    }

    async getAllUsers(): Promise<TUser[]> {
        const result = await executeQuery("SELECT * FROM users;");
        return result.rows;
    }

    async getUserById(id: string): Promise<TUser | null> {
        const result = await executeQuery("SELECT * FROM users WHERE id = $1;", [id]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async getUserByEmail(email: string): Promise<TUser | null> {
        const result = await executeQuery("SELECT * FROM users WHERE email = $1;", [email]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async updateUser(id: string, userData: Partial<TUser>): Promise<boolean> {
        // First get the existing user
        const existingUser = await this.getUserById(id);
        if (!existingUser) return false;

        // Merge existing data with updates
        const updatedUser = { ...existingUser, ...userData };

        const result = await executeQuery(
            `UPDATE users
             SET name = $1, email = $2, age = $3, avatar = $4
             WHERE id = $5;`,
            [
                updatedUser.name,
                updatedUser.email,
                updatedUser.age || null,
                updatedUser.avatar || null,
                id
            ]
        );

        return (result.rowCount ?? 0) > 0;
    }

    async deleteUser(id: string): Promise<boolean> {
        const result = await executeQuery("DELETE FROM users WHERE id = $1;", [id]);
        return (result.rowCount ?? 0) > 0;
    }

    async clearUsers(): Promise<void> {
        await executeQuery("DELETE FROM users;");
    }
}
