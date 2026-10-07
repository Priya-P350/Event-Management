-- Seed script for Event Management & QR Ticketing System

-- 1. SEED USERS (Passwords hashed using bcrypt for "Admin@123", "Staff@123", "Guest@123")
-- Hash for "Admin@123": $2a$10$wT5aV3n0G5iN2Xz9r1Y6u.M8aH0K6qZ7bX8yW9v0t1u2v3w4x5y6z
-- Hash for "Staff@123": $2a$10$wT5aV3n0G5iN2Xz9r1Y6u.M8aH0K6qZ7bX8yW9v0t1u2v3w4x5y6z
-- Hash for "Guest@123": $2a$10$wT5aV3n0G5iN2Xz9r1Y6u.M8aH0K6qZ7bX8yW9v0t1u2v3w4x5y6z

INSERT INTO users (id, name, email, phone, password_hash, role) VALUES
('11111111-1111-1111-1111-111111111111', 'Global Super Admin', 'admin@eventhub.com', '+91 9876543210', '$2a$10$7vN3fQ1kQ4W.Zk1v2K3u4eO1k2m3n4o5p6q7r8s9t0u1v2w3x4y5z', 'super_admin'),
('22222222-2222-2222-2222-222222222222', 'Event Organizer Admin', 'organizer@eventhub.com', '+91 9876543211', '$2a$10$7vN3fQ1kQ4W.Zk1v2K3u4eO1k2m3n4o5p6q7r8s9t0u1v2w3x4y5z', 'event_admin'),
('33333333-3333-3333-3333-333333333333', 'Scanner Gate Staff', 'staff@eventhub.com', '+91 9876543212', '$2a$10$7vN3fQ1kQ4W.Zk1v2K3u4eO1k2m3n4o5p6q7r8s9t0u1v2w3x4y5z', 'scanner_staff'),
('44444444-4444-4444-4444-444444444444', 'Rahul Sharma', 'guest@gmail.com', '+91 9876543213', '$2a$10$7vN3fQ1kQ4W.Zk1v2K3u4eO1k2m3n4o5p6q7r8s9t0u1v2w3x4y5z', 'guest'),
('55555555-5555-5555-5555-555555555555', 'Priya Patel', 'priya@gmail.com', '+91 9876543214', '$2a$10$7vN3fQ1kQ4W.Zk1v2K3u4eO1k2m3n4o5p6q7r8s9t0u1v2w3x4y5z', 'guest')
ON CONFLICT (email) DO NOTHING;

-- 2. SEED EVENTS
INSERT INTO events (id, title, description, category, cover_image_url, event_date, start_time, end_time, venue, address, google_maps_url, ticket_price, capacity, registration_open_at, registration_close_at, status, created_by) VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'Global Tech Summit 2026',
    'The premier tech conference bringing together world leaders in AI, Cloud Computing, Cybersecurity, and Web3 technologies. Features keynotes, hands-on workshops, and exclusive networking sessions.',
    'Technology',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    '2026-10-15',
    '09:00:00',
    '18:00:00',
    'Grand Convention Center - Main Auditorium',
    'Plot 42, Tech Park Avenue, Financial District, Cyberabad',
    'https://maps.google.com',
    1499.00,
    500,
    '2026-09-01 00:00:00+00',
    '2026-10-14 23:59:59+00',
    'registration_open',
    '11111111-1111-1111-1111-111111111111'
),
(
    'a2222222-2222-2222-2222-222222222222',
    'Neon Pulsar Music Festival',
    'An immersive electronic & synthwave music festival with high-octane stage lights, top international DJs, gourmet food trucks, and VIP lounge experiences.',
    'Music & Entertainment',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    '2026-11-20',
    '16:00:00',
    '23:30:00',
    'Skyline Open Air Arena',
    'Sector 18, Riverside Boulevard, Downtown City',
    'https://maps.google.com',
    2999.00,
    1200,
    '2026-09-05 00:00:00+00',
    '2026-11-19 23:59:59+00',
    'registration_open',
    '22222222-2222-2222-2222-222222222222'
),
(
    'a3333333-3333-3333-3333-333333333333',
    'Startup Pitch & Venture Gala',
    'Connect top venture capitalists, angel investors, and high-growth startup founders. Watch live pitch sessions with funding opportunities over $5M.',
    'Business',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    '2026-12-05',
    '10:00:00',
    '17:00:00',
    'The Zenith Business Hub',
    '8th Floor Executive Hall, Commercial Center, Metro City',
    'https://maps.google.com',
    999.00,
    250,
    '2026-09-10 00:00:00+00',
    '2026-12-04 23:59:59+00',
    'registration_open',
    '11111111-1111-1111-1111-111111111111'
),
(
    'a4444444-4444-4444-4444-444444444444',
    'Generative AI Masterclass Workshop',
    'Hands-on masterclass building LLM agents, RAG systems, multimodal apps, and fine-tuning open source models with industry AI experts.',
    'Education',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    '2026-08-10',
    '11:00:00',
    '16:00:00',
    'Innovation Labs Hall A',
    'Knowledge Village, Tech Hub Campus',
    'https://maps.google.com',
    499.00,
    100,
    '2026-07-01 00:00:00+00',
    '2026-08-09 23:59:59+00',
    'completed',
    '11111111-1111-1111-1111-111111111111'
)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED REGISTRATIONS
INSERT INTO registrations (id, event_id, user_id, registration_number, guest_name, guest_email, guest_phone, registration_status) VALUES
(
    'r1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'REG-2026-000101',
    'Rahul Sharma',
    'guest@gmail.com',
    '+91 9876543213',
    'confirmed'
),
(
    'r2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    'REG-2026-000102',
    'Priya Patel',
    'priya@gmail.com',
    '+91 9876543214',
    'confirmed'
),
(
    'r3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    'REG-2026-000099',
    'Rahul Sharma',
    'guest@gmail.com',
    '+91 9876543213',
    'confirmed'
)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED PAYMENTS
INSERT INTO payments (id, registration_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, status, paid_at) VALUES
(
    'p1111111-1111-1111-1111-111111111111',
    'r1111111-1111-1111-1111-111111111111',
    'order_Pz111111111111',
    'pay_Pz111111111111',
    'sig_mock_hash_111111111111',
    1499.00,
    'INR',
    'paid',
    CURRENT_TIMESTAMP
),
(
    'p2222222-2222-2222-2222-222222222222',
    'r2222222-2222-2222-2222-222222222222',
    'order_Pz222222222222',
    'pay_Pz222222222222',
    'sig_mock_hash_222222222222',
    1499.00,
    'INR',
    'paid',
    CURRENT_TIMESTAMP
),
(
    'p3333333-3333-3333-3333-333333333333',
    'r3333333-3333-3333-3333-333333333333',
    'order_Pz333333333333',
    'pay_Pz333333333333',
    'sig_mock_hash_333333333333',
    499.00,
    'INR',
    'paid',
    '2026-08-10 10:30:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED TICKETS (Secure Unpredictable Tokens)
INSERT INTO tickets (id, registration_id, event_id, user_id, ticket_number, secure_token, qr_code_data, status) VALUES
(
    't1111111-1111-1111-1111-111111111111',
    'r1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'EVT-2026-000101',
    'EVT-TK-9a8b7c6d5e4f3a2b1c0d',
    'EVENT-TICKET:EVT-TK-9a8b7c6d5e4f3a2b1c0d',
    'active'
),
(
    't2222222-2222-2222-2222-222222222222',
    'r2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    'EVT-2026-000102',
    'EVT-TK-1f2e3d4c5b6a7b8c9d0e',
    'EVENT-TICKET:EVT-TK-1f2e3d4c5b6a7b8c9d0e',
    'active'
),
(
    't3333333-3333-3333-3333-333333333333',
    'r3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    'EVT-2026-000099',
    'EVT-TK-887766554433221100aa',
    'EVENT-TICKET:EVT-TK-887766554433221100aa',
    'checked_in'
)
ON CONFLICT (id) DO NOTHING;

-- 6. SEED ATTENDANCE
INSERT INTO attendance (id, ticket_id, event_id, registration_id, checked_in_by, checked_in_at, status, device_info) VALUES
(
    'att11111-1111-1111-1111-111111111111',
    't3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    'r3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '2026-08-10 10:45:12+00',
    'checked_in',
    'Gate Scanner Mobile #01'
)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED EVENT GALLERY IMAGES
INSERT INTO event_images (id, event_id, image_url, caption, uploaded_by) VALUES
('img11111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80', 'Opening keynote session at Generative AI Masterclass', '11111111-1111-1111-1111-111111111111'),
('img22222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80', 'Attendees working on live AI coding labs', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;
