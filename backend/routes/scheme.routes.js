const express = require("express");
const router = express.Router();
const scrapeMyScheme = require("../scraper/myscheme.scraper");
const schemeController = require("../controllers/schemeController");
const auth = require("../middleware/authMiddleware");

// Sync schemes (Admin only or scheduled task)
router.post("/sync", auth(["admin"]), async (req, res) => {
  try {
    await scrapeMyScheme();
    const SchemeEligibilityParser = require("../utils/schemeEligibilityParser");
    await SchemeEligibilityParser.migrateAllSchemes();
    res.json({ message: "Government schemes synced successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard stats (User only)
router.get("/stats", auth("user"), schemeController.getDashboardStats);

// Get all eligible schemes (User only)
router.get("/eligible", auth("user"), schemeController.getEligibleSchemes);

// Get featured/recommended schemes
router.get("/featured", auth("user"), schemeController.getFeaturedSchemes);

// Get analytical data
router.get("/analytics", auth("admin"), schemeController.getAdminAnalytics);
router.get("/user-analytics", auth("user"), schemeController.getUserAnalytics);

// Get all schemes
router.get("/", auth(["user", "admin"]), schemeController.getSchemes);

// Get single scheme details
router.get("/:id", auth("user"), schemeController.getSchemeById);

module.exports = router;
