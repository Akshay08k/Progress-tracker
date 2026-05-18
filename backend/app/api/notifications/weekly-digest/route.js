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

    // Set dates for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Fetch user profile from Firestore to get display name and stats
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return corsResponse({ error: 'User not found' }, 404);
    }
    const userData = userDoc.data();
    const displayName = userData.displayName || 'StitchXP Member';
    const userEmail = email || userData.email;

    // Fetch all tasks for the last 7 days
    const tasksSnapshot = await adminDb.collection('tasks')
      .where('userId', '==', userId)
      .where('dueDate', '>=', sevenDaysAgoStr)
      .where('isDeleted', '==', false)
      .get();

    const tasksThisWeek = [];
    tasksSnapshot.forEach(doc => {
      tasksThisWeek.push(doc.data());
    });

    const completedThisWeek = tasksThisWeek.filter(t => t.completed);
    const missedThisWeek = tasksThisWeek.filter(t => !t.completed && t.missed);

    const totalTasks = tasksThisWeek.length;
    const completedCount = completedThisWeek.length;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    const xpEarnedThisWeek = completedThisWeek.reduce((acc, curr) => acc + (curr.xpEarned || 0), 0);

    // Calculate most productive category
    const categoriesMap = {};
    completedThisWeek.forEach(t => {
      const cat = t.category || 'General';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    });

    let peakCategory = 'None';
    let peakCount = 0;
    Object.entries(categoriesMap).forEach(([cat, count]) => {
      if (count > peakCount) {
        peakCategory = cat;
        peakCount = count;
      }
    });

    // Email html layout (woven stitch canvas theme aesthetic, clean and readable)
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 2px dashed #534ab7; border-radius: 12px; background-color: #f8f7f4; color: #1f2937;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 26px; font-weight: bold; color: #1a1a1a;">Stitch<span style="color: #534ab7;">XP</span></span>
          <p style="font-size: 13px; color: #4b5563; margin: 4px 0 0 0;">Your Weekly Progress Digest</p>
        </div>
        
        <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 12px;">Weekly Wrap-Up</h2>
        <p style="font-size: 15px; color: #4b5563;">Hi ${displayName},</p>
        <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">You've completed another full week of goals and tasks! Here is how your week shaped up:</p>
        
        <div style="margin: 20px 0; background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e1; box-shadow: 0 4px 12px rgba(83,74,183,0.04);">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-weight: 500;">Tasks Completed:</td>
              <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: 700; color: #1a1a1a; text-align: right;">${completedCount} / ${totalTasks}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-weight: 500;">Completion Rate:</td>
              <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: 700; color: #534ab7; text-align: right; font-family: monospace;">${completionRate}%</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-weight: 500;">Weekly Experience:</td>
              <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: 700; color: #10b981; text-align: right;">+${xpEarnedThisWeek} XP</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-weight: 500;">Peak Focus Area:</td>
              <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: 700; color: #d85a30; text-align: right;">${peakCategory}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #6b7280; font-weight: 500;">Active Streak:</td>
              <td style="padding: 10px; font-weight: 700; color: #ef4444; text-align: right;">${userData.streak || 0} Days 🔥</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #4b5563; line-height: 1.5; text-align: center; margin-top: 24px;">
          "Consistent small stitches build the strongest canvas."
        </p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.5; text-align: center; font-weight: 500;">
          Keep up the fantastic work for the upcoming week!
        </p>

        <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 24px 0;" />
        <div style="text-align: center; font-size: 12px; color: #9ca3af;">
          StitchXP Progress Tracker • Sent Sunday Evening Digest
        </div>
      </div>
    `;

    await sendEmail({
      to: userEmail,
      subject: `StitchXP Weekly Digest: ${completedCount} Tasks Completed (+${xpEarnedThisWeek} XP)`,
      html: emailHtml
    });

    return corsResponse({
      success: true,
      tasksAnalyzed: totalTasks,
      completionRate,
      xpEarnedThisWeek,
      peakCategory
    });

  } catch (error) {
    console.error('Weekly Digest Route error:', error);
    return corsResponse({ error: error.message }, 500);
  }
}
