export const deleteFile = async (key: string): Promise<boolean> => {
    const storageUrl = process.env.KCONSOLE_STORAGE_URL || 'https://api-kconsole.koompi.cloud';
    const apiKey = process.env.KCONSOLE_STORAGE_KEY;

    if (!apiKey) {
        console.warn('Storage configuration missing (KEY)');
        return false;
    }

    try {
        const response = await fetch(`${storageUrl}/api/storage/objects?key=${encodeURIComponent(key)}`, {
            method: 'DELETE',
            headers: {
                'x-api-key': apiKey,
            },
        });

        if (!response.ok) {
            console.error(`Failed to delete file from storage: ${response.status} ${response.statusText}`, await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error deleting file from storage:', error);
        return false;
    }
};
