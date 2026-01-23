const express = require('express');
const router = express.Router();

// const users = require('../controllers/users.controllers');
const admin = require('../controllers/admin.controllers');
const benner = require('../controllers/benner.controllers');
const categories = require('../controllers/categories.controller');
const reports = require('../controllers/reports.controllers');
const packages = require('../controllers/packages.controllers');
const address = require('../controllers/address.controllers');
const subpackages = require('../controllers/subpackage.controller');
const dashboard = require('../controllers/dashboard.controllers');
const doctors = require('../controllers/doctors.controllers');
const order = require('../controllers/order.controllers')
const laboratories = require('../controllers/laboratories.controllers');
const patient = require('../controllers/patient.controllers');
const offer = require('../controllers/offer.controllers');  
const user = require('../controllers/users.controllers');
const setting = require('../controllers/setting.controllers');
const upload = require('../middlewares/upload.middleware');
const auth = require('../middlewares/auth.middleware');

// ******* Dashboard Routes ********
router.get('/dashboard/stats', auth , dashboard.getDashboardStats);
router.get('/dashboard/orders', auth , dashboard.getDashboardOrders);  

// Admin Profile Routes
router.get('/settings', auth, dashboard.renderSettings); 
router.post('/dashboard/change-email', auth , dashboard.updateAdminEmail); 
router.get('/dashboard/profile', auth , dashboard.getAdminProfile); 
router.post('/dashboard/change-password', auth , dashboard.updateAdminPassword); 
router.post('/dashboard/logout', auth , dashboard.logoutAdmin);
router.get('/dashboard', auth,  dashboard.dashboard);

// ******* Banner Routes ********
router.get('/banners', auth ,  benner.banners);
router.post('/banners', auth , upload('banners').single('avatar'), benner.createBanner);
router.put('/banners/:id', auth , upload('banners').single('avatar'), benner.updateBanner);
router.patch('/banners/:id/toggle-status', auth , benner.toggleBannerStatus);
router.delete('/banners/:id', auth , benner.deleteBanner); 

// ******* Category Routes ********
router.get('/categories', auth , categories.categories);
router.post('/categories', auth , upload('categories').single('avatar'), categories.createCategory);
router.put('/categories/:id', auth , upload('categories').single('avatar'), categories.updateCategory);
router.patch('/categories/:id/toggle-status', auth , categories.toggleCategoryStatus);
router.delete('/categories/:id', auth , categories.deleteCategory);

// ******* Report Routes ********
 
router.get('/reports', auth, reports.reports);  
router.post('/report/update/:id', auth, upload('reports').single('avatar'), reports.uploadReportFileAdmin);
router.delete('/report/delete/:id', auth, reports.deleteReportAdmin);

// ******* Package Routes ********
router.get('/packages', auth ,  packages.packages);
router.get('/packages/:id', auth ,  packages.getPackageViewAdmin);
router.post('/packages', auth , upload('packages').single('avatar'), packages.createPackage);
router.put('/packages/:id', auth , upload('packages').single('avatar'), packages.updatePackage);
router.get('/packages/view/:id', auth ,  packages.packageViewAdmin);
router.patch('/packages/:id/toggle-status', auth , packages.togglePackageStatus);
router.delete('/packages/:id', auth , packages.deletePackage);

// ******* Additional Package Data Route ******** 

// addBenefit
router.post('/packages/:id/benefits', auth , packages.addBenefit);
router.delete('/packages/:id/benefits/:benefitId', auth , packages.deleteBenefit);

// addCriteria
router.post('/packages/:id/criteria', auth , packages.addCriteria);
router.delete('/packages/:id/criteria/:criteriaId', auth , packages.deleteCriteria);
// addQnA
router.post('/packages/:id/qanda', auth , packages.addQanda);
router.delete('/packages/:id/qanda/:qandaId', auth , packages.deleteQanda);

// ******* Sub-Package Routes ********
// router.get('/sub-packages', auth , subpackages.getAllSubPackagesAdmin);
router.get('/sub-packages', auth, subpackages.subPackages);
router.post('/sub-packages', auth , upload('packages').single('avatar'), subpackages.createSubPackage);
router.put('/sub-packages/:id', auth , upload('packages').single('avatar'), subpackages.updateSubPackage);
router.get('/sub-packages/:id', auth , subpackages.getSubPackageById);
router.delete('/sub-packages/:id', auth , subpackages.deleteSubPackage);
router.patch('/sub-packages/:id/toggle-status', auth , subpackages.toggleSubPackageStatus);
router.get('/sub-packages/:id/packages', auth , subpackages.getSubPackagePackageList);

// ******* Doctor Routes ********
router.get('/doctors', auth , doctors.doctors);
router.post('/doctors', auth , doctors.createDoctor);
router.put('/doctors/:id', auth , doctors.updateDoctor);
router.delete('/doctors/:id', auth , doctors.deleteDoctor);
router.patch('/doctors/:id/toggle-status', auth , doctors.toggleDoctorStatus);

// ******* Address Routes ********
router.get('/addresses', auth, address.addresses);  
router.delete('/addresses/:id', auth, address.deleteAddressAdmin); 
router.patch('/addresses/:id/toggle-status', auth, address.toggleAddressStatusAdmin);

// ******* Order Routes ********
router.get('/orders', auth, order.orders);  
router.get('/orders/:id', auth, order.getOrderViewAdmin);  
router.patch('/orders/:id/confirm', auth, order.confirmOrderAdmin); 
router.patch('/orders/:id/reject', auth, order.rejectOrderAdmin);

// ******* Laboratory Routes ********
router.get('/laboratory', auth, laboratories.laboratory); 
router.get('/laboratory/view/:id', auth, laboratories.viewLaboratory);
 
router.post('/laboratory/add', auth, upload('laboratories').single('logo'), laboratories.createLaboratory);
router.post('/laboratory/update/:id', auth, upload('laboratories').single('logo'), laboratories.updateLaboratory);  
router.delete('/laboratory/delete/:id', auth, laboratories.deleteLaboratory);
router.patch('/laboratory/status/:id', auth, laboratories.toggleLaboratoryStatus); 
 
router.post('/laboratory/add-category', auth, laboratories.addCategoryToLab);
router.delete('/laboratory/delete-category/:id', auth, laboratories.removeCategoryFromLab);
router.post('/laboratory/add-package', auth, laboratories.addPackageToLab);
router.delete('/laboratory/delete-package/:id', auth, laboratories.removePackageFromLab);
 
router.get('/packages/by-category/:categoryId/not-in-lab/:laboratoryId', auth, laboratories.getPackagesForLabDropdown);

// ******* Patient Routes ********
router.get('/patients', auth, patient.patients); 
router.get('/patients/view/:id', auth, patient.viewPatient);
 
router.delete('/patients/delete/:id', auth, patient.deletePatientAdmin);
router.patch('/patients/status/:id', auth, patient.togglePatientStatusAdmin);

// ******* Offer Routes ********
router.get('/offers', auth, offer.offers); 
 
router.post('/offers/add', auth, upload('offers').single('avatar'), offer.createOffer);
router.post('/offers/update/:id', auth, upload('offers').single('avatar'), offer.updateOffer);  
router.delete('/offers/delete/:id', auth, offer.deleteOffer);
router.patch('/offers/status/:id', auth, offer.toggleOfferStatus);  

// ******* User Routes ********
router.get('/users', auth, user.users);  
router.delete('/users/delete/:id', auth, user.deleteUserAdmin);
router.patch('/users/status/:id', auth, user.toggleUserStatusAdmin);

// User Permissions Routes
router.get('/users/:id/permissions', auth, admin.renderUserPermissions);
router.post('/users/:id/permissions', auth, admin.updateUserPermissions);

// ******* Settings Routes ********
router.get('/terms-and-conditions', auth, setting.renderTerms);
router.get('/privacy-policy', auth, setting.renderPolicy);
router.get('/cancellation-policy', auth, setting.renderCancellation);
 
router.post('/settings/terms', auth, setting.updateTerms);  
router.post('/settings/policy', auth, setting.updatePolicy);  
router.post('/settings/cancellation', auth, setting.updateCancellation);

module.exports = router;