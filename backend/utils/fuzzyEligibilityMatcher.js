const SchemeEligibility = require('../models/schemeEligibility');
const UserProfile = require('../models/UserProfile');
const { Op } = require('sequelize');

/**
 * ============================================================
 * FUZZY ELIGIBILITY MATCHER
 * Algorithm: Mamdani Fuzzy Inference System (FIS)
 * ============================================================
 *
 * This class implements a Mamdani-type Fuzzy Inference System
 * for multi-criteria government scheme eligibility decision-making.
 *
 * MAMDANI FIS PIPELINE:
 * ─────────────────────
 * Step 1 │ FUZZIFICATION
 *        │ Crisp inputs (age, income) → fuzzy membership values [0, 1]
 *        │ Uses Triangular Membership Functions (trimf)
 *        │
 * Step 2 │ RULE BASE (IF–THEN Rules)
 *        │ e.g. IF age is eligible AND income is low → HIGH eligibility
 *        │      IF age is near_limit → MEDIUM eligibility
 *        │      IF income exceeds_limit → DISQUALIFY
 *        │
 * Step 3 │ INFERENCE ENGINE (Mamdani Method)
 *        │ AND  → min operator
 *        │ OR   → max operator
 *        │ Fires rules and computes per-criterion fuzzy output
 *        │
 * Step 4 │ AGGREGATION
 *        │ Combines all rule outputs into a single fuzzy output set
 *        │ per criterion using weighted accumulation
 *        │
 * Step 5 │ DEFUZZIFICATION
 *        │ Fuzzy output → crisp score [0–100]
 *        │ Method: Weighted Average (centroid approximation)
 *        │ finalScore = (Σ weight_i × membershipScore_i) / Σ weight_i × 100
 *
 * WHY MAMDANI OVER SUGENO?
 * Mamdani produces interpretable fuzzy output sets, making it
 * more suitable for rule-based human welfare decision systems.
 *
 * ELIGIBILITY THRESHOLD: score ≥ 80% → Eligible
 */

// ─────────────────────────────────────────────
// HELPER: Triangular Membership Function (trimf)
// Returns membership degree μ ∈ [0, 1]
// Shape: rises from a→b, falls from b→c
// ─────────────────────────────────────────────
function trimf(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

// ─────────────────────────────────────────────
// HELPER: Build dynamic explanation object
// Describes the Mamdani pipeline for any match
// ─────────────────────────────────────────────
function buildMamdaniExplanation(userProfile, schemeEligibility, details, finalScore) {
  const rules = [];

  if (details.age.status !== 'N/A') {
    rules.push({
      rule: `IF age (${userProfile.age}) is ${details.age.status.toLowerCase()} THEN age_eligibility = ${(details.age.score * 100).toFixed(0)}%`,
      membershipDegree: details.age.score,
      weight: details.age.weight
    });
  }

  if (details.income.status !== 'N/A') {
    rules.push({
      rule: `IF income (${userProfile.income}) is ${details.income.status.toLowerCase()} THEN income_eligibility = ${(details.income.score * 100).toFixed(0)}%`,
      membershipDegree: details.income.score,
      weight: details.income.weight
    });
  }

  if (details.gender.status !== 'N/A') {
    rules.push({
      rule: `IF gender matches scheme requirement THEN gender_eligibility = 100%`,
      membershipDegree: 1,
      weight: details.gender.weight
    });
  }

  if (details.category.status !== 'N/A') {
    rules.push({
      rule: `IF category (${userProfile.category}) is in eligible list THEN category_eligibility = 100%`,
      membershipDegree: details.category.score,
      weight: details.category.weight
    });
  }

  if (details.disability.status !== 'N/A') {
    rules.push({
      rule: `IF disability requirement is met THEN disability_eligibility = 100%`,
      membershipDegree: 1,
      weight: details.disability.weight
    });
  }

  if (details.specialGroup.status !== 'N/A') {
    rules.push({
      rule: `IF special group criteria: [${details.specialGroup.reason}] THEN specialGroup_eligibility = ${(details.specialGroup.score * 100).toFixed(0)}%`,
      membershipDegree: details.specialGroup.score,
      weight: details.specialGroup.weight
    });
  }

  if (details.location.status !== 'N/A') {
    rules.push({
      rule: `IF location (state/district) is in eligible area THEN location_eligibility = 100%`,
      membershipDegree: 1,
      weight: details.location.weight
    });
  }

  return {
    algorithm: 'Mamdani Fuzzy Inference System (FIS)',
    membershipFunctions: 'Triangular Membership Functions (trimf)',
    inferenceOperators: { AND: 'min', OR: 'max' },
    defuzzificationMethod: 'Weighted Average',
    pipeline: {
      step1_fuzzification: rules.map(r => ({
        criterion: r.rule.split('IF ')[1]?.split(' THEN')[0] || '',
        membershipDegree: r.membershipDegree
      })),
      step2_ruleBase: rules.map(r => r.rule),
      step3_inference: 'Mamdani AND (min) applied across criteria',
      step4_aggregation: `${rules.length} rule outputs aggregated with weights`,
      step5_defuzzification: {
        method: 'Weighted Average',
        formula: '(Σ weight_i × μ_i) / Σ weight_i × 100',
        crispOutput: finalScore
      }
    },
    firedRules: rules
  };
}

class FuzzyEligibilityMatcher {

  /**
   * STEP 1 — FUZZIFICATION
   * Convert crisp age value into fuzzy membership degree
   * using Triangular Membership Function (trimf)
   *
   * Fuzzy Sets:
   *   "core_eligible" → trimf centered at midpoint of [min, max]
   *   "near_limit"    → linear decay beyond the core range (tolerance = 10 yrs)
   *
   * @param {number} age      - User's crisp age
   * @param {number} minAge   - Scheme minimum age
   * @param {number} maxAge   - Scheme maximum age
   * @returns {{ degree: number, set: string }}
   */
  static fuzzifyAge(age, minAge, maxAge) {
    // Full membership inside [minAge, maxAge]
    if (age >= minAge && age <= maxAge) {
      const mid = (minAge + maxAge) / 2;
      // trimf: fully in range → membership 1.0
      const degree = trimf(age, minAge - 1, mid, maxAge + 1);
      return { degree: Math.max(degree, 1.0), set: 'core_eligible' };
    }

    // Partial membership within tolerance (10 years outside range)
    const TOLERANCE = 10;
    const distance = Math.min(Math.abs(age - minAge), Math.abs(age - maxAge));
    if (distance <= TOLERANCE) {
      // trimf decays linearly from range boundary → 0 at tolerance
      const degree = trimf(distance, 0, 0, TOLERANCE);
      return { degree: Math.max(0, 1 - distance / TOLERANCE), set: 'near_limit' };
    }

    return { degree: 0, set: 'out_of_range' };
  }

  /**
   * STEP 1 — FUZZIFICATION
   * Convert crisp income value into fuzzy membership degree
   *
   * Fuzzy Sets:
   *   "within_limit"  → full membership [0, maxIncome]
   *   "near_limit"    → partial membership within 10% tolerance
   *   "exceeds_limit" → membership = 0 (hard disqualifier)
   *
   * @param {number} income    - User's crisp income
   * @param {number} minIncome - Scheme min income (default 0)
   * @param {number} maxIncome - Scheme max income
   * @returns {{ degree: number, set: string }}
   */
  static fuzzifyIncome(income, minIncome, maxIncome) {
    if (income >= minIncome && income <= maxIncome) {
      return { degree: 1.0, set: 'within_limit' };
    }

    const tolerance = maxIncome * 0.1;
    if (income <= maxIncome + tolerance) {
      const degree = 1 - (income - maxIncome) / tolerance;
      return { degree: Math.max(0, degree * 0.5), set: 'near_limit' };
    }

    return { degree: 0, set: 'exceeds_limit' };
  }

  /**
   * STEPS 2–5: Rule Base → Inference → Aggregation → Defuzzification
   *
   * Implements the full Mamdani FIS pipeline:
   *  - Hard filters act as crisp pre-conditions (μ = 0 disqualifiers)
   *  - Fuzzy criteria fire IF–THEN rules with membership degrees
   *  - Aggregation: weighted sum of all fired rule outputs
   *  - Defuzzification: Weighted Average → crisp score [0–100]
   *
   * @param {object} userProfile       - User's profile object
   * @param {object} schemeEligibility - Scheme eligibility object
   * @returns {{ score, details, mamdaniExplanation, eligible }}
   */
  static calculateMatchScore(userProfile, schemeEligibility) {

    let totalWeight = 0;
    let achievedScore = 0;

    // Details track per-criterion membership degrees (μ values)
    const details = {
      age:          { score: 0, weight: 0, status: 'N/A' },
      income:       { score: 0, weight: 0, status: 'N/A' },
      gender:       { score: 0, weight: 0, status: 'N/A' },
      category:     { score: 0, weight: 0, status: 'N/A' },
      disability:   { score: 0, weight: 0, status: 'N/A' },
      specialGroup: { score: 0, weight: 0, status: 'N/A' },
      location:     { score: 0, weight: 0, status: 'N/A' }
    };

    // ============================================================
    // HARD FILTERS (Crisp Pre-Conditions)
    // These are non-fuzzy binary gates — μ = 0 means disqualified.
    // In Mamdani terms: these rules fire with output = 0 (dead zone).
    // ============================================================

    if (schemeEligibility.gender && schemeEligibility.gender !== 'All') {
      if (userProfile.gender !== schemeEligibility.gender) {
        return { score: 0, details, totalWeight: 0, achievedScore: 0, eligible: false, reason: "Gender mismatch" };
      }
    }

    if (schemeEligibility.requiresDisability && !userProfile.disability) {
      return { score: 0, details, totalWeight: 0, achievedScore: 0, eligible: false, reason: "Disability required" };
    }

    if (schemeEligibility.requiresExServicemen && !userProfile.exServiceman) {
      return { score: 0, details, totalWeight: 0, achievedScore: 0, eligible: false, reason: "Ex-Servicemen required" };
    }

    if (Array.isArray(schemeEligibility.eligibleOccupations) &&
        schemeEligibility.eligibleOccupations.length > 0) {
      if (!userProfile.occupation ||
          !schemeEligibility.eligibleOccupations.includes(userProfile.occupation)) {
        return { score: 0, details, totalWeight: 0, achievedScore: 0, eligible: false, reason: "Occupation not eligible" };
      }
    }

    if (Array.isArray(schemeEligibility.eligibleCategories) &&
        schemeEligibility.eligibleCategories.length > 0) {
      if (!schemeEligibility.eligibleCategories.includes(userProfile.category)) {
        return { score: 0, details, totalWeight: 0, achievedScore: 0, eligible: false, reason: "Category not eligible" };
      }
    }

    if (Array.isArray(schemeEligibility.eligibleStates) &&
        schemeEligibility.eligibleStates.length > 0) {
      if (!schemeEligibility.eligibleStates.includes(userProfile.state)) {
        return { score: 0, details, totalWeight: 0, achievedScore: 0, eligible: false, reason: "State not eligible" };
      }
    }

    if (Array.isArray(schemeEligibility.eligibleDistricts) &&
        schemeEligibility.eligibleDistricts.length > 0) {
      if (!schemeEligibility.eligibleDistricts.includes(userProfile.district)) {
        return { score: 0, details, totalWeight: 0, achievedScore: 0, eligible: false, reason: "District not eligible" };
      }
    }

    // Dynamic strict special group check
    const requiredGroups = Object.keys(schemeEligibility)
      .filter(key => key.startsWith('requires') && schemeEligibility[key] === true);

    if (schemeEligibility.strictSpecialGroup === true) {
      for (const field of requiredGroups) {
        const profileField = field.replace('requires', '');
        const normalizedField = profileField.charAt(0).toLowerCase() + profileField.slice(1);
        if (!userProfile[normalizedField]) {
          return { score: 0, details, totalWeight: 0, achievedScore: 0, eligible: false, reason: `${profileField} required` };
        }
      }
    }

    // ============================================================
    // FUZZY SCORING (Mamdani Inference + Aggregation)
    //
    // For each criterion:
    //   1. Fuzzify input → membership degree μ ∈ [0,1]
    //   2. Fire IF–THEN rule → output = μ × weight  (AND = min applied)
    //   3. Aggregate: achievedScore += output
    //   4. Defuzzify at end: finalScore = achievedScore / totalWeight × 100
    // ============================================================

    // CRITERION 1: Age — Fuzzy trimf membership
    if (schemeEligibility.minAge !== null || schemeEligibility.maxAge !== null) {
      const weight = schemeEligibility.weightAge || 1.0;
      totalWeight += weight;

      if (userProfile.age !== undefined && userProfile.age !== null) {
        const minAge = schemeEligibility.minAge || 0;
        const maxAge = schemeEligibility.maxAge || 120;

        const { degree, set } = this.fuzzifyAge(userProfile.age, minAge, maxAge);

        if (degree === 0) {
          return { score: 0, details, totalWeight: 0, achievedScore: 0, eligible: false, reason: "Age outside allowed range" };
        }

        // IF age is [set] THEN age_eligibility = degree  (Mamdani rule fires)
        achievedScore += weight * degree;
        details.age = {
          score: degree,
          weight,
          status: set === 'core_eligible' ? 'Match' : 'Partial',
          reason: `Age ${userProfile.age} , Match level: "${set}", Score = ${degree.toFixed(2)}`
        };
      }
    }

    // CRITERION 2: Income — Fuzzy trimf membership
    if (schemeEligibility.maxIncome !== null || schemeEligibility.minIncome !== null) {
      const weight = schemeEligibility.weightIncome || 1.0;
      totalWeight += weight;

      if (userProfile.income !== undefined && userProfile.income !== null) {
        const minIncome = schemeEligibility.minIncome || 0;
        const maxIncome = schemeEligibility.maxIncome || Infinity;

        const { degree, set } = this.fuzzifyIncome(userProfile.income, minIncome, maxIncome);

        if (degree === 0) {
          return { score: 0, details, totalWeight: 0, achievedScore: 0, eligible: false, reason: "Income exceeds limit" };
        }

        // IF income is [set] THEN income_eligibility = degree
        achievedScore += weight * degree;
        details.income = {
          score: degree,
          weight,
          status: set === 'within_limit' ? 'Match' : 'Near Match',
          reason: `Income ${userProfile.income} ,Match level: "${set}", score= ${degree.toFixed(2)}`
        };
      }
    }

    // CRITERION 3: Gender — Binary (already passed hard filter = full match)
    if (schemeEligibility.gender && schemeEligibility.gender !== 'All') {
      const weight = 1.0;
      totalWeight += weight;
      achievedScore += weight; // μ = 1.0 (exact match)
      details.gender = {
        score: 1.0,
        weight,
        status: 'Match',
        reason: `Gender "${userProfile.gender}" matches scheme requirement`
      };
    }

    // CRITERION 4: Category — Binary membership (passed hard filter = full match)
    if (Array.isArray(schemeEligibility.eligibleCategories) &&
        schemeEligibility.eligibleCategories.length > 0) {
      const weight = schemeEligibility.weightCategory || 1.0;
      totalWeight += weight;
      achievedScore += weight; // μ = 1.0
      details.category = {
        score: 1.0,
        weight,
        status: 'Match',
        reason: `Category "${userProfile.category}" is in eligible list`
      };
    }

    // CRITERION 5: Disability — Binary membership with higher weight
    if (schemeEligibility.requiresDisability) {
      const weight = 1.5;
      totalWeight += weight;
      achievedScore += weight; // μ = 1.0
      details.disability = {
        score: 1.0,
        weight,
        status: 'Match',
        reason: 'Disability requirement satisfied'
      };
    }

    // CRITERION 6: Special Group — Partial fuzzy membership
    // μ = (matched groups) / (total required groups)  → fuzzy partial credit
    if (requiredGroups.length > 0) {
      const weight = schemeEligibility.weightSpecialGroup || 1.0;
      totalWeight += weight;

      let matches = 0;
      const matched = [];
      const missing = [];

      for (const field of requiredGroups) {
        const profileField = field.replace('requires', '');
        const normalizedField = profileField.charAt(0).toLowerCase() + profileField.slice(1);

        if (userProfile[normalizedField]) {
          matches++;
          matched.push(profileField);
        } else {
          missing.push(profileField);
        }
      }

      // Fuzzy membership: proportion of matched special groups
      const degree = matches / requiredGroups.length;
      achievedScore += weight * degree;

      details.specialGroup = {
        score: degree,
        weight,
        status: degree === 1 ? 'Match' : degree > 0 ? 'Partial' : 'No Match',
        reason: `Matched: [${matched.join(', ') || 'None'}] | Missing: [${missing.join(', ') || 'None'}] | μ = ${degree.toFixed(2)}`
      };
    }

    // CRITERION 7: Location — Binary membership (passed hard filter = full match)
    if (
      (Array.isArray(schemeEligibility.eligibleStates) && schemeEligibility.eligibleStates.length > 0) ||
      (Array.isArray(schemeEligibility.eligibleDistricts) && schemeEligibility.eligibleDistricts.length > 0)
    ) {
      const weight = 0.8;
      totalWeight += weight;
      achievedScore += weight; // μ = 1.0
      details.location = {
        score: 1.0,
        weight,
        status: 'Match',
        reason: `Location matches scheme's eligible area`
      };
    }

    // ============================================================
    // DEFUZZIFICATION — Weighted Average Method
    //
    // Formula: crispScore = (Σ weight_i × μ_i) / Σ weight_i × 100
    //
    // This maps the aggregated fuzzy output back to a
    // crisp eligibility score in [0, 100].
    // ============================================================
    const finalScore = totalWeight > 0
      ? (achievedScore / totalWeight) * 100
      : 0;

    const crispScore = Math.round(finalScore * 100) / 100;

    // Build dynamic Mamdani explanation for this match
    const mamdaniExplanation = buildMamdaniExplanation(
      userProfile, schemeEligibility, details, crispScore
    );

    return {
      score: crispScore,
      details,
      totalWeight,
      achievedScore,
      eligible: crispScore >= 80, // Threshold: 80%
      mamdaniExplanation           // Dynamic Mamdani FIS trace
    };
  }

  /**
   * Find all matching schemes for a user using Mamdani FIS scoring
   */
  static async findMatchingSchemes(userId, minScore = 50) {
    const userProfile = await UserProfile.findOne({ where: { userId } });
    if (!userProfile) throw new Error(`User profile not found`);

    const allSchemes = await SchemeEligibility.findAll({
      where: { parsedSuccessfully: true }
    });

    const matches = [];

    for (const scheme of allSchemes) {
      const result = this.calculateMatchScore(userProfile, scheme);

      if (result.score >= minScore && result.eligible !== false) {
        matches.push({
          schemeId:         scheme.schemeId,
          schemeName:       scheme.schemeName,
          schemeLevel:      scheme.schemeLevel,
          matchScore:       result.score,
          eligible:         result.eligible,
          matchDetails:     result.details,
          mamdaniTrace:     result.mamdaniExplanation, // FIS pipeline trace
          rawEligibility:   scheme.rawEligibilityText
        });
      }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);

    return {
      userId,
      userName:        userProfile.name,
      algorithm:       'Mamdani Fuzzy Inference System',
      totalSchemes:    allSchemes.length,
      matchingSchemes: matches.length,
      schemes:         matches
    };
  }

  /**
   * Get detailed Mamdani FIS eligibility trace for a specific scheme
   */
  static async checkSchemeEligibility(userId, schemeId) {
    const userProfile = await UserProfile.findOne({ where: { userId } });
    if (!userProfile) throw new Error(`User profile not found`);

    const scheme = await SchemeEligibility.findOne({ where: { schemeId } });
    if (!scheme) throw new Error(`Scheme not found`);

    const result = this.calculateMatchScore(userProfile, scheme);

    return {
      userId,
      userName:           userProfile.name,
      schemeId:           scheme.schemeId,
      schemeName:         scheme.schemeName,
      algorithm:          'Mamdani Fuzzy Inference System (FIS)',
      defuzzification:    'Weighted Average',
      membershipFunctions:'Triangular (trimf)',
      ...result
    };
  }
}

module.exports = FuzzyEligibilityMatcher;