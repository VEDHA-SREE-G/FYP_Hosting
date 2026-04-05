const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("user", "admin"), defaultValue: "user" },
  consent: { type: DataTypes.BOOLEAN, defaultValue: false }, // GDPR
  
  // Profile-specific fields should be in UserProfile model, not here
});

module.exports = User;
