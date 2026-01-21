const express = require('express');
const router = express.Router();

const users = require('../controllers/users.controllers'); 
const benner = require('../controllers/benner.controllers');
const categories = require('../controllers/categories.controller');
const packages = require('../controllers/packages.controllers');
const subpackages = require('../controllers/subpackage.controller'); 
const doctors = require('../controllers/doctors.controllers');

// ******* User Routes ******** 
router.post('/users', users.loginUser);
router.post('/otp-verify', users.verifyOtp);
router.put('/profile', users.updateProfile);
router.put('/address', users.addAddress);
router.get('/address_list', users.getAddressList);
router.get('/user', users.getUserDetail);

// ******* Banner Routes ********
router.get('/banners/active', benner.getActiveBanners);

// ******* Category Routes ********
router.get('/categories/active', categories.getActiveCategories);

// ******* Package Routes ******** 
router.get('/packages/active', packages.getPackagesByCategory);
router.get('/packages/:id', packages.getPackageDetail);

// ******* Sub-Package Routes ******** 
router.get('/subpackages/active', subpackages.getActiveSubPackages);

// ******* Doctor Routes ********
router.get('/doctors/active', doctors.getActiveDoctors);

module.exports = router;