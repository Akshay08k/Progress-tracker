import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';
import { corsResponse, handleOptions } from '../../../../lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

// Helper function to verify admin permissions
async function verifyAdmin(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, error: 'Missing auth token' };
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check Firestore user doc for role
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return { authorized: false, error: 'User does not exist in records' };
    }

    const userData = userDoc.data();
    if (userData.role !== 'admin') {
      return { authorized: false, error: 'Access denied: Admin role required' };
    }

    return { authorized: true, requesterUid: decodedToken.uid };
  } catch (error) {
    console.error('Verify admin error:', error);
    return { authorized: false, error: 'Invalid or expired authentication token' };
  }
}

// GET: Retrieve all users
export async function GET(request) {
  const adminCheck = await verifyAdmin(request);
  if (!adminCheck.authorized) {
    return corsResponse({ error: adminCheck.error }, 403);
  }

  try {
    const usersSnapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get();
    const usersList = [];
    usersSnapshot.forEach(doc => {
      usersList.push(doc.data());
    });

    return corsResponse({ users: usersList });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return corsResponse({ error: error.message }, 500);
  }
}

// POST: Suspend/Unsuspend or delete user
export async function POST(request) {
  const adminCheck = await verifyAdmin(request);
  if (!adminCheck.authorized) {
    return corsResponse({ error: adminCheck.error }, 403);
  }

  try {
    const { targetUserId, action } = await request.json(); // actions: 'suspend', 'unsuspend', 'delete'

    if (!targetUserId || !action) {
      return corsResponse({ error: 'Missing targetUserId or action parameters' }, 400);
    }

    if (targetUserId === adminCheck.requesterUid) {
      return corsResponse({ error: 'Cannot perform administrative actions on yourself!' }, 400);
    }

    const userRef = adminDb.collection('users').doc(targetUserId);

    if (action === 'suspend') {
      await userRef.update({ suspended: true, updatedAt: new Date().toISOString() });
      // In a real app, you could also revoke Firebase refresh tokens using adminAuth.revokeRefreshTokens(targetUserId)
      await adminAuth.revokeRefreshTokens(targetUserId);
      return corsResponse({ success: true, message: 'User suspended and active sessions revoked.' });
    } else if (action === 'unsuspend') {
      await userRef.update({ suspended: false, updatedAt: new Date().toISOString() });
      return corsResponse({ success: true, message: 'User unsuspended.' });
    } else if (action === 'delete') {
      // 1. Delete user from auth
      await adminAuth.deleteUser(targetUserId);
      // 2. Delete user document from Firestore (soft-delete or clean up)
      await userRef.delete();
      return corsResponse({ success: true, message: 'User completely deleted from authorization and database.' });
    } else {
      return corsResponse({ error: 'Invalid action parameter specified' }, 400);
    }

  } catch (error) {
    console.error('Admin users POST error:', error);
    return corsResponse({ error: error.message }, 500);
  }
}
