const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const models = require('../models');

let isConnected = false;

async function connectMongo() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventhub';

    if (isConnected) {
        return { connected: true, uri: mongoUri };
    }

    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            driverInfo: {
                name: 'nodejs',
                version: process.version || 'v20.0.0'
            }
        });

        isConnected = true;
        console.log(`[MongoDB] Connected successfully to MongoDB: ${mongoUri.split('@').pop()}`);

        // Seed initial data if MongoDB is fresh
        await seedMongoIfEmpty();

        return { connected: true, uri: mongoUri };
    } catch (err) {
        console.warn(`[MongoDB] Connection warning (${err.message}). Check MONGODB_URI in .env`);
        isConnected = false;
        return { connected: false, error: err.message };
    }
}

async function seedMongoIfEmpty() {
    try {
        const eventCount = await models.Event.countDocuments();
        if (eventCount > 0) return;

        console.log('[MongoDB] Fresh database detected. Seeding initial event data into MongoDB...');

        // Seed Events
        const events = [
            {
                _id: 'a1111111-1111-1111-1111-111111111111',
                title: 'Global Tech Summit 2026',
                description: 'The premier tech conference bringing together world leaders in AI, Cloud Computing, Cybersecurity, and Web3 technologies. Features keynotes, hands-on workshops, and exclusive networking sessions.',
                category: 'Technology',
                cover_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
                event_date: '2026-10-15',
                start_time: '09:00',
                end_time: '18:00',
                venue: 'Grand Convention Center - Main Auditorium',
                address: 'Plot 42, Tech Park Avenue, Financial District, Cyberabad',
                google_maps_url: 'https://maps.google.com',
                ticket_price: 1499.00,
                capacity: 500,
                registration_open_at: '2026-09-01 00:00:00',
                registration_close_at: '2026-10-14 23:59:59',
                status: 'registration_open',
                created_by: '11111111-1111-1111-1111-111111111111'
            },
            {
                _id: 'a2222222-2222-2222-2222-222222222222',
                title: 'Neon Pulsar Music Festival',
                description: 'An immersive electronic & synthwave music festival with high-octane stage lights, top international DJs, gourmet food trucks, and VIP lounge experiences.',
                category: 'Music',
                cover_image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
                event_date: '2026-11-20',
                start_time: '16:00',
                end_time: '23:30',
                venue: 'Skyline Open Air Arena',
                address: 'Sector 18, Riverside Boulevard, Downtown City',
                google_maps_url: 'https://maps.google.com',
                ticket_price: 2999.00,
                capacity: 1200,
                registration_open_at: '2026-09-05 00:00:00',
                registration_close_at: '2026-11-19 23:59:59',
                status: 'registration_open',
                created_by: '22222222-2222-2222-2222-222222222222'
            },
            {
                _id: 'a3333333-3333-3333-3333-333333333333',
                title: 'Startup Pitch & Venture Gala',
                description: 'Connect top venture capitalists, angel investors, and high-growth startup founders. Watch live pitch sessions with funding opportunities over $5M.',
                category: 'Business',
                cover_image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
                event_date: '2026-12-05',
                start_time: '10:00',
                end_time: '17:00',
                venue: 'The Zenith Business Hub',
                address: '8th Floor Executive Hall, Commercial Center, Metro City',
                google_maps_url: 'https://maps.google.com',
                ticket_price: 999.00,
                capacity: 250,
                registration_open_at: '2026-09-10 00:00:00',
                registration_close_at: '2026-12-04 23:59:59',
                status: 'registration_open',
                created_by: '11111111-1111-1111-1111-111111111111'
            },
            {
                _id: 'a4444444-4444-4444-4444-444444444444',
                title: 'National ITI Electrician & Fitter Vocational Expo',
                description: 'Career fair and skills exhibition for certified ITI professionals in Electrician, Fitter, and Machinist trades.',
                category: 'ITI & Vocational',
                cover_image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
                event_date: '2026-11-15',
                start_time: '09:30',
                end_time: '17:30',
                venue: 'National Skill Development Center Hall 2',
                address: 'Industrial Estate Phase 3, Metro City',
                google_maps_url: 'https://maps.google.com',
                ticket_price: 0.00,
                capacity: 600,
                registration_open_at: '2026-09-01 00:00:00',
                registration_close_at: '2026-11-14 23:59:59',
                status: 'registration_open',
                created_by: '11111111-1111-1111-1111-111111111111',
                iti_trade: 'Electrician, Fitter, Welder',
                iti_institute: 'Government ITI Apex Campus',
                iti_eligibility: 'ITI Pass / Final Year Apprenticeship'
            }
        ];

        for (const evt of events) {
            await models.Event.findOneAndUpdate({ _id: evt._id }, evt, { upsert: true, returnDocument: 'after' });
        }

        // Seed Sample Registration & Ticket
        const reg = {
            _id: 'r1111111-1111-1111-1111-111111111111',
            event_id: 'a1111111-1111-1111-1111-111111111111',
            user_id: '44444444-4444-4444-4444-444444444444',
            registration_number: 'REG-2026-000101',
            guest_name: 'Rahul Sharma',
            guest_email: 'guest@gmail.com',
            guest_phone: '+91 9876543213',
            registration_status: 'confirmed'
        };
        await models.Registration.findOneAndUpdate({ _id: reg._id }, reg, { upsert: true, returnDocument: 'after' });

        const ticket = {
            _id: 't1111111-1111-1111-1111-111111111111',
            registration_id: 'r1111111-1111-1111-1111-111111111111',
            event_id: 'a1111111-1111-1111-1111-111111111111',
            user_id: '44444444-4444-4444-4444-444444444444',
            ticket_number: 'EVT-2026-000101',
            secure_token: 'EVT-TK-9a8b7c6d5e4f3a2b1c0d',
            qr_code_data: 'EVENT-TICKET:EVT-TK-9a8b7c6d5e4f3a2b1c0d',
            status: 'active'
        };
        await models.Ticket.findOneAndUpdate({ _id: ticket._id }, ticket, { upsert: true, returnDocument: 'after' });

        const payment = {
            _id: 'p1111111-1111-1111-1111-111111111111',
            registration_id: 'r1111111-1111-1111-1111-111111111111',
            razorpay_order_id: 'order_Pz111111111111',
            razorpay_payment_id: 'pay_Pz111111111111',
            razorpay_signature: 'sig_mock_hash_111111111111',
            amount: 1499.00,
            currency: 'INR',
            status: 'paid',
            paid_at: new Date().toISOString()
        };
        await models.Payment.findOneAndUpdate({ _id: payment._id }, payment, { upsert: true, returnDocument: 'after' });

        console.log('[MongoDB] Seed completed successfully. Users and Events stored in MongoDB.');
    } catch (e) {
        console.error('[MongoDB] Seed error:', e.message);
    }
}

module.exports = {
    connectMongo,
    models,
    mongoose,
    get isConnected() { return isConnected; }
};
