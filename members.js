import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    // Set CORS headers so your frontend can communicate smoothly
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    const STORAGE_KEY = 'osis_members_permanent';

    try {
        // GET Request: Fetch all members from the database
        if (request.method === 'GET') {
            const data = await kv.get(STORAGE_KEY);
            return response.status(200).json(data || []);
        }

        // POST Request: Overwrite the data with the updated array from frontend
        if (request.method === 'POST') {
            const updatedMembers = request.body;
            if (!Array.isArray(updatedMembers)) {
                return response.status(400).json({ error: 'Invalid data format. Expected an array.' });
            }
            await kv.set(STORAGE_KEY, updatedMembers);
            return response.status(200).json({ success: true, message: 'Database updated permanently!' });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Database Error:', error);
        return response.status(500).json({ error: 'Internal server error connectivity issue' });
    }
}
