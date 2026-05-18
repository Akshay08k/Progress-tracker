import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';
import { corsResponse, handleOptions } from '../../../../lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

async function verifyAdmin(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false };
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) return { authorized: false };

    const userData = userDoc.data();
    if (userData.role !== 'admin') return { authorized: false };

    return { authorized: true };
  } catch {
    return { authorized: false };
  }
}

export async function GET(request) {
  const adminCheck = await verifyAdmin(request);
  if (!adminCheck.authorized) {
    return corsResponse({ error: 'Access denied' }, 403);
  }

  try {
    // 1. Total users
    const usersSnapshot = await adminDb.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // 2. Start of today and start of week timestamps
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayStr = startOfToday.toISOString();

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString();

    // 3. Tasks created today
    const tasksTodaySnapshot = await adminDb.collection('tasks')
      .where('createdAt', '>=', startOfTodayStr)
      .get();
    const tasksCreatedToday = tasksTodaySnapshot.size;

    // 4. Tasks created this week
    const tasksWeekSnapshot = await adminDb.collection('tasks')
      .where('createdAt', '>=', startOfWeekStr)
      .get();
    const tasksCreatedWeek = tasksWeekSnapshot.size;

    // 5. Total notifications sent
    const notificationsSnapshot = await adminDb.collection('notifications').get();
    const notificationsSent = notificationsSnapshot.size;

    return corsResponse({
      stats: {
        totalUsers,
        tasksCreatedToday,
        tasksCreatedWeek,
        notificationsSent
      }
    });

  } catch (error) {
    console.error('Admin stats GET error:', error);
    return corsResponse({ error: error.message }, 500);
  }
}
