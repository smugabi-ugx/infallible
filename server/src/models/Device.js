const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Device = sequelize.define('Device', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    imei: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    imei2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: true
    },
    androidVersion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    simOperator: {
      type: DataTypes.STRING,
      allowNull: true
    },
    simSerialNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fcmToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deviceToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    isStolen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    stolenAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isStealthMode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    trackingMode: {
      type: DataTypes.ENUM('high', 'balanced', 'low', 'off'),
      defaultValue: 'balanced'
    },
    lastLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    lastLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastBatteryLevel: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'devices',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['imei'] },
      { fields: ['isStolen'] },
      { fields: ['lastSeenAt'] }
    ]
  });

  return Device;
};
