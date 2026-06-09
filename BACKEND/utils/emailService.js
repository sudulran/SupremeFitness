// utils/emailService.js
const nodemailer = require('nodemailer');
const sendEmailBasic = require('../helpers/emailSend'); // Import the basic sender

// Email templates
const emailTemplates = {
  welcome: (user) => ({
    subject: 'Welcome to SUPREME FITNESS Gym!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626; }
          .status-pending { color: #d97706; font-weight: bold; }
          .button { background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SUPREME<span style="color: #ffffff">FITNESS</span></h1>
            <p>Your Fitness Journey Begins Now!</p>
          </div>
          <div class="content">
            <h2>Welcome, ${user.name}! 🎉</h2>
            <p>Thank you for registering with <strong>SUPREME FITNESS Gym</strong>. We're excited to have you on board!</p>
            
            <div class="info-box">
              <h3>Registration Details:</h3>
              <p><strong>Name:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Contact:</strong> ${user.contactNumber}</p>
              <p><strong>Membership:</strong> ${user.membershipType}</p>
              <p><strong>Status:</strong> <span class="status-pending">Pending Approval</span></p>
            </div>

            <p>Your registration is currently under review. Our admin team will verify your payment receipt and activate your account within 24 hours.</p>
            
            <p>Once approved, you'll receive another email with your login credentials and membership details.</p>
            
            <div style="text-align: center;">
              <a href="http://localhost:3000/dashboard" class="button">View Your Account</a>
            </div>

            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Wait for account approval (24 hours)</li>
              <li>Receive activation confirmation email</li>
              <li>Access our gym facilities</li>
              <li>Get your personalized workout plan</li>
            </ul>
          </div>
          <div class="footer">
            <p>&copy; 2024 SUPREME FITNESS Gym. All rights reserved.</p>
            <p>Contact us: fitness@supremefit.com | +94 77 123 4567</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  approval: (user) => ({
    subject: '🎉 Your SUPREME FITNESS Account is Approved!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #059669; }
          .status-approved { color: #059669; font-weight: bold; }
          .button { background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SUPREME<span style="color: #ffffff">FITNESS</span></h1>
            <p>Account Approved! 🎉</p>
          </div>
          <div class="content">
            <h2>Congratulations, ${user.name}! 🎊</h2>
            <p>Great news! Your <strong>SUPREME FITNESS Gym</strong> account has been approved and is now active!</p>
            
            <div class="info-box">
              <h3>Account Details:</h3>
              <p><strong>Name:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Membership:</strong> ${user.membershipType}</p>
              <p><strong>Status:</strong> <span class="status-approved">ACTIVE</span></p>
              <p><strong>Activation Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p>You can now login to your account and start your fitness journey with us!</p>
            
            <div style="text-align: center;">
              <a href="http://localhost:3000/login" class="button">Login to Your Account</a>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Visit our gym with your ID card</li>
              <li>Get your membership card</li>
              <li>Schedule your first training session</li>
              <li>Meet with our fitness trainers</li>
            </ul>

            <p><strong>Gym Hours:</strong><br>
            Monday - Friday: 5:00 AM - 11:00 PM<br>
            Weekend: 6:00 AM - 10:00 PM</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 SUPREME FITNESS Gym. All rights reserved.</p>
            <p>Contact us: fitness@supremefit.com | +94 77 123 4567</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  rejection: (user, reason) => ({
    subject: 'Update on Your SUPREME FITNESS Registration',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626; }
          .status-rejected { color: #dc2626; font-weight: bold; }
          .button { background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SUPREME<span style="color: #ffffff">FITNESS</span></h1>
            <p>Registration Update</p>
          </div>
          <div class="content">
            <h2>Dear ${user.name},</h2>
            <p>We've reviewed your registration application for <strong>SUPREME FITNESS Gym</strong>.</p>
            
            <div class="info-box">
              <h3>Application Status: <span class="status-rejected">REQUIRES ATTENTION</span></h3>
              <p><strong>Reason:</strong> ${reason || 'Payment receipt verification failed'}</p>
            </div>

            <p>To complete your registration, please:</p>
            <ol>
              <li>Ensure your payment receipt is clear and valid</li>
              <li>Verify your personal information</li>
              <li>Resubmit your application if needed</li>
            </ol>

            <p>If you believe this is a mistake, please contact our support team immediately.</p>
            
            <div style="text-align: center;">
              <a href="mailto:support@supremefit.com" class="button">Contact Support</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 SUPREME FITNESS Gym. All rights reserved.</p>
            <p>Contact us: fitness@supremefit.com | +94 77 123 4567</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Enhanced send email function using the basic sender
const sendEmail = async (to, templateName, data, reason = null) => {
  try {
    // Get the appropriate template
    const template = emailTemplates[templateName](data, reason);

    console.log('📧 Attempting to send email to:', to);
    console.log('📋 Template:', templateName);
    
    // Use the basic email sender
    const result = await sendEmailBasic({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text || `Please view this email in HTML format. ${template.subject}`
    });

    console.log('✅ Email sent successfully to:', to);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('Invalid login') || error.message.includes('Authentication failed')) {
      console.error('💡 Tip: Make sure you are using an App Password, not your regular Gmail password');
    }
    
    throw error;
  }
};

// Test email configuration
const testEmail = async () => {
  try {
    if (!process.env.SYSTEM_EMAIL || !process.env.SYSTEM_EMAIL_PASSWORD) {
      return { 
        success: false, 
        error: 'Email credentials not configured in .env file'
      };
    }

    console.log('🔍 Testing email configuration...');
    console.log('📧 Email account:', process.env.SYSTEM_EMAIL);
    
    // Test by sending a simple email
    const result = await sendEmailBasic({
      to: process.env.SYSTEM_EMAIL,
      subject: 'Test Email from SUPREME FITNESS',
      text: 'This is a test email to verify your email configuration.',
      html: '<h1>Test Email</h1><p>This is a test email to verify your email configuration.</p>'
    });

    console.log('✅ Email configuration test passed');
    
    return { 
      success: true, 
      message: 'Email configuration is valid',
      email: process.env.SYSTEM_EMAIL
    };
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return { 
      success: false, 
      error: error.message
    };
  }
};

module.exports = {
  sendEmail,
  testEmail,
  emailTemplates // Export templates if needed elsewhere
};