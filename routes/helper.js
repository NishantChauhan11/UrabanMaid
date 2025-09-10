const express = require('express');
const router = express.Router();
const Helper = require('../models/Helper');
const multer = require('multer');
const ImageKit = require('imagekit');

// Ensure flash exists (fallback for safety)
router.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  if (!req.flash) {
    req.flash = (type, msg) => console.log(`[FLASH ${type}] ${msg}`);
  }
  next();
});

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Multer setup for image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WEBP images allowed!'), false);
    }
  }
});

// GET - Helper registration form (both /joinashelper and /register show the form)
router.get(['/joinashelper', '/register'], (req, res) => {
  res.render('helper/joinashelper', {
    title: 'Register as Helper - UrbanMaid'
  });
});

// POST - Register helper with optional image upload
router.post('/register', upload.single('profileImage'), async (req, res, next) => {
  try {
    const { name, email, phone, category, skills, experience, area, city, pincode, hourlyRate, description } = req.body;
    const normalizedEmail = email?.trim().toLowerCase() || '';
    const normalizedPhone = phone?.replace(/\D/g, '') || '';

    // Check if helper already exists
    const existingHelper = await Helper.findOne({ email: normalizedEmail });
    if (existingHelper) {
      req.flash('error_msg', 'Helper with this email already exists');
      return res.status(400).redirect('/helper/register');
    }

    let imageURL = 'https://via.placeholder.com/200x200?text=No+Image';

    // Upload image to ImageKit if provided
    if (req.file) {
      try {
        const uploadResponse = await imagekit.upload({
          file: req.file.buffer,
          fileName: `helper_${Date.now()}_${req.file.originalname}`,
          folder: '/helpers/',
        });
        imageURL = uploadResponse.url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        req.flash('error_msg', 'Failed to upload image, proceeding without it.');
      }
    }

    // Create and save helper
    const newHelper = new Helper({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      category,
      skills: skills ? skills.split(',').map(s => s.trim()) : [],
      experience: Number(experience) || 0,
      location: { area, city, pincode },
      hourlyRate: Number(hourlyRate) || 0,
      description,
      imageURL,
      availability: 'available'
    });

    await newHelper.save();

    req.flash('success_msg', 'Helper registration successful! You are now available for bookings.');
    res.redirect('/category');
  } catch (error) {
    console.error('Helper registration error:', error);
    req.flash('error_msg', 'Something went wrong during registration. Please try again.');
    res.redirect('/helper/register');
  }
});

// GET - Helper profile
router.get('/profile/:helperID', async (req, res, next) => {
  try {
    const helper = await Helper.findById(req.params.helperID);
    if (!helper) {
      req.flash('error_msg', 'Helper not found');
      return res.status(404).redirect('/category');
    }
    res.render('helper/profile', {
      title: `${helper.name} - Helper Profile`,
      helper
    });
  } catch (error) {
    console.error('Helper profile error:', error);
    next(error);
  }
});

module.exports = router;
