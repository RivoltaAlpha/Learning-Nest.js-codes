import { Request, Response } from 'express';
import { User, TUser } from './service';
import * as uuid from 'uuid';

// Initialize user service
const userService = new User();

export class UserController {
    /**
     * Get all users
     */
    public async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await userService.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Failed to retrieve users' });
        }
    }

    /**
     * Get user by ID
     */
    public async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = await userService.getUserById(id);

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json(user);
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({ error: 'Failed to retrieve user' });
        }
    }

    /**
     * Create a new user
     */
    public async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { name, email, age, avatar } = req.body;

            if (!name || !email) {
                res.status(400).json({ error: 'Name and email are required' });
                return;
            }

            // Check if user with email already exists
            const existingUser = await userService.getUserByEmail(email);
            if (existingUser) {
                res.status(409).json({ error: 'User with this email already exists' });
                return;
            }

            // Create a new user with the provided data
            const newUser: Omit<TUser, 'created_at'> = {
                id: uuid.v4(),
                name,
                email,
                age: age ? Number(age) : undefined,
                avatar
            };

            await userService.insertUser(newUser);

            // Return the newly created user
            const user = await userService.getUserById(newUser.id);
            res.status(201).json(user);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }

    /**
     * Update an existing user
     */
    public async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, email, age, avatar } = req.body;

            const userData: Partial<TUser> = {};

            if (name) {
                userData.name = name;
            }

            if (email) {
                // Check if another user has this email
                const existingUser = await userService.getUserByEmail(email);
                if (existingUser && existingUser.id !== id) {
                    res.status(409).json({ error: 'Email is already in use by another user' });
                    return;
                }
                userData.email = email;
            }

            if (age !== undefined) {
                userData.age = age ? Number(age) : undefined;
            }

            if (avatar !== undefined) {
                userData.avatar = avatar;
            }

            const updated = await userService.updateUser(id, userData);

            if (!updated) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            const user = await userService.getUserById(id);
            res.json(user);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    }

    /**
     * Delete a user
     */
    public async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = await userService.getUserById(id);

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            await userService.deleteUser(id);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }
}
