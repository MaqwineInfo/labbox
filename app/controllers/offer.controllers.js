const Offer = require('../models/offer.model');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Helper: Delete file from local storage
const deleteLocalFile = (filePath) => {
    if (!filePath) return;  

    let relativePath = filePath;
    
    if (filePath.startsWith('http')) {
        const splitArr = filePath.split('/uploads/');
        if (splitArr.length > 1) {
            relativePath = `uploads/${splitArr[1]}`;
        }
    }

    const fullPath = path.join(__dirname, '../../', relativePath); 
    
    if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
            if (err) console.error("Error deleting file:", err);
            else console.log("File deleted successfully:", fullPath);
        });
    }
};
  
const getFileUrl = (req, filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;  

    const normalizedPath = filePath.replace(/\\/g, '/');
    return `${req.protocol}://${req.get('host')}/${normalizedPath}`;
};

// Helper function for error responses
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
//                 USER-FACING/PUBLIC API
// =================================================================

// Get all active offers  
exports.getActiveOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ status: 1 });

        if (!offers.length) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: 'No offers found.'
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Offer data retrieved successfully",
            data: offers
        });

    } catch (error) {
        handleError(res, error, "Error fetching active offers");
    }
};

// =================================================================
//                 ADMIN-ONLY API
// ================================================================= 

//  Get all offers with filters  
exports.getAllOffersAdmin = async (req, res) => {
    try {
        const { linked_with, status, page = 1, limit = 10 } = req.query;

        // Base query: status not 2 (deleted)
        const query = { status: { $ne: 2 } };

        if (linked_with) {
            query.linked_with = { $regex: linked_with, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }

        // Pagination
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const offers = await Offer.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);

        const totalDocuments = await Offer.countDocuments(query);

        res.status(200).json({
            code: 200,
            status: true,
            message: "Offers retrieved for admin",
            data: offers,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching admin offers");
    }
};

// Create a new offer
exports.createOffer = async (req, res) => {
    try {
        const { linked_with, from, to } = req.body;
         
        const avatarFile = req.file;

        if (!from || !to) {
            if (avatarFile) deleteLocalFile(`uploads/offers/${avatarFile.filename}`);
            return res.status(400).json({
                code: 400,
                status: false,
                message: "'from' and 'to' dates are required"
            });
        }

        let avatarUrl = null;
        if (avatarFile) { 
            const baseUrl = `${req.protocol}://${req.get('host')}`; 
            avatarUrl = `${baseUrl}/uploads/offers/${avatarFile.filename}`;
        }

        const newOffer = new Offer({
            avatar: avatarUrl, 
            linked_with,
            from,
            to
        });

        await newOffer.save();

        res.status(201).json({
            code: 201,
            status: true,
            message: "Offer created successfully",
            data: newOffer
        });

    } catch (error) {
        if (req.file) deleteLocalFile(`uploads/offers/${req.file.filename}`);
        handleError(res, error, "Error creating offer");
    }
};

//  Update an existing offer
exports.updateOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { linked_with, from, to } = req.body;
         
        const newAvatarFile = req.file;
 
        const offer = await Offer.findById(id);
        if (!offer) {
            if (newAvatarFile) deleteLocalFile(`uploads/offers/${newAvatarFile.filename}`);
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Offer not found"
            });
        }
 
        if (!from || !to) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "'from' and 'to' dates are required"
            });
        }
 
        offer.linked_with = linked_with;
        offer.from = from;
        offer.to = to;
 
        if (newAvatarFile) { 
            if (offer.avatar) {
                deleteLocalFile(offer.avatar);
            }
 
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            offer.avatar = `${baseUrl}/uploads/offers/${newAvatarFile.filename}`;
        }

        await offer.save();

        res.status(200).json({
            code: 200,
            status: true,
            message: "Offer updated successfully",
            data: offer
        });

    } catch (error) {
        if (req.file) deleteLocalFile(`uploads/offers/${req.file.filename}`);
        handleError(res, error, "Error updating offer");
    }
};

//  Soft delete an offer
exports.deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;

        const offer = await Offer.findByIdAndUpdate(
            id,
            { status: 2 }, // 2 = Deleted
            { new: true }
        );

        if (!offer) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Offer not found"
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Offer deleted successfully...!"
        });

    } catch (error) {
        handleError(res, error, "Error deleting offer");
    }
};

//  Toggle offer status between active (1) and inactive (0)
exports.toggleOfferStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findById(id);

        if (!offer) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Offer not found"
            });
        }

        // Toggle only between 0 and 1
        let newStatus;
        if (offer.status === 1) {
            newStatus = 0;
        } else if (offer.status === 0) {
            newStatus = 1;
        } else {
            // Do not change status if it's 2 (deleted)
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Cannot change status of a deleted item"
            });
        }

        offer.status = newStatus;
        await offer.save();

        const message = newStatus === 1 ? 'Offer activated!' : 'Offer deactivated!';
        res.status(200).json({
            code: 200,
            status: true,
            message,
            data: offer
        });

    } catch (error) {
        handleError(res, error, "Error toggling offer status");
    }
};

// Render offers page for admin
exports.offers = async (req, res) => {
    try {
        const { linked_with, status, page = 1, limit = 10 } = req.query;
        const query = { status: { $ne: 2 } };

        if (linked_with) {
            query.linked_with = { $regex: linked_with, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const offersData = await Offer.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);
 
        const totalDocuments = await Offer.countDocuments(query);

        res.render('admin/offers', {
            title: "Offers",
            offer: offersData,  
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
        res.render('admin/offers', {
            title: "Offers",
            offer: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load offers.',
            success: null
        });
    }
};