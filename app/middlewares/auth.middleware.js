const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');

const authMiddleware = async (req, res, next) => {
    let token;

    if (req.session.token) {
        token = req.session.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
            token = req.headers.authorization.split(' ')[1];
        } catch (err) {
            console.error('Error parsing auth header');
            return res.status(401).json({ 
                code : 401,
                status: false, 
                message: 'Not authorized, token malformed' 
            });
        }
    }

    if (!token) {
        if (req.accepts('json') && !req.accepts('html')) {
            return res.status(401).json({ 
                code : 401,
                status: false, 
                message: 'Not authorized, no token' 
            });
        }
        return res.redirect('/admin');
    }

    if (!process.env.JWT_SECRET) {
        console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
        return res.status(500).send('Server configuration error.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Admin.findById(decoded.id).select('-password');

        if (!user) {
            if (req.accepts('json') && !req.accepts('html')) {
                return res.status(401).json({ 
                    code : 401,
                    status: false, 
                    message: 'Not authorized, user not found' 
                });
            }
            req.session.destroy(() => {
                res.clearCookie('connect.sid');
                return res.redirect('/admin');
            });
            return;
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('JWT verification failed:', err.message);

        if (req.accepts('json') && !req.accepts('html')) {
            return res.status(401).json({ 
                code : 401,
                status: false, 
                message: 'Not authorized, token failed or expired' 
            });
        }
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            return res.redirect('/admin');
        });
    }
};

module.exports = authMiddleware;