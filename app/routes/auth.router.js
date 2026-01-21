const express = require('express');
const router = express.Router();

const admin = require('../controllers/admin.controllers');

// ******* Admin Routes ********
router.post('/auth/login', admin.loginAdmin);
router.post('/auth/register', admin.registerAdmin); 
// router.get('/logout', admin.logoutAdmin);

router.get('/admin', admin.signIn);
    
module.exports = router;