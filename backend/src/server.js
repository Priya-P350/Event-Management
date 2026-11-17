const path = require('path');
// Ensure .env is always loaded regardless of execution working directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const qrRoutes = require('./routes/qrRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & CORS Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false
}));

app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true
}));

// Capture raw body for webhook signature verification
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ extended: true }));

const dbQuery = require('./config/db');

// Health Check
app.get('/api/health', async (req, res) => {
    const dbStatus = await dbQuery.testConnection();
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'QR Event Management REST API',
        database: dbStatus
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/qr', qrRoutes);

// Global Error Handler
app.use(errorHandler);

function freePort(port) {
    try {
        const { execSync } = require('child_process');
        if (process.platform === 'win32') {
            try {
                const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
                const lines = out.trim().split('\n');
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && pid !== `${process.pid}` && pid !== '0') {
                        try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch (e) {}
                    }
                }
            } catch (netstatErr) {
                // If netstat findstr failed or no process found, fallback to PowerShell
                execSync(`powershell -NoProfile -NonInteractive -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne ${process.pid} } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
            }
        } else {
            execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: 'ignore' });
        }
    } catch (clearErr) {
        // Ignore clearing errors
    }
}

function listenOnPort(port, retries = 3) {
    const server = app.listen(port, async () => {
        console.log(`======================================================`);
        console.log(`🚀 QR Event Management API Server running on port ${port}`);
        console.log(`🔗 Health Check: http://localhost:${port}/api/health`);
        console.log(`======================================================`);
        await dbQuery.testConnection();
    });

    server.on('error', (err) => {
        try { server.close(); } catch (e) {}
        if (err.code === 'EADDRINUSE' && retries > 0) {
            console.warn(`[Server] Port ${port} is occupied. Attempting to free port ${port} (retries left: ${retries})...`);
            freePort(port);
            setTimeout(() => {
                listenOnPort(port, retries - 1);
            }, 600);
        } else if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${port} is currently in use. The backend is already active on http://localhost:${port}`);
            process.exit(1);
        } else {
            console.error('[Server Error]', err);
            process.exit(1);
        }
    });

    // Gracefully handle process termination signals for nodemon
    const shutdown = () => {
        try { server.close(); } catch (e) {}
        process.exit(0);
    };
    process.once('SIGUSR2', shutdown);
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);

    return server;
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection at Promise]', reason);
});

process.on('uncaughtException', (err) => {
    console.error('[Uncaught Exception]', err);
});

if (process.env.NODE_ENV !== 'test') {
    listenOnPort(PORT);
}

module.exports = app;
