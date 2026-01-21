const Sample = require('../models/sample.model');
const User = require('../models/users.model');
const Address = require('../models/address.model');
const Order = require('../models/order.model');
const Package = require('../models/packages.model');
const Laboratory = require('../models/laboratory.model');
const mongoose = require('mongoose');

const handleError = (res, error, message = "Server Error", code = 500) => {
    console.error(message, error);
    res.status(code).json({
        code: 500,
        status: false,
        message,
        error: error.message
    });
};

// =================================================================
//                 "FLABO" (Phlebotomist) API
// ================================================================= 

//  Get user details for Flabo
exports.getUserDetailsForFlabo = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "A valid user ID is required"
            });
        }

        const userId = new mongoose.Types.ObjectId(id);

        const [user, addresses, orders] = await Promise.all([
            User.findById(userId).lean(),
            Address.find({ user_id: userId }).lean(),
            Order.find({ user_id: userId }).lean()
        ]);

        if (!user) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "User not found"
            });
        }
 
        const packageIds = [...new Set(orders.map(o => o.package_id).filter(Boolean))];
        const labIds = [...new Set(orders.map(o => o.laboratory_id).filter(Boolean))];
 
        const [packages, laboratories] = await Promise.all([
            Package.find({ '_id': { $in: packageIds } }).lean(),
            Laboratory.find({ '_id': { $in: labIds } }).lean()
        ]);

        res.status(200).json({
            code: 200,
            status: true,
            message: "Data retrieved successfully...!",
            data: {
                id: id,
                User: user,  
                Address: addresses,
                Package: packages,
                lab: laboratories
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching user details");
    }
};

//  Upload a sample
exports.uploadSample = async (req, res) => {
    try {
        const { user_id, sample1, sample2, sample3 } = req.body;
 
        if (!user_id || !sample1 || !sample2 || !sample3) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "user_id, sample1, sample2, and sample3 are all required."
            });
        }
 
        const newSample = new Sample({
            user_id: user_id,
            sample1: sample1,
            sample2: sample2,
            sample3: sample3,
            status: 1  
        });

        await newSample.save();

        res.status(200).json({
            code: 200,
            status: true,
            message: 'Sample created successfully',
            data: newSample
        });

    } catch (error) {
        handleError(res, error, "Error creating sample");
    }
};
 