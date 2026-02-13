import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Config
const STORAGE_KEY = process.env.KCONSOLE_STORAGE_KEY;
const STORAGE_URL = process.env.KCONSOLE_STORAGE_URL || 'https://api-kconsole.koompi.cloud';

// POST /api/upload/complete
// Confirms upload completion to KConsole Storage
export async function POST(request: NextRequest) {
    if (!STORAGE_KEY) {
        return NextResponse.json({ error: 'Storage not configured (Missing KCONSOLE_STORAGE_KEY)' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { objectId } = body;

        if (!objectId) {
            return NextResponse.json({ error: 'objectId is required' }, { status: 400 });
        }

        // Call KConsole Storage API
        const response = await fetch(`${STORAGE_URL}/api/storage/complete`, {
            method: 'POST',
            headers: {
                'x-api-key': STORAGE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ objectId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to complete upload');
        }

        const data = await response.json();
        return NextResponse.json(data.data);

    } catch (error: any) {
        console.error('Upload completion failed:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
