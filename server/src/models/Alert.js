const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'devices',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'geofence_exit',   // Device left defined area
        'geofence_enter',  // Device entered defined area
        'movement',        // Device moved (when stolen)
        'sim_change',      // SIM card was changed
        'low_battery',     // Battery below threshold
        'offline',         // Device went offline
        'wrong_pin'        // Wrong PIN entered
      ),
      allowNull: false
    },
    config: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Alert configuration (geofence coords, thresholds, etc.)'
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notifyEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notifySms: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    notifyPush: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastTriggeredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    triggerCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'alerts',
    timestamps: true,
    indexes: [
      { fields: ['deviceId'] },
      { fields: ['type'] },
      { fields: ['enabled'] }
    ]
  });

  return Alert;
};
