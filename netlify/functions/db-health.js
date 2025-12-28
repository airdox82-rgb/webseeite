import { neon } from '@netlify/neon';

export const handler = async () => {
    const sql = neon();

    try {
        const result = await sql`SELECT NOW() as current_time`;
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'healthy',
                database: 'connected',
                timestamp: result[0].current_time
            })
        };
    } catch (error) {
        console.error('Health Check Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'unhealthy',
                error: error.message
            })
        };
    }
};
