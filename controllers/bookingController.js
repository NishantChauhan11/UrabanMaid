const Booking = require('../models/Booking');
const Helper = require('../models/Helper');

// Show booking form for a helper
exports.showBookingForm = async (req, res) => {
  try {
    const helper = await Helper.findById(req.params.helperID);
    if (!helper) {
      req.flash('error_msg', 'Helper not found');
      return res.redirect('/category');
    }
    if (helper.availability !== 'available') {
      req.flash('error_msg', 'This helper is currently not available');
      return res.redirect(`/category/${helper.category}`);
    }
    res.render('booking/create', { 
      title: `Book ${helper.name} - UrbanMaid`,
      helper,
      error: null,
      formData: {} // Always send formData (empty on first load)
    });
  } catch (err) {
    console.error('Error loading booking form:', err);
    req.flash('error_msg', 'Error loading booking page');
    return res.redirect('/category');
  }
};

// Create a booking
exports.createBooking = async (req, res) => {
  try {
    const { 
      helperID, 
      bookingDate, 
      startHour, 
      startMinute, 
      ampm, 
      duration, 
      street, 
      area, 
      city, 
      pincode, 
      instructions 
    } = req.body;

    // Validate required fields
    if (!helperID || !bookingDate || !startHour || !startMinute || !ampm || !duration) {
      const helper = await Helper.findById(helperID);
      return res.render('booking/create', {
        helper,
        title: `Book ${helper ? helper.name : ''} - UrbanMaid`,
        error: 'Please fill in all required fields including date, time, and duration',
        formData: req.body // Preserves user's input
      });
    }

    // Validate address fields
    if (!street || !city) {
      const helper = await Helper.findById(helperID);
      return res.render('booking/create', {
        helper,
        title: `Book ${helper ? helper.name : ''} - UrbanMaid`,
        error: 'Please provide at least street address and city',
        formData: req.body
      });
    }

    // Validate time format
    const hourNum = parseInt(startHour);
    const minuteNum = parseInt(startMinute);
    
    if (hourNum < 1 || hourNum > 12 || minuteNum < 0 || minuteNum > 59) {
      const helper = await Helper.findById(helperID);
      return res.render('booking/create', {
        helper,
        title: `Book ${helper ? helper.name : ''} - UrbanMaid`,
        error: 'Please enter a valid time (1-12 hours, 0-59 minutes)',
        formData: req.body
      });
    }

    // Validate pincode if provided
    if (pincode && (!/^\d{6}$/.test(pincode))) {
      const helper = await Helper.findById(helperID);
      return res.render('booking/create', {
        helper,
        title: `Book ${helper ? helper.name : ''} - UrbanMaid`,
        error: 'Pincode must be exactly 6 digits',
        formData: req.body
      });
    }

    const helper = await Helper.findById(helperID);
    if (!helper) {
      req.flash('error_msg', 'Helper not found');
      return res.redirect('/category');
    }
    if (helper.availability !== 'available') {
      req.flash('error_msg', 'This helper is currently not available');
      return res.redirect(`/category/${helper.category}`);
    }

    // Format time for storage (12-hour to 24-hour conversion for consistency)
    let hour24 = parseInt(startHour);
    if (ampm === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (ampm === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const formattedTime = `${hour24.toString().padStart(2, '0')}:${startMinute.padStart(2, '0')}`;
    
    // For display purposes, also store the original 12-hour format
    const displayTime = `${startHour.padStart(2, '0')}:${startMinute.padStart(2, '0')} ${ampm}`;

    const totalAmount = helper.hourlyRate * Number(duration);

    // Create comprehensive address object
    const addressObj = {
      street: street.trim(),
      area: area ? area.trim() : 'Not specified',
      city: city.trim(),
      pincode: pincode ? pincode.trim() : 'Not specified'
    };

    const booking = new Booking({
      userID: req.session.user.id,
      helperID,
      bookingDate: new Date(bookingDate),
      startTime: displayTime, // Store user-friendly format
      startTime24: formattedTime, // Store 24-hour format for internal use
      duration: Number(duration),
      totalAmount,
      status: 'confirmed',
      paymentStatus: 'pending',
      address: addressObj,
      specialInstructions: instructions ? instructions.trim() : ''
    });

    const savedBooking = await booking.save();
    await Helper.findByIdAndUpdate(helperID, { availability: 'busy' });

    console.log(`Booking created: ${savedBooking._id} for ${displayTime} on ${bookingDate}`);
    req.flash('success_msg', 'Booking created successfully!');
    return res.redirect(`/booking/confirmation/${savedBooking._id}`);
  } catch (err) {
    console.error('Error creating booking:', err);
    let helper = null;
    if (req.body.helperID) {
      try {
        helper = await Helper.findById(req.body.helperID);
      } catch (helperError) {
        console.error('Error fetching helper for error page:', helperError);
      }
    }
    return res.render('booking/create', {
      helper,
      title: `Book ${helper ? helper.name : ''} - UrbanMaid`,
      error: 'Failed to create booking. Please check your information and try again.',
      formData: req.body // Always send formData, even on error
    });
  }
};

// Show booking confirmation
exports.showConfirmation = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingID)
      .populate('helperID')
      .populate('userID');

    if (!booking) {
      req.flash('error_msg', 'Booking not found');
      return res.redirect('/');
    }
    if (String(booking.userID._id) !== String(req.session.user.id)) {
      req.flash('error_msg', 'You can only view your own bookings');
      return res.redirect('/');
    }
    if (!booking.helperID) {
      req.flash('error_msg', 'Helper information not available');
      return res.redirect('/');
    }

    const formattedBooking = {
      ...booking.toObject(),
      bookingDate: booking.bookingDate instanceof Date
        ? booking.bookingDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : booking.bookingDate
    };

    return res.render('booking/confirmation', { 
      title: 'Booking Confirmed - UrbanMaid',
      booking: formattedBooking,
      helper: booking.helperID
    });
  } catch (err) {
    console.error('Error loading confirmation:', err);
    req.flash('error_msg', 'Error loading booking confirmation');
    return res.redirect('/');
  }
};

// List logged-in user bookings
exports.listUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userID: req.session.user.id })
      .populate('helperID')
      .sort({ createdAt: -1 });

    // Format booking dates for display
    const formattedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      bookingDate: booking.bookingDate instanceof Date
        ? booking.bookingDate.toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
        : booking.bookingDate
    }));

    return res.render('booking/my-booking', {
      title: 'My Bookings - UrbanMaid',
      bookings: formattedBookings
    });
  } catch (err) {
    console.error('Error loading user bookings:', err);
    req.flash('error_msg', 'Failed to load your bookings');
    return res.redirect('/');
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingID);
    if (!booking) {
      req.flash('error_msg', 'Booking not found');
      return res.redirect('/booking/my-bookings');
    }
    if (String(booking.userID) !== String(req.session.user.id)) {
      req.flash('error_msg', 'You can only cancel your own bookings');
      return res.redirect('/booking/my-bookings');
    }

    // Check if booking can be cancelled (not already cancelled or completed)
    if (booking.status === 'cancelled') {
      req.flash('error_msg', 'This booking is already cancelled');
      return res.redirect('/booking/my-bookings');
    }

    if (booking.status === 'completed') {
      req.flash('error_msg', 'Cannot cancel a completed booking');
      return res.redirect('/booking/my-bookings');
    }

    // Update booking status and make helper available again
    await Booking.findByIdAndUpdate(req.params.bookingID, { 
      status: 'cancelled',
      cancelledAt: new Date()
    });
    await Helper.findByIdAndUpdate(booking.helperID, { availability: 'available' });

    console.log(`Booking cancelled: ${req.params.bookingID}`);
    req.flash('success_msg', 'Booking cancelled successfully');
    return res.redirect('/booking/my-bookings');
  } catch (err) {
    console.error('Error cancelling booking:', err);
    req.flash('error_msg', 'Failed to cancel booking');
    return res.redirect('/booking/my-bookings');
  }
};
