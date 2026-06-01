const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 */
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email not configured - skipping send');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Infallible <noreply@infallible.ug>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send theft alert email
 */
async function sendTheftAlert(user, device, location) {
  const mapUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  
  await sendEmail({
    to: user.email,
    subject: `🚨 ALERT: ${device.name} location update`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #e74c3c; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🚨 Device Alert</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Your stolen device has been located!</h2>
          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Device:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${device.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>IMEI:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${device.imei || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Location:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${location.latitude}, ${location.longitude}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Accuracy:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${location.accuracy ? location.accuracy + 'm' : 'Unknown'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Time:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(location.recordedAt).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Battery:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${location.batteryLevel ? location.batteryLevel + '%' : 'Unknown'}</td>
            </tr>
          </table>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${mapUrl}" style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              📍 View on Map
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            This is an automated alert from Infallible device tracking system.
            <br>Do not share this information publicly. Contact local authorities for assistance.
          </p>
        </div>
      </div>
    `
  });
}

/**
 * Send geofence alert email
 */
async function sendGeofenceAlert(user, device, location, alert, direction) {
  const mapUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  
  await sendEmail({
    to: user.email,
    subject: `⚠️ ${device.name} ${direction} geofence "${alert.config.name}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f39c12; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">⚠️ Geofence Alert</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>${device.name} has ${direction} "${alert.config.name}"</h2>
          <p>Your device crossed the geofence boundary at ${new Date(location.recordedAt).toLocaleString()}</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${mapUrl}" style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              📍 View Location
            </a>
          </div>
        </div>
      </div>
    `
  });
}

module.exports = {
  sendEmail,
  sendTheftAlert,
  sendGeofenceAlert
};
