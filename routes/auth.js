const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware: make user available in all EJS templates
router.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Middleware: check if user is authenticated
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/auth/login');
}

// Middleware: check if user is a guest
function requireGuest(req, res, next) {
  if (!req.session.user) return next();
  res.redirect('/');
}

// ================= AUTH ROUTES ================= //

// GET - Login page
router.get('/login', requireGuest, (req, res) => {
  res.render('auth/login', { title: 'Login - UrbanMaid' });
});

// POST - Login user
router.post('/login', requireGuest, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    // Save session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.flash('success_msg', `Welcome back, ${user.name || user.email}!`);
    res.redirect('/');
  } catch (err) {
    console.error('🚨 Login error:', err);
    req.flash('error_msg', 'Something went wrong. Please try again.');
    res.redirect('/auth/login');
  }
});

// GET - Register page
router.get('/register', requireGuest, (req, res) => {
  res.render('auth/register', { title: 'Register - UrbanMaid' });
});

// POST - Register user
router.post('/register', requireGuest, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // Check passwords
    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect('/auth/register');
    }

    // Check if email exists
    if (await User.findOne({ email })) {
      req.flash('error_msg', 'User with this email already exists');
      return res.redirect('/auth/register');
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role: role || 'user',
    });
    await newUser.save();

    req.flash('success_msg', 'Registration successful! Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('🚨 Registration error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      req.flash('error_msg', messages.join('. '));
    } else {
      req.flash('error_msg', 'Something went wrong. Please try again.');
    }
    res.redirect('/auth/register');
  }
});

// LOGOUT (GET and POST)
async function handleLogout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error('🚨 Logout error:', err);
      req.flash('error_msg', 'Error logging out');
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
}
router.get('/logout', requireAuth, handleLogout);
router.post('/logout', requireAuth, handleLogout);

module.exports = router;
