const Package = require('../models/packages.model');
const mongoose = require('mongoose');

const SubPackage = require('../models/subPackage.model');
const Benefit = require('../models/benefit.model');
const Criteria = require('../models/criteria.model');
const Qanda = require('../models/qanda.model');
const Category = require('../models/category.model');
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

// Get packages by category
exports.getPackagesByCategory = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Valid category ID (id) is required"
            });
        }

        const categoryId = new mongoose.Types.ObjectId(id);
        console.log("Category ID:", categoryId);

        const packages = await Package.aggregate([
            {
                $match: {
                    status: 1,
                    categories_id: categoryId
                }
            },
            {
                $lookup: {
                    from: "subpackages",
                    localField: "_id",
                    foreignField: "packages_id",
                    as: "subpackages"
                }
            },
            {
                $addFields: {
                    discount_percentage: {
                        $cond: {
                            if: { $and: [{ $gt: ["$mrp", 0] }, { $gt: ["$dis_price", 0] }] },
                            then: {
                                $round: [
                                    {
                                        $multiply: [
                                            { $divide: [{ $subtract: ["$mrp", "$dis_price"] }, "$mrp"] },
                                            100
                                        ]
                                    },
                                    0
                                ]
                            },
                            else: 0
                        }
                    },
                    total_parameter_count: {
                        $sum: {
                            $map: {
                                input: "$subpackages",
                                as: "sp",
                                in: {
                                    $cond: [
                                        { $and: [{ $ne: ["$$sp.parameter", null] }, { $ne: ["$$sp.parameter", ""] }] },
                                        {
                                            $add: [
                                                {
                                                    $subtract: [
                                                        { $strLenCP: "$$sp.parameter" },
                                                        { $strLenCP: { $replaceAll: { input: "$$sp.parameter", find: "@", replacement: "" } } }
                                                    ]
                                                },
                                                1
                                            ]
                                        },
                                        0
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    subpackages: 0
                }
            }
        ]);
        console.log("Packages Found:", packages.length);

        if (!packages.length) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "No packages found for this category"
            });
        }

        return res.status(200).json({
            code: 200,
            status: true,
            message: "Packages retrieved successfully",
            data: packages
        });

    } catch (error) {
        console.error("Get Packages Error:", error);
        res.status(500).json({
            code: 500,
            status: false,
            message: "Server error while fetching packages",
            error: error.message
        });
    }
};

// Get package detail
exports.getPackageDetail = async (req, res) => {
    try {
        const packageId = req.params.id;

        if (!packageId || !mongoose.Types.ObjectId.isValid(packageId)) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Valid Package ID is required"
            });
        }

        const packageAgg = await Package.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(packageId),
                    status: 1
                }
            },
            {
                $lookup: {
                    from: 'subpackages',
                    localField: '_id',
                    foreignField: 'packages_id',
                    as: 'subpackages'
                }
            },
            {
                $addFields: {
                    discount_percentage: {
                        $cond: {
                            if: { $and: [{ $gt: ["$mrp", 0] }, { $gt: ["$dis_price", 0] }] },
                            then: {
                                $round: [
                                    {
                                        $multiply: [
                                            { $divide: [{ $subtract: ["$mrp", "$dis_price"] }, "$mrp"] },
                                            100
                                        ]
                                    },
                                    0
                                ]
                            },
                            else: 0
                        }
                    },
                    total_parameter_count: {
                        $sum: {
                            $map: {
                                input: "$subpackages",
                                as: "sp",
                                in: {
                                    $cond: [
                                        { $and: [{ $ne: ["$$sp.parameter", null] }, { $ne: ["$$sp.parameter", ""] }] },
                                        {
                                            $add: [
                                                {
                                                    $subtract: [
                                                        { $strLenCP: "$$sp.parameter" },
                                                        { $strLenCP: { $replaceAll: { input: "$$sp.parameter", find: "@", replacement: "" } } }
                                                    ]
                                                },
                                                1
                                            ]
                                        },
                                        0
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    subpackage_details: {
                        $map: {
                            input: "$subpackages",
                            as: "sp",
                            in: { name: "$$sp.name", parameter: "$$sp.parameter" }
                        }
                    }
                }
            },
            {
                $project: { subpackages: 0 }
            }
        ]);

        if (packageAgg.length === 0) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: 'No package found'
            });
        }

        const packageData = packageAgg[0];
        const benefits = await Benefit.find({ package_id: packageId }).select('avatar text');

        return res.status(200).json({
            status: true,
            message: "Data retrieved successfully...!",
            data: {
                Package: packageData,
                subpackage: packageData.subpackage_details,
                benefits: benefits
            }
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            status: false,
            message: "Server Error",
            error: error.message
        });
    }
};

// =================================================================
//                 ADMIN-ONLY API
// ================================================================= 

// Render packages page with filters and pagination
exports.packages = async (req, res) => {
    try {
        const { name, status, category, page = 1, limit = 10 } = req.query;

        const query = { status: { $ne: 2 } };

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }
        if (category) {
            query.categories_id = new mongoose.Types.ObjectId(category);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
 
        const [packagesData, categoriesData] = await Promise.all([
            Package.find(query)
                .populate('categories_id', 'name')  
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip(skip),
            Category.find({ status: 1 }).select('name _id')  
        ]);

        const totalDocuments = await Package.countDocuments(query);
 
        res.render('admin/packages', {
            title: "Packages",
            packages: packagesData,   
            categories: categoriesData, 
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
        console.error("Error rendering packages page:", error);
        res.render('admin/packages', {
            title: "Packages",
            packages: [],
            categories: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load packages.',
            success: null
        });
    }
};

//  Get all packages for admin with filters and pagination
exports.getAllPackagesAdmin = async (req, res) => {
    try {
        const { name, status, category, page = 1, limit = 10 } = req.query;

        const query = { status: { $ne: 2 } };

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }
        if (category) {
            query.categories_id = new mongoose.Types.ObjectId(category);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const packages = await Package.find(query)
            .populate('categories_id', 'name')
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);

        const totalDocuments = await Package.countDocuments(query);

        res.status(200).json({
            code: 200,
            status: true,
            message: "Packages retrieved for admin",
            data: packages,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });
    } catch (error) {
        handleError(res, error, "Error fetching admin packages");
    }
};

// Get package view for admin (with related data)
exports.getPackageViewAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const packageId = new mongoose.Types.ObjectId(id);

        const packageData = await Package.findById(id).populate('categories_id', 'name');
        if (!packageData) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Package not found"
            });
        }

        const [benefits, criteria, qanda, allCategories] = await Promise.all([
            Benefit.find({ package_id: packageId }),
            Criteria.find({ package_id: packageId }),
            Qanda.find({ package_id: packageId }),
            Category.find({ status: 1 }).select('name')
        ]);

        const packageCategoryIds = packageData.categories_id.map(c => c._id.toString());
        const otherCategories = allCategories.filter(c => !packageCategoryIds.includes(c._id.toString()));

        res.status(200).json({
            code: 200,
            status: true,
            data: {
                package: packageData,
                benefits,
                criteria,
                qanda,
                otherCategories
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching package view");
    }
};

//  Create a new package
exports.createPackage = async (req, res) => {
    try {
        const {
            name, short_desc, long_desc, categories_id,
            fasting, report_in, sample_type, for_what, package_instruction,
            recommended_age, recommended_gender, option, mrp, dis_price
        } = req.body;
 
        const avatarFile = req.file;

        if (!name || !categories_id || !mrp || !dis_price || !short_desc) { 
            if (avatarFile) deleteLocalFile(`uploads/packages/${avatarFile.filename}`);
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Required fields are missing (name, categories_id, mrp, dis_price, short_desc)"
            });
        }

        let avatarUrl = null;
        if (avatarFile) { 
            const baseUrl = `${req.protocol}://${req.get('host')}`; 
            avatarUrl = `${baseUrl}/uploads/packages/${avatarFile.filename}`;
        }

        const newPackage = new Package({
            name,
            avatar: avatarUrl, 
            short_desc,
            long_desc,
            categories_id: Array.isArray(categories_id) ? categories_id : [categories_id],
            fasting,
            report_in,
            sample_type,
            for_what,
            package_instruction,
            recommended_age,
            recommended_gender,
            option,
            mrp,
            dis_price
        });

        await newPackage.save();

        res.status(201).json({
            code: 201,
            status: true,
            message: "Package created successfully",
            data: newPackage
        });

    } catch (error) {
        // Error આવે તો ફાઈલ ડીલીટ કરો
        if (req.file) deleteLocalFile(`uploads/packages/${req.file.filename}`);
        
        if (error.code === 11000) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "A package with this name already exists"
            });
        }
        handleError(res, error, "Error creating package");
    }
};

//   Update an existing package
exports.updatePackage = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
         
        const newAvatarFile = req.file;

        const packageToUpdate = await Package.findById(id);
        if (!packageToUpdate) {
             if (newAvatarFile) deleteLocalFile(`uploads/packages/${newAvatarFile.filename}`);
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Package not found"
            });
        }

        if (updateData.name && updateData.name !== packageToUpdate.name) {
            const existing = await Package.findOne({ name: updateData.name });
            if (existing) {
                 if (newAvatarFile) deleteLocalFile(`uploads/packages/${newAvatarFile.filename}`);
                return res.status(400).json({
                    code: 400,
                    status: false,
                    message: "A package with this name already exists"
                });
            }
        }

        Object.assign(packageToUpdate, updateData);
 
        if (newAvatarFile) { 
            if (packageToUpdate.avatar) {
                deleteLocalFile(packageToUpdate.avatar);
            }
             
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            packageToUpdate.avatar = `${baseUrl}/uploads/packages/${newAvatarFile.filename}`;
        }

        await packageToUpdate.save();

        res.status(200).json({
            code: 200,
            status: true,
            message: "Package updated successfully",
            data: packageToUpdate
        });

    } catch (error) {
         if (req.file) deleteLocalFile(`uploads/packages/${req.file.filename}`);
        
        if (error.code === 11000) {
            return res.status(400).json({ status: false, message: "A package with this name already exists" });
        }
        handleError(res, error, "Error updating package");
    }
};

//  Delete a package (soft delete)
exports.deletePackage = async (req, res) => {
    try {
        const { id } = req.params;

        const activeSubPackages = await SubPackage.find({
            packages_id: id,
            status: { $ne: 2 }
        });

        if (activeSubPackages.length > 0) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "Package exists in Sub-Packages, so you cannot delete it."
            });
        }

        // 2. Soft delete
        const deletedPackage = await Package.findByIdAndUpdate(
            id,
            { status: 2 },
            { new: true }
        );

        if (!deletedPackage) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Package not found"
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Package deleted successfully...!"
        });

    } catch (error) {
        handleError(res, error, "Error deleting package");
    }
};

//  Toggle package status (active/inactive)
exports.togglePackageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const packageToToggle = await Package.findById(id);

        if (!packageToToggle) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Package not found"
            });
        }

        const newStatus = packageToToggle.status === 1 ? 0 : 1;

        if (newStatus === 0) {
            const activeSubPackages = await SubPackage.find({
                packages_id: id,
                status: { $ne: 2 }
            });

            if (activeSubPackages.length > 0) {
                return res.status(400).json({
                    code: 400,
                    status: false,
                    message: "Package exists in Sub-Packages, so you cannot Inactive it."
                });
            }
        }

        // 2. Toggle status
        packageToToggle.status = newStatus;
        await packageToToggle.save();

        const message = newStatus === 1 ? 'Package activated!' : 'Package deactivated!';
        res.status(200).json({
            code: 200,
            status: true,
            message,
            data: packageToToggle
        });

    } catch (error) {
        handleError(res, error, "Error toggling package status");
    }
};

// Get package view for admin (Render EJS)
exports.packageViewAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
             return res.render('admin/packages', {
                title: "Packages", packages: [], categories: [], query: {}, pagination: null, error: 'Invalid Package ID', success: null
            });
        }

        const packageData = await Package.findById(id).populate('categories_id', 'name');
        
        if (!packageData) {
            return res.render('admin/packages', {
                title: "Packages", packages: [], categories: [], query: {}, pagination: null, error: 'Package not found', success: null
            });
        }
 
        const [benefits, criteria, qanda] = await Promise.all([
            Benefit.find({ package_id: id, status: 1 }),
            Criteria.find({ package_id: id, status: 1 }),
            Qanda.find({ package_id: id, status: 1 })
        ]);

        res.render('admin/view-packages', {
            title: "Package Details",
            pkg: packageData,  
            benefits,
            criteria,
            qanda,
            error: null,
            success: null
        });

    } catch (error) {
        console.error("Error fetching package view:", error);
        res.render('admin/packages', {
            title: "Packages",
            packages: [],
            categories: [],
            query: {},
            pagination: null,
            error: 'Server Error: Failed to load package details.',
            success: null
        });
    }
};

// =================================================================
//      ADMIN PACKAGE VIEW - RELATED DATA (Benefit, Criteria, Q&A)
// =================================================================

//  Add a Benefit to a package
exports.addBenefit = async (req, res) => {
        try {
            const package_id = req.params.id;
            const { text, avatar } = req.body;

            if (!package_id || !text) {
                return res.status(400).json({
                    code: 400,
                    status: false,
                    message: "package_id and text are required"
                });
            }

            const benefit = new Benefit({
                package_id,
                text,
                avatar: avatar || null
            });

            await benefit.save();

            res.status(201).json({
                code: 201,
                status: true,
                message: "Benefit added successfully",
                data: benefit
            });

        } catch (error) {
            handleError(res, error, "Error adding benefit");
        }
    };

//  Delete a Benefit soft delete
exports.deleteBenefit = async (req, res) => {
    try {
        const { benefitId } = req.params;

        const benefit = await Benefit.findByIdAndUpdate(
            benefitId,
            { status: 2 },
            { new: true }
        );

        if (!benefit) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Benefit not found"
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Benefit deleted successfully...!"
        });

    } catch (error) {
        handleError(res, error, "Error deleting benefit");
    }
};

//   Add a Criteria to a package 
exports.addCriteria = async (req, res) => {
    try {
        const package_id = req.params.id;
        const { text, avatar } = req.body;

        if (!text) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "text is required"
            });
        }

        const criteria = new Criteria({
            package_id,
            text,
            avatar: avatar || null
        });

        await criteria.save();

        res.status(201).json({
            code: 201,
            status: true,
            message: "Criteria added successfully",
            data: criteria
        });

    } catch (error) {
        handleError(res, error, "Error adding criteria");
    }
};

//  Delete a Criteria soft delete 
exports.deleteCriteria = async (req, res) => {
    try {
        const { criteriaId } = req.params;

        const criteria = await Criteria.findByIdAndUpdate(
            criteriaId,
            { status: 2 },
            { new: true }
        );

        if (!criteria) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Criteria not found"
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Criteria deleted successfully"
        });

    } catch (error) {
        handleError(res, error, "Error deleting criteria");
    }
};

//  Add a Q&A to a package 
exports.addQanda = async (req, res) => {
    try {
        const package_id = req.params.id;
        const { question, answer } = req.body;

        if (!question || !answer) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: "question and answer are required"
            });
        }

        const qanda = new Qanda({
            package_id,
            question,
            answer
        });

        await qanda.save();

        res.status(201).json({
            code: 201,
            status: true,
            message: "Q&A added successfully",
            data: qanda
        });

    } catch (error) {
        handleError(res, error, "Error adding Q&A");
    }
};

// Soft Delete Q&A
exports.deleteQanda = async (req, res) => {
    try {
        const { qandaId } = req.params;

        const qanda = await Qanda.findByIdAndUpdate(
            qandaId,
            { status: 2 },
            { new: true }
        );

        if (!qanda) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Q&A not found"
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Q&A deleted successfully"
        });

    } catch (error) {
        handleError(res, error, "Error deleting Q&A");
    }
};