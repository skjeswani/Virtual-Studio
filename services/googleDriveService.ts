import type { GoogleUser } from '../types';

declare const gapi: any;

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const ALBUM_FOLDER_NAME = 'Virtual Studio Album';

let googleAuth: any;

const updateUser = (setUser: (user: GoogleUser | null) => void) => {
    const isSignedIn = googleAuth.isSignedIn.get();
    if (isSignedIn) {
        const profile = googleAuth.currentUser.get().getBasicProfile();
        setUser({
            id: profile.getId(),
            name: profile.getName(),
            givenName: profile.getGivenName(),
            familyName: profile.getFamilyName(),
            imageUrl: profile.getImageUrl(),
            email: profile.getEmail(),
        });
    } else {
        setUser(null);
    }
};

export const initClient = (setUser: (user: GoogleUser | null) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
        gapi.load('client:auth2', async () => {
            try {
                if (!process.env.GOOGLE_CLIENT_ID) {
                    console.warn("GOOGLE_CLIENT_ID not set. Drive features are disabled.");
                    return resolve();
                }

                await gapi.client.init({
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    discoveryDocs: DISCOVERY_DOCS,
                    scope: SCOPES,
                });

                googleAuth = gapi.auth2.getAuthInstance();
                googleAuth.isSignedIn.listen(() => updateUser(setUser));
                updateUser(setUser);
                resolve();

            } catch (error) {
                reject(error);
            }
        });
    });
};

export const signIn = () => {
    if (googleAuth) {
        googleAuth.signIn();
    }
};

export const signOut = () => {
    if (googleAuth) {
        googleAuth.signOut();
    }
};


const getAlbumFolderId = async (): Promise<string> => {
    const response = await gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${ALBUM_FOLDER_NAME}' and trashed=false`,
        fields: 'files(id, name)',
    });
    
    if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id;
    } else {
        const fileMetadata = {
            name: ALBUM_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
        };
        const folderResponse = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        return folderResponse.result.id;
    }
};

// Helper to convert base64 to Blob
const b64toBlob = (b64Data: string, contentType = 'image/jpeg', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
};

export const saveImageToDrive = async (base64ImageData: string, prompt: string, productName: string, index: number) => {
    const folderId = await getAlbumFolderId();
    const contentType = 'image/jpeg';
    const blob = b64toBlob(base64ImageData, contentType);
    
    // Sanitize product name for filename
    const sanitizedProductName = productName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedProductName}_${index + 1}_${Date.now()}.jpg`;

    const fileMetadata = {
        name: fileName,
        parents: [folderId],
        description: `Generated prompt: ${prompt}`,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', blob);

    const response = await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: {
            'Content-Type': `multipart/related; boundary=${form.constructor.name}`,
        },
        body: form,
    });
    
    if (response.status !== 200) {
        throw new Error('Failed to upload file to Google Drive');
    }

    return response.result;
};