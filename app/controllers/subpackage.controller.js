const SubPackage = require('../models/subpackage.model');
const Package = require('../models/packages.model');
const Category = require('../models/category.model');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Helper: Delete file from local storage
const deleteLocalFile = (filePath) => {
    if (!filePath) return;  

    let relativePath = filePath;
  
    // જો DB માં Full URL હોય, તો તેને Relative Path માં કન્વર્ટ કરો
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

// ================================================================
//                 USER-FACING/PUBLIC API
// =================================================================

//   Get all active sub-packages
exports.getActiveSubPackages = async (req, res) => {
    try {
        const subPackages = await SubPackage.find({ status: 1 });

        res.status(200).json({
            code: 200,
            status: true,
            message: 'Data retrieved successfully...!',
            data: subPackages
        });

    } catch (error) {
        handleError(res, error, "Error fetching active sub-packages");
    }
};

// =================================================================
//                 ADMIN-ONLY API
// ================================================================= 

// Get all sub-packages with filters  
exports.getAllSubPackagesAdmin = async (req, res) => {
    try {
        const { name, status, category: categoryID, package: packageID, page = 1, limit = 10 } = req.query;

        const query = { status: { $ne: 2 } };

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }
        if (packageID && mongoose.Types.ObjectId.isValid(packageID)) {
            query.packages_id = { $in: [new mongoose.Types.ObjectId(packageID)] };
        }
        else if (categoryID && mongoose.Types.ObjectId.isValid(categoryID)) {

            const packages = await Package.find({
                categories_id: new mongoose.Types.ObjectId(categoryID),
                status: 1
            }).select('_id');

            const packageIds = packages.map(p => p._id);

            if (packageIds.length > 0) {
                query.packages_id = { $in: packageIds };
            } else {
                query.packages_id = { $in: [] };
            }
        }

        // Pagination
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const subPackages = await SubPackage.find(query)
            .populate('packages_id', 'name')
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);

        const totalDocuments = await SubPackage.countDocuments(query);

        const [allCategories, allPackages] = await Promise.all([
            Category.find({ status: 1 }).select('name'),
            Package.find({ status: 1 }).select('name')
        ]);

        res.status(200).json({
            code: 200,
            status: true,
            message: "Sub-packages retrieved for admin",
            data: subPackages,
            filters: {
                categories: allCategories,
                packages: allPackages
            },
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching admin sub-packages");
    }
};

// Render sub-packages page with filters and pagination 
exports.subPackages = async (req, res) => {
    try {
        const { name, status, category: categoryID, package: packageID, page = 1, limit = 10 } = req.query;
        const query = { status: { $ne: 2 } };  

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        } 
        if (packageID && mongoose.Types.ObjectId.isValid(packageID)) {
            query.packages_id = { $in: [new mongoose.Types.ObjectId(packageID)] };
        }  
        else if (categoryID && mongoose.Types.ObjectId.isValid(categoryID)) {
            const packages = await Package.find({ 
                categories_id: new mongoose.Types.ObjectId(categoryID), 
                status: 1 
            }).select('_id');
            const packageIds = packages.map(p => p._id);
            query.packages_id = { $in: packageIds.length > 0 ? packageIds : [] };
        } 

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
 
        const [subPackagesData, allCategories, allPackagesData] = await Promise.all([
            SubPackage.find(query)
                .populate({ path: 'packages_id', select: 'name' })  
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip(skip),
            Category.find({ status: 1 }).select('name _id'),
            Package.find({ status: 1 }).select('name _id')
        ]);
 
        const totalDocuments = await SubPackage.countDocuments(query);
          
        res.render('admin/sub-packages', {
            title: "Sub-Packages",
            subPackages: subPackagesData, 
            categories: allCategories, 
            allPackages: allPackagesData,  
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
        console.error("Error rendering sub-packages page:", error);
        res.render('admin/sub-packages', {
            title: "Sub-Packages",
            subPackages: [],
            categories: [],
            allPackages: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load sub-packages.',
            success: null
        });
    }
};

// Create a new sub-package
exports.createSubPackage = async (req, res) => {
    try {
        const {
            name, short_desc, long_desc, mrp, dis_price, parameter, packages_id
        } = req.body;
  
        const avatarFile = req.file; 

        if (!name || !packages_id) {
            if (avatarFile) deleteLocalFile(`uploads/packages/${avatarFile.filename}`);
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Name and packages_id are required"
            });
        }
 
        let packagesIdArray = packages_id;
        if (typeof packages_id === 'string') { 
            packagesIdArray = packages_id.includes(',') ? packages_id.split(',') : [packages_id];
        } else if (!Array.isArray(packages_id)) {
             packagesIdArray = [packages_id];
        }
  
        let avatarUrl = null;
        if (avatarFile) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            avatarUrl = `${baseUrl}/uploads/packages/${avatarFile.filename}`;
        }

        const newSubPackage = new SubPackage({
            name,
            avatar: avatarUrl,  
            short_desc,
            long_desc,
            mrp,
            dis_price,
            parameter,
            packages_id: packagesIdArray
        });

        await newSubPackage.save();

        res.status(201).json({
            code: 201,
            status: true,
            message: "SubPackage created successfully",
            data: newSubPackage
        });

    } catch (error) {
        if (req.file) deleteLocalFile(`uploads/packages/${req.file.filename}`);
        if (error.code === 11000) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "A sub-package with this name already exists"
            });
        }
        handleError(res, error, "Error creating sub-package");
    }
};

// Update an existing sub-package
exports.updateSubPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
         
        const newAvatarFile = req.file;
        
        const subPackage = await SubPackage.findById(id);
        if (!subPackage) {
            if (newAvatarFile) deleteLocalFile(`uploads/packages/${newAvatarFile.filename}`);
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Sub-package not found"
            });
        }
 
        if (updateData.packages_id) {
            let packagesIdArray = updateData.packages_id;
            if (typeof packagesIdArray === 'string') {
                packagesIdArray = packagesIdArray.includes(',') ? packagesIdArray.split(',') : [packagesIdArray];
            } else if (!Array.isArray(packagesIdArray)) {
                packagesIdArray = [packagesIdArray];
            }
            updateData.packages_id = packagesIdArray;
        }

        Object.assign(subPackage, updateData);
 
        if (newAvatarFile) {
            if (subPackage.avatar) {
                deleteLocalFile(subPackage.avatar);
            }
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            subPackage.avatar = `${baseUrl}/uploads/packages/${newAvatarFile.filename}`;
        }

        await subPackage.save();

        res.status(200).json({
            code: 200,
            status: true,
            message: "Sub-Package updated successfully",
            data: subPackage
        });

    } catch (error) {
        if (req.file) deleteLocalFile(`uploads/packages/${req.file.filename}`);
        handleError(res, error, "Error updating sub-package");
    }
};

//  Delete a sub-package  
exports.deleteSubPackage = async (req, res) => {
    try {
        const { id } = req.params;

        const subPackage = await SubPackage.findByIdAndUpdate(
            id,
            { status: 2 },
            { new: true }
        );

        if (!subPackage) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Sub-package not found"
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Sub-package deleted successfully...!"
        });

    } catch (error) {
        handleError(res, error, "Error deleting sub-package");
    }
};

// get by id
exports.getSubPackageById = async (req, res) => {
    try {
        const { id } = req.params;
        const subPackage = await SubPackage.findById(id).populate('packages_id');

        if (!subPackage) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Sub-Package not found"
            });
        }
        res.status(200).json({
            code: 200,
            status: true,
            message: "Sub-Package retrieved",
            data: subPackage
        });
    } catch (error) {
        handleError(res, error, "Error retrieving sub-package");
    }
};

//  Toggle active/inactive status of a sub-package
exports.toggleSubPackageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const subPackage = await SubPackage.findById(id);

        if (!subPackage) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Sub-Package not found"
            });
        }

        let newStatus;
        if (subPackage.status === 1) {
            newStatus = 0;
        } else if (subPackage.status === 0) {
            newStatus = 1;
        } else {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Cannot change status of a deleted item"
            });
        }

        subPackage.status = newStatus;
        await subPackage.save();

        const message = newStatus === 1 ? 'Sub-Package activated!' : 'Sub-Package deactivated!';
        res.status(200).json({
            code: 200,
            status: true,
            message,
            data: subPackage
        });

    } catch (error) {
        handleError(res, error, "Error toggling sub-package status");
    }
};

// Get the list of packages associated with a sub-package
exports.getSubPackagePackageList = async (req, res) => {
    try {
        const { id } = req.params;

        const subPackage = await SubPackage.findById(id)
            .populate('packages_id');

        if (!subPackage) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Sub-Package not found"
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Package list retrieved",
            data: subPackage.packages_id
        });

    } catch (error) {
        handleError(res, error, "Error retrieving package list");
    }
};

// Remove a package from a sub-package's packages_id array
exports.removePackageFromSubPackage = async (req, res) => {
    try {
        const { subPackageId, packageId } = req.params;

        const result = await SubPackage.findByIdAndUpdate(
            subPackageId,
            { $pull: { packages_id: packageId } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Sub-Package not found"
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Package removed from Sub-Package successfully",
            data: result
        });

    } catch (error) {
        handleError(res, error, "Error removing package from sub-package");
    }
};