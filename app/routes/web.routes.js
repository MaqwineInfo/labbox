const express = require('express');
const router = express.Router();
const webController = require('../controllers/web.controllers');
const auth = require('../middlewares/auth.middleware');

// router.get('/', webController.index);  // Home page route
// router.get('/privacy-policy', webController.privacyPolicy);  // Privacy Policy page route
router.get('/', webController.signIn); // Sign in page route
router.get('/sign-up', webController.signUp); // Sign up page route
router.get('/dashboard', auth,  webController.dashboard); // Dashboard page route
router.get('/settings', auth,  webController.settings); // Settings page route
router.get('/orders', auth,  webController.orders); // Orders page route
router.get('/orders/:id', auth,  webController.viewOrder); // View Order page route
router.get('/reports', auth,  webController.reports); // Reports page route
router.get('/patients', auth,  webController.patients); // Patients page route
router.get('/patients/:id', auth,  webController.viewPatient); // View Patient page route
router.get('/addresses', auth,  webController.addresses); // Addresses page route
router.get('/laboratory', auth,  webController.laboratory); // Laboratory page route
router.get('/laboratory/:id', auth,  webController.viewLaboratory); // View Laboratory page route
// router.get('/categories', auth,  webController.categories); // Categories page route
router.get('/packages', auth,  webController.packages); // Packages page route
router.get('/sub-packages', auth,  webController.subPackages); // Sub Packages page route
router.get('/banners', auth,  webController.banners); // Banners page route
router.get('/offers', auth,  webController.offers); // Offers page route
router.get('/doctors', auth,  webController.doctors); // Doctors page route
router.get('/users', auth,  webController.users); // Users page route
router.get('/user-permissions', auth,  webController.userPermissions); // User Permissions page route
router.get('/privacy-policy', auth,  webController.privacyPolicy); // Privacy Policy page route
router.get('/terms-and-conditions', auth,  webController.termsAndConditions); // Terms and Conditions page route
router.get('/cancellation-policy', auth,  webController.cancellationPolicy); // Cancellation Policy page route

module.exports = router;
