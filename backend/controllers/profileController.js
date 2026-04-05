// const User = require("../models/User");
// const UserProfile = require("../models/UserProfile");
// const { Op } = require("sequelize");

// // GET PROFILE
// exports.getProfile = async (req, res) => {
//   try {
//     const profile = await UserProfile.findOne({ where: { userId: req.user.id } });
//     res.json(profile);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching profile" });
//   }
// };

// // UPDATE / CREATE PROFILE
// exports.updateProfile = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const {
//       name,
//       age,
//       gender,
//       income,
//       occupation,
//       state,
//       district,
//       category,
//       disability,
//       farmer,
//       student,
//       widow,
//       seniorCitizen
//     } = req.body;

//     // Validation
//     if (age && (age < 0 || age > 120)) {
//       return res.status(400).json({ error: "Invalid age" });
//     }
//     if (income && income < 0) {
//       return res.status(400).json({ error: "Income cannot be negative" });
//     }

//     // Fetch or create
//     let profile = await UserProfile.findOne({ where: { userId } });
//     if (!profile) profile = await UserProfile.create({ userId });

//     // Duplicate profile detection
//     if (name && age && state && district) {
//       const duplicate = await UserProfile.findOne({
//         where: {
//           userId: { [Op.ne]: userId },
//           name,
//           age,
//           state,
//           district
//         }
//       });

//       if (duplicate) {
//         profile.duplicateProfile = true;
//         await profile.save();

//         return res.status(400).json({
//           error: "Duplicate profile detected",
//           warning: "Similar profile exists"
//         });
//       }
//     }

//     // Identity mismatch detection
//     const user = await User.findByPk(userId);
//     const emailName = user.email.split("@")[0].toLowerCase();
//     const cleanName = name?.toLowerCase().replace(/\s+/g, "");

//     if (name && !cleanName.includes(emailName)) {
//       profile.identityMismatch = true;
//     }

//     // Update fields
//     await profile.update({
//       name,
//       age,
//       gender,
//       income,
//       occupation,
//       state,
//       district,
//       category,
//       disability,
//       farmer,
//       student,
//       widow,
//       seniorCitizen,
//       lastProfileUpdate: new Date()
//     });

//     // Check profile completeness
//     const required = [name, age, gender, income, occupation, state, district, category];
//     profile.profileComplete = required.every(f => f);
//     await profile.save();

//     // Suspicious activity (too many flags)
//     if (profile.duplicateProfile || profile.identityMismatch || profile.applicationCount > 3) {
//       profile.suspiciousActivity = true;
//       await profile.save();
//     }

//     res.json({
//       message: "Profile updated",
//       profile
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Server error", details: err.message });
//   }
// };

// // AUTO SAVE
// exports.autoSave = async (req, res) => {
//   try {
//     let profile = await UserProfile.findOne({ where: { userId: req.user.id } });
//     if (!profile) profile = await UserProfile.create({ userId: req.user.id });

//     await profile.update({
//       ...req.body,
//       lastProfileUpdate: new Date()
//     });

//     res.json({ message: "Auto-saved", profile });
//   } catch (err) {
//     res.status(500).json({ error: "Auto-save failed" });
//   }
// };

// // APPLICATION COUNTER
// exports.incrementApplication = async (req, res) => {
//   try {
//     const profile = await UserProfile.findOne({ where: { userId: req.user.id } });

//     if (!profile) return res.status(404).json({ error: "Profile missing" });

//     profile.applicationCount += 1;

//     if (profile.applicationCount > 3) profile.suspiciousActivity = true;

//     await profile.save();

//     res.json({ 
//       message: "Application recorded",
//       count: profile.applicationCount
//     });

//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// };

// // ADMIN — GET SUSPICIOUS
// exports.getSuspiciousProfiles = async (req, res) => {
//   try {
//     const profiles = await UserProfile.findAll({
//       where: { suspiciousActivity: true }
//     });

//     res.json(profiles);
//   } catch (err) {
//     res.status(500).json({ error: "Error loading suspicious users" });
//   }
// };

// // ADMIN — REVIEW
// exports.reviewProfile = async (req, res) => {
//   try {
//     const { userId, action } = req.body;

//     const profile = await UserProfile.findOne({ where: { userId } });
//     if (!profile) return res.status(404).json({ error: "Profile not found" });

//     if (action === "approve") {
//       profile.suspiciousActivity = false;
//       profile.identityMismatch = false;
//       profile.duplicateProfile = false;
//       profile.applicationCount = 0;
//       await profile.save();

//       return res.json({ message: "Profile approved & flags cleared" });
//     }

//     if (action === "reject") {
//       return res.json({ message: "Profile marked for deeper review" });
//     }

//     res.status(400).json({ error: "Invalid action" });

//   } catch (err) {
//     res.status(500).json({ error: "Review failed" });
//   }
// };
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const { Op } = require("sequelize");

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let profile = await UserProfile.findOne({ where: { userId } });
    
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }
    
    res.json(profile);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: "Error fetching profile" });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      age,
      gender,
      income,
      occupation,
      state,
      district,
      category,
      disability,
      farmer,
      student,
      widow,
      seniorCitizen
    } = req.body;

    // Validation
    if (age !== undefined && (age <= 0 || age > 120)) {
      return res.status(400).json({ error: "Invalid age. Age must be greater than 0." });
    }
    if (income && income < 0) {
      return res.status(400).json({ error: "Income cannot be negative" });
    }

    let profile = await UserProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    // Duplicate profile detection
    if (name && age && state && district) {
      const duplicate = await UserProfile.findOne({
        where: {
          userId: { [Op.ne]: userId },
          name,
          age,
          state,
          district
        }
      });

      if (duplicate) {
        profile.duplicateProfile = true;
        await profile.save();
        return res.status(400).json({
          error: "Duplicate profile detected"
        });
      }
    }

    // Update fields
    await profile.update({
      name: name || profile.name,
      age: age || profile.age,
      gender: gender || profile.gender,
      income: income || profile.income,
      occupation: occupation || profile.occupation,
      state: state || profile.state,
      district: district || profile.district,
      category: category || profile.category,
      disability: disability !== undefined ? disability : profile.disability,
      farmer: farmer !== undefined ? farmer : profile.farmer,
      student: student !== undefined ? student : profile.student,
      widow: widow !== undefined ? widow : profile.widow,
      seniorCitizen: seniorCitizen !== undefined ? seniorCitizen : profile.seniorCitizen,
      lastProfileUpdate: new Date()
    });

    // Check profile completeness
    const required = [name, age, gender, income, occupation, state, district, category];
    profile.profileComplete = required.every(f => f);
    await profile.save();

    // Suspicious activity check
    if (profile.duplicateProfile || profile.identityMismatch || profile.applicationCount > 3) {
      profile.suspiciousActivity = true;
      await profile.save();
    }

    res.json({
      message: "Profile updated successfully",
      profile
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: "Server error" });
  }
};

// AUTO SAVE
exports.autoSave = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let profile = await UserProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    await profile.update({
      ...req.body,
      lastProfileUpdate: new Date()
    });

    res.json({ message: "Auto-saved", profile });
  } catch (err) {
    console.error('Auto-save error:', err);
    res.status(500).json({ error: "Auto-save failed" });
  }
};

// INCREMENT APPLICATION
exports.incrementApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let profile = await UserProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    profile.applicationCount += 1;

    if (profile.applicationCount > 3) {
      profile.suspiciousActivity = true;
    }

    await profile.save();

    res.json({ 
      message: "Application recorded",
      count: profile.applicationCount
    });
  } catch (err) {
    console.error('Increment application error:', err);
    res.status(500).json({ error: "Server error" });
  }
};

// ADMIN - GET SUSPICIOUS
exports.getSuspiciousProfiles = async (req, res) => {
  try {
    const profiles = await UserProfile.findAll({
      where: { suspiciousActivity: true }
    });

    res.json(profiles);
  } catch (err) {
    console.error('Get suspicious profiles error:', err);
    res.status(500).json({ error: "Error loading suspicious users" });
  }
};

// ADMIN - REVIEW
exports.reviewProfile = async (req, res) => {
  try {
    const { userId, action } = req.body;

    const profile = await UserProfile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    if (action === "approve") {
      profile.suspiciousActivity = false;
      profile.identityMismatch = false;
      profile.duplicateProfile = false;
      profile.applicationCount = 0;
      await profile.save();

      return res.json({ message: "Profile approved" });
    }

    if (action === "reject") {
      return res.json({ message: "Profile marked for review" });
    }

    res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error('Review profile error:', err);
    res.status(500).json({ error: "Review failed" });
  }
};