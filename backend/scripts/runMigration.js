require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const SchemeEligibilityParser = require('../utils/schemeEligibilityParser');
const sequelize = require('../config/db');

async function main() {
  try {
    console.log('Syncing database...');
    await sequelize.sync({ alter: true });
    console.log('Migrating all schemes using fallback parser...');
    const result = await SchemeEligibilityParser.migrateAllSchemes();
    console.log(result);
    console.log('Done.');
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
