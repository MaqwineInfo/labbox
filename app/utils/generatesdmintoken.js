const jwt = require('jsonwebtoken');
 
const generateAdminToken = (admin) => {
    const payload = {
        id: admin._id,
        email: admin.email,
        is_main: admin.is_main, 
    };
 
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1d',  
    });
};

module.exports = generateAdminToken;