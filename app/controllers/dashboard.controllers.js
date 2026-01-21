const Admin = require('../models/admin.model');
const User = require('../models/users.model');
const Category = require('../models/category.model');
const Package = require('../models/packages.model');
const SubPackage = require('../models/subpackage.model');
const Order = require('../models/order.model');  
const Cart = require('../models/cart.model');  

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
 
const handleError = (res, error, message = "Server Error", code = 500) => {
    console.error(message, error);
    res.status(code).json({
        code : 500,
        status: false,
        message,
        error: error.message
    });
};

//  Dashboard Controllers
exports.getDashboardStats = async (req, res) => {
    try { 
        const [
            categoryCount,
            packageCount,
            subPackageCount,
            userCount
        ] = await Promise.all([
            Category.countDocuments({ status: 1 }),
            Package.countDocuments({ status: 1 }),
            SubPackage.countDocuments({ status: 1 }),
            User.countDocuments({ status: 1 })
        ]);

        res.status(200).json({
            code: 200,
            status: true,
            data: {
                categories: categoryCount,
                packages: packageCount,
                subPackages: subPackageCount,
                users: userCount
            }
        });
    } catch (error) {
        handleError(res, error, "Error fetching dashboard stats");
    }
};

// Get today's orders for dashboard with filters and pagination
exports.getDashboardOrders = async (req, res) => {
    try {
        const { user: userName, page = 1, limit = 10 } = req.query; 
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59); 
        const matchStage = {
            date: { $gte: todayStart, $lte: todayEnd },
            status: { $in: [1, 2] } // 1=in_review, 2=order_confirm
        }; 
        const userSearchStage = [];
        if (userName) {
            userSearchStage.push(
                {
                    $lookup: {
                        from: "users", 
                        localField: "patient_id",
                        foreignField: "_id",
                        as: "patientDoc"
                    }
                },
                {
                    $match: { "patientDoc.name": { $regex: userName, $options: 'i' } }
                }
            );
        }
 
        const aggregationPipeline = [ 
            { $match: matchStage }, 
            ...userSearchStage, 
            {
                $lookup: {
                    from: "carts", 
                    localField: "_id",
                    foreignField: "order_id",
                    as: "cartItems"
                }
            }, 
            {
                $lookup: {
                    from: "users", 
                    localField: "patient_id",
                    foreignField: "_id",
                    as: "patientDoc"
                }
            },
            {
                $lookup: {
                    from: "prescriptions",  
                    localField: "prescription_id",
                    foreignField: "_id",
                    as: "prescriptionDoc"
                }
            },
            {
                $lookup: {
                    from: "laboratories", 
                    localField: "laboratory_id",
                    foreignField: "_id",
                    as: "labDoc"
                }
            },
            {
                $lookup: {
                    from: "addresses",  
                    localField: "address_id",
                    foreignField: "_id",
                    as: "addressDoc"
                }
            },
             
            { $unwind: { path: "$patientDoc", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$prescriptionDoc", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$labDoc", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$addressDoc", preserveNullAndEmptyArrays: true } },
 
            {
                $lookup: {
                    from: "packages",
                    localField: "cartItems.package_id",  
                    foreignField: "_id",
                    as: "packageDocs"
                }
            }, 
            {
                $addFields: {
                    user: "$patientDoc.name",
                    contact_no: "$patientDoc.contact_no",
                    prescription_details: "$prescriptionDoc.avatar",
                    laboratory_name: "$labDoc.name",
                    user_address: "$addressDoc.address", 
                    report: {
                        $size: {
                            $filter: {
                                input: "$cartItems",
                                as: "item",
                                cond: { $eq: ["$$item.status", 2] }
                            }
                        }
                    }, 
                    amount: {
                        $sum: {
                            $map: {
                                input: "$packageDocs",
                                as: "pkg",
                                in: {
                                    $let: {
                                        vars: { 
                                            cartItem: {
                                                $arrayElemAt: [
                                                    { $filter: { input: "$cartItems", as: "ci", cond: { $and: [ { $eq: ["$$ci.package_id", "$$pkg._id"] }, { $eq: ["$$ci.status", 2] } ] } } },
                                                    0
                                                ]
                                            }
                                        }, 
                                        in: { $cond: { if: "$$cartItem", then: "$$pkg.dis_price", else: 0 } }
                                    }
                                }
                            }
                        }
                    }
                }
            }, 
            {
                $project: {
                    cartItems: 0,
                    packageDocs: 0,
                    patientDoc: 0,
                    prescriptionDoc: 0,
                    labDoc: 0,
                    addressDoc: 0
                }
            },

            //  Pagination
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) }
        ]; 
        const orders = await Order.aggregate(aggregationPipeline);
 
        const countPipeline = [
            { $match: matchStage },
            ...userSearchStage,
            { $count: "totalDocuments" }
        ];
        const countResult = await Order.aggregate(countPipeline);
        const totalDocuments = countResult[0]?.totalDocuments || 0;

        res.status(200).json({
            code: 200,
            status: true,
            data: orders,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / Number(limit)),
                currentPage: Number(page),
                limit: Number(limit)
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching dashboard orders");
    }
};

//  Admin Profile Controllers
exports.getAdminProfile = async (req, res) => { 
    const admin = await Admin.findById(req.admin.id).select('email status');
    
    if (!admin) {
        return res.status(404).json({ status: false, message: "Admin not found" });
    }

    res.status(200).json({ status: true, data: admin });
};

// Update admin email
exports.updateAdminEmail = async (req, res) => {
    try {
        const { email, currentPassword } = req.body;
        if (!email || !currentPassword) {
            return res.status(400).json({ status: false, message: "Email and currentPassword are required" });
        }

        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ status: false, message: "Admin not found" });
        }
 
        const isMatch = await admin.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ status: false, message: "Current password is incorrect" });
        }
 
        if (email !== admin.email) {
            const emailExists = await Admin.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ status: false, message: "Email is already in use" });
            }
        }
 
        admin.email = email;
        await admin.save();

        res.status(200).json({ 
            status: true, 
            message: "Email updated successfully. Please log in again." 
        });

    } catch (error) {
        handleError(res, error, "Error updating email");
    }
};

// Update admin password
exports.updateAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                code: 400,
                status: false, 
                message: "Current and new passwords are required" 
            });
        }

        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ 
                code: 404,
                status: false,
                message: "Admin not found"
            });
        } 
        const isMatch = await admin.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ 
                code: 401,
                status: false, 
                message: "Current password is incorrect" 
            });
        }
 
        admin.password = newPassword;
        await admin.save();

        res.status(200).json({ 
            code: 200,
            status: true, 
            message: "Password updated successfully." 
        });

    } catch (error) {
        handleError(res, error, "Error updating password");
    }
};

//  Admin Logout
exports.logoutAdmin = async (req, res) => {
    try {  
        const adminId = req.user ? req.user._id : null; 
        req.session.destroy((err) => {
            if (err) {
                 return res.status(500).json({ status: false, message: "Could not destroy session" });
            }
            res.clearCookie('connect.sid'); 
            if (adminId) { 
                Admin.findByIdAndUpdate(adminId, { status: 0 }).catch(e => console.error("Admin status update failed:", e.message)); 
            } 
            res.status(200).json({ 
                code: 200,
                status: true, 
                message: "Logged out successfully",
                redirect: "/admin" 
            });
        });

    } catch (error) {
         console.error("Error logging out:", error);
         res.status(500).json({ 
             code: 500,
             status: false,
             message: "Server error during logout"
         });
    }
};

//  dahsboard page
exports.dashboard = (req, res) => {
    res.render('admin/dashboard', { currentPage: 'dashboard' });
};

// ==========================================================
//            Admin Settings Controllers
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

// Update Admin Email
exports.updateAdminEmail = async (req, res) => {
    try {
        const adminUser = req.user;
        if (!adminUser || !adminUser._id) {
             return res.status(401).json({ status: false, message: "Unauthorized or session expired" });
        } 
        const { email, currentPassword } = req.body;
        const admin = await Admin.findById(adminUser._id);
        
        if (!admin) {
            return res.status(404).json({ status: false, message: "Admin not found" });
        } 
        const isMatch = await admin.matchPassword(currentPassword);
        if (!isMatch) {
             return res.status(401).json({
                code: 401,
                status: false,
                message: "Incorrect current password"  
            });
        } 
        if (email !== admin.email) {
            const emailExists = await Admin.findOne({ email });
            if (emailExists) {
                return res.status(400).json({
                    code: 400,
                    status: false,
                    message: "Email is already in use" 
                });
            }
        } 
        admin.email = email;
        await admin.save(); 
        res.status(200).json({
            code: 200,
            status: true,
            message: "Email updated successfully! Please login again with new email." 
        });

    } catch (error) {
        handleError(res, error, "Error updating email");
    }
};

// Update Admin Password
exports.updateAdminPassword = async (req, res) => {
    try {
        const adminUser = req.user;
        if (!adminUser || !adminUser._id) {
             return res.status(401).json({ status: false, message: "Unauthorized or session expired" });
        }

        const { currentPassword, newPassword } = req.body;
        const admin = await Admin.findById(adminUser._id);

        if (!admin) {
             return res.status(404).json({ status: false, message: "Admin not found" });
        } 

        const isMatch = await admin.matchPassword(currentPassword);
        if (!isMatch) {
             return res.status(401).json({
                code: 401,
                status: false,
                message: "Incorrect current password"  
            });
        } 
        if (newPassword.length < 4) {
             return res.status(400).json({
                code: 400,
                status: false,
                message: "New password must be at least 4 characters" 
            });
        } 
        admin.password = newPassword;
        await admin.save(); 
        res.status(200).json({
            code: 200,
            status: true,
            message: "Password updated successfully." 
        }); 
    } catch (error) {
        handleError(res, error, "Error updating password");
    }
};
