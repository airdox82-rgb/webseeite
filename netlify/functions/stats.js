import { neon } from '@netlify/neon';

export const handler = async (event) => {
    // Netlify Neon client picks up DATABASE_URL automatically
    const sql = neon();

    try {
        // Auto-Migration
        await sql`
            CREATE TABLE IF NOT EXISTS track_stats (
                id TEXT PRIMARY KEY,
                plays INTEGER DEFAULT 0,
                likes INTEGER DEFAULT 0,
                dislikes INTEGER DEFAULT 0
            );
        `;

        // GET
        if (event.httpMethod === 'GET') {
            const rows = await sql`SELECT * FROM track_stats`;
            const stats = {};
            rows.forEach(row => {
                stats[row.id] = row;
            });
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stats)
            };
        }

        // POST
        if (event.httpMethod === 'POST') {
            if (!event.body) return { statusCode: 400, body: 'Missing body' };
            const { id, type } = JSON.parse(event.body);
            if (!id || !type) return { statusCode: 400, body: 'Missing id or type' };

            // Initialize row
            await sql`
                INSERT INTO track_stats (id, plays, likes, dislikes)
                VALUES (${id}, 0, 0, 0)
                ON CONFLICT (id) DO NOTHING;
            `;

            // Updates
            if (type === 'play') {
                await sql`UPDATE track_stats SET plays = plays + 1 WHERE id = ${id}`;
            } else if (type === 'like') {
                await sql`UPDATE track_stats SET likes = likes + 1 WHERE id = ${id}`;
            } else if (type === 'dislike') {
                await sql`UPDATE track_stats SET dislikes = dislikes + 1 WHERE id = ${id}`;
            } else if (type === 'unlike') {
                await sql`UPDATE track_stats SET likes = GREATEST(0, likes - 1) WHERE id = ${id}`;
            } else if (type === 'undislike') {
                await sql`UPDATE track_stats SET dislikes = GREATEST(0, dislikes - 1) WHERE id = ${id}`;
            }

            const [updated] = await sql`SELECT * FROM track_stats WHERE id = ${id}`;
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            };
        }

        return { statusCode: 405, body: 'Method Not Allowed' };
    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message || 'Unknown database error' })
        };
    }
};
