const Category = require('../models/category.model');   
const Package = require('../models/packages.model'); 
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
        code : 500,
        status: false,
        message,
        error: error.message
    });
};

// =================================================================
//                 USER-FACING/PUBLIC API
// =================================================================
 
// Get all active categories
exports.getActiveCategories = async (req, res) => {
    try { 
        const categories = await Category.find({ status: 1 }).sort({ sort_by: 1 });

        if (!categories || categories.length === 0) {
            return res.status(404).json({
                code : 404,
                status: false,
                message: "No categories found."
            });
        }

        res.status(200).json({
            code : 200,
            status: true,
            message: 'Data retrieved successfully',
            data: categories
        });

    } catch (error) {
        handleError(res, error, "Error fetching categories");
    }
};

// =================================================================
//                 ADMIN-ONLY API
// =================================================================  

// Get all categories with admin filters and pagination
exports.getAllCategoriesAdmin = async (req, res) => {
    try {
        const { name, status, page = 1, limit = 10 } = req.query;
 
        const query = { status: { $ne: 2 } }; 

        if (name) { 
            query.name = { $regex: name, $options: 'i' };
        }

        if (status && status !== 'all') {
            query.status = Number(status);
        }

        // Pagination logic
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const categories = await Category.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);
 
        const totalDocuments = await Category.countDocuments(query);
        
        res.status(200).json({
            code : 200,
            status: true,
            message: "Categories retrieved for admin",
            data: categories,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching admin categories");
    }
};

// Create a new category 
exports.createCategory = async (req, res) => {
    try { 
        const { name, long_desc, short_desc } = req.body; 
         
        const avatarFile = req.file; 

        if (!name || !long_desc || !short_desc) {
            return res.status(400).json({ 
                code : 400,
                status: false, 
                message: "Name, long_desc, and short_desc are required" 
            });
        }
         
        if (!avatarFile) {
            return res.status(400).json({ 
                code : 400,
                status: false, 
                message: "Avatar (image) is required" 
            });
        }

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) { 
            if (avatarFile) deleteLocalFile(`uploads/categories/${avatarFile.filename}`);
            return res.status(400).json({ 
                code : 400,
                status: false, 
                message: "A category with this name already exists" 
            });
        } 
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const avatarPath = `${baseUrl}/uploads/categories/${avatarFile.filename}`;

        const newCategory = new Category({
            name,
            avatar: avatarPath, 
            long_desc,
            short_desc 
        });

        await newCategory.save();

        res.status(201).json({
            code : 201,
            status: true,
            message: "Category created successfully",
            data: newCategory
        });

    } catch (error) { 
        if (req.file) deleteLocalFile(`uploads/categories/${req.file.filename}`);
        handleError(res, error, "Error creating category");
    }
};

// Update an existing category  
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params; 
        const { name, long_desc, short_desc } = req.body; 
        const newAvatarFile = req.file; 

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                code : 404,
                status: false, 
                message: "Category not found" 
            });
        }
        
        if (!name || !long_desc || !short_desc) {
            return res.status(400).json({ 
                code : 400,
                status: false, 
                message: "Name, long_desc, and short_desc are required" 
            });
        }

        if (name !== category.name) {
            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                if (newAvatarFile) deleteLocalFile(`uploads/categories/${newAvatarFile.filename}`);
                return res.status(400).json({ 
                    code : 400,
                    status: false, 
                    message: "A category with this name already exists" 
                });
            }
        }
         
        category.name = name;
        category.long_desc = long_desc;
        category.short_desc = short_desc;
 
        if (newAvatarFile) {  
            if (category.avatar) deleteLocalFile(category.avatar);
            
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            category.avatar = `${baseUrl}/uploads/categories/${newAvatarFile.filename}`;
        }

        await category.save();

        res.status(200).json({
            code : 200,
            status: true,
            message: "Category updated successfully",
            data: category
        });

    } catch (error) {
        if (req.file) deleteLocalFile(`uploads/categories/${req.file.filename}`);
        handleError(res, error, "Error updating category");
    }
};

// Soft delete a category
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params; 
        const activePackages = await Package.find({
            categories: id,
            status: { $ne: 2 }
        });

        if (activePackages.length > 0) {
            return res.status(400).json({
                code : 400,
                status: false,
                message: "Category exists in Package, so you cannot delete it."
            });
        }

        // 2. Soft delete the category
        const category = await Category.findByIdAndUpdate(
            id,
            { status: 2 }, // 2 = Deleted
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ 
                code : 404,
                status: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            code : 200,
            status: true,
            message: "Category deleted successfully"
        });

    } catch (error) {
        handleError(res, error, "Error deleting category");
    }
};

//  Toggle category status between active (1) and inactive (0)
exports.toggleCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ 
                code : 404,
                status: false, 
                message: "Category not found" 
            });
        }
        
        const newStatus = category.status === 1 ? 0 : 1;
 
        if (newStatus === 0) {
            const activePackages = await Package.find({
                categories: id,
                status: { $ne: 2 }
            });

            if (activePackages.length > 0) {
                return res.status(400).json({
                    code : 400,
                    status: false,
                    message: "Category exists in Package, so you cannot Inactive it."
                });
            }
        }

        // 2. Toggle only between 0 and 1.
        if (category.status === 0 || category.status === 1) {
            category.status = newStatus;
            await category.save();
        }

        const message = category.status === 1 ? 'Category activated!' : 'Category deactivated!';
        
        res.status(200).json({
            code : 200,
            status: true,
            message,
            data: category
        });

    } catch (error) {
        handleError(res, error, "Error toggling category status");
    }
}; 

// Render categories page for admin with filters and pagination
exports.categories = async (req, res) => {
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
 
        const categoriesData = await Category.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);
 
        const totalDocuments = await Category.countDocuments(query);
         
        res.render('admin/categories', {  
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
        console.error("Error rendering categories page:", error);
        res.render('admin/categories', {
            categories: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load categories.',
            success: null
        });
    }
};