import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();
// Request Workspace scope for full Google Drive access as requested/approved
provider.addScope('https://www.googleapis.com/auth/drive');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Start popup sign-in flow
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('[Google Drive Auth Error] Sign in failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve cached access token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Sign out from application
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Uploads a text dental ticket to the user's Google Drive.
 */
export const uploadTicketToDrive = async (
  accessToken: string, 
  ticketText: string, 
  filename: string
): Promise<{ id: string; name: string }> => {
  const metadata = {
    name: filename,
    mimeType: 'text/plain',
    description: 'Dental Appointment Ticket from Dawidar Dental Center'
  };

  const boundary = 'dawidar_multipart_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    ticketText +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: body,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload to Google Drive: ${errText}`);
  }

  return await response.json();
};

/**
 * Lists previously uploaded dental tickets from Google Drive.
 */
export interface DriveTicketFile {
  id: string;
  name: string;
  createdTime: string;
  webViewLink?: string;
}

export const listDriveTickets = async (accessToken: string): Promise<DriveTicketFile[]> => {
  const q = encodeURIComponent("name contains 'Dawidar_Dental_Ticket_' and name contains '.txt' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,createdTime,webViewLink)&orderBy=createdTime%20desc&pageSize=15`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to list tickets from Google Drive: ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
};
