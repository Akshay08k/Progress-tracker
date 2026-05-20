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
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayStr = startOfToday.toISOString();

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString();

    const todayStr = new Date().toISOString().split('T')[0];

    // Users
    const usersSnapshot = await adminDb.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Habits stats
    const habitsSnapshot = await adminDb.collection('habits').get();
    const totalHabits = habitsSnapshot.size;

    let habitsCompletedToday = 0;
    habitsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.completions && Array.isArray(data.completions)) {
        const todayCompletion = data.completions.find(c => c.date === todayStr && c.completed);
        if (todayCompletion) habitsCompletedToday++;
      }
    });

    // Best streak across all users
    let bestStreak = 0;
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.streak && userData.streak > bestStreak) {
        bestStreak = userData.streak;
      }
    });

    // Notifications
    const notificationsSnapshot = await adminDb.collection('notifications').get();
    const notificationsSent = notificationsSnapshot.size;

    return corsResponse({
      stats: {
        totalUsers,
        totalHabits,
        habitsCompletedToday,
        bestStreak,
        notificationsSent
      }
    });

  } catch (error) {
    console.error('Admin stats GET error:', error);
    return corsResponse({ error: error.message }, 500);
  }
}
