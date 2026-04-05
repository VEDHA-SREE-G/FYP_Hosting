const Scheme = require("../models/Schem");
const SchemeEligibility = require("../models/schemeEligibility");
const UserProfile = require("../models/UserProfile");
const FuzzyEligibilityMatcher = require("../utils/fuzzyEligibilityMatcher");
const { Op } = require("sequelize");
const sequelize = require("../config/db");

// GET DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Get total schemes count
    const totalSchemes = await Scheme.count();
    
    // 2. Get user profile
    const userProfile = await UserProfile.findOne({ where: { userId } });
    
    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // 3. Get eligible schemes count using Fuzzy Matcher
    // We'll use the findSchemesForUser logic from testMatcher.js but optimized for just count if possible
    // For now, we'll get the matches and count them. 
    // Optimization: In a real app, we might want to cache this or use a more direct query.
    const matchResult = await FuzzyEligibilityMatcher.findMatchingSchemes(userId, 50);
    const eligibleSchemesCount = matchResult.matchingSchemes;

    // 4. Get application count
    const applicationCount = userProfile.applicationCount;

    // 5. Get profile completeness
    const profileComplete = userProfile.profileComplete;

    res.json({
      totalSchemes,
      eligibleSchemes: eligibleSchemesCount,
      applicationCount,
      profileComplete
    });

  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Server error fetching stats" });
  }
};

// GET SCHEMES (with optional filtering/search)
exports.getSchemes = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      level, 
      ministry 
    } = req.query;

    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { scheme_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    if (level) {
      whereClause.scheme_level = level;
    }
    if (ministry) {
      whereClause.ministry = ministry;
    }

    const { count, rows } = await Scheme.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      schemes: rows
    });

  } catch (err) {
    console.error("Error fetching schemes:", err);
    res.status(500).json({ error: "Server error fetching schemes" });
  }
};

// GET SCHEME BY ID
exports.getSchemeById = async (req, res) => {
  try {
    const { id } = req.params;
    const scheme = await Scheme.findByPk(id);

    if (!scheme) {
      return res.status(404).json({ error: "Scheme not found" });
    }

    // Optional: Get eligibility details if user is logged in
    let eligibilityDetails = null;
    if (req.user) {
        // We can access req.user because of the verifyToken middleware
        try {
             // Check if eligibility data exists for this scheme
             const eligibility = await SchemeEligibility.findOne({ where: { schemeId: id } });
             if (eligibility) {
                 const match = await FuzzyEligibilityMatcher.checkSchemeEligibility(req.user.id, id);
                 eligibilityDetails = match;
             }
        } catch (e) {
            console.log("Could not calculate eligibility for specific scheme", e.message);
        }
    }

    res.json({
        scheme,
        eligibility: eligibilityDetails
    });

  } catch (err) {
    console.error("Error fetching scheme details:", err);
    res.status(500).json({ error: "Server error fetching scheme details" });
  }
};

// GET ALL ELIGIBLE SCHEMES FOR USER
exports.getEligibleSchemes = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Use the fuzzy matcher to find all matches
        const matchResult = await FuzzyEligibilityMatcher.findMatchingSchemes(userId, 50); // 50 threshold to match dashboard stats
        
        // Filter for eligible schemes only (score >= 50 or eligible flag)
        const eligibleMatches = matchResult.schemes;
        
        // Fetch full details
        const detailedSchemes = [];
        for (const match of eligibleMatches) {
            const scheme = await Scheme.findOne({ where: { id: match.schemeId } });
            if (scheme) {
                detailedSchemes.push({
                    ...scheme.toJSON(),
                    matchScore: match.matchScore,
                    matchStatus: match.eligible ? "Eligible" : "Partial Match",
                    matchDetails: match.matchDetails
                });
            }
        }

        res.json(detailedSchemes);

    } catch (err) {
        console.error("Error fetching eligible schemes:", err);
        res.status(500).json({ error: "Server error fetching eligible schemes" });
    }
};

// GET RECOMMENDED / FEATURED SCHEMES
exports.getFeaturedSchemes = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Use the fuzzy matcher to find top schemes
        const matchResult = await FuzzyEligibilityMatcher.findMatchingSchemes(userId, 50);
        
        // Get the top 3 schemes
        const topMatches = matchResult.schemes.slice(0, 3);
        
        // Fetch full scheme details for these matches
        const featuredSchemes = [];
        for (const match of topMatches) {
            const scheme = await Scheme.findOne({ where: { id: match.schemeId } });
            if (scheme) {
                // Combine scheme data with match data
                featuredSchemes.push({
                    ...scheme.toJSON(),
                    matchScore: match.matchScore,
                    matchStatus: match.eligible ? "Eligible" : "Partial Match"
                });
            }
        }

        // If no matches found (e.g. new user or no schemes), fallback to just latest schemes
        if (featuredSchemes.length === 0) {
            const latestSchemes = await Scheme.findAll({
                limit: 3,
                order: [['createdAt', 'DESC']]
            });
            res.json(latestSchemes);
        } else {
            res.json(featuredSchemes);
        }

    } catch (err) {
        console.error("Error fetching featured schemes:", err);
        res.status(500).json({ error: "Server error fetching featured schemes" });
    }
};

// GET ADMIN ANALYTICS
exports.getAdminAnalytics = async (req, res) => {
    try {
        const schemesByLevel = await Scheme.findAll({
            attributes: ['scheme_level', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['scheme_level'],
            raw: true
        });
        
        const usersByState = await UserProfile.findAll({
            attributes: ['state', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['state'],
            where: { state: { [Op.ne]: null, [Op.ne]: '' } },
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: 5,
            raw: true
        });

        schemesByLevel.forEach(s => s.count = parseInt(s.count || s['COUNT(id)'], 10) || 0);
        usersByState.forEach(u => u.count = parseInt(u.count || u['COUNT(id)'], 10) || 0);

        res.json({ schemesByLevel, usersByState });
    } catch (err) {
        console.error("Error fetching admin analytics:", err);
        res.status(500).json({ error: "Server error fetching admin analytics" });
    }
};

// GET USER ANALYTICS
exports.getUserAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        const userProfile = await UserProfile.findOne({ where: { userId } });
        if (!userProfile) {
            return res.json({
                matchDistribution: [],
               totalMatchesAnalyzed: 0
            });
        }
        const matchResult = await FuzzyEligibilityMatcher.findMatchingSchemes(userId, 0);
        
        let high = 0, medium = 0, low = 0;
        matchResult.schemes.forEach(m => {
            if (m.matchScore >= 80) high++;
            else if (m.matchScore >= 50) medium++;
            else low++;
        });

        res.json({ 
            matchDistribution: [
                { name: 'High Match (>80%)', value: high, fill: '#10B981' },
                { name: 'Medium Match (50-80%)', value: medium, fill: '#3B82F6' },
                { name: 'Low Match (<50%)', value: low, fill: '#EF4444' }
            ],
            totalMatchesAnalyzed: matchResult.schemes.length
        });
    } catch (err) {
        console.error("Error fetching user analytics:", err);
        res.status(500).json({ error: "Server error fetching user analytics" });
    }
};
