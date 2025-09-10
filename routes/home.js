const express = require('express');
const router = express.Router();

// Middleware to make session user available in views
router.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// Home page route
router.get('/', (req, res) => {
  res.render('home', {
    title: 'Welcome to UrbanMaid'
  });
});

// About page route
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About UrbanMaid'
  });
});

// Contact page route
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact Us',
    contactInfo: {
      email: 'support@urbanmaid.com',
      phone: '+1 234 567 890',
      address: '123 Urban Maid Street, City, Country'
    }
  });
});

module.exports = router;
