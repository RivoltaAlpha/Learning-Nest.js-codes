import express from 'express';
import { Express, Request, Response, NextFunction } from 'express';
import usersRouter from './users/router';
import productsRouter from './products/router';
import { DbUtils } from './database/utils';

// Start the application
async function startServer() {
    try {
        // Run database migrations
        await DbUtils.runMigrations();

        const app: Express = express();
        const PORT = process.env.PORT || 8000;

        // Middleware
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // Routes
        app.get('/api', (req: Request, res: Response) => {
            res.json({ message: 'Welcome to the API' });
        });

        app.use('/api/products', productsRouter);
        app.use('/api/users', usersRouter);

        // Error handling middleware
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error(err.stack);
            res.status(500).json({ error: 'Something went wrong!' });
        });

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Initialize database tables and start server
startServer().catch(err => {
    console.error('Unhandled error during server startup:', err);
    process.exit(1);
});