const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions
  }
);

const db = {};

// Import models
db.User = require('./User')(sequelize);
db.Device = require('./Device')(sequelize);
db.Location = require('./Location')(sequelize);
db.Command = require('./Command')(sequelize);
db.Alert = require('./Alert')(sequelize);
db.Evidence = require('./Evidence')(sequelize);

// Define associations
db.User.hasMany(db.Device, { foreignKey: 'userId', as: 'devices' });
db.Device.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.Device.hasMany(db.Location, { foreignKey: 'deviceId', as: 'locations' });
db.Location.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device' });

db.Device.hasMany(db.Command, { foreignKey: 'deviceId', as: 'commands' });
db.Command.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device' });

db.Device.hasMany(db.Alert, { foreignKey: 'deviceId', as: 'alerts' });
db.Alert.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device' });

db.Device.hasMany(db.Evidence, { foreignKey: 'deviceId', as: 'evidence' });
db.Evidence.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
