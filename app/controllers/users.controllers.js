const User = require('../models/users.model');
const Admin = require('../models/admin.model');
const Address = require('../models/address.model');
const Order = require('../models/order.model');
const generateToken = require('../utils/generatetoken');
const sendNotification = require('../utils/pushnotification');

// =================================================================
//                 USER-FACING/PUBLIC API
// =================================================================

// Login or Register User
exports.loginUser = async (req, res) => {
    try {
        const { contact_no, device_token } = req.body;
        console.log("Login Request Body:", req.body);

        if (!contact_no || !device_token) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Contact number and device token are required.",
            });
        }

        // Static OTP  
        const otp = "123216";

        let user = await User.findOne({ contact_no });
        let is_first_login = false;
        let message;

        if (user) {
            user.otp = otp;
            user.device_token = device_token;
            await user.save();

            message = user.is_verify
                ? "Login successful."
                : "User not verified. Please verify your contact number.";

            is_first_login = false;
        } else {
            user = new User({
                contact_no,
                otp,
                device_token,
                is_user: "1",
            });
            await user.save();

            user.parent_id = user._id;
            await user.save();

            is_first_login = true;
            message = "User registered successfully. Please verify OTP.";
        }

        if (device_token) {
            sendNotification(
                device_token,
                "Welcome to Labbox!",
                `Your verification OTP is: ${otp}.`
            );
        }

        // Generate Token
        const token = generateToken(user);

        return res.status(200).json({
            code: 200,
            status: true,
            message,
            otp,
            token,
            is_first_login,
            is_verify: user.is_verify,
        });

    } catch (error) {
        console.error("Login Error:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Contact number already exists.",
                error: error.message,
            });
        }
        return res.status(500).json({
            code: 500,
            status: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// Verify OTP for user
exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!req.user || !req.user.contact_no) {
            return res.status(401).json({ status: false, message: "Auth token is not found or invalid" });
        }

        const contactNo = req.user.contact_no;

        if (!otp) {
            return res.status(400).json({ status: false, message: "OTP is required" });
        }

        const user = await User.findOne({ contact_no: contactNo });

        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        if (user.otp === Number(otp)) {
            user.is_verify = true;
            user.otp = null;
            await user.save();

            return res.status(200).json({
                code: 200,
                status: true,
                message: "Your contact number verified successfully ..!",
                is_verify: true
            });
        } else {
            return res.status(401).json({ status: false, message: "wrong otp" });
        }

    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ status: false, message: "Server Error", error: error.message });
    }
};

// Update profile for the logged-in user or their patients
exports.updateProfile = async (req, res) => {
    try {
        const { id, name, age, relation, gender, doctor_id } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ status: false, message: "Auth token is not found or invalid" });
        }
        const parentId = req.user.id;

        if (!id) {
            return res.status(400).json({ status: false, message: "Profile ID (id) is required" });
        }

        const userToUpdate = await User.findById(id);

        if (!userToUpdate) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        if (userToUpdate.parent_id && userToUpdate.parent_id.toString() !== parentId) {
            if (userToUpdate._id.toString() !== parentId) {
                return res.status(403).json({ status: false, message: "Not authorized to update this profile" });
            }
        }

        // Update fields
        userToUpdate.name = name || userToUpdate.name;
        userToUpdate.age = age || userToUpdate.age;
        userToUpdate.relation = relation || userToUpdate.relation;
        userToUpdate.gender = gender || userToUpdate.gender;
        userToUpdate.doctor_id = doctor_id || null;
        userToUpdate.parent_id = parentId;
        userToUpdate.is_user = "1";

        const updatedUser = await userToUpdate.save();

        const token = generateToken(updatedUser);

        res.status(200).json({
            status: true,
            message: "Your profile was updated successfully!",
            token: token
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ status: false, message: "Server Error", error: error.message });
    }
};

// Add address for the logged-in user
exports.addAddress = async (req, res) => {
    try {
        const { address, save_as, lat, long } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ status: false, message: "Auth token is not found or invalid" });
        }
        const userId = req.user.id;

        if (!address || !save_as) {
            return res.status(400).json({ status: false, message: "Address and Save As fields are required" });
        }

        const newAddress = new Address({
            user_id: userId,
            address,
            save_as,
            lat: lat || "",
            long: long || ""
        });

        const savedAddress = await newAddress.save();

        res.status(200).json({
            status: true,
            message: 'Your address added successfully!',
            data: savedAddress
        });

    } catch (error) {
        console.error("Add Address Error:", error);
        res.status(500).json({ status: false, message: "Server Error", error: error.message });
    }
};

// Get address list for the logged-in user and their patients
exports.getAddressList = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                code: 401,
                status: false,
                message: "Auth token is not found or invalid"
            });
        }
        const parentId = req.user.id;

        const patients = await User.find({ parent_id: parentId }).select('_id');

        const patientIds = patients.map(p => p._id);

        patientIds.push(parentId);

        const addresses = await Address.find({ user_id: { $in: patientIds } });

        res.status(200).json({
            code: 200,
            status: true,
            message: "Address list retrieved successfully ...!",
            data: addresses
        });

    } catch (error) {
        console.error("Get Address List Error:", error);
        res.status(500).json({ status: false, message: "Server Error", error: error.message });
    }
};

// Get user details along with pending order status
exports.getUserDetail = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                code: 401,
                status: false,
                message: "Auth token is not found or invalid"
            });
        }
        const userId = req.user.id;

        const user = await User.findById(userId).lean();

        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        const pendingOrder = await Order.findOne({ user_id: userId, status: 0 }).select('_id');

        user.is_order = pendingOrder ? pendingOrder._id : null;

        res.status(200).json({
            code: 200,
            status: true,
            message: "User retrieved successfully ...!",
            data: user
        });

    } catch (error) {
        console.error("Get User Detail Error:", error);
        res.status(500).json({ status: false, message: "Server Error", error: error.message });
    }
};

// =================================================================
//                 ADMIN-ONLY API
// ================================================================= 

// Render users.ejs  
exports.users = async (req, res) => {
    try {
        const { email, status, page = 1, limit = 10 } = req.query;
        const query = { status: { $ne: 2 } };

        if (email) {
            query.email = { $regex: email, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const adminsData = await Admin.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);

        const totalDocuments = await Admin.countDocuments(query);

        res.render('admin/users', {
            title: "Registered Users",
            users: adminsData,
            query: req.query,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            },
            error: null,
            success: null
        });

    } catch (error) {
        res.render('admin/users', {
            title: "Registered Users",
            users: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load users.',
            success: null
        });
    }
};

//  Soft delete an admin user
exports.deleteUserAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findByIdAndUpdate(id, { status: 2 }, { new: true });

        if (!admin) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            code: 200,
            status: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            status: false,
            message: "Server Error", error: error.message
        });
    }
};

//  Toggle admin user status
exports.toggleUserStatusAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findById(id);

        if (!admin) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "User not found"
            });
        }

        let newStatus;
        if (admin.status === 1) newStatus = 0;
        else if (admin.status === 0) newStatus = 1;
        else {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Cannot change status of a deleted item"
            });
        }

        admin.status = newStatus;
        await admin.save();

        const message = newStatus === 1 ? 'User activated!' : 'User deactivated!';
        res.status(200).json({ status: true, message });
    } catch (error) {
        res.status(500).json({
            code: 500,
            status: false,
            message: "Server Error", error: error.message
        });
    }
};