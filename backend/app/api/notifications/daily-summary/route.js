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
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Fetch user profile
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return corsResponse({ error: 'User not found' }, 404);
    }
    const userData = userDoc.data();
    const displayName = userData.displayName || 'User';
    const userEmail = email || userData.email;

    // Fetch habits
    const habitsSnapshot = await adminDb.collection('habits')
      .where('userId', '==', userId)
      .where('archived', '==', false)
      .get();

    const habits = [];
    habitsSnapshot.forEach(doc => {
      habits.push({ id: doc.id, ...doc.data() });
    });

    const completedHabits = habits.filter(h => 
      h.completions?.some(c => c.date === todayStr && c.completed)
    );
    const missedHabits = habits.filter(h => 
      !h.completions?.some(c => c.date === todayStr && c.completed)
    );

    const totalHabits = habits.length;
    const completedCount = completedHabits.length;
    const completionRate = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

    // Calculate best streak
    let bestStreak = 0;
    habits.forEach(h => {
      if (h.completions) {
        const streak = calculateStreak(h.completions);
        if (streak > bestStreak) bestStreak = streak;
      }
    });

    const completedListHtml = completedCount > 0 
      ? completedHabits.map(h => `<li style="padding: 6px 0; color: #10b981;">✓ <b>${h.icon || '🎯'} ${h.name}</b></li>`).join('')
      : '<li style="padding: 6px 0; color: #9ca3af; font-style: italic;">No habits completed today.</li>';

    const missedListHtml = missedHabits.length > 0
      ? missedHabits.slice(0, 5).map(h => `<li style="padding: 6px 0; color: #f59e0b;">○ <b>${h.icon || '🎯'} ${h.name}</b></li>`).join('')
      : '<li style="padding: 6px 0; color: #9ca3af; font-style: italic;">All habits completed! Perfect day!</li>';

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border-radius: 16px; background-color: #ffffff; color: #1f2937; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: #6366f1; border-radius: 12px; line-height: 48px; color: white; font-size: 24px; font-weight: bold;">H</div>
          <p style="font-size: 13px; color: #6b7280; margin: 8px 0 0 0;">Daily Habit Recap</p>
        </div>
        
        <h2 style="font-size: 20px; font-weight: 600; color: #111827; text-align: center; margin: 0 0 16px 0;">Hi ${displayName}!</h2>
        
        <div style="margin: 20px 0; background: linear-gradient(135deg, #f0f9ff, #e0e7ff); padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Today's Progress</h3>
          <div style="font-size: 40px; font-weight: bold; color: #6366f1; margin: 10px 0;">${completionRate}%</div>
          <p style="margin: 0; font-size: 14px; color: #4b5563;">You completed <b>${completedCount}/${totalHabits}</b> habits today</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">Best streak: <b>${bestStreak} days</b> 🔥</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 15px; color: #10b981; margin-bottom: 8px;">Completed Today</h3>
          <ul style="list-style-type: none; padding-left: 0; margin: 0; font-size: 14px;">
            ${completedListHtml}
          </ul>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 15px; color: #f59e0b; margin-bottom: 8px;">Still Pending</h3>
          <ul style="list-style-type: none; padding-left: 0; margin: 0; font-size: 14px;">
            ${missedListHtml}
          </ul>
        </div>

        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <div style="text-align: center; font-size: 12px; color: #9ca3af;">
          Habit Tracker • Keep building better routines!
        </div>
      </div>
    `;

    await sendEmail({
      to: userEmail,
      subject: `Habit Tracker: ${completionRate}% completed today`,
      html: emailHtml
    });

    return corsResponse({
      success: true,
      habitsAnalyzed: totalHabits,
      completionRate
    });

  } catch (error) {
    console.error('Daily Summary Route error:', error);
    return corsResponse({ error: error.message }, 500);
  }
}

function calculateStreak(completions) {
  const sorted = [...completions]
    .filter(c => c.completed)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  if (sorted.length === 0) return 0;
  
  let streak = 0;
  let checkDate = new Date();
  
  for (const completion of sorted) {
    const expectedDate = checkDate.toISOString().split('T')[0];
    if (completion.date === expectedDate) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (completion.date < expectedDate) {
      break;
    }
  }
  
  return streak;
}
