// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const sequelize = require("./config/db");
// require("./models/User");

// const authRoutes = require("./routes/authRoutes");
// const profileRoutes = require("./routes/profileRoutes");

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.use("/api/auth", authRoutes);
// app.use("/api/profile", profileRoutes);

// sequelize.sync({ alter: true }).then(() => {
//   console.log("Database synced");
// });

// app.listen(process.env.PORT, () =>
//   console.log("Server running on port " + process.env.PORT)
// );

require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");
const schemeRoutes = require("./routes/scheme.routes");
// const ngoRoutes = require("./routes/ngoScraperRoutes");
// Import models
const User = require("./models/User");
const UserProfile = require("./models/UserProfile");


// Setup relationships
User.hasOne(UserProfile, { foreignKey: "userId", onDelete: "CASCADE" });
UserProfile.belongsTo(User, { foreignKey: "userId" });

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/schemes", schemeRoutes);
app.use("/api/chat", require("./routes/chatRoutes"));

// app.use("/api/ngo-scraper",ngoRoutes);


// Sync database
sequelize.sync().then(() => {
  console.log("✅ Database synced successfully");
  
  app.listen(process.env.PORT || 5000, () => {
    console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
  });
}).catch(err => {
  console.error("❌ Database sync failed:", err);
});