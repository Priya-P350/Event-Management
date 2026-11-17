require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const path = require('path');
const fs = require('fs');
const { connectMongo, models, mongoose } = require('../config/mongo');

async function purgeAllData() {
    console.log('==============================================');
    console.log('⚡ STARTING COMPLETE DATA PURGE (FRESH START)');
    console.log('==============================================');

    // 1. Purge MongoDB
    console.log('\n[1/2] Connecting to MongoDB...');
    const mongoResult = await connectMongo();
    if (mongoResult.connected) {
        console.log('Connected to MongoDB. Deleting all records from collections...');
        
        const modelsList = [
            { name: 'User', model: models.User },
            { name: 'Event', model: models.Event },
            { name: 'Registration', model: models.Registration },
            { name: 'Ticket', model: models.Ticket },
            { name: 'Payment', model: models.Payment },
            { name: 'Attendance', model: models.Attendance },
            { name: 'EventImage', model: models.EventImage }
        ];

        for (const item of modelsList) {
            const res = await item.model.deleteMany({});
            console.log(`  - MongoDB ${item.name}: Deleted ${res.deletedCount} documents.`);
        }

        // Also check any extra collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const colName = col.name;
            if (!modelsList.some(m => m.model.collection.name === colName)) {
                const count = await mongoose.connection.db.collection(colName).countDocuments();
                if (count > 0) {
                    await mongoose.connection.db.collection(colName).deleteMany({});
                    console.log(`  - MongoDB (raw collection) ${colName}: Deleted ${count} documents.`);
                }
            }
        }

        console.log('✅ MongoDB successfully purged to 0 records across all collections.');
    } else {
        console.warn('⚠️ MongoDB not connected:', mongoResult.error);
    }

    // 2. Purge SQLite
    console.log('\n[2/2] Checking SQLite database...');
    const sqlitePath = path.resolve(__dirname, '../../local_database.sqlite');
    if (fs.existsSync(sqlitePath)) {
        try {
            const Database = require('better-sqlite3');
            const db = new Database(sqlitePath);
            db.pragma('foreign_keys = OFF');

            const tables = [
                'attendance',
                'member_attendance',
                'tickets',
                'payments',
                'registrations',
                'event_images',
                'events',
                'users',
                'audit_logs',
                'webhook_events'
            ];

            for (const table of tables) {
                try {
                    const info = db.prepare(`DELETE FROM ${table}`).run();
                    console.log(`  - SQLite ${table}: Deleted ${info.changes} rows.`);
                } catch (err) {
                    // Table might not exist, ignore
                }
            }

            db.pragma('foreign_keys = ON');
            db.close();
            console.log('✅ SQLite successfully purged to 0 records across all tables.');
        } catch (err) {
            console.warn('⚠️ SQLite purge error:', err.message);
        }
    } else {
        console.log('ℹ️ No local_database.sqlite file found.');
    }

    console.log('\n==============================================');
    console.log('🎉 FRESH START PURGE COMPLETE!');
    console.log('All events, login credentials, and registrations removed.');
    console.log('==============================================');

    if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    process.exit(0);
}

purgeAllData().catch(err => {
    console.error('Fatal error during purge:', err);
    process.exit(1);
});
