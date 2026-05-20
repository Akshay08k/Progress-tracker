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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

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
      habits.push(doc.data());
    });

    // Calculate weekly stats
    let totalCompletions = 0;
    let totalPossible = 0;
    let bestHabitStreak = 0;

    habits.forEach(h => {
      if (h.completions && Array.isArray(h.completions)) {
        const weekCompletions = h.completions.filter(c => c.date >= sevenDaysAgoStr && c.completed);
        totalCompletions += weekCompletions.length;
        totalPossible += 7; // 7 days per habit
        
        const streak = calculateStreak(h.completions);
        if (streak > bestHabitStreak) bestHabitStreak = streak;
      }
    });

    const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

    // Top habits this week
    const habitWeekCounts = habits.map(h => {
      const count = h.completions?.filter(c => c.date >= sevenDaysAgoStr && c.completed).length || 0;
      return { name: h.name, icon: h.icon || '🎯', count };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    const topHabitsHtml = habitWeekCounts.length > 0
      ? habitWeekCounts.map(h => `<li style="padding: 6px 0;">${h.icon} <b>${h.name}</b> - ${h.count}/7 days</li>`).join('')
      : '<li style="padding: 6px 0; color: #9ca3af; font-style: italic;">No habits tracked this week.</li>';

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border-radius: 16px; background-color: #ffffff; color: #1f2937; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: #6366f1; border-radius: 12px; line-height: 48px; color: white; font-size: 24px; font-weight: bold;">H</div>
          <p style="font-size: 13px; color: #6b7280; margin: 8px 0 0 0;">Weekly Progress Digest</p>
        </div>
        
        <h2 style="font-size: 20px; font-weight: 600; color: #111827; text-align: center; margin: 0 0 16px 0;">Hi ${displayName}!</h2>
        <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">Here's your weekly habit summary:</p>
        
        <div style="margin: 20px 0; background: linear-gradient(135deg, #f0f9ff, #e0e7ff); padding: 20px; border-radius: 12px; text-align: center;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Completion Rate:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #6366f1; text-align: right;">${completionRate}%</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Days Completed:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #111827; text-align: right;">${totalCompletions} / ${totalPossible}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Best Streak:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #f97316; text-align: right;">${bestHabitStreak} Days 🔥</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #6b7280; font-weight: 500;">Active Streak:</td>
              <td style="padding: 10px; font-weight: 700; color: #f97316; text-align: right;">${userData.streak || 0} Days 🔥</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 15px; color: #6366f1; margin-bottom: 8px;">Top Habits This Week</h3>
          <ul style="list-style-type: none; padding-left: 0; margin: 0; font-size: 14px;">
            ${topHabitsHtml}
          </ul>
        </div>

        <p style="font-size: 14px; color: #4b5563; line-height: 1.5; text-align: center; margin-top: 24px; font-style: italic;">
          "Small daily improvements lead to remarkable results."
        </p>

        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <div style="text-align: center; font-size: 12px; color: #9ca3af;">
          Habit Tracker • Weekly Digest
        </div>
      </div>
    `;

    await sendEmail({
      to: userEmail,
      subject: `Weekly Digest: ${completionRate}% completion rate`,
      html: emailHtml
    });

    return corsResponse({
      success: true,
      completionRate,
      totalCompletions,
      bestHabitStreak
    });

  } catch (error) {
    console.error('Weekly Digest Route error:', error);
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
