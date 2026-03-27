require('dotenv').config();
const { sequelize } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected.');

    // Update status constraint to include counter_offer_sent
    await sequelize.query(`ALTER TABLE agreements DROP CONSTRAINT IF EXISTS agreements_status_check;`);
    await sequelize.query(`
      ALTER TABLE agreements ADD CONSTRAINT agreements_status_check 
      CHECK (status IN ('pending', 'forwarded_to_owner', 'counter_offer', 'counter_offer_sent', 'owner_approved', 'owner_rejected', 'completed'));
    `);
    console.log('Updated status constraint with counter_offer_sent.');

    await sequelize.close();
    console.log('Done!');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
