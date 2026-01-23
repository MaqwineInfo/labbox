const Order = require('../models/order.model');
const User = require('../models/users.model');
const Cart = require('../models/cart.model');  
const Laboratory = require('../models/laboratory.model');  
const Package = require('../models/packages.model');  
const Prescription = require('../models/prescription.model'); 
const Address = require('../models/address.model');  
const sendNotification = require('../utils/pushnotification');  
const mongoose = require('mongoose');

// Helper function for error responses
const handleError = (res, error, message = "Server Error", code = 500) => {
    console.error(message, error);
    res.status(code).json({
        code : 500,
        status: false,
        message,
        error: error.message
    });
};

// =================================================================
//                 ADMIN-ONLY API
// =================================================================

// Get all orders for admin with filters and pagination (EJS Render)
exports.orders = async (req, res) => {
    try {
        const { user: userName, status, page = 1, limit = 10 } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
 
        const matchStage = {
            status: { $ne: 5 }, 
            is_delete: 0
        };
        if (status && status !== 'all') {
            matchStage.status = Number(status);
        }
        let pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users', 
                    localField: 'patient_id',  
                    foreignField: '_id',
                    as: 'patient'
                }
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'laboratories',
                    localField: 'laboratory_id',
                    foreignField: '_id',
                    as: 'laboratory'
                }
            },
            { $unwind: { path: '$laboratory', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'packages',  
                    localField: 'package_id',
                    foreignField: '_id',
                    as: 'package'
                }
            },
            { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'addresses',
                    localField: 'address_id',
                    foreignField: '_id',
                    as: 'address'
                }
            },
            { $unwind: { path: '$address', preserveNullAndEmptyArrays: true } },
             
            {
                $match: {
                    'patient.name': userName ? { $regex: userName, $options: 'i' } : { $exists: true }
                }
            },
            
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNum },
            {
                $project: { 
                    user: '$patient.name',
                    package_name: { $ifNull: [ "$package.name", "Prescription" ] }, 
                    laboratory_name: '$laboratory.name',
                    user_address: '$address.address', 
                    status: 1,
                    date: 1
                }
            }
        ];
         
        const ordersData = await Order.aggregate(pipeline);

        const totalDocuments = await Order.countDocuments(matchStage);
         
        res.render('admin/orders', {
            title: "Orders",
            orders: ordersData,  
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
        console.error("Error rendering orders page:", error);
        res.render('admin/orders', {
            title: "Orders",
            orders: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load orders.',
            success: null
        });
    }
};

//  Get all orders for admin with filters and pagination
exports.getAllOrdersAdmin = async (req, res) => {
    try {
        const { user: userName, status, page = 1, limit = 10 } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
 
        const matchStage = {
            status: { $ne: 5 },
            is_delete: 0
        };
        if (status && status !== 'all') {
            matchStage.status = Number(status);
        }
 
        let pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users', 
                    localField: 'patient_id',  
                    foreignField: '_id',
                    as: 'patient'
                }
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'laboratories',
                    localField: 'laboratory_id',
                    foreignField: '_id',
                    as: 'laboratory'
                }
            },
            { $unwind: { path: '$laboratory', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'prescriptions',
                    localField: 'prescription_id',
                    foreignField: '_id',
                    as: 'prescription'
                }
            },
            { $unwind: { path: '$prescription', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'addresses',
                    localField: 'address_id',
                    foreignField: '_id',
                    as: 'address'
                }
            },
            { $unwind: { path: '$address', preserveNullAndEmptyArrays: true } },
            {
                $project: { 
                    user: '$patient.name',
                    package_id: 1,  
                    prescription_details: '$prescription.avatar',
                    laboratory_name: '$laboratory.name',
                    user_address: '$address.address', 
                    status: 1,
                    date: 1,
                    price: 1,
                    reason: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ];
 
        if (userName) {
            pipeline.push({
                $match: {
                    user: { $regex: userName, $options: 'i' }
                }
            });
        }
         
        pipeline.push({ $sort: { createdAt: -1 } });
 
        const [result] = await Order.aggregate([
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limitNum },
                        ...pipeline 
                    ],
                    metadata: [
                        { $match: matchStage }, 
                        { $count: 'totalDocuments' }
                    ]
                }
            }
        ]);

        const data = result.data;
        const totalDocuments = result.metadata[0]?.totalDocuments || 0;
        
        res.status(200).json({
            code: 200,
            status: true,
            message: "Orders retrieved successfully",
            data: data,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching admin orders");
    }
};

//  Confirm/Advance order status (Admin)
exports.confirmOrderAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id).populate('patient_id', 'device_token');

        if (!order) {
            return res.status(404).json({
                code: 404,
                status: false, 
                message: "Order not found" 
            });
        }

        const userToken = order.patient_id?.device_token;
        let newStatus = order.status;
        let notificationMessage = '';

        switch (order.status) {
            case 0: 
            case 1:  
                newStatus = 2; 
                notificationMessage = 'Your order has been confirmed.';
                break;
            case 2:  
                newStatus = 3; 
                notificationMessage = 'On the way to collect sample.';
                break;
            case 3: 
                newStatus = 4;  
                notificationMessage = 'Your report is in progress.';
                break;
            case 4:  
                newStatus = 5;  
                notificationMessage = 'Your report process to generate.';
                break;
            default:
                return res.status(400).json({ 
                    code: 400,
                    status: false, 
                    message: "Order is already completed or in an invalid state."
                 });
        }

        order.status = newStatus;
        await order.save();
 
        if (userToken && notificationMessage) {
            await sendNotification(userToken, 'Order Status Updated', notificationMessage);
        }

        res.status(200).json({ 
            code: 200,
            status: true,
            message: "Report moved successfully!", 
            data: order
         });

    } catch (error) {
        handleError(res, error, "Error confirming order");
    }
};

//  Reject an order (Admin)
exports.rejectOrderAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ 
                code: 400,
                status: false, 
                message: "Reason is required"
            });
        }

        const order = await Order.findById(id).populate('patient_id', 'device_token');

        if (!order) {
            return res.status(404).json({ 
                code: 404,
                status: false,
                message: "Order not found" 
            });
        }

        order.status = 6;  
        order.reason = reason;
        await order.save();
         
        const userToken = order.patient_id?.device_token;
        if (userToken) {
            await sendNotification(userToken, 'Order Rejected', `Your order has been rejected. Reason: ${reason}`);
        }

        res.status(200).json({ 
            code: 200,
            status: true, 
            message: "Report rejected successfully!",
            data: order
        });

    } catch (error) {
        handleError(res, error, "Error rejecting order");
    }
};

//  Get detailed order view for admin 
exports.getOrderViewAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { 
            return res.render('admin/orders', {
                 title: "Orders", orders: [], query: {}, pagination: null, error: 'Invalid Order ID', success: null 
            });
        }
        
        const orderData = await Order.findById(id);

        if (!orderData) {
            return res.render('admin/orders', {
                 title: "Orders", orders: [], query: {}, pagination: null, error: 'Order not found', success: null 
            });
        }
 
        const parentUserId = orderData.patient_id;

        if (!parentUserId || !mongoose.Types.ObjectId.isValid(parentUserId)) {
             return res.render('admin/view-orders', {
                title: "Order Details",
                order: {},
                error: "Order has an invalid patient ID.",
                success: null
            });
        }
  
        const [labData, parentUser, cartData] = await Promise.all([
            Laboratory.findById(orderData.laboratory_id),
            User.findById(parentUserId), 
            Cart.aggregate([
                {
                    $match: {
                        user_id: new mongoose.Types.ObjectId(parentUserId),
                        order_id: new mongoose.Types.ObjectId(id),
                        status: 2
                    }
                },
                { $lookup: { from: 'packages', localField: 'package_id', foreignField: '_id', as: 'package' } },
                { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: 'orders', localField: 'order_id', foreignField: '_id', as: 'order' } },
                { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: 'prescriptions', localField: 'order.prescription_id', foreignField: '_id', as: 'prescription' } },
                { $unwind: { path: '$prescription', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        status: 1, 
                        package_name: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$package", null] }, then: "Prescription Uploaded" },
                                    { case: { $eq: ["$order.prescription_id", null] }, then: "$package.name" }
                                ],
                                default: "unknown"
                            }
                        }, 
                        package_mrp: "$package.mrp",
                        package_dis_price: "$package.dis_price",
                        prescription_id: "$order.prescription_id", 
                        prescription_details: "$prescription.avatar",
                        discount_percentage: {
                            $cond: {
                                if: { $gt: ["$package.mrp", 0] },
                                then: { $multiply: [{ $floor: { $divide: [{ $multiply: [{ $divide: [{ $subtract: ["$package.mrp", "$package.dis_price"] }, "$package.mrp"] }, 100] }, 5] } }, 5] },
                                else: 0
                            }
                        }
                    }
                },
                { $sort: { _id: -1 } }
            ])
        ]); 

        const formattedOrder = {
            _id: orderData._id,
            id: orderData._id,
            status: orderData.status,
            date: orderData.date,
            prescription_id: orderData.prescription_id,  
             
            patient: parentUser ? {
                name: parentUser.name,
                contact_no: parentUser.contact_no, 
                age: parentUser.age,
                relation: parentUser.relation,
                gender: parentUser.gender
            } : null,
 
            lab: labData ? {
                name: labData.name,
                contact: labData.contact_1 || labData.contact,
                email: labData.email,
                address_1: labData.address_1
            } : null,
 
            items: cartData || [] 
        };
 
        res.render('admin/view-orders', {
            title: "Order Details",
            order: formattedOrder,  
            error: null,
            success: null
        });

    } catch (error) {
        console.error("Error showing order details:", error);
        res.render('admin/view-orders', {
            title: "Order Details",
            order: {},
            error: "Server Error: Failed to load order details.",
            success: null
        });
    }
};


// =================================================================
//                 "FLABO" (Phlebotomist) API
// ================================================================= 

//  Get all flabo requests
exports.getFlaboRequests = async (req, res) => {
    try {
        const orders = await Order.aggregate([
            { $match: { status: { $in: [0, 1] } } },
            { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'packages', localField: 'package_id', foreignField: '_id', as: 'package' } },
            { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'prescriptions', localField: 'prescription_id', foreignField: '_id', as: 'prescription' } },
            { $unwind: { path: '$prescription', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'laboratories', localField: 'laboratory_id', foreignField: '_id', as: 'laboratory' } },
            { $unwind: { path: '$laboratory', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1, status: 1, date: 1, price: 1, reason: 1,
                    user_name: '$user.name',
                    package_name: '$package.name',
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
        handleError(res, error, "Error fetching flabo requests");
    }
};

//   Accept/Advance an order (Flabo)
exports.acceptOrderFlabo = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Order not found!"
            });
        }

        let newStatus = order.status;

        switch (order.status) {
            case 0:
            case 1:
                newStatus = 2;
                break;
            case 2:
                newStatus = 3;
                break;
            case 3:
                newStatus = 4;
                break;
            case 4:
                newStatus = 5;
                break;
            default:
                 return res.status(400).json({ 
                    code: 400,
                    status: false,
                    message: "Order is already completed or in an invalid state."
                });
        }

        order.status = newStatus;
        await order.save();

        res.status(200).json({ 
            code: 200,
            status: true,
            message: "Report moved successfully!",
            data: order
        });

    } catch (error) {
        handleError(res, error, "Error accepting order");
    }
};

//  Reject an order (Flabo)
exports.rejectOrderFlabo = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ 
                code : 400,
                status: false, 
                message: "Reason is required"
            });
        }

        const order = await Order.findByIdAndUpdate(id, 
            { status: 6, reason: reason }, 
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ 
                code: 404,
                status: false,
                message: "Order not found"
            });
        }

        res.status(200).json({ 
            status: true, 
            message: "Report rejected!", 
            data: order 
        });

    } catch (error) {
        handleError(res, error, "Error rejecting order");
    }
};

//  Get flabo history by date
exports.getFlaboHistory = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ 
                code: 400,
                status: false, 
                message: "Date query parameter is required" 
            });
        }

        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const orders = await Order.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate } } },
            { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'packages', localField: 'package_id', foreignField: '_id', as: 'package' } },
            { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'prescriptions', localField: 'prescription_id', foreignField: '_id', as: 'prescription' } },
            { $unwind: { path: '$prescription', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'laboratories', localField: 'laboratory_id', foreignField: '_id', as: 'laboratory' } },
            { $unwind: { path: '$laboratory', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1, status: 1, date: 1, price: 1, reason: 1,
                    user_name: '$user.name',
                    package_name: '$package.name',
                    prescription_details: '$prescription.avatar',
                    laboratory_name: '$laboratory.name'
                }
            }
        ]);

        if (orders.length === 0) {
            return res.status(404).json({ 
                status: false, 
                message: "Data not found" 
            });
        }

        res.status(200).json({ 
            code: 200,
            status: true, 
            message: "Data retrieved successfully...!", 
            data: orders 
        });

    } catch (error) {
        handleError(res, error, "Error fetching flabo history");
    }
};
   