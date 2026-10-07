require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const dbQuery = require('../config/db');
const bcrypt = require('bcryptjs');

async function runSeed() {
    try {
        console.log(`[Seed Script] Initializing seed data via Drizzle ORM (${dbQuery.mode.toUpperCase()} mode)...`);
        
        const passwordHash = bcrypt.hashSync('Admin@123', 10);
        const guestHash = bcrypt.hashSync('Guest@123', 10);
        const staffHash = bcrypt.hashSync('Staff@123', 10);

        const users = [
            { id: '11111111-1111-1111-1111-111111111111', name: 'Global Super Admin', email: 'admin@eventhub.com', phone: '+91 9876543210', password_hash: passwordHash, role: 'super_admin' },
            { id: '22222222-2222-2222-2222-222222222222', name: 'Event Organizer Admin', email: 'organizer@eventhub.com', phone: '+91 9876543211', password_hash: passwordHash, role: 'event_admin' },
            { id: '33333333-3333-3333-3333-333333333333', name: 'Scanner Gate Staff', email: 'staff@eventhub.com', phone: '+91 9876543212', password_hash: staffHash, role: 'scanner_staff' },
            { id: '44444444-4444-4444-4444-444444444444', name: 'Rahul Sharma', email: 'guest@gmail.com', phone: '+91 9876543213', password_hash: guestHash, role: 'guest' },
            { id: '55555555-5555-5555-5555-555555555555', name: 'Priya Patel', email: 'priya@gmail.com', phone: '+91 9876543214', password_hash: guestHash, role: 'guest' }
        ];

        for (const user of users) {
            const existing = await dbQuery.findUserByEmail(user.email);
            if (!existing) {
                await dbQuery.createUser(user);
            }
        }
        console.log('✅ Seed users ready.');

        const events = [
            {
                id: 'a1111111-1111-1111-1111-111111111111',
                title: 'Global Tech Summit 2026',
                description: 'The premier tech conference bringing together world leaders in AI, Cloud Computing, Cybersecurity, and Web3 technologies. Features keynotes, hands-on workshops, and exclusive networking sessions.',
                category: 'Technology',
                cover_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
                event_date: '2026-10-15',
                start_time: '09:00:00',
                end_time: '18:00:00',
                venue: 'Grand Convention Center - Main Auditorium',
                address: 'Plot 42, Tech Park Avenue, Financial District, Cyberabad',
                google_maps_url: 'https://maps.google.com',
                ticket_price: 1499.00,
                capacity: 500,
                registration_open_at: '2026-09-01T00:00:00Z',
                registration_close_at: '2026-10-14T23:59:59Z',
                status: 'registration_open',
                created_by: '11111111-1111-1111-1111-111111111111'
            },
            {
                id: 'a2222222-2222-2222-2222-222222222222',
                title: 'Neon Pulsar Music Festival',
                description: 'An immersive electronic & synthwave music festival with high-octane stage lights, top international DJs, gourmet food trucks, and VIP lounge experiences.',
                category: 'Music',
                cover_image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
                event_date: '2026-11-20',
                start_time: '16:00:00',
                end_time: '23:30:00',
                venue: 'Skyline Open Air Arena',
                address: 'Sector 18, Riverside Boulevard, Downtown City',
                google_maps_url: 'https://maps.google.com',
                ticket_price: 2999.00,
                capacity: 1200,
                registration_open_at: '2026-09-05T00:00:00Z',
                registration_close_at: '2026-11-19T23:59:59Z',
                status: 'registration_open',
                created_by: '22222222-2222-2222-2222-222222222222'
            },
            {
                id: 'a3333333-3333-3333-3333-333333333333',
                title: 'Startup Pitch & Venture Gala',
                description: 'Connect top venture capitalists, angel investors, and high-growth startup founders. Watch live pitch sessions with funding opportunities over $5M.',
                category: 'Business',
                cover_image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
                event_date: '2026-12-05',
                start_time: '10:00:00',
                end_time: '17:00:00',
                venue: 'The Zenith Business Hub',
                address: '8th Floor Executive Hall, Commercial Center, Metro City',
                google_maps_url: 'https://maps.google.com',
                ticket_price: 999.00,
                capacity: 250,
                registration_open_at: '2026-09-10T00:00:00Z',
                registration_close_at: '2026-12-04T23:59:59Z',
                status: 'registration_open',
                created_by: '11111111-1111-1111-1111-111111111111'
            },
            {
                id: 'a4444444-4444-4444-4444-444444444444',
                title: 'Generative AI Masterclass Workshop',
                description: 'Hands-on masterclass building LLM agents, RAG systems, multimodal apps, and fine-tuning open source models with industry AI experts.',
                category: 'Education',
                cover_image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
                event_date: '2026-08-10',
                start_time: '11:00:00',
                end_time: '16:00:00',
                venue: 'Innovation Labs Hall A',
                address: 'Knowledge Village, Tech Hub Campus',
                google_maps_url: 'https://maps.google.com',
                ticket_price: 499.00,
                capacity: 100,
                registration_open_at: '2026-07-01T00:00:00Z',
                registration_close_at: '2026-08-09T23:59:59Z',
                status: 'completed',
                created_by: '11111111-1111-1111-1111-111111111111'
            },
            {
                id: 'a5555555-5555-5555-5555-555555555555',
                title: 'AI & Future Tech Open Expo 2026 (Free Entry)',
                description: '100% Free Public Entry! Experience live AI humanoid robotics, generative media demos, tech startup showcases, and career networking. Free entry pass with instant QR ticket delivery via email.',
                category: 'Technology',
                cover_image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
                event_date: '2026-10-30',
                start_time: '10:00:00',
                end_time: '18:00:00',
                venue: 'Silicon Hall - Grand Exhibition Center',
                address: 'Gate 4, Innovation Park, High-Tech City',
                google_maps_url: 'https://maps.google.com',
                ticket_price: 0.00,
                capacity: 1500,
                registration_open_at: '2026-09-01T00:00:00Z',
                registration_close_at: '2026-10-29T23:59:59Z',
                status: 'registration_open',
                created_by: '11111111-1111-1111-1111-111111111111'
            }
        ];

        for (const evt of events) {
            const existing = await dbQuery.getEventById(evt.id);
            if (!existing) {
                await dbQuery.createEvent(evt);
            }
        }
        console.log('✅ Seed events ready.');

    } catch (e) {
        console.error('Seed exception:', e);
    }
}

runSeed();
