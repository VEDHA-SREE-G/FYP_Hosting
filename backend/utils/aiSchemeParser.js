const Groq = require('groq-sdk');
const SchemeEligibility = require('../models/schemeEligibility');
const Scheme = require('../models/Schem');
const SchemeEligibilityParser = require('./schemeEligibilityParser'); // Fallback Parser
console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++");
console.log("PROCESS KEY:", process.env.GROQ_API_KEY);
console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++");

class AISchemeParser {
  constructor(apiKey) {
    const keys = (apiKey || process.env.GROQ_API_KEY || '').split(',');
    this.apiKeys = keys.map(k => k.trim()).filter(k => k);
    this.currentKeyIndex = 0;

    if (this.apiKeys.length === 0) {
      console.warn("No Groq API keys found!");
    } else {
      console.log(`Loaded ${this.apiKeys.length} API keys for rotation.`);
    }

    this.initializeClient();
  }

  initializeClient() {
    const key = this.apiKeys[this.currentKeyIndex];
    this.groq = new Groq({ apiKey: key });
  }

  rotateKey() {
    if (this.apiKeys.length <= 1) return false;

    this.currentKeyIndex =
      (this.currentKeyIndex + 1) % this.apiKeys.length;

    console.log(`Rotating to API Key index: ${this.currentKeyIndex}`);
    this.initializeClient();
    return true;
  }

  async parseSchemeWithAI(scheme, retries = 3) {
    const prompt = `You are an expert at analyzing government scheme eligibility criteria from India. 

SCHEME NAME: ${scheme.scheme_name}
MINISTRY: ${scheme.ministry || 'N/A'}
DESCRIPTION: ${scheme.description || 'N/A'}
ELIGIBILITY: ${scheme.eligibility || 'N/A'}
BENEFITS: ${scheme.benefits || 'N/A'}
SCHEME LEVEL: ${scheme.scheme_level || 'Central'}

Extract eligibility criteria into this EXACT JSON structure. If a field is not mentioned or not applicable, strictly use null for numbers/strings and false for booleans (unless default is specified). Do not invent data.

{
  "minAge": 18 (integer or null),
  "maxAge": 60 (integer or null),
  "minIncome": 100000 (integer or null),
  "maxIncome": 500000 (integer or null),
  "gender": "All" (Enum: "Male", "Female", "Other", "All"),
  "eligibleCategories": ["General", "SC", "ST"] (Array of strings or null),
  "requiresDisability": false (boolean),
  "disabilityPercentageMin": 40 (integer or null),
  "requiresFarmer": false (boolean),
  "requiresStudent": false (boolean),
  "requiresWidow": false (boolean),
  "requiresSeniorCitizen": false (boolean),
  "minEducation": "10th" (string or null),
  "specificDegrees": ["B.Tech", "MBBS"] (Array of strings or null),
  "eligibleOccupations": ["Artisan", "Weaver"] (Array of strings or null),
  "employmentStatus": "Any" (Enum: "Employed", "Unemployed", "Self-Employed", "Any"),
  "schemeLevel": "Central" (Enum: "Central", "State", "District"),
  "eligibleStates": ["Maharashtra"] (Array of strings or null),
  "eligibleDistricts": [] (Array of strings or null),
  "requiresExServicemen": false (boolean),
  "maxRank": "Havildar" (string or null),
  "pensionerStatus": "Any" (Enum: "Pensioner", "Non-Pensioner", "Any"),
  "requiresIndianCitizen": true (boolean),
  "admissionRequired": false (boolean),
  "courseLevel": [] (Array of strings),
  "studyLocation": "India" (Enum: "India", "Abroad", "Both"),
  "excludesPreviousRecipients": false (boolean),
  "excludesPermanentEmployees": false (boolean),
  "maxFamilyMembers": null (integer or null),
  "requiresCareerBreak": false (boolean),
  "specialConditions": "Must be residents of hill areas" (string or null)
}

Return ONLY VALID JSON. No markdown. No comments.`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const completion = await this.groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a data extraction expert. You must return VALID JSON matching the requested schema exactly."
            },
            { role: "user", content: prompt }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.1,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        });

        const responseText =
          completion.choices[0]?.message?.content || '{}';

        let jsonText = responseText.trim();

        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```json\n?/g, '')
                             .replace(/```\n?/g, '');
        }

        const parsedData = JSON.parse(jsonText);

        return {
          success: true,
          data: parsedData,
          rawResponse: responseText
        };

      } catch (error) {
        console.error(
          `AI parsing error for scheme ${scheme.id} (Attempt ${attempt}/${retries}):`,
          error.message
        );

        const isRateLimit =
          error.message.includes('429') ||
          error.message.includes('Rate limit');

        const isServerError =
          error.message.includes('500') ||
          error.message.includes('502') ||
          error.message.includes('503');

        if (isRateLimit) {
          if (this.rotateKey()) {
            console.log("Switching API key due to rate limit...");
            attempt--;
            continue;
          }

          const waitTime = attempt * 5000;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(r => setTimeout(r, waitTime));

        } else if (isServerError) {
          const waitTime = attempt * 5000;
          await new Promise(r => setTimeout(r, waitTime));
        }

        if (attempt === retries) {
          return {
            success: false,
            error: error.message,
            data: null
          };
        }
      }
    }

    return {
      success: false,
      error: "Max retries exceeded",
      data: null
    };
  }

  normalizeEligibility(data) {
    return {
      minAge: Number.isInteger(data.minAge) ? data.minAge : null,
      maxAge: Number.isInteger(data.maxAge) ? data.maxAge : null,
      minIncome: Number.isInteger(data.minIncome) ? data.minIncome : null,
      maxIncome: Number.isInteger(data.maxIncome) ? data.maxIncome : null,
      gender: ["Male", "Female", "Other", "All"].includes(data.gender) ? data.gender : "All",
      eligibleCategories: Array.isArray(data.eligibleCategories) ? data.eligibleCategories : null,
      requiresDisability: !!data.requiresDisability,
      disabilityPercentageMin: Number.isInteger(data.disabilityPercentageMin) ? data.disabilityPercentageMin : null,
      requiresFarmer: !!data.requiresFarmer,
      requiresStudent: !!data.requiresStudent,
      requiresWidow: !!data.requiresWidow,
      requiresSeniorCitizen: !!data.requiresSeniorCitizen,
      minEducation: data.minEducation || null,
      specificDegrees: Array.isArray(data.specificDegrees) ? data.specificDegrees : null,
      eligibleOccupations: Array.isArray(data.eligibleOccupations) ? data.eligibleOccupations : null,
      employmentStatus: ["Employed", "Unemployed", "Self-Employed", "Any"].includes(data.employmentStatus) ? data.employmentStatus : "Any",
      schemeLevel: ["Central", "State", "District"].includes(data.schemeLevel) ? data.schemeLevel : "Central",
      eligibleStates: Array.isArray(data.eligibleStates) ? data.eligibleStates : null,
      eligibleDistricts: Array.isArray(data.eligibleDistricts) ? data.eligibleDistricts : null,
      requiresExServicemen: !!data.requiresExServicemen,
      maxRank: data.maxRank || null,
      pensionerStatus: ["Pensioner", "Non-Pensioner", "Any"].includes(data.pensionerStatus) ? data.pensionerStatus : "Any",
      requiresIndianCitizen: data.requiresIndianCitizen !== false, // Default true
      admissionRequired: !!data.admissionRequired,
      courseLevel: Array.isArray(data.courseLevel) ? data.courseLevel : null,
      studyLocation: ["India", "Abroad", "Both"].includes(data.studyLocation) ? data.studyLocation : "India",
      excludesPreviousRecipients: !!data.excludesPreviousRecipients,
      excludesPermanentEmployees: !!data.excludesPermanentEmployees,
      maxFamilyMembers: Number.isInteger(data.maxFamilyMembers) ? data.maxFamilyMembers : null,
      requiresCareerBreak: !!data.requiresCareerBreak,
      specialConditions: data.specialConditions || null
    };
  }

  async parseAndSaveScheme(schemeId) {
    try {
      const scheme = await Scheme.findByPk(schemeId);
      if (!scheme) {
        throw new Error(`Scheme with ID ${schemeId} not found`);
      }

      console.log(`Parsing scheme: ${scheme.scheme_name}`);

      let parseResult = await this.parseSchemeWithAI(scheme);
      let usedFallback = false;

      if (!parseResult.success) {
        console.warn(`AI parsing failed for scheme ${scheme.id}. Using fallback parser...`);
        const fallbackData = SchemeEligibilityParser.parseEligibility(
          scheme.eligibility || '',
          scheme.benefits || ''
        );
        parseResult = {
          success: true,
          data: fallbackData,
          rawResponse: "Fallback Parser Used"
        };
        usedFallback = true;
      }

      // Normalize data to ensure type safety
      const finalData = this.normalizeEligibility(parseResult.data);

      const eligibilityData = {
        schemeId: scheme.id,
        schemeName: scheme.scheme_name,
        schemeLevel: finalData.schemeLevel || scheme.scheme_level || 'Central',
        ...finalData,
        rawEligibilityText: scheme.eligibility || '',
        parsedSuccessfully: true,
        lastParsed: new Date()
      };

      const existing = await SchemeEligibility.findOne({
        where: { schemeId }
      });

      if (existing) {
        await existing.update(eligibilityData);
        console.log(`✓ Updated scheme eligibility: ${scheme.scheme_name}`);
      } else {
        await SchemeEligibility.create(eligibilityData);
        console.log(`✓ Created scheme eligibility: ${scheme.scheme_name}`);
      }

      return {
        success: true,
        schemeId: scheme.id,
        schemeName: scheme.scheme_name
      };

    } catch (error) {
      console.error(
        `Error processing scheme ${schemeId}:`,
        error.message
      );

      return {
        success: false,
        schemeId,
        error: error.message
      };
    }
  }

  async parseAllSchemes(options = {}) {
    const { batchSize = 2, delayMs = 5000 } = options;

    const schemes = await Scheme.findAll();
    console.log(`Found ${schemes.length} schemes to parse`);

    const results = {
      total: schemes.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < schemes.length; i += batchSize) {
      const batch = schemes.slice(i, i + batchSize);

      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${
          Math.ceil(schemes.length / batchSize)
        }`
      );

      const batchResults = await Promise.all(
        batch.map(s => this.parseAndSaveScheme(s.id))
      );

      for (const result of batchResults) {
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(result);
        }
      }

      if (i + batchSize < schemes.length) {
        console.log(`Waiting ${delayMs}ms before next batch...`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }

    console.log('='.repeat(50));
    console.log('PARSING COMPLETE');
    console.log('='.repeat(50));

    return results;
  }
  async validateParsedData() {
  try {
    const allEligibility = await SchemeEligibility.findAll();

    const validation = {
      total: allEligibility.length,
      withAge: 0,
      withIncome: 0,
      withGender: 0,
      withSpecialGroups: 0,
      withEducation: 0,
      incomplete: []
    };

    for (const elig of allEligibility) {
      let criteriaCount = 0;

      if (elig.minAge !== null || elig.maxAge !== null) {
        validation.withAge++;
        criteriaCount++;
      }

      if (elig.minIncome !== null || elig.maxIncome !== null) {
        validation.withIncome++;
        criteriaCount++;
      }

      if (elig.gender && elig.gender !== 'All') {
        validation.withGender++;
        criteriaCount++;
      }

      if (
        elig.requiresDisability ||
        elig.requiresFarmer ||
        elig.requiresStudent ||
        elig.requiresWidow ||
        elig.requiresSeniorCitizen
      ) {
        validation.withSpecialGroups++;
        criteriaCount++;
      }

      if (
        elig.minEducation ||
        (elig.specificDegrees &&
          elig.specificDegrees.length > 0)
      ) {
        validation.withEducation++;
        criteriaCount++;
      }

      if (criteriaCount === 0) {
        validation.incomplete.push({
          schemeId: elig.schemeId,
          schemeName: elig.schemeName
        });
      }
    }

    return validation;

  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
}

}


module.exports = AISchemeParser;
