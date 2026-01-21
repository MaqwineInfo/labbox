const Admin = require('../models/admin.model');
const bcrypt = require('bcryptjs');
const generateAdminToken = require('../utils/generatesdmintoken');

// register admin
exports.registerAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Please provide both email and password"
            });
        }

        if (password.length < 4) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Password must be at least 4 characters long"
            });
        }

        const adminExists = await Admin.findOne({ email });

        if (adminExists) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Admin with this email already exists"
            });
        }

        const admin = new Admin({
            email: email.toLowerCase(),
            password: password,
        });

        await admin.save();

        res.status(201).json({
            code: 201,
            status: true,
            message: "Admin registered successfully. Please login."
        });

    } catch (error) {
        console.error("Register Admin Error:", error);
        res.status(500).json({
            code: 500,
            status: false,
            message: "Server Error",
            error: error.message
        });
    }
};

// login admin
exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("login attempt:", req.body);

        if (!email || !password) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Please provide both email and password"
            });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        console.log("found admin:", admin);

        if (!admin) {
            return res.status(401).json({
                code: 401,
                status: false,
                message: "Invalid email or password"
            });
        }

        const isMatch = await admin.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                code: 401,
                status: false,
                message: "Invalid email or password"
            });
        }

        if (admin.email === 'admin@gmail.com') {
            const superAdminPermissions = {
                status: 1,
                patient_read: 1,
                patient_delete: 1,
                lab_add: 1,
                lab_read: 1,
                lab_update: 1,
                lab_delete: 1,
                cate_add: 1,
                cate_read: 1,
                cate_update: 1,
                cate_delete: 1,
                pack_add: 1,
                pack_read: 1,
                pack_update: 1,
                pack_delete: 1,
                sub_add: 1,
                sub_read: 1,
                sub_update: 1,
                sub_delete: 1,
                banner_add: 1,
                banner_read: 1,
                banner_update: 1,
                banner_delete: 1,
                offer_add: 1,
                offer_read: 1,
                offer_update: 1,
                offer_delete: 1,
                order_read: 1,
                order_update: 1,
                report_read: 1,
                report_update: 1,
                report_delete: 1,
                doctor_add: 1,
                doctor_read: 1,
                doctor_update: 1,
                doctor_delete: 1,
                is_main: 1,
            };

            Object.assign(admin, superAdminPermissions);
            await admin.save();
        }

        const token = generateAdminToken(admin);
        req.session.token = token;
        res.status(200).json({
            code: 200,
            status: true,
            message: "Login successful",
            token: token,
            admin: {
                id: admin._id,
                email: admin.email,
                is_main: admin.is_main,
            },
            redirectUrl: "/admin/dashboard"
        });

    } catch (error) {
        console.error("Login Admin Error:", error);
        res.status(500).json({
            code: 500,
            status: false,
            message: "Server Error",
            error: error.message
        });
    }
};

// GET - Sign In page
exports.signIn = (req, res) => {
    res.render('auth/signin', {
        title: "Sign In",
        error: null,
        success: null,
        errors: {},
        old: {}
    });
};


// ==========================================================
//                  SETTINGS CONTROLLERS
// ==========================================================

// Render Settings Page
exports.renderSettings = async (req, res) => {
    try {
        const admin = req.user;

        res.render('admin/settings', {
            title: "Settings",
            admin: admin,
            error: null,
            success: null
        });
    } catch (error) {
        console.error("Render Settings Error:", error);
        res.redirect('/admin/dashboard');
    }
};

// Change Email Logic
exports.changeEmail = async (req, res) => {
    try {
        const { email, currentPassword } = req.body;
        const admin = req.user;

        const isMatch = await admin.matchPassword(currentPassword);
        if (!isMatch) {
            return res.render('admin/settings', {
                title: "Settings",
                admin: admin,
                error: "Incorrect current password",
                success: null
            });
        }
        const emailExists = await Admin.findOne({ email: email.toLowerCase() });
        if (emailExists && emailExists._id.toString() !== admin._id.toString()) {
            return res.render('admin/settings', {
                title: "Settings",
                admin: admin,
                error: "This email is already registered",
                success: null
            });
        }
        admin.email = email.toLowerCase();
        await admin.save();
        res.render('admin/settings', {
            title: "Settings",
            admin: admin,
            error: null,
            success: "Email updated successfully!"
        });
    } catch (error) {
        console.error("Change Email Error:", error);
        res.render('admin/settings', {
            title: "Settings",
            admin: req.user,
            error: "An error occurred while updating email",
            success: null
        });
    }
};

// Change Password Logic
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.user._id);

        const isMatch = await admin.matchPassword(currentPassword);
        if (!isMatch) {
            return res.render('admin/settings', {
                title: "Settings",
                admin: admin,
                error: "Incorrect current password",
                success: null
            });
        }

        if (newPassword.length < 4) {
            return res.render('admin/settings', {
                title: "Settings",
                admin: admin,
                error: "New password must be at least 4 characters",
                success: null
            });
        }

        admin.password = newPassword;
        await admin.save();

        res.render('admin/settings', {
            title: "Settings",
            admin: admin,
            error: null,
            success: "Password updated successfully!"
        });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.render('admin/settings', {
            title: "Settings",
            admin: req.user,
            error: "An error occurred while updating password",
            success: null
        });
    }
};

// ==========================================================
//           USER MANAGEMENT (ADMIN PERMISSIONS)
// ==========================================================

// Render User Permission Page
exports.renderUserPermissions = async (req, res) => {
    try {
        const adminId = req.params.id;

        // User data (permissions and email) fetch karo
        const user = await Admin.findById(adminId);

        if (!user) {
            return res.render('admin/users', {
                title: "Users",
                users: [],
                error: "User not found."
            });
        }

        // Permission object create karo jethi EJS ma use thai shake
        const permission = user.toObject();

        res.render('admin/user-permissions', {
            title: `Permissions for ${user.email}`,
            user: user,
            permission: permission, // Aahiya badha fields direct pass kari didha
            error: null,
            success: null
        });

    } catch (error) {
        console.error("Render Permissions Error:", error);
        res.render('admin/users', {
            title: "Users",
            users: [],
            error: "Failed to load user permissions."
        });
    }
};

// Update User Permissions
exports.updateUserPermissions = async (req, res) => {
    try {
        const adminId = req.params.id;
        const updates = req.body;

        const user = await Admin.findById(adminId);
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const zeroPermissions = {};
        for (const key in user.toObject()) {
            if (typeof user[key] === 'number' && (key.endsWith('_read') || key.endsWith('_add') || key.endsWith('_update') || key.endsWith('_delete'))) {
                zeroPermissions[key] = 0;
            }
        }

        Object.assign(user, zeroPermissions);
        for (const key in updates) {
            if (user.schema.path(key) && (updates[key] === 1 || updates[key] === '1')) {
                user[key] = 1;
            }
        }

        await user.save();
        res.status(200).json({
            status: true,
            message: `Permissions updated successfully for ${user.email}`,
            redirectUrl: "/admin/users"
        });

    } catch (error) {
        handleError(res, error, "Permissions update failed due to server error.", 500);
    }
};