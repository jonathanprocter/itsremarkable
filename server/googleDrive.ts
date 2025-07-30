import { google } from 'googleapis';
// Helper function to get authenticated user ID
function getAuthenticatedUserId(req: any): number | null {
  const sources = [
    req.user?.id,
    req.session?.user?.id,
    req.session?.userId,
    req.session?.passport?.user
  ];

  for (const source of sources) {
    if (source) {
      const parsed = parseInt(source);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  if (req.session?.isAuthenticated && process.env.NODE_ENV === 'development') {
    return 2;
  }

  return null;
}

// Import storage function
async function getUserById(userId: number) {
  const { storage } = await import('./storage');
  return await storage.getUserById(userId);
}

// Initialize Google Drive API
export async function initializeDriveAPI(req: any) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const user = await getUserById(userId);
  if (!user || !user.accessToken) {
    throw new Error('No valid Google access token found');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  return { drive, oauth2Client };
}

// Create or find "reMarkable Calendars" folder
export async function getOrCreateCalendarFolder(drive: any) {
  try {
    // Search for existing folder
    const folderSearch = await drive.files.list({
      q: "name='reMarkable Calendars' and mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name)'
    });

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      return folderSearch.data.files[0].id;
    }

    // Create folder if it doesn't exist
    const folderMetadata = {
      name: 'reMarkable Calendars',
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    return folder.data.id;
  } catch (error) {
    console.error('Error managing calendar folder:', error);
    throw error;
  }
}

// Upload PDF to Google Drive
export async function uploadPDFToGoogleDrive(drive: any, folderId: string, filename: string, pdfBuffer: Buffer) {
  try {
    const fileMetadata = {
      name: filename,
      parents: [folderId]
    };

    const media = {
      mimeType: 'application/pdf',
      body: pdfBuffer
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });

    return {
      fileId: response.data.id,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink
    };
  } catch (error) {
    console.error('Error uploading PDF to Google Drive:', error);
    throw error;
  }
}

// List files in calendar folder
export async function listCalendarFiles(drive: any, folderId: string) {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, createdTime, webViewLink, size)',
      orderBy: 'createdTime desc'
    });

    return response.data.files || [];
  } catch (error) {
    console.error('Error listing calendar files:', error);
    throw error;
  }
}

// Get Google Drive storage usage
export async function getDriveStorageInfo(drive: any) {
  try {
    const response = await drive.about.get({
      fields: 'storageQuota'
    });

    const quota = response.data.storageQuota;
    return {
      used: parseInt(quota.usage || '0'),
      total: parseInt(quota.limit || '0'),
      usedPercent: quota.limit ? Math.round((parseInt(quota.usage || '0') / parseInt(quota.limit)) * 100) : 0
    };
  } catch (error) {
    console.error('Error getting drive storage info:', error);
    throw error;
  }
}