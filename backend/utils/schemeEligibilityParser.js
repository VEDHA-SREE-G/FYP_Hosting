const SchemeEligibility = require('../models/schemeEligibility');
const Scheme = require('../models/Schem');

class SchemeEligibilityParser {
  
  /**
   * Parse eligibility text and extract structured criteria
   */
  static parseEligibility(eligibilityText, benefitsText = '') {
    const eligibility = {
      minAge: null,
      maxAge: null,
      minIncome: null,
      maxIncome: null,
      gender: 'All',
      eligibleCategories: null,
      requiresDisability: false,
      disabilityPercentageMin: null,
      requiresFarmer: false,
      requiresStudent: false,
      requiresWidow: false,
      requiresSeniorCitizen: false,
      minEducation: null,
      specificDegrees: null,
      eligibleOccupations: null,
      employmentStatus: 'Any',
      eligibleStates: null,
      eligibleDistricts: null,
      requiresExServicemen: false,
      maxRank: null,
      pensionerStatus: 'Any',
      requiresIndianCitizen: true,
      admissionRequired: false,
      courseLevel: null,
      studyLocation: null,
      excludesPreviousRecipients: false,
      excludesPermanentEmployees: false,
      maxFamilyMembers: null,
      requiresCareerBreak: false,
      specialConditions: null,
      rawEligibilityText: eligibilityText
    };

    const text = (eligibilityText + ' ' + benefitsText).toLowerCase();

    // Parse Age
    const ageMatches = [
      /age.*?(\d+)\s*(?:to|and|-)\s*(\d+)/i,
      /(\d+)\s*(?:to|and|-)\s*(\d+)\s*years/i,
      /between\s*(\d+)\s*(?:to|and)\s*(\d+)/i,
      /(\d+)\s*years?\s*or\s*lesser/i,
      /(\d+)\s*years?\s*or\s*below/i
    ];
    
    for (const regex of ageMatches) {
      const match = text.match(regex);
      if (match) {
        if (match[2]) {
          eligibility.minAge = parseInt(match[1]);
          eligibility.maxAge = parseInt(match[2]);
        } else {
          eligibility.maxAge = parseInt(match[1]);
        }
        break;
      }
    }

    // Parse Income
    const incomeMatches = [
      /income.*?not\s*exceed.*?₹?\s*(\d+)\s*lakh/i,
      /income.*?less\s*than.*?₹?\s*(\d+)\s*lakh/i,
      /family\s*income.*?₹?\s*(\d+)(?:,(\d+))?\s*(?:lakh|per\s*annum)/i
    ];
    
    for (const regex of incomeMatches) {
      const match = text.match(regex);
      if (match) {
        let income = parseInt(match[1]);
        if (match[2]) {
          income = parseInt(match[1] + match[2]);
        }
        eligibility.maxIncome = income * 100000; // Convert lakh to actual amount
        break;
      }
    }

    // Parse Gender
    if (text.includes('female') || text.includes('women') || text.includes('widow')) {
      eligibility.gender = 'Female';
    } else if (text.includes('male') && !text.includes('female')) {
      eligibility.gender = 'Male';
    }

    // Parse Category
    const categories = [];
    if (text.includes('sc') || text.includes('scheduled caste')) categories.push('SC');
    if (text.includes('st') || text.includes('scheduled tribe')) categories.push('ST');
    if (text.includes('obc') || text.includes('other backward')) categories.push('OBC');
    if (text.includes('general') || text.includes('unreserved')) categories.push('General');
    if (categories.length > 0) {
      eligibility.eligibleCategories = categories;
    }

    // Parse Disability
    if (text.includes('disabilit') || text.includes('pwd') || text.includes('handicap')) {
      eligibility.requiresDisability = true;
      
      const disabilityMatch = text.match(/(\d+)%?\s*(?:&|and)?\s*above|disability.*?(\d+)%/i);
      if (disabilityMatch) {
        eligibility.disabilityPercentageMin = parseInt(disabilityMatch[1] || disabilityMatch[2]);
      }
    }

    // Parse Special Groups
    eligibility.requiresFarmer = text.includes('farmer') || text.includes('agriculture');
    eligibility.requiresStudent = text.includes('student') || text.includes('scholar');
    eligibility.requiresWidow = text.includes('widow');
    eligibility.requiresSeniorCitizen = text.includes('senior citizen') || text.includes('elderly');

    // Parse Education
    const educationKeywords = {
      'phd': 'PhD',
      'ph.d': 'PhD',
      'doctorate': 'PhD',
      'post-graduate': 'Post-Graduate',
      'post graduate': 'Post-Graduate',
      'master': 'Masters',
      'm.sc': 'Masters',
      'm.tech': 'Masters',
      'm.phil': 'Masters',
      'graduate': 'Graduate',
      'bachelor': 'Graduate',
      'b.tech': 'Graduate',
      'mbbs': 'Graduate',
      '12th': '12th',
      '10th': '10th'
    };

    const degrees = [];
    for (const [keyword, degree] of Object.entries(educationKeywords)) {
      if (text.includes(keyword)) {
        if (!degrees.includes(degree)) {
          degrees.push(degree);
        }
      }
    }
    
    if (degrees.length > 0) {
      eligibility.specificDegrees = degrees;
      eligibility.minEducation = degrees[degrees.length - 1]; // Lowest qualification
    }

    // Parse Ex-Servicemen
    if (text.includes('ex-service') || text.includes('esm') || text.includes('veteran')) {
      eligibility.requiresExServicemen = true;
      
      if (text.includes('non-pensioner')) {
        eligibility.pensionerStatus = 'Non-Pensioner';
      } else if (text.includes('pensioner')) {
        eligibility.pensionerStatus = 'Pensioner';
      }
      
      const rankMatch = text.match(/havildar|naik|sepoy|equivalent/i);
      if (rankMatch) {
        eligibility.maxRank = 'Havildar';
      }
    }

    // Parse Study/Course Criteria
    if (text.includes('admission') || text.includes('admitted')) {
      eligibility.admissionRequired = true;
    }

    const courseLevels = [];
    if (text.includes("master") || text.includes("m.sc") || text.includes("m.tech")) {
      courseLevels.push('Masters');
    }
    if (text.includes("phd") || text.includes("ph.d") || text.includes("doctorate")) {
      courseLevels.push('PhD');
    }
    if (courseLevels.length > 0) {
      eligibility.courseLevel = courseLevels;
    }

    if (text.includes('abroad') || text.includes('foreign') || text.includes('overseas')) {
      eligibility.studyLocation = 'Abroad';
    } else if (text.includes('india') && !text.includes('abroad')) {
      eligibility.studyLocation = 'India';
    }

    // Parse Exclusions
    if (text.includes('already') && (text.includes('scholarship') || text.includes('received'))) {
      eligibility.excludesPreviousRecipients = true;
    }
    
    if (text.includes('permanent position') || text.includes('permanent employee')) {
      eligibility.excludesPermanentEmployees = true;
    }

    // Parse Family Restrictions
    const familyMatch = text.match(/not\s*more\s*than\s*(\d+)\s*(?:children|family|members)/i);
    if (familyMatch) {
      eligibility.maxFamilyMembers = parseInt(familyMatch[1]);
    }

    // Parse Career Break
    if (text.includes('career break') || text.includes('break in career')) {
      eligibility.requiresCareerBreak = true;
    }

    return eligibility;
  }

  /**
   * Migrate all schemes to eligibility table
   */
  static async migrateAllSchemes() {
    try {
      const schemes = await Scheme.findAll();
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (const scheme of schemes) {
        try {
          const eligibilityData = this.parseEligibility(
            scheme.eligibility || '',
            scheme.benefits || ''
          );

          await SchemeEligibility.create({
            schemeId: scheme.id,
            schemeName: scheme.scheme_name,
            schemeLevel: scheme.scheme_level || 'Central',
            ...eligibilityData,
            parsedSuccessfully: true,
            lastParsed: new Date()
          });

          results.success++;
          console.log(`✓ Parsed scheme: ${scheme.scheme_name}`);
        } catch (error) {
          results.failed++;
          results.errors.push({
            schemeId: scheme.id,
            schemeName: scheme.scheme_name,
            error: error.message
          });
          console.error(`✗ Failed to parse scheme ${scheme.id}: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Update single scheme eligibility
   */
  static async updateSchemeEligibility(schemeId) {
    try {
      const scheme = await Scheme.findByPk(schemeId);
      if (!scheme) {
        throw new Error(`Scheme with ID ${schemeId} not found`);
      }

      const eligibilityData = this.parseEligibility(
        scheme.eligibility || '',
        scheme.benefits || ''
      );

      const existing = await SchemeEligibility.findOne({ where: { schemeId } });
      
      if (existing) {
        await existing.update({
          ...eligibilityData,
          schemeName: scheme.scheme_name,
          schemeLevel: scheme.scheme_level,
          parsedSuccessfully: true,
          lastParsed: new Date()
        });
      } else {
        await SchemeEligibility.create({
          schemeId: scheme.id,
          schemeName: scheme.scheme_name,
          schemeLevel: scheme.scheme_level,
          ...eligibilityData,
          parsedSuccessfully: true,
          lastParsed: new Date()
        });
      }

      return { success: true, message: `Eligibility updated for scheme: ${scheme.scheme_name}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = SchemeEligibilityParser;

