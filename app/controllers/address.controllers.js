const Address = require('../models/address.model');
const mongoose = require('mongoose');

// Helper function for error responses
const handleError = (res, error, message = "Server Error", code = 500) => {
    console.error(message, error);
    res.status(code).json({
        status: false,
        message,
        error: error.message
    });
};

// =================================================================
//                 ADMIN-ONLY API
// ================================================================= 

// Render addresses page for admin with filters and pagination
exports.addresses = async (req, res) => {
    try { 
        const { search, status, page = 1, limit = 10 } = req.query;

        const query = { status: { $ne: 2 } }; // 2 = Deleted  

        if (search) {
            query.address = { $regex: search, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
 
        const addressesData = await Address.find(query)
            .populate('user_id', 'name contact_no')  
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);

        const totalDocuments = await Address.countDocuments(query);
 
        res.render('admin/addresses', {
            title: "Addresses",
            addresses: addressesData,  
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
        console.error("Error rendering addresses page:", error);
        res.render('admin/addresses', {
            title: "Addresses",
            addresses: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load addresses.',
            success: null
        });
    }
};

//  Get all addresses for admin with filters and pagination
exports.getAllAddressesAdmin = async (req, res) => {
    try {
        const { address, status, page = 1, limit = 10 } = req.query;

        // status not 2 (deleted)
        const query = { status: { $ne: 2 } };

        if (address) {
            query.address = { $regex: address, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }

        // Pagination
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const addresses = await Address.find(query)
            .populate('user_id', 'name contact_no')
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);

        const totalDocuments = await Address.countDocuments(query);

        res.status(200).json({
            code: 200,
            status: true,
            message: "Addresses retrieved for admin",
            data: addresses,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching admin addresses");
    }
};

// delete address (soft delete by setting status to 2)
exports.deleteAddressAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const address = await Address.findByIdAndUpdate(
            id,
            { status: 2 }, // 2 = Deleted
            { new: true }
        );

        if (!address) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Address not found"
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Address deleted successfully...!"
        });

    } catch (error) {
        handleError(res, error, "Error deleting address");
    }
};

//  toggle address status (active/inactive)
exports.toggleAddressStatusAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const address = await Address.findById(id);

        if (!address) {
            return res.status(404).json({ 
                code : 404,
                status: false, 
                message: "Address not found"
            });
        }

        // Toggle only between 0 and 1
        let newStatus;
        if (address.status === 1) {
            newStatus = 0;
        } else if (address.status === 0) {
            newStatus = 1;
        } else {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Cannot change status of a deleted item"
            });
        }

        address.status = newStatus;
        await address.save();

        const message = newStatus === 1 ? 'Address activated!' : 'Address deactivated!';
        res.status(200).json({
            code: 200,
            status: true,
            message, 
            data: address });

    } catch (error) {
        handleError(res, error, "Error toggling address status");
    }
};