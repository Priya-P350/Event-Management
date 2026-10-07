const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const dbQuery = require("../config/db");
const { convertToCSV } = require("../utils/csvExport");

async function getDashboardStats(req, res, next) {
  try {
    const stats = await dbQuery.getAdminDashboardStats();
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

async function getAllUsers(req, res, next) {
  try {
    const { search, role } = req.query;
    const users = await dbQuery.getAllUsers({ search, role });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
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
    const validRoles = ['guest', 'scanner_staff', 'event_admin', 'super_admin'];
    const userRole = role && validRoles.includes(role) ? role : 'guest';

    const newUser = {
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password_hash,
      role: userRole
    };

    await dbQuery.createUser(newUser);

    res.status(201).json({
      success: true,
      message: `User '${newUser.name}' (${newUser.role}) created successfully.`,
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

async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role parameter is required.' });
    }

    const updatedUser = await dbQuery.updateUserRole(id, role);
    res.json({
      success: true,
      message: `User role updated to '${role}' successfully.`,
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user && req.user.id === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    await dbQuery.deleteUser(id);
    res.json({ success: true, message: 'User account deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function getAllRegistrations(req, res, next) {
  try {
    const registrations = await dbQuery.getAllRegistrations();
    res.json({ success: true, count: registrations.length, registrations });
  } catch (err) {
    next(err);
  }
}

async function getAllPayments(req, res, next) {
  try {
    const payments = await dbQuery.getAllPayments();
    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    next(err);
  }
}

async function getAllAttendance(req, res, next) {
  try {
    const attendance = await dbQuery.getAllAttendance();
    res.json({ success: true, count: attendance.length, attendance });
  } catch (err) {
    next(err);
  }
}

async function exportRegistrationsCSV(req, res, next) {
  try {
    const registrations = await dbQuery.getAllRegistrations();

    const columns = [
      "registration_number",
      "guest_name",
      "guest_email",
      "guest_phone",
      "event_title",
      "registration_status",
      "created_at",
    ];
    const csvString = convertToCSV(registrations, columns);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="registrations_export.csv"',
    );
    res.status(200).send(csvString);
  } catch (err) {
    next(err);
  }
}

async function exportPaymentsCSV(req, res, next) {
  try {
    const payments = await dbQuery.getAllPayments();

    const columns = [
      "razorpay_order_id",
      "razorpay_payment_id",
      "guest_name",
      "guest_email",
      "event_title",
      "amount",
      "currency",
      "status",
      "paid_at",
    ];
    const csvString = convertToCSV(payments, columns);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="payments_export.csv"',
    );
    res.status(200).send(csvString);
  } catch (err) {
    next(err);
  }
}

async function initiateRefund(req, res, next) {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res
        .status(400)
        .json({ success: false, message: "Payment ID is required." });
    }

    await dbQuery.initiateRefund(paymentId);

    res.json({
      success: true,
      message: "Refund initiated successfully via Razorpay API.",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getAllRegistrations,
  getAllPayments,
  getAllAttendance,
  exportRegistrationsCSV,
  exportPaymentsCSV,
  initiateRefund,
};
