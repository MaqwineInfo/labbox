const jwt = require('jsonwebtoken');
 
const generateToken = (user) => { 
    const payload = {
        id: user._id,
        contact_no: user.contact_no,
        status: user.status,
        name: user.name,
        age: user.age,
        gender: user.gender,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d',  
    });
};

module.exports = generateToken;