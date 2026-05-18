import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';
import { corsResponse, handleOptions } from '../../../../lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

async function verifyAdmin(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return { authorized: false };

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) return { authorized: false };

    return { authorized: userDoc.data().role === 'admin' };
  } catch {
    return { authorized: false };
  }
}

// GET: Retrieve the active announcement banner
export async function GET() {
  try {
    const announcementDoc = await adminDb.collection('settings').doc('announcement').get();
    if (announcementDoc.exists) {
      return corsResponse(announcementDoc.data());
    } else {
      return corsResponse({ message: '', active: false });
    }
  } catch (error) {
    console.error('Announcements GET error:', error);
    return corsResponse({ error: error.message }, 500);
  }
}

// POST: Update the global announcement banner (Admin only)
export async function POST(request) {
  const adminCheck = await verifyAdmin(request);
  if (!adminCheck.authorized) {
    return corsResponse({ error: 'Access denied: Admin role required' }, 403);
  }

  try {
    const { message, active } = await request.json();

    if (message === undefined || active === undefined) {
      return corsResponse({ error: 'Missing message or active status fields' }, 400);
    }

    await adminDb.collection('settings').doc('announcement').set({
      message,
      active,
      updatedAt: new Date().toISOString()
    });

    return corsResponse({ success: true, message: 'Global announcement updated successfully.' });
  } catch (error) {
    console.error('Announcements POST error:', error);
    return corsResponse({ error: error.message }, 500);
  }
}
