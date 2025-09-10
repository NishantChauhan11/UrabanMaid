const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Middleware to expose user to views
router.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  req.flash('error_msg', 'Please log in first');
  return res.redirect('/auth/login');
}

// Show booking form for a helper
router.get('/create/:helperID', requireAuth, async (req, res, next) => {
  try {
    // Call controller function to show booking form
    await bookingController.showBookingForm(req, res, next);
  } catch (err) {
    console.error('Error showing booking form:', err);
    req.flash('error_msg', 'Error loading booking form');
    res.redirect('/category');
  }
});

// Create a booking (POST) - Main booking submission
router.post('/create', requireAuth, async (req, res, next) => {
  try {
    await bookingController.createBooking(req, res, next);
  } catch (err) {
    console.error('Error creating booking:', err);
    req.flash('error_msg', 'Error processing your booking. Please try again.');
    res.redirect('back');
  }
});

// Alternative route for direct booking creation with helper ID
router.post('/create/:helperID', requireAuth, async (req, res, next) => {
  try {
    req.params.helperID = req.params.helperID; // Ensure helperID is available
    await bookingController.createBooking(req, res, next);
  } catch (err) {
    console.error('Error creating booking:', err);
    req.flash('error_msg', 'Error processing your booking. Please try again.');
    res.redirect(`/helper/profile/${req.params.helperID}`);
  }
});

// Show booking confirmation page
router.get('/confirmation/:bookingID', requireAuth, async (req, res, next) => {
  try {
    await bookingController.showConfirmation(req, res, next);
  } catch (err) {
    console.error('Error showing confirmation:', err);
    req.flash('error_msg', 'Booking confirmation not found');
    res.redirect('/booking/my-bookings');
  }
});

// Alternative confirmation route without ID (for immediate post-booking)
router.get('/confirmation', requireAuth, async (req, res, next) => {
  try {
    // If no specific booking ID, show latest user booking
    await bookingController.showLatestConfirmation(req, res, next);
  } catch (err) {
    console.error('Error showing latest confirmation:', err);
    req.flash('error_msg', 'No recent booking found');
    res.redirect('/booking/my-bookings');
  }
});

// List logged-in user bookings
router.get('/my-bookings', requireAuth, async (req, res, next) => {
  try {
    await bookingController.listUserBookings(req, res, next);
  } catch (err) {
    console.error('Error listing user bookings:', err);
    req.flash('error_msg', 'Error loading your bookings');
    res.redirect('/category');
  }
});

// Cancel a booking
router.post('/cancel/:bookingID', requireAuth, async (req, res, next) => {
  try {
    await bookingController.cancelBooking(req, res, next);
  } catch (err) {
    console.error('Error canceling booking:', err);
    req.flash('error_msg', 'Error canceling booking');
    res.redirect('/booking/my-bookings');
  }
});

// Update booking status (for admin or helper)
router.post('/update-status/:bookingID', requireAuth, async (req, res, next) => {
  try {
    await bookingController.updateBookingStatus(req, res, next);
  } catch (err) {
    console.error('Error updating booking status:', err);
    req.flash('error_msg', 'Error updating booking status');
    res.redirect('back');
  }
});

module.exports = router;
