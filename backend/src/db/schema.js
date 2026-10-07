const { pgTable, uuid, varchar, text, timestamp, numeric, integer, jsonb } = require('drizzle-orm/pg-core');
const { sqliteTable, text: sqliteText, real: sqliteReal, integer: sqliteInteger } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

// ==========================================
// POSTGRESQL DIALECT SCHEMAS (SUPABASE POSTGRES)
// ==========================================

const usersPg = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 50 }),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('guest'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

const eventsPg = pgTable('events', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).default('General'),
    coverImageUrl: text('cover_image_url'),
    eventDate: text('event_date').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    venue: varchar('venue', { length: 255 }).notNull(),
    address: text('address').notNull(),
    googleMapsUrl: text('google_maps_url'),
    ticketPrice: numeric('ticket_price', { precision: 10, scale: 2 }).notNull().default('0.00'),
    capacity: integer('capacity').notNull().default(100),
    registrationOpenAt: timestamp('registration_open_at', { withTimezone: true }),
    registrationCloseAt: timestamp('registration_close_at', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('draft'),
    createdBy: uuid('created_by').references(() => usersPg.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

const registrationsPg = pgTable('registrations', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().references(() => eventsPg.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => usersPg.id, { onDelete: 'cascade' }),
    registrationNumber: varchar('registration_number', { length: 100 }).notNull().unique(),
    guestName: varchar('guest_name', { length: 255 }).notNull(),
    guestEmail: varchar('guest_email', { length: 255 }).notNull(),
    guestPhone: varchar('guest_phone', { length: 50 }).notNull(),
    customAnswers: jsonb('custom_answers').default({}),
    registrationStatus: varchar('registration_status', { length: 50 }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

const paymentsPg = pgTable('payments', {
    id: uuid('id').primaryKey().defaultRandom(),
    registrationId: uuid('registration_id').notNull().references(() => registrationsPg.id, { onDelete: 'cascade' }),
    razorpayOrderId: varchar('razorpay_order_id', { length: 255 }).notNull().unique(),
    razorpayPaymentId: varchar('razorpay_payment_id', { length: 255 }),
    razorpaySignature: varchar('razorpay_signature', { length: 512 }),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('INR'),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    refundId: varchar('refund_id', { length: 255 }),
    refundStatus: varchar('refund_status', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

const ticketsPg = pgTable('tickets', {
    id: uuid('id').primaryKey().defaultRandom(),
    registrationId: uuid('registration_id').notNull().unique().references(() => registrationsPg.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').notNull().references(() => eventsPg.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => usersPg.id, { onDelete: 'cascade' }),
    ticketNumber: varchar('ticket_number', { length: 100 }).notNull().unique(),
    secureToken: varchar('secure_token', { length: 255 }).notNull().unique(),
    qrCodeData: text('qr_code_data').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

const attendancePg = pgTable('attendance', {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id').notNull().unique().references(() => ticketsPg.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').notNull().references(() => eventsPg.id, { onDelete: 'cascade' }),
    registrationId: uuid('registration_id').notNull().references(() => registrationsPg.id, { onDelete: 'cascade' }),
    checkedInBy: uuid('checked_in_by').references(() => usersPg.id, { onDelete: 'set null' }),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }).defaultNow(),
    status: varchar('status', { length: 50 }).notNull().default('checked_in'),
    deviceInfo: varchar('device_info', { length: 255 })
});

const eventImagesPg = pgTable('event_images', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().references(() => eventsPg.id, { onDelete: 'cascade' }),
    imageUrl: text('image_url').notNull(),
    caption: varchar('caption', { length: 255 }),
    uploadedBy: uuid('uploaded_by').references(() => usersPg.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

const auditLogsPg = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => usersPg.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

const webhookEventsPg = pgTable('webhook_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: varchar('event_id', { length: 255 }).notNull().unique(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow()
});

// ==========================================
// SQLITE DIALECT SCHEMAS (EMBEDDED LOCAL DB)
// ==========================================

const usersSqlite = sqliteTable('users', {
    id: sqliteText('id').primaryKey(),
    name: sqliteText('name').notNull(),
    email: sqliteText('email').notNull().unique(),
    phone: sqliteText('phone'),
    passwordHash: sqliteText('password_hash').notNull(),
    role: sqliteText('role').notNull().default('guest'),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: sqliteText('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

const eventsSqlite = sqliteTable('events', {
    id: sqliteText('id').primaryKey(),
    title: sqliteText('title').notNull(),
    description: sqliteText('description'),
    category: sqliteText('category').default('General'),
    coverImageUrl: sqliteText('cover_image_url'),
    eventDate: sqliteText('event_date').notNull(),
    startTime: sqliteText('start_time').notNull(),
    endTime: sqliteText('end_time').notNull(),
    venue: sqliteText('venue').notNull(),
    address: sqliteText('address').notNull(),
    googleMapsUrl: sqliteText('google_maps_url'),
    ticketPrice: sqliteReal('ticket_price').notNull().default(0.00),
    capacity: sqliteInteger('capacity').notNull().default(100),
    registrationOpenAt: sqliteText('registration_open_at'),
    registrationCloseAt: sqliteText('registration_close_at'),
    status: sqliteText('status').notNull().default('draft'),
    createdBy: sqliteText('created_by').references(() => usersSqlite.id),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: sqliteText('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

const registrationsSqlite = sqliteTable('registrations', {
    id: sqliteText('id').primaryKey(),
    eventId: sqliteText('event_id').notNull().references(() => eventsSqlite.id, { onDelete: 'cascade' }),
    userId: sqliteText('user_id').notNull().references(() => usersSqlite.id, { onDelete: 'cascade' }),
    registrationNumber: sqliteText('registration_number').notNull().unique(),
    guestName: sqliteText('guest_name').notNull(),
    guestEmail: sqliteText('guest_email').notNull(),
    guestPhone: sqliteText('guest_phone').notNull(),
    customAnswers: sqliteText('custom_answers').default('{}'),
    registrationStatus: sqliteText('registration_status').notNull().default('pending'),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`)
});

const paymentsSqlite = sqliteTable('payments', {
    id: sqliteText('id').primaryKey(),
    registrationId: sqliteText('registration_id').notNull().references(() => registrationsSqlite.id, { onDelete: 'cascade' }),
    razorpayOrderId: sqliteText('razorpay_order_id').notNull().unique(),
    razorpayPaymentId: sqliteText('razorpay_payment_id'),
    razorpaySignature: sqliteText('razorpay_signature'),
    amount: sqliteReal('amount').notNull(),
    currency: sqliteText('currency').default('INR'),
    status: sqliteText('status').notNull().default('pending'),
    paidAt: sqliteText('paid_at'),
    refundId: sqliteText('refund_id'),
    refundStatus: sqliteText('refund_status'),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`)
});

const ticketsSqlite = sqliteTable('tickets', {
    id: sqliteText('id').primaryKey(),
    registrationId: sqliteText('registration_id').notNull().unique().references(() => registrationsSqlite.id, { onDelete: 'cascade' }),
    eventId: sqliteText('event_id').notNull().references(() => eventsSqlite.id, { onDelete: 'cascade' }),
    userId: sqliteText('user_id').notNull().references(() => usersSqlite.id, { onDelete: 'cascade' }),
    ticketNumber: sqliteText('ticket_number').notNull().unique(),
    secureToken: sqliteText('secure_token').notNull().unique(),
    qrCodeData: sqliteText('qr_code_data').notNull(),
    status: sqliteText('status').notNull().default('active'),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`)
});

const attendanceSqlite = sqliteTable('attendance', {
    id: sqliteText('id').primaryKey(),
    ticketId: sqliteText('ticket_id').notNull().unique().references(() => ticketsSqlite.id, { onDelete: 'cascade' }),
    eventId: sqliteText('event_id').notNull().references(() => eventsSqlite.id, { onDelete: 'cascade' }),
    registrationId: sqliteText('registration_id').notNull().references(() => registrationsSqlite.id, { onDelete: 'cascade' }),
    checkedInBy: sqliteText('checked_in_by').references(() => usersSqlite.id, { onDelete: 'set null' }),
    checkedInAt: sqliteText('checked_in_at').default(sql`CURRENT_TIMESTAMP`),
    status: sqliteText('status').notNull().default('checked_in'),
    deviceInfo: sqliteText('device_info')
});

const eventImagesSqlite = sqliteTable('event_images', {
    id: sqliteText('id').primaryKey(),
    eventId: sqliteText('event_id').notNull().references(() => eventsSqlite.id, { onDelete: 'cascade' }),
    imageUrl: sqliteText('image_url').notNull(),
    caption: sqliteText('caption'),
    uploadedBy: sqliteText('uploaded_by').references(() => usersSqlite.id, { onDelete: 'set null' }),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`)
});

const auditLogsSqlite = sqliteTable('audit_logs', {
    id: sqliteText('id').primaryKey(),
    userId: sqliteText('user_id').references(() => usersSqlite.id, { onDelete: 'set null' }),
    action: sqliteText('action').notNull(),
    entityType: sqliteText('entity_type').notNull(),
    entityId: sqliteText('entity_id'),
    metadata: sqliteText('metadata').default('{}'),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`)
});

const webhookEventsSqlite = sqliteTable('webhook_events', {
    id: sqliteText('id').primaryKey(),
    eventId: sqliteText('event_id').notNull().unique(),
    eventType: sqliteText('event_type').notNull(),
    payload: sqliteText('payload').notNull(),
    processedAt: sqliteText('processed_at').default(sql`CURRENT_TIMESTAMP`)
});

module.exports = {
    // Postgres exports
    usersPg,
    eventsPg,
    registrationsPg,
    paymentsPg,
    ticketsPg,
    attendancePg,
    eventImagesPg,
    auditLogsPg,
    webhookEventsPg,

    // SQLite exports
    usersSqlite,
    eventsSqlite,
    registrationsSqlite,
    paymentsSqlite,
    ticketsSqlite,
    attendanceSqlite,
    eventImagesSqlite,
    auditLogsSqlite,
    webhookEventsSqlite
};
