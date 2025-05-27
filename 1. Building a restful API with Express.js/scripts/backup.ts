import db, { executeQuery }  from '../src/database';
import fs from 'fs';
import path from 'path';

async function backup(): Promise<void> {
    try {
        // Get schema dump using pg_dump (requires pg_dump to be in PATH)
        const pool = db.getPool();
        const client = await pool.connect();

        try {
            // Get database name
            const dbNameResult = await executeQuery('SELECT current_database();');
            const dbName = dbNameResult.rows[0].current_database;
            
            // Create backup directory if it doesn't exist
            const backupDir = path.resolve('./backup');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            // Set backup file path with database name
            const backupFilePath = path.join(backupDir, `${dbName}.sql`);

            // Get table structure
            const tablesList = await executeQuery(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_type = 'BASE TABLE';
            `);

            // Create backup content
            let backupContent = '-- Database Backup\n\n';

            for (const tableRow of tablesList.rows) {
                const tableName = tableRow.table_name;

                // Get table structure
                const tableSchema = await executeQuery(`
                    SELECT column_name, data_type, character_maximum_length
                    FROM information_schema.columns
                    WHERE table_name = $1
                    ORDER BY ordinal_position;
                `, [tableName]);

                backupContent += `-- Table: ${tableName}\n`;
                backupContent += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

                const columns = tableSchema.rows.map((col: any) => {
                    let colDef = `    ${col.column_name} ${col.data_type}`;
                    if (col.character_maximum_length) {
                        colDef += `(${col.character_maximum_length})`;
                    }
                    return colDef;
                }).join(',\n');

                backupContent += columns + '\n);\n\n';
                
                // Get table data
                const tableData = await executeQuery(`SELECT * FROM ${tableName};`);
                
                if (tableData.rows.length > 0) {
                    backupContent += `-- Data for table: ${tableName}\n`;
                    
                    // Get column names for INSERT statements
                    const columnNames = tableSchema.rows.map((col: any) => col.column_name).join(', ');
                    
                    // Generate INSERT statements for each row
                    for (const row of tableData.rows) {
                        const values = tableSchema.rows.map((col: any) => {
                            const value = row[col.column_name];
                            if (value === null) return 'NULL';
                            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                            if (value instanceof Date) return `'${value.toISOString()}'`;
                            return value;
                        }).join(', ');
                        
                        backupContent += `INSERT INTO ${tableName} (${columnNames}) VALUES (${values});\n`;
                    }
                    
                    backupContent += '\n';
                }
            }

            // Write to file
            fs.writeFileSync(backupFilePath, backupContent);
            console.log(`Backup created at ${backupFilePath}`);

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Backup failed:', error);
        throw error;
    }
}

backup();