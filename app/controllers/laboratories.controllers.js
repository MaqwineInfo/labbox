const Laboratory = require('../models/laboratory.model');
const LaboratoryCategory = require('../models/laboratorycategory.model');
const LaboratoryPackage = require('../models/laboratorypackage.model');
const Category = require('../models/category.model'); 
const Package = require('../models/packages.model');  
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs'); 

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

//  Get all active laboratories
exports.getActiveLabs = async (req, res) => {
    try { 
        const laboratories = await Laboratory.find({ status: 1 });

        if (laboratories.length === 0) {
            return res.status(200).json({  
                code: 200,
                status: false,
                message: 'No Laboratory found'
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Data retrieved successfully...!",
            data: laboratories
        });

    } catch (error) {
        handleError(res, error, "Error fetching active labs");
    }
};

// =================================================================
//                 ADMIN-ONLY API
// ================================================================= 

//  Get all laboratories for admin with filters and pagination
exports.getAllLaboratoriesAdmin = async (req, res) => {
    try {
        const { name, status, page = 1, limit = 10 } = req.query;

        // Base query: status not 2 (deleted)
        const query = { status: { $ne: 2 } };

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }

        // Pagination
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const laboratories = await Laboratory.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);

        // Get total document count for pagination
        const totalDocuments = await Laboratory.countDocuments(query);

        res.status(200).json({
            code: 200,
            status: true,
            message: "Laboratories retrieved for admin",
            data: laboratories,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching admin laboratories");
    }
};

//  Create a new laboratory
exports.createLaboratory = async (req, res) => {
    try {
        const {
            name, owner, contact_1, contact_2, email,
            address_1, address_2, city, state, zipcode
        } = req.body;
          
        const logoFile = req.file; 

        if (!name || !owner || !contact_1 || !email || !address_1 || !city || !state || !zipcode) { 
            if (logoFile) deleteLocalFile(`uploads/laboratories/${logoFile.filename}`);
            return res.status(400).json({ 
                code: 400,
                status: false, 
                message: "Missing required fields" 
            });
        }
         
        if (!logoFile) {
            return res.status(400).json({ code: 400, status: false, message: "Logo is required" });
        }
  
        const baseUrl = `${req.protocol}://${req.get('host')}`; 
        const logoUrl = `${baseUrl}/uploads/laboratories/${logoFile.filename}`;

        const newLaboratory = new Laboratory({
            logo: logoUrl, 
            name, owner, contact_1, contact_2, email,
            address_1, address_2, city, state, zipcode
        });

        await newLaboratory.save();

        res.status(201).json({
            code: 201,
            status: true,
            message: "Laboratory created successfully",
            data: newLaboratory
        });

    } catch (error) {
        if (req.file) deleteLocalFile(`uploads/laboratories/${req.file.filename}`);
        
        if (error.code === 11000) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: `Duplicate key error: ${Object.keys(error.keyValue)[0]} already exists.`
            });
        }
        handleError(res, error, "Error creating laboratory");
    }
};

//  Update an existing laboratory
exports.updateLaboratory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
          
        const newLogoFile = req.file;
 
        const laboratory = await Laboratory.findById(id);
        if (!laboratory) {
            if (newLogoFile) deleteLocalFile(`uploads/laboratories/${newLogoFile.filename}`);
            return res.status(404).json({ 
                code: 404,
                status: false, 
                message: "Laboratory not found" 
            });
        }
   
        delete updateData.logo;
        Object.assign(laboratory, updateData);
   
        if (newLogoFile) { 
            if (laboratory.logo) {
                deleteLocalFile(laboratory.logo);
            }

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            laboratory.logo = `${baseUrl}/uploads/laboratories/${newLogoFile.filename}`;
        }

        await laboratory.save();

        res.status(200).json({
            code: 200,
            status: true,
            message: "Laboratory updated successfully",
            data: laboratory
        });

    } catch (error) { 
        if (req.file) deleteLocalFile(`uploads/laboratories/${req.file.filename}`);

        if (error.code === 11000) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: `Duplicate key error: ${Object.keys(error.keyValue)[0]} already exists.`
            });
        }
        handleError(res, error, "Error updating laboratory");
    }
};

//  Soft delete a laboratory
exports.deleteLaboratory = async (req, res) => {
    try {
        const { id } = req.params;

        const lab = await Laboratory.findByIdAndUpdate(
            id,
            { status: 2 }, // 2 = Deleted
            { new: true }
        );

        if (!lab) {
            return res.status(404).json({ 
                code: 404,
                status: false,
                message: "Laboratory not found" 
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Laboratory deleted successfully!"
        });

    } catch (error) {
        handleError(res, error, "Error deleting laboratory");
    }
};

//  Toggle active/inactive status of a laboratory
exports.toggleLaboratoryStatus = async (req, res) => {  
    try {
        const { id } = req.params;
        const lab = await Laboratory.findById(id);

        if (!lab) {
            return res.status(404).json({ 
                code: 404,
                status: false,
                message: "Laboratory not found"
            });
        }

        // Toggle only between 0 and 1
        let newStatus;
        if (lab.status === 1) {
            newStatus = 0;
        } else if (lab.status === 0) {
            newStatus = 1;
        } else {
            return res.status(400).json({ 
                code: 400,
                status: false,
                message: "Cannot change status of a deleted item"
            }); 
        }

        lab.status = newStatus;
        await lab.save();

        const message = newStatus === 1 ? 'Laboratory activated!' : 'Laboratory deactivated!';
        res.status(200).json({ 
            code: 200,
            status: true,
            message,
            data: lab
        });

    } catch (error) {
        handleError(res, error, "Error toggling laboratory status");
    }
};

// Render laboratory.ejs  
exports.laboratory = async (req, res) => {
    try {
        const { name, status, page = 1, limit = 10 } = req.query;
        const query = { status: { $ne: 2 } };

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const laboratoriesData = await Laboratory.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);

        const totalDocuments = await Laboratory.countDocuments(query);

        res.render('admin/laboratory', {
            title: "Laboratory",
            laboratory: laboratoriesData,  
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
        res.render('admin/laboratory', {
            title: "Laboratory",
            laboratory: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load laboratories.',
            success: null
        });
    }
};

// =================================================================
//      ADMIN LABORATORY VIEW - RELATED DATA
// =================================================================

// Render view-laboratory.ejs
exports.viewLaboratory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.redirect('/admin/laboratory');
        }

        const [laboratory, labCategories, labPackages, allCategories, allPackages] = await Promise.all([
            Laboratory.findById(id),
            LaboratoryCategory.find({ laboratory_id: id, status: 1 }).populate('category_id', 'name'),  
            LaboratoryPackage.find({ laboratory_id: id, status: 1 }).populate('package_id', 'name'), 
            Category.find({ status: 1 }).select('name _id'),  
            Package.find({ status: 1 }).select('name _id')    
        ]);

        if (!laboratory) { 
            return res.redirect('/admin/laboratory');
        } 
        
        // Aa logic barabar chhe
        const linkedCategoryIds = labCategories
            .filter(lc => lc.category_id) 
            .map(lc => lc.category_id._id.toString());
         
        const availableCategories = allCategories.filter(c => !linkedCategoryIds.includes(c._id.toString()));
         
        const linkedPackageIds = labPackages
            .filter(lp => lp.package_id)
            .map(lp => lp.package_id._id.toString());

        const availablePackages = allPackages.filter(p => !linkedPackageIds.includes(p._id.toString()));
 
        res.render('admin/view-laboratory', {
            title: laboratory.name,
            lab: laboratory,  
            labCategories: labCategories,
            labPackages: labPackages, 
            availableCategories: availableCategories,  
            allCategories: allCategories,  
            availablePackages: availablePackages,   
            error: null,
            success: null
        });

    } catch (error) {
        console.error("Error rendering lab view page:", error);
        res.redirect('/admin/laboratory');
    }
};

// 'view-laboratory.ejs'  
exports.getPackagesForLabDropdown = async (req, res) => {
    try {
        const { categoryId, laboratoryId } = req.params;
 
        const labPackages = await LaboratoryPackage.find({ laboratory_id: laboratoryId }).select('package_id');
        const linkedPackageIds = labPackages.map(lp => lp.package_id);
 
        const packages = await Package.find({
            categories_id: new mongoose.Types.ObjectId(categoryId),
            status: 1,
            _id: { $nin: linkedPackageIds }  
        }).select('name');
        
        res.status(200).json(packages); 
    } catch (error) {
        handleError(res, error, "Error fetching packages for lab dropdown");
    }
};

//  Get laboratory details along with linked and available categories/packages
exports.getLaboratoryViewAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const [laboratory, labCategories, labPackages, allCategories, allPackages] = await Promise.all([
            Laboratory.findById(id),
            LaboratoryCategory.find({ laboratory_id: id }).populate('category_id', 'name'),
            LaboratoryPackage.find({ laboratory_id: id }).populate('package_id', 'name'),
            Category.find({ status: 1 }).select('name'),
            Package.find({ status: 1 }).select('name')  
        ]);

        if (!laboratory) {
            return res.status(404).json({ 
                code: 404,
                status: false,
                message: "Laboratory not found"
            });
        }

        // Filter out categories already linked
        const linkedCategoryIds = labCategories.map(lc => lc.category_id._id.toString());
        const otherCategories = allCategories.filter(c => !linkedCategoryIds.includes(c._id.toString()));
        
        // Filter out packages already linked
        const linkedPackageIds = labPackages.map(lp => lp.package_id._id.toString());
        const otherPackages = allPackages.filter(p => !linkedPackageIds.includes(p._id.toString()));


        res.status(200).json({
            code: 200,
            status: true,
            data: {
                laboratory,
                linkedCategories: labCategories,
                linkedPackages: labPackages,
                availableCategories: otherCategories,
                availablePackages: otherPackages  
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching laboratory view data");
    }
};
 
// 
exports.addCategoryToLab = async (req, res) => {
    try {
        const { laboratory_id, category_id } = req.body;
        if (!laboratory_id || !category_id) {
            return res.status(400).json({ 
                code: 400,
                status: false,
                message: "laboratory_id and category_id are required"
            });
        }

        // Check if link already exists
        const existing = await LaboratoryCategory.findOne({ laboratory_id, category_id });
        if (existing) {
            return res.status(400).json({ 
                code: 400,
                status: false,
                message: "This category is already linked to the laboratory"
            });
        }

        const newLink = new LaboratoryCategory({ laboratory_id, category_id });
        await newLink.save();
        await newLink.populate('category_id', 'name');

        res.status(201).json({ 
            code: 201,
            status: true,
            message: "Category added successfully",
            data: newLink
        });
    } catch (error) {
        handleError(res, error, "Error adding category to lab");
    }
};

// Remove a Category from a Laboratory (by link ID)
exports.removeCategoryFromLab = async (req, res) => {
    try {
        const { id } = req.params; 
        const deletedLink = await LaboratoryCategory.findByIdAndDelete(id);

        if (!deletedLink) {
            return res.status(404).json({ 
                code: 404,
                status: false, 
                message: "Link not found" 
            });
        }
        res.status(200).json({ 
            code: 200,
            status: true, 
            message: "Category deleted from the laboratory successfully!" 
        });
    } catch (error) {
        handleError(res, error, "Error removing category from lab");
    }
};

// Packages by Category ID (or all if none provided)
exports.fetchPackagesByCategory = async (req, res) => {
    try {
        const { category_id } = req.query;
        let packages;

        if (category_id && mongoose.Types.ObjectId.isValid(category_id)) { 
            packages = await Package.find({
                categories_id: new mongoose.Types.ObjectId(category_id),
                status: 1
            }).select('name');
        } else { 
            packages = await Package.find({ status: 1 }).select('name');
        }
        res.status(200).json(packages); 
    } catch (error) {
        handleError(res, error, "Error fetching packages");
    }
};

//  Add a Package to a Laboratory
exports.addPackageToLab = async (req, res) => {
    try {
        const { laboratory_id, package_id } = req.body;
        if (!laboratory_id || !package_id) {
            return res.status(400).json({ 
                code: 400,
                status: false,
                message: "laboratory_id and package_id are required"
            });
        }

        // Check if link already exists
        const existing = await LaboratoryPackage.findOne({ laboratory_id, package_id });
        if (existing) {
            return res.status(400).json({ 
                code: 400,
                status: false,
                message: "This package is already linked to the laboratory"
            });
        }

        const newLink = new LaboratoryPackage({ laboratory_id, package_id });
        await newLink.save();
        await newLink.populate('package_id', 'name');

        res.status(201).json({ 
            code: 201,
            status: true,
            message: "Package added successfully",
            data: newLink
        });
    } catch (error) {
        handleError(res, error, "Error adding package to lab");
    }
};

//  Remove a Package from a Laboratory (by link ID)
exports.removePackageFromLab = async (req, res) => {
    try {
        const { id } = req.params; 
        const deletedLink = await LaboratoryPackage.findByIdAndDelete(id);

        if (!deletedLink) {
            return res.status(404).json({ 
                code: 404,
                status: false,
                message: "Link not found"
            });
        }
        res.status(200).json({ 
            code: 200,
            status: true,
            message: "Package deleted from the laboratory successfully!"
        });
    } catch (error) {
        handleError(res, error, "Error removing package from lab");
    }
};
