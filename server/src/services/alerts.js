const db = require('../models');
const { sendTheftAlert, sendGeofenceAlert } = require('./email');

/**
 * Check if any alerts should be triggered for a location update
 */
async function checkAlerts(device, location) {
  try {
    // Get enabled alerts for this device
    const alerts = await db.Alert.findAll({
      where: {
        deviceId: device.id,
        enabled: true
      }
    });

    // Get device owner
    const user = await db.User.findByPk(device.userId);

    for (const alert of alerts) {
      let triggered = false;
      let triggerData = {};

      switch (alert.type) {
        case 'movement':
          // Trigger if device is stolen and moves
          if (device.isStolen) {
            triggered = true;
            triggerData = { reason: 'stolen_device_moved' };
          }
          break;

        case 'geofence_exit':
          triggered = checkGeofenceExit(location, alert.config);
          if (triggered) {
            triggerData = { direction: 'exited' };
          }
          break;

        case 'geofence_enter':
          triggered = checkGeofenceEnter(location, alert.config);
          if (triggered) {
            triggerData = { direction: 'entered' };
          }
          break;

        case 'low_battery': {
          const threshold = alert.config?.threshold || 15;
          if (location.batteryLevel && location.batteryLevel <= threshold) {
            triggered = true;
            triggerData = { batteryLevel: location.batteryLevel };
          }
          break;
        }
      }

      if (triggered) {
        await handleAlertTrigger(user, device, location, alert, triggerData);
      }
    }

    // Always send theft alerts if device is marked stolen
    if (device.isStolen) {
      await sendTheftAlert(user, device, location);
    }
  } catch (error) {
    console.error('Alert check failed:', error);
  }
}

/**
 * Check if location is outside geofence
 */
function checkGeofenceExit(location, config) {
  if (!config?.center || !config?.radius) return false;

  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    config.center.latitude,
    config.center.longitude
  );

  return distance > config.radius;
}

/**
 * Check if location is inside geofence
 */
function checkGeofenceEnter(location, config) {
  if (!config?.center || !config?.radius) return false;

  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    config.center.latitude,
    config.center.longitude
  );

  return distance <= config.radius;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Handle triggered alert
 */
async function handleAlertTrigger(user, device, location, alert, triggerData) {
  console.log(`Alert triggered: ${alert.type} for device ${device.id}`);

  // Update alert stats
  await alert.update({
    lastTriggeredAt: new Date(),
    triggerCount: alert.triggerCount + 1
  });

  // Send notifications based on alert preferences
  if (alert.notifyEmail) {
    try {
      if (alert.type.startsWith('geofence_')) {
        await sendGeofenceAlert(user, device, location, alert, triggerData.direction);
      }
      // Add more email types as needed
    } catch (error) {
      console.error('Email notification failed:', error);
    }
  }

  // TODO: SMS notifications via Africa's Talking
  if (alert.notifySms && user.phone) {
    // await sendSmsAlert(user.phone, device, alert);
  }

  // TODO: Push notification to dashboard
  if (alert.notifyPush) {
    // Will be handled by Socket.io real-time updates
  }
}

/**
 * Check SIM change (called when device reports new SIM)
 */
async function checkSimChange(device, newSimInfo) {
  const alert = await db.Alert.findOne({
    where: {
      deviceId: device.id,
      type: 'sim_change',
      enabled: true
    }
  });

  if (!alert) return;

  // Compare with stored SIM info
  if (device.simSerialNumber && device.simSerialNumber !== newSimInfo.simSerialNumber) {
    const user = await db.User.findByPk(device.userId);
    const oldSim = device.simSerialNumber;

    // Update device with new SIM info
    await device.update({
      simSerialNumber: newSimInfo.simSerialNumber,
      simOperator: newSimInfo.simOperator,
      phoneNumber: newSimInfo.phoneNumber
    });

    await handleAlertTrigger(user, device, null, alert, {
      oldSim,
      newSim: newSimInfo.simSerialNumber,
      newNumber: newSimInfo.phoneNumber
    });
  }
}

module.exports = {
  checkAlerts,
  checkGeofenceExit,
  checkGeofenceEnter,
  calculateDistance,
  checkSimChange
};
