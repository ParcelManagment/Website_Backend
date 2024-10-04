const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/connectSequelize');
const User = require('./user');

class Package extends Model {}

Package.init({
  id:{type:DataTypes.INTEGER, primaryKey:true, autoIncrement:true},
  package_id: { type: DataTypes.STRING, unique:true, allowNull:false},
  tag_id: { type: DataTypes.STRING, unique: true, allowNull: false },
  sender_id: { type: DataTypes.INTEGER, allowNull: false },
  receiver_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM("vehical", "furniture", "food", "grocery", "chemical", "other"), allowNull: false },
  package_condition: { type: DataTypes.ENUM('new', 'used'), allowNull: false },
  departure:{type: DataTypes.STRING, allowNull:false},
  destination: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false },
  tracking_device_id: { type: DataTypes.INTEGER, allowNull: true },
  submitted: { type: DataTypes.DATE  },
  out_for_delivery: { type: DataTypes.DATE },
  arrived: { type: DataTypes.DATE },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  cancelled: { type: DataTypes.BOOLEAN, defaultValue: false },

  submitted_by: {type: DataTypes.INTEGER, allowNull: false}
}, { sequelize, modelName: 'Package', tableName: "package", timestamps:false});

User.hasMany(Package, {
  foreignKey: 'sender_id',
  constraints: false,
  scope: {
    sender_type: 'User'
  }
});

Package.belongsTo(User, {
  foreignKey: 'sender_id',
  constraints: false,
  as: 'senderUser'
});


User.hasMany(Package, {
  foreignKey: 'receiver_id',
  constraints: false,
  scope: {
    receiver_type: 'User'
  }
});

Package.belongsTo(User, {
  foreignKey: 'receiver_id',
  constraints: false,
  as: 'receiverUser'
});


module.exports = Package;
