import { adminDb } from '../../../../lib/firebaseAdmin';
import { sendEmail } from '../../../../lib/nodemailer';
import { corsResponse, handleOptions } from '../../../../lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request) {
  try {
    const { userId, email } = await request.json();

    if (!userId) {
      return corsResponse({ error: 'Missing userId' }, 400);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Fetch user profile from Firestore to get display name and stats
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return corsResponse({ error: 'User not found' }, 404);
    }
    const userData = userDoc.data();
    const displayName = userData.displayName || 'StitchXP Member';
    const userEmail = email || userData.email;

    // Fetch all tasks for today
    const tasksSnapshot = await adminDb.collection('tasks')
      .where('userId', '==', userId)
      .where('dueDate', '==', todayStr)
      .where('isDeleted', '==', false)
      .get();

    const tasksToday = [];
    tasksSnapshot.forEach(doc => {
      tasksToday.push(doc.data());
    });

    // Fetch all tasks for tomorrow
    const tomorrowSnapshot = await adminDb.collection('tasks')
      .where('userId', '==', userId)
      .where('dueDate', '==', tomorrowStr)
      .where('isDeleted', '==', false)
      .get();

    const tasksTomorrow = [];
    tomorrowSnapshot.forEach(doc => {
      tasksTomorrow.push(doc.data());
    });

    const completedToday = tasksToday.filter(t => t.completed);
    const missedToday = tasksToday.filter(t => !t.completed);

    const totalTasks = tasksToday.length;
    const completedCount = completedToday.length;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    const xpEarnedToday = completedToday.reduce((acc, curr) => acc + (curr.xpEarned || 0), 0);

    // Build lists for email
    const completedListHtml = completedCount > 0 
      ? completedToday.map(t => `<li style="padding: 6px 0; color: #10b981;">✓ <b>${t.title}</b> (${t.category}) <span style="color: #6b7280; font-size: 12px;">+${t.xpEarned} XP</span></li>`).join('')
      : '<li style="padding: 6px 0; color: #9ca3af; font-style: italic;">No tasks completed today.</li>';

    const missedListHtml = missedToday.length > 0
      ? missedToday.map(t => `<li style="padding: 6px 0; color: #ef4444;">✗ <b>${t.title}</b> (${t.category}) <span style="color: #6b7280; font-size: 12px;">${t.priority}</span></li>`).join('')
      : '<li style="padding: 6px 0; color: #9ca3af; font-style: italic;">No tasks missed today! Clean sheet!</li>';

    const tomorrowListHtml = tasksTomorrow.length > 0
      ? tasksTomorrow.map(t => `<li style="padding: 6px 0; color: #534ab7;">• <b>${t.title}</b> (${t.category}) <span style="color: #6b7280; font-size: 12px;">${t.dueTime || 'All Day'}</span></li>`).join('')
      : '<li style="padding: 6px 0; color: #9ca3af; font-style: italic;">No tasks scheduled for tomorrow yet. Relax!</li>';

    // Premium Email Layout (Fusion dark void vibe & Stitch canvas vibe)
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 2px dashed #534ab7; border-radius: 12px; background-color: #0a0a0f; color: #f3f4f6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 26px; font-weight: bold; color: #534ab7; font-family: monospace;">STITCH_XP</span>
          <p style="font-size: 13px; color: #9ca3af; margin: 4px 0 0 0;">Daily Productivity Smart Recap</p>
        </div>
        
        <h2 style="font-size: 20px; font-weight: 500; color: #ffffff; text-align: center; border-bottom: 1px dashed #212030; padding-bottom: 12px;">Hello, ${displayName}!</h2>
        
        <div style="margin: 20px 0; background-color: #111118; padding: 18px; border-radius: 8px; border: 1px solid #212030; text-align: center;">
          <h3 style="margin: 0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Today's Productivity Index</h3>
          <div style="font-size: 40px; font-weight: bold; color: #10b981; font-family: monospace; margin: 10px 0;">${completionRate}%</div>
          <p style="margin: 0; font-size: 14px; color: #9ca3af;">You completed <b>${completedCount}/${totalTasks}</b> tasks and gained <b style="color: #534ab7;">+${xpEarnedToday} XP</b> today!</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #9ca3af; font-style: italic;">Current Streak: <b>${userData.streak || 0} days</b> 🔥</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 15px; color: #10b981; margin-bottom: 8px; border-bottom: 1px dashed #212030; padding-bottom: 4px;">Completed Tasks</h3>
          <ul style="list-style-type: none; padding-left: 0; margin: 0; font-size: 14px;">
            ${completedListHtml}
          </ul>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 15px; color: #ef4444; margin-bottom: 8px; border-bottom: 1px dashed #212030; padding-bottom: 4px;">Missed Tasks</h3>
          <ul style="list-style-type: none; padding-left: 0; margin: 0; font-size: 14px;">
            ${missedListHtml}
          </ul>
        </div>

        <div style="margin-bottom: 24px; background-color: #111118; padding: 16px; border-radius: 8px; border: 1px solid #212030;">
          <h3 style="font-size: 15px; color: #534ab7; margin: 0 0 8px 0; border-bottom: 1px dashed #212030; padding-bottom: 4px;">Tomorrow's Forecast</h3>
          <ul style="list-style-type: none; padding-left: 0; margin: 0; font-size: 14px;">
            ${tomorrowListHtml}
          </ul>
        </div>

        <hr style="border: 0; border-top: 1px dashed #212030; margin: 24px 0;" />
        <div style="text-align: center; font-size: 12px; color: #9ca3af;">
          StitchXP Accountability System • Keep stitching your progress!
        </div>
      </div>
    `;

    await sendEmail({
      to: userEmail,
      subject: `StitchXP Smart Recap: ${completionRate}% Completed Today (+${xpEarnedToday} XP)`,
      html: emailHtml
    });

    return corsResponse({
      success: true,
      tasksAnalyzed: totalTasks,
      completionRate,
      xpEarnedToday
    });

  } catch (error) {
    console.error('Daily Summary Route error:', error);
    return corsResponse({ error: error.message }, 500);
  }
}
