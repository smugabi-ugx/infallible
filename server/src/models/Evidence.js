const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Evidence = sequelize.define('Evidence', {
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
      type: DataTypes.ENUM('photo', 'audio', 'screenshot', 'call_log', 'sms_log'),
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional data: location, trigger reason, etc.'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    capturedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    trigger: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'What triggered the capture: wrong_pin, remote_command, etc.'
    }
  }, {
    tableName: 'evidence',
    timestamps: true,
    indexes: [
      { fields: ['deviceId'] },
      { fields: ['type'] },
      { fields: ['capturedAt'] }
    ]
  });

  return Evidence;
};
