const { Sequelize } = require('sequelize');

// Use full DATABASE_URL if provided (Render/Neon) — most reliable for SSL
// Falls back to individual credentials for local dev
let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  });
} else {
  const config = require('../config/database');
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = config[env];

  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host:           dbConfig.host,
      port:           dbConfig.port,
      dialect:        dbConfig.dialect,
      logging:        dbConfig.logging,
      pool:           dbConfig.pool,
      dialectOptions: dbConfig.dialectOptions,
    }
  );
}

const db = {};

db.User     = require('./User')(sequelize);
db.Device   = require('./Device')(sequelize);
db.Location = require('./Location')(sequelize);
db.Command  = require('./Command')(sequelize);
db.Alert    = require('./Alert')(sequelize);
db.Evidence = require('./Evidence')(sequelize);

// Associations
db.User.hasMany(db.Device,     { foreignKey: 'userId',   as: 'devices'   });
db.Device.belongsTo(db.User,   { foreignKey: 'userId',   as: 'user'      });

db.Device.hasMany(db.Location, { foreignKey: 'deviceId', as: 'locations' });
db.Location.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device'  });

db.Device.hasMany(db.Command,  { foreignKey: 'deviceId', as: 'commands'  });
db.Command.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device'   });

db.Device.hasMany(db.Alert,    { foreignKey: 'deviceId', as: 'alerts'    });
db.Alert.belongsTo(db.Device,  { foreignKey: 'deviceId', as: 'device'    });

db.Device.hasMany(db.Evidence, { foreignKey: 'deviceId', as: 'evidence'  });
db.Evidence.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device'  });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
