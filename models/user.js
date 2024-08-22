const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/connectSequelize'); // Assuming you export your sequelize instance from db.js

class User extends Model {}

User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING},
  first_name: { type: DataTypes.STRING, allowNull: false },
  last_name: { type: DataTypes.STRING, allowNull: false },
  mobile_number: { type: DataTypes.INTEGER },
  role: { type: DataTypes.ENUM('user'), defaultValue: 'user_nr', allowNull: false },
  
}, { tableName: "user", sequelize, modelName: 'User', timestamps:false});


module.exports = User;
