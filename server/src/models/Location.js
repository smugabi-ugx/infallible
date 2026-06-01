const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Location = sequelize.define('Location', {
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
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Accuracy in meters'
    },
    altitude: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    speed: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Speed in m/s'
    },
    bearing: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Direction in degrees'
    },
    provider: {
      type: DataTypes.ENUM('gps', 'network', 'fused', 'passive'),
      defaultValue: 'fused'
    },
    batteryLevel: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isCharging: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    networkType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'wifi, mobile, none'
    },
    wifiSSID: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cellTower: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Cell tower info for additional tracking'
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Reverse geocoded address'
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Time recorded on device'
    }
  }, {
    tableName: 'locations',
    timestamps: true,
    indexes: [
      { fields: ['deviceId'] },
      { fields: ['recordedAt'] },
      { fields: ['latitude', 'longitude'] },
      { fields: ['deviceId', 'recordedAt'] }
    ]
  });

  return Location;
};
