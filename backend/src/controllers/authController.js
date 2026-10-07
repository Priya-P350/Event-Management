const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dbQuery = require('../config/db');
const { jwtSecret } = require('../middleware/auth');

async function register(req, res, next) {
    try {
        const { name, email, phone, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required fields.' });
        }

        const existingUser = await dbQuery.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const userRole = role && ['guest', 'scanner_staff', 'event_admin', 'super_admin'].includes(role) ? role : 'guest';

        const newUser = {
            id: uuidv4(),
            name,
            email: email.toLowerCase(),
            phone: phone || '',
            password_hash,
            role: userRole
        };

        await dbQuery.createUser(newUser);

        const token = jwt.sign(
            { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role
            }
        });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, loginInput, identifier, password } = req.body;
        const userInput = (email || loginInput || identifier || '').trim();

        if (!userInput || !password) {
            return res.status(400).json({ success: false, message: 'Email or phone number and password are required.' });
        }

        const user = await dbQuery.findUserByEmailOrPhone(userInput);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. User account not found.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Logged in successfully.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (err) {
        next(err);
    }
}

async function getMe(req, res, next) {
    try {
        const user = await dbQuery.findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    register,
    login,
    getMe
};
