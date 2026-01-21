const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const User = require('../models/users.model');
const Package = require('../models/packages.model');
const Prescription = require('../models/prescription.model');
const Laboratory = require('../models/laboratory.model');
const Address = require('../models/address.model');
const sendNotification = require('../utils/pushnotification'); // Assumed utility
const mongoose = require('mongoose');

// Helper function for error responses
const handleError = (res, error, message = "Server Error", code = 500) => {
    console.error(message, error);
    res.status(code).json({
        CODE: 500,
        status: false,
        message,
        error: error.message
    });
};

// =================================================================
//                 USER-FACING/PUBLIC API
// ================================================================= 

// Add a package to the cart
exports.addToCart = async (req, res) => {
    try {
        const { package_id, order_id } = req.body;
        const main_user_id = req.user.id;

        if (!package_id) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "package_id is required"
            });
        }

        let findQuery = {
            user_id: main_user_id,
            package_id: package_id,
            status: 1 // 1 = in cart
        };

        if (order_id) {
            findQuery.order_id = order_id;
        }

        const findCart = await Cart.findOne(findQuery);
        if (findCart) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: 'Package already added in cart.'
            });
        }

        const findPack = await Package.findById(package_id);
        if (!findPack) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: 'Package not found'
            });
        }

        let currentOrderId = order_id;

        if (!currentOrderId) {
            const newOrder = new Order({
                package_id: package_id,
                user_id: main_user_id,
                status: 0 // 0 = request/pending
            });
            await newOrder.save();
            currentOrderId = newOrder._id;
        }

        const newCartItem = new Cart({
            order_id: currentOrderId,
            package_id: package_id,
            user_id: main_user_id,
            status: 1 // 1 = in cart
        });
        await newCartItem.save();

        res.status(200).json({
            code: 200,
            status: true,
            message: 'Package Added..!',
            data: { order_id: currentOrderId }
        });

    } catch (error) {
        handleError(res, error, "Error adding to cart");
    }
};

//  View cart items
exports.viewCart = async (req, res) => {
    try {
        const main_user_id = req.user.id;

        const orderData = await Order.findOne({ user_id: main_user_id, status: 0 });

        if (!orderData) {
            return res.status(200).json({
                status: true,
                message: "Cart Data.",
                data: []
            });
        }

        const cartList = await Cart.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(main_user_id),
                    order_id: orderData._id,
                    status: 1 // 1 = in cart
                }
            },
            { $sort: { _id: -1 } },
            { $lookup: { from: 'orders', localField: 'order_id', foreignField: '_id', as: 'order' } },
            { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'packages', localField: 'package_id', foreignField: '_id', as: 'package' } },
            { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'prescriptions', localField: 'order.prescription_id', foreignField: '_id', as: 'prescription' } },
            { $unwind: { path: '$prescription', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    order_id: 1,
                    package_id: 1,
                    user_id: 1,
                    status: 1,
                    package_name: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$package_id", null] }, then: "Prescription Uploaded" },
                                { case: { $eq: ["$order.prescription_id", null] }, then: "$package.name" }
                            ],
                            default: "unknown"
                        }
                    },
                    package_mrp: "$package.mrp",
                    package_dis_price: "$package.dis_price",
                    prescription_id: "$order.prescription_id",
                    prescription_avatar: "$prescription.avatar",
                    discount_percentage: {
                        $cond: {
                            if: { $gt: ["$package.mrp", 0] },
                            then: { $multiply: [{ $floor: { $divide: [{ $multiply: [{ $divide: [{ $subtract: ["$package.mrp", "$package.dis_price"] }, "$package.mrp"] }, 100] }, 5] } }, 5] },
                            else: 0
                        }
                    },
                    report_for: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$package_id", null] }, then: "prescription" },
                                { case: { $eq: ["$order.prescription_id", null] }, then: "package" }
                            ],
                            default: "unknown"
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            code: 200,
            status: true,
            message: "Cart Data.",
            data: cartList
        });

    } catch (error) {
        handleError(res, error, "Error viewing cart");
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { cart_id } = req.body;
        const main_user_id = req.user.id;

        if (!cart_id) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "cart_id is required"
            });
        }

        const cartItem = await Cart.findOneAndUpdate(
            {
                _id: cart_id,
                user_id: main_user_id,
                status: 1 // 1 = in cart
            },
            { $set: { status: 0 } }, // 0 = removed
            { new: true }
        );

        if (!cartItem) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Item not found in cart."
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Item removed from cart."
        });

    } catch (error) {
        handleError(res, error, "Error removing from cart");
    }
};

//  Confirm an order
exports.confirmOrder = async (req, res) => {
    try {
        const { lab_id, order_id, patient_id, address_id } = req.body;
        const main_user_id = req.user.id;

        if (!lab_id || !order_id || !patient_id || !address_id) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "lab_id, order_id, patient_id, and address_id are required"
            });
        }

        const order = await Order.findOne({
            _id: order_id,
            user_id: main_user_id
        });

        if (!order) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Item not found in your cart. Please check and try again."
            });
        }

        if (order.status !== 0) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Your order is already in progress. Thank you for your patience!"
            });
        }
 
        const cartData = await Cart.find({ order_id: order_id, status: 1 });
        if (cartData.length === 0) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "No active items in your cart for this order."
            });
        } 
        const odrStatus = order.prescription_id ? 2 : 1;
 
        await Order.updateOne(
            { _id: order_id },
            {
                patient_id: patient_id,  
                address_id: address_id,
                laboratory_id: lab_id,
                status: odrStatus,
                date: new Date()
            }
        );
 
        await Cart.updateMany(
            { order_id: order_id, status: 1 },
            { $set: { patient_id: patient_id, status: 2 } }  
        );
 
        const user = await User.findById(main_user_id).select('device_token');
        if (user && user.device_token) {
            if (order.prescription_id) {
                sendNotification(
                    user.device_token,
                    'Prescription Uploaded Successfully!📄✅',
                    'Our lab assistant will get in touch with you shortly for further assistance.'
                );
            } else {
                sendNotification(
                    user.device_token,
                    'Sample Collection Scheduled!🧪📅',
                    'Your test is booked. Our Flebo will arrive soon. Thank you!'
                );
            }
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Test booked successfully! Our Flebo will arrive soon for sample collection. Thank you!"
        });

    } catch (error) {
        handleError(res, error, "Error confirming order");
    }
};

//  Get "My Orders" list (in-progress orders)
exports.getMyOrders = async (req, res) => {
    try {
        const main_user_id = req.user.id;
 
        const patientUsers = await User.find({ parent_id: main_user_id }).select('_id');
        const patientIds = patientUsers.map(u => u._id);
        patientIds.push(new mongoose.Types.ObjectId(main_user_id)); 
 
        const orders = await Order.aggregate([
            {
                $match: {
                    patient_id: { $in: patientIds },
                    status: { $nin: [0, 5] }  
                }
            },
            { $sort: { _id: -1 } },
            { $lookup: { from: 'users', localField: 'patient_id', foreignField: '_id', as: 'patient' } },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'packages', localField: 'package_id', foreignField: '_id', as: 'package' } },
            { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'prescriptions', localField: 'prescription_id', foreignField: '_id', as: 'prescription' } },
            { $unwind: { path: '$prescription', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'laboratories', localField: 'laboratory_id', foreignField: '_id', as: 'laboratory' } },
            { $unwind: { path: '$laboratory', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1, status: 1, date: 1, reason: 1,
                    user_name: '$patient.name',
                    user_age: '$patient.age',
                    user_relation: '$patient.relation',
                    user_gender: '$patient.gender',
                    package_name: { $ifNull: ["$package.name", "Prescription Uploaded"] },
                    prescription_details: '$prescription.avatar',
                    laboratory_name: '$laboratory.name',
                    status_name: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", 0] }, then: "Request" },
                                { case: { $eq: ["$status", 1] }, then: "In review" },
                                { case: { $eq: ["$status", 2] }, then: "Order confirm" },
                                { case: { $eq: ["$status", 3] }, then: "Sample Collected" },
                                { case: { $eq: ["$status", 4] }, then: "In progress" },
                                { case: { $eq: ["$status", 5] }, then: "Report Generated" },
                                { case: { $eq: ["$status", 6] }, then: "Reject" }
                            ],
                            default: "Unknown"
                        }
                    },
                    status_color: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", 0] }, then: "FFC700" },
                                { case: { $eq: ["$status", 1] }, then: "293845" },
                                { case: { $eq: ["$status", 2] }, then: "007822" },
                                { case: { $eq: ["$status", 3] }, then: "C80048" },
                                { case: { $eq: ["$status", 4] }, then: "4E31FF" },
                                { case: { $eq: ["$status", 5] }, then: "36A692" },
                                { case: { $eq: ["$status", 6] }, then: "FF0000" }
                            ],
                            default: "FF0000"
                        }
                    }
                }
            }
        ]);
 
        for (const order of orders) {
            order.cart = await Cart.aggregate([
                { $match: { order_id: order._id, status: 2 } },  
                { $lookup: { from: 'packages', localField: 'package_id', foreignField: '_id', as: 'package' } },
                { $unwind: '$package' },
                {
                    $project: {
                        _id: 1, package_id: 1,
                        package_name: '$package.name',
                        package_mrp: '$package.mrp',
                        package_dis_price: '$package.dis_price',
                        discount_percentage: {
                            $cond: {
                                if: { $gt: ["$package.mrp", 0] },
                                then: { $multiply: [{ $floor: { $divide: [{ $multiply: [{ $divide: [{ $subtract: ["$package.mrp", "$package.dis_price"] }, "$package.mrp"] }, 100] }, 5] } }, 5] },
                                else: 0
                            }
                        }
                    }
                }
            ]);
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Data retrieved successfully...!",
            data: orders
        });

    } catch (error) {
        handleError(res, error, "Error getting my orders");
    }
};
 
// Get "My Reports" list
exports.getMyReports = async (req, res) => {
    try {
        const main_user_id = req.user.id;
 
        const patientUsers = await User.find({ parent_id: main_user_id }).select('_id');
        const patientIds = patientUsers.map(u => u._id);
        patientIds.push(new mongoose.Types.ObjectId(main_user_id));  
 
        const orders = await Order.aggregate([
            {
                $match: {
                    patient_id: { $in: patientIds },
                    status: 5  
                }
            },
            { $sort: { _id: -1 } },
            { $lookup: { from: 'users', localField: 'patient_id', foreignField: '_id', as: 'patient' } },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'packages', localField: 'package_id', foreignField: '_id', as: 'package' } },
            { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'prescriptions', localField: 'prescription_id', foreignField: '_id', as: 'prescription' } },
            { $unwind: { path: '$prescription', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'laboratories', localField: 'laboratory_id', foreignField: '_id', as: 'laboratory' } },
            { $unwind: { path: '$laboratory', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1, status: 1, date: 1, reason: 1, avatar: 1,
                    user_name: '$patient.name',
                    user_age: '$patient.age',
                    user_relation: '$patient.relation',
                    user_gender: '$patient.gender',
                    package_name: { $ifNull: ["$package.name", "Prescription Uploaded"] },
                    prescription_details: '$prescription.avatar',
                    laboratory_name: '$laboratory.name'
                }
            }
        ]);

        res.status(200).json({
            code: 200,
            status: true,
            message: "Data retrieved successfully...!",
            data: orders
        });

    } catch (error) {
        handleError(res, error, "Error getting my reports");
    }
};

//  Get users who have uploaded prescriptions
exports.getPrescriptionUsers = async (req, res) => {
    try {
        const main_user_id = req.user.id;
 
        const patientUsers = await User.find({ parent_id: main_user_id }).select('_id');
        const patientIds = patientUsers.map(u => u._id);
        patientIds.push(new mongoose.Types.ObjectId(main_user_id));
 
        const prescriptions = await Prescription.find({ user_id: { $in: patientIds } }).select('user_id');
        const userIdsWithPrescriptions = [...new Set(prescriptions.map(p => p.user_id))];
 
        const users = await User.find({ _id: { $in: userIdsWithPrescriptions } });

        res.status(200).json({
            code: 200,
            status: true,
            message: "Data retrieved successfully...!",
            data: users
        });

    } catch (error) {
        handleError(res, error, "Error getting prescription users");
    }
}; 