const cron = require('node-cron');
const User = require('../models/userModel');
const { sendEmail } = require('../utils/emailService');

// Check for expired memberships daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('🕒 Running daily membership expiration check...');
  try {
    const now = new Date();
    const expiredUsers = await User.find({
      paymentStatus: 'accepted',
      membershipEndDate: { $lte: now }
    });

    let expiredCount = 0;
    for (const user of expiredUsers) {
      user.paymentStatus = 'expired';
      await user.save();
      expiredCount++;

      // Send expiration notification
      sendEmail(user.email, 'expiration', user)
        .then(() => console.log(`✅ Expiration email sent to: ${user.email}`))
        .catch(error => console.error(`❌ Failed to send expiration email to ${user.email}:`, error.message));
    }

    console.log(`✅ Daily check: ${expiredCount} memberships expired`);
  } catch (error) {
    console.error('❌ Error in daily membership check:', error);
  }
});

// Check for expiring soon memberships daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('🕘 Running expiring soon membership check...');
  try {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringSoonUsers = await User.find({
      paymentStatus: 'accepted',
      membershipEndDate: {
        $lte: sevenDaysFromNow,
        $gt: new Date()
      }
    });

    for (const user of expiringSoonUsers) {
      // Send renewal reminder
      sendEmail(user.email, 'renewal_reminder', {
        ...user.toObject(),
        daysUntilExpiration: user.daysUntilExpiration
      })
        .then(() => console.log(`✅ Renewal reminder sent to: ${user.email}`))
        .catch(error => console.error(`❌ Failed to send renewal reminder to ${user.email}:`, error.message));
    }

    console.log(`✅ Renewal reminders sent to ${expiringSoonUsers.length} users`);
  } catch (error) {
    console.error('❌ Error in expiring soon check:', error);
  }
});

module.exports = cron;