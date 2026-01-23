const Banner = require('../models/benner.model');    
const fs = require('fs');
const path = require('path');

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
        code,
        status: false,
        message,
        error: error.message
    });
};

// =================================================================
//                 USER-FACING/PUBLIC API
// =================================================================

//Get all active banners
exports.getActiveBanners = async (req, res) => {
    try {
        // Find banners that are active (status: 1)
        const banners = await Banner.find({ status: 1 });

        if (!banners || banners.length === 0) {
            return res.status(404).json({
                code : 404,
                status: false,
                message: "No banners found."
            });
        }

        res.status(200).json({
            code : 200,
            status: true,
            message: 'Banners data retrieved successfully',
            data: banners
        });

    } catch (error) {
        handleError(res, error, "Error fetching banners");
    }
};

// =================================================================
//                 ADMIN-ONLY API
// =================================================================  

// Get all banners with admin filters and pagination
exports.getAllBannersAdmin = async (req, res) => {
    try {
        const { linked_with, status, page = 1, limit = 10 } = req.query;
 
        const query = { status: { $ne: 2 } }; 

        if (linked_with) { 
            query.linked_with = { $regex: linked_with, $options: 'i' };
        }

        if (status && status !== 'all') {
            query.status = Number(status);
        }

        // Pagination logic
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const banners = await Banner.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);
 
        const totalDocuments = await Banner.countDocuments(query);
        
        res.status(200).json({
            code : 200,
            status: true,
            message: "Banners retrieved for admin",
            data: banners,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching admin banners");
    }
};
 
// Create a new banner
exports.createBanner = async (req, res) => {
    try {
        const { linked_with, from, to } = req.body;
        const avatarFile = req.file; 

        if (!from || !to) {
            return res.status(400).json({ code: 400, status: false, message: "From and To dates are required" });
        }

        if (new Date(to) < new Date(from)) {
            return res.status(400).json({ code: 400, status: false, message: "To date must be after From date" });
        }

        let avatarPath = null;
        if (avatarFile) { 
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            avatarPath = `${baseUrl}/uploads/banners/${avatarFile.filename}`;
        }

        const newBanner = new Banner({
            avatar: avatarPath, 
            linked_with: linked_with || null,
            from,
            to
        });

        await newBanner.save();

        res.status(201).json({
            code: 201,
            status: true,
            message: "Banner created successfully",
            data: newBanner
        });

    } catch (error) {
        if (req.file) deleteLocalFile(`uploads/banners/${req.file.filename}`);
        handleError(res, error, "Error creating banner");
    }
};

// Update Banner
exports.updateBanner = async (req, res) => {
    try {
        const { id } = req.params; 
        const { linked_with, from, to, status } = req.body;
        const newAvatarFile = req.file; 

        const banner = await Banner.findById(id);

        if (!banner) return res.status(404).json({ code : 404, status: false, message: "Banner not found" });
        
        if (from && to && new Date(to) < new Date(from)) {
             return res.status(400).json({ code : 400, status: false, message: "To date must be after From date" });
        }
  
        if (newAvatarFile) {  
            if (banner.avatar) deleteLocalFile(banner.avatar);
 
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            banner.avatar = `${baseUrl}/uploads/banners/${newAvatarFile.filename}`;
        }
 
        banner.linked_with = linked_with !== undefined ? linked_with : banner.linked_with;
        banner.from = from || banner.from;
        banner.to = to || banner.to;
        banner.status = status !== undefined ? status : banner.status;

        await banner.save();

        res.status(200).json({
            code : 200,
            status: true,
            message: "Banner updated successfully",
            data: banner
        });

    } catch (error) {
        handleError(res, error, "Error updating banner");
    }
};

// Soft delete a banner
exports.deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findByIdAndUpdate(
            id,
            { status: 2 }, // 2 = Deleted
            { new: true }
        );

        if (!banner) {
            return res.status(404).json({ 
                code : 404,
                status: false, 
                message: "Banner not found" 
            });
        }

        res.status(200).json({
            code : 200,
            status: true,
            message: "Banner deleted successfully (soft delete)"
        });

    } catch (error) {
        handleError(res, error, "Error deleting banner");
    }
};

// Toggle banner status between active (1) and inactive (0)
exports.toggleBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ 
                code : 404,
                status: false, 
                message: "Banner not found" 
            });
        }

        // Toggle only between 0 and 1. If it's 2 (deleted), do nothing.
        if (banner.status === 0 || banner.status === 1) {
            banner.status = banner.status === 1 ? 0 : 1; // Toggle
            await banner.save();
        }

        const message = banner.status === 1 ? 'Banner activated!' : 'Banner deactivated!';
        
        res.status(200).json({
            code : 200,
            status: true,
            message,
            data: banner
        });

    } catch (error) {
        handleError(res, error, "Error toggling banner status");
    }
};

exports.banners = async (req, res) => {
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
 
        const banners = await Banner.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);
 
        const totalDocuments = await Banner.countDocuments(query);
         
        res.render('admin/banners', {  
            benner: banners,  
            query: req.query,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }, 
            error: req.flash ? req.flash('error') : null,
            success: req.flash ? req.flash('success') : null
        });

    } catch (error) {
        console.error("Error rendering banners page:", error);
        res.render('admin/banners', {
            benner: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load banners.',
            success: null
        });
    }
};