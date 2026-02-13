import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Config
// In KConsole deployment, these are injected automatically
const STORAGE_KEY = process.env.KCONSOLE_STORAGE_KEY;
const STORAGE_URL = process.env.KCONSOLE_STORAGE_URL || 'https://api-kconsole.koompi.cloud';

// POST /api/upload/token
// Requests a presigned URL from KConsole Storage
export async function POST(request: NextRequest) {
    if (!STORAGE_KEY) {
        return NextResponse.json({ error: 'Storage not configured (Missing KCONSOLE_STORAGE_KEY)' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { filename, contentType, size } = body;

        if (!filename || !size) {
            return NextResponse.json({ error: 'Filename and size are required' }, { status: 400 });
        }

        // Call KConsole Storage API
        const response = await fetch(`${STORAGE_URL}/api/storage/upload-token`, {
            method: 'POST',
            headers: {
                'x-api-key': STORAGE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename,
                contentType,
                size,
                visibility: 'public' // We want public images for todos
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get upload token');
        }

        const data = await response.json();
        return NextResponse.json(data.data);

    } catch (error: any) {
        console.error('Upload setup failed:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
