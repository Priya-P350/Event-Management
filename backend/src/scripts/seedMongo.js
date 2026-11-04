require('dotenv').config();
const { connectMongo, models } = require('../config/mongo');

async function runSeed() {
    console.log('[MongoDB Seeder] Connecting to MongoDB...');
    const conn = await connectMongo();
    if (!conn.connected) {
        console.error('[MongoDB Seeder] Failed to connect:', conn.error);
        process.exit(1);
    }

    const userCount = await models.User.countDocuments();
    const eventCount = await models.Event.countDocuments();

    console.log(`[MongoDB Seeder] Status: Verified MongoDB connection.`);
    console.log(`[MongoDB Seeder] Current Collection Stats:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Events: ${eventCount}`);
    console.log(`   - Registrations: ${await models.Registration.countDocuments()}`);
    console.log(`   - Tickets: ${await models.Ticket.countDocuments()}`);
    console.log(`   - Payments: ${await models.Payment.countDocuments()}`);
    console.log('✅ [MongoDB Seeder] Database is ready for user data storage.');
    process.exit(0);
}

runSeed().catch(err => {
    console.error('[MongoDB Seeder] Uncaught error:', err);
    process.exit(1);
});
