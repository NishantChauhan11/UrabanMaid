const express = require('express');
const router = express.Router();
const Helper = require('../models/Helper');

// Make session user available in all views
router.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// Category metadata with icon values set to empty strings
const categories = {
  maid:       { name: 'Maid Services',      icon: '', description: 'Professional house cleaning and maintenance services' },
  cook:       { name: 'Cook Services',      icon: '', description: 'Expert cooking and meal preparation for your family' },
  babysitter: { name: 'Babysitting',        icon: '', description: 'Trusted childcare services for your little ones' },
  cleaner:    { name: 'Deep Cleaning',      icon: '', description: 'Intensive and professional cleaning services for your home' },
  plumber:    { name: 'Plumbing',           icon: '', description: 'Expert plumbing and leak repair services' },
  electrician:{ name: 'Electrician',        icon: '', description: 'Certified professionals for electrical work and repairs' },
  gardener:   { name: 'Gardening',          icon: '', description: 'Professional gardening and landscaping services' },
  driver:     { name: 'Driver Services',    icon: '', description: 'Skilled drivers for daily commutes and travel' }
};

// GET /category - Show all categories
router.get('/', (req, res) => {
  // Convert categories object to array with slugs
  const categoriesArray = Object.keys(categories).map(slug => ({
    slug: slug,
    name: categories[slug].name,
    icon: categories[slug].icon,
    description: categories[slug].description
  }));

  res.render('category/all', {
    title: 'All Categories - UrbanMaid',
    categories: categoriesArray  // Pass as array
  });
});

// GET /category/:categoryName - List helpers by category
router.get('/:categoryName', async (req, res, next) => {
  const { categoryName } = req.params;

  if (!categories[categoryName]) {
    return res.status(404).render('404', { message: 'Category not found' });
  }

  try {
    const helpers = await Helper.find({ category: categoryName });
    res.render('category/list', {
      title: `${categories[categoryName].name} - UrbanMaid`,
      helpers,
      category: categories[categoryName],
      categoryName
    });
  } catch (err) {
    next(err);
  }
});

// GET /category/:categoryName/helper/:helperId - Show helper profile
router.get('/:categoryName/helper/:helperId', async (req, res, next) => {
  const { categoryName, helperId } = req.params;

  if (!categories[categoryName]) {
    return res.status(404).render('404', { message: 'Category not found' });
  }

  try {
    const helper = await Helper.findById(helperId);
    if (!helper) {
      return res.status(404).render('404', { message: 'Helper not found' });
    }

    res.render('category/single', {
      title: `${helper.name} - ${categories[categoryName].name} - UrbanMaid`,
      helper,
      category: categories[categoryName],
      categoryName
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
