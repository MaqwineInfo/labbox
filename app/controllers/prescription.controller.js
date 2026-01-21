const Prescription = require('../models/prescription.model');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');  
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
//                 USER-FACING/PUBLIC API
// ================================================================= 

//  Upload a prescription and create an order
exports.uploadPrescription = async (req, res) => {
    try { 
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                code: 401,
                status: false,
                message: "Auth token is not found" 
            });
        }
        const main_user_id = req.user.id; 
        const { user_id: patient_user_id, avatar } = req.body;
 
        if (!avatar) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "avatar (prescription image URL) is required"
            });
        }
        if (!patient_user_id) {
            return res.status(400).json({ 
                code: 400,
                status: false,
                message: "user_id (patient ID) is required"
            });
        } 

        const findOdr = await Order.findOne({
            user_id: main_user_id,
            prescription_id: { $ne: null }, 
            status: 0  
        });

        if (findOdr) {
            return res.status(400).json({ 
                code: 400,
                status: false,
                message: 'Prescription already uploaded in cart.'
            });
        }
 
        const newPrescription = new Prescription({
            avatar: avatar,  
            user_id: patient_user_id 
        });
        await newPrescription.save();
 
        const newOrder = new Order({
            user_id: main_user_id,  
            patient_id: patient_user_id,
            prescription_id: newPrescription._id,
            status: 0,
            date: new Date()
        });
        await newOrder.save();
             
        const newCart = new Cart({
            order_id: newOrder._id,
            user_id: main_user_id,
            status: 0  
        });
        await newCart.save();
         
        
        res.status(200).json({
            code: 200,
            status: true,
            message: 'Your order has been successfully placed',
            data: { order_id: newOrder._id }
        });

    } catch (error) {
        handleError(res, error, "Error uploading prescription");
    }
};
 