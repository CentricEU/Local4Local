import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
require('dotenv').config();

export class DataBase {
    private DBConfig = {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        port: 5432,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        allowExitOnIdle: false,
        ssl: { rejectUnauthorized: false },
    };

    private async runQuery(query: string): Promise<any[]> {
        const client = new Client(this.DBConfig);
        try {
            await client.connect();
            const result = await client.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error in query execution:', error);
            throw error;
        } finally {
            await client.end().catch((error) => {
                console.error('Error ending client connection:', error);
            });
        }
    }

    private loadAndPrepareQuery(filePath: string, params?: any[]): string {
        const scriptPath = path.join(__dirname, filePath);
        let script = fs.readFileSync(scriptPath, 'utf-8');

        if (params && params.length > 0) {
            params.forEach((param, index) => {
                script = script.replace(new RegExp(`\\$${index + 1}`, 'g'), `'${param}'`);
            });
        }
        return script;
    }

    async executeQuery(query: string): Promise<any[]> {
        return await this.runQuery(query);
    }

    async executeQueryFromFile(filePath: string, params?: any[]): Promise<void> {
        const script = this.loadAndPrepareQuery(filePath, params);
        await this.runQuery(script);
    }

    async getValueOfExecuteQueryFromFile(filePath: string, params?: any[]): Promise<any[]> {
        const script = this.loadAndPrepareQuery(filePath, params);
        return await this.runQuery(script);
    }
}
