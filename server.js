const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
require('dotenv').config();

const app = express();

// Log environment variables for debugging
console.log('🔧 Environment Variables:', {
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI ? 'Found' : 'Missing',
  SESSION_SECRET: process.env.SESSION_SECRET ? 'Found' : 'Missing',
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY ? 'Found' : 'Missing',
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY ? 'Found' : 'Missing',
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT ? 'Found' : 'Missing',
});

// Import routers
const homeRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/category');
const bookingRoutes = require('./routes/booking');
const helperRoutes = require('./routes/helper');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Sessions & flash messages
if (!process.env.SESSION_SECRET) {
  console.error('❌ SESSION_SECRET missing in .env');
  process.exit(1);
}
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // For production, set secure: true when using HTTPS!
}));
app.use(flash());

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Make user and flash available to views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// EJS templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route registration
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use('/category', categoryRoutes);
app.use('/booking', bookingRoutes);
app.use('/helper', helperRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 UrbanMaid server running on port ${port}`);
  console.log(`🌍 Open http://localhost:${port} in your browser`);
});
