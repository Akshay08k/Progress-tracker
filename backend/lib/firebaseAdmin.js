import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || "mock-project-id";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "mock-email@gserviceaccount.com";
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${projectId}.firebaseio.com`
      });
    } else {
      // Fallback for development if keys aren't set yet
      admin.initializeApp({
        projectId: projectId
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
