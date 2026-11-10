import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, userId } from '@/lib/auth-server';

export const runtime = 'nodejs';

// Config
// In KOOMPI Cloud deployment, these are injected automatically
const STORAGE_KEY = process.env.KCONSOLE_STORAGE_KEY;
const STORAGE_URL = process.env.KCONSOLE_STORAGE_URL || 'https://api-kconsole.koompi.cloud';

// POST /api/upload/token
// Requests a presigned URL from KOOMPI Cloud Storage, for a signed-in person only:
// the storage is this app's, and paid for. Each person's files go in a folder of
// their own (users/<their id>/), so whose a file is stays known.
export async function POST(request: NextRequest) {
    const user = await getUserFromRequest(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!STORAGE_KEY) {
        return NextResponse.json({ error: 'Storage not configured (Missing KCONSOLE_STORAGE_KEY)' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { filename, contentType, size } = body;

        if (!filename || !size) {
            return NextResponse.json({ error: 'Filename and size are required' }, { status: 400 });
        }

        // Call KOOMPI Cloud Storage API
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
                visibility: 'public', // We want public images for todos
                path: `users/${userId(user).replace(/[^A-Za-z0-9_-]/g, '_')}`,
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
