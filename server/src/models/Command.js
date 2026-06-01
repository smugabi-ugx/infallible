const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Command = sequelize.define('Command', {
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
        'ring',           // Play loud alarm
        'lock',           // Lock device with PIN
        'wipe',           // Factory reset
        'locate',         // Request immediate location
        'message',        // Display message on screen
        'photo',          // Take front camera photo
        'stealth_on',     // Enable stealth mode
        'stealth_off',    // Disable stealth mode
        'tracking_high',  // High frequency tracking
        'tracking_low',   // Low frequency tracking
        'tracking_off'    // Stop tracking
      ),
      allowNull: false
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Command-specific data (e.g., lock PIN, message text)'
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'executed', 'failed'),
      defaultValue: 'pending'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Command expires after this time'
    }
  }, {
    tableName: 'commands',
    timestamps: true,
    indexes: [
      { fields: ['deviceId'] },
      { fields: ['status'] },
      { fields: ['type'] }
    ]
  });

  return Command;
};
