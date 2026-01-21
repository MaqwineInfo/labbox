const User = require('../models/users.model'); 
const mongoose = require('mongoose');

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

//  Add a new patient (as a new User record)
exports.addPatient = async (req, res) => {
    try { 
        if (!req.user || !req.user.id || !req.user.contact_no) {
             return res.status(401).json({ 
                code: 401,
                status: false, 
                message: "Auth token is not found or invalid" 
            });
        }
        const parentId = req.user.id;
        const parentContactNo = req.user.contact_no;
 
        const { name, age, relation, gender, device_token } = req.body;
 
        if (!name || !age || !relation || !gender || !device_token) {
            return res.status(400).json({ 
                code: 400,
                status: false, 
                message: "name, age, relation, gender, and device_token are required" 
            });
        }
         
        const patient = new User({
            contact_no: parentContactNo,  
            name,
            age,
            relation,
            gender,
            parent_id: parentId,  
            is_verify: true,     
            is_user: true,       
            device_token,
            status: 1          
        });

        await patient.save();

        res.status(200).json({ 
            code: 200,
            status: true, 
            message: "Patient added successfully!", 
            data: patient 
        });

    } catch (error) { 
         if (error.code === 11000) {
            return res.status(400).json({ 
                code: 400,
                status: false, 
                message: "A user with this contact number already exists. This patient profile cannot be created with the same contact."
            });
         }
        handleError(res, error, "Error adding patient");
    }
};

//  Get all patients linked to the logged-in user
exports.getPatients = async (req, res) => {
    try { 
        if (!req.user || !req.user.id) {
             return res.status(401).json({ 
                code: 401,
                status: false, 
                message: "Auth token is not found or invalid"
            });
        }
        const parentId = req.user.id;
 
        const patients = await User.find({ parent_id: parentId });

        res.status(200).json({ 
            code: 200,
            status: true, 
            message: "Data retrieved successfully", 
            data: patients 
        });

    } catch (error) {
        handleError(res, error, "Error retrieving patients");
    }
};


// =================================================================
//                 ADMIN-ONLY API
// ================================================================= 

//  Get all patients with filters and pagination for Admin
exports.getAllPatientsAdmin = async (req, res) => {
    try {
        const { name, status, page = 1, limit = 10 } = req.query;
 
        const query = { is_user: true, status: { $ne: 2 } }; // is_user: true 

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const patients = await User.find(query)
            .populate('parent_id', 'name contact_no') 
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);
 
        const totalDocuments = await User.countDocuments(query);

        res.status(200).json({
            code: 200,
            status: true,
            message: "Patients retrieved for admin",
            data: patients,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching admin patients");
    }
};

//  Get detailed view of a patient and their linked patients for Admin
exports.getPatientDetailViewAdmin = async (req, res) => {
    try {
        const { id } = req.params;  

        const [user, childPatients] = await Promise.all([
            User.findById(id),
            User.find({ parent_id: id })
        ]);

        if (!user) {
            return res.status(404).json({ 
                code: 404,
                status: false, 
                message: "User not found"
             });
        }

        res.status(200).json({
            code: 200,
            status: true,
            data: {
                user: user,
                patients: childPatients
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching patient detail view");
    }
};

//  Soft delete a patient and their linked patients for Admin
exports.deletePatientAdmin = async (req, res) => {
    try {
        const { id } = req.params;  
 
        const result = await User.updateMany(
            { parent_id: id },
            { $set: { status: 2 } } // 2 = Deleted
        );

        if (result.matchedCount === 0) { 
            const mainUser = await User.findById(id);
            if (mainUser) { 
                mainUser.status = 2;
                await mainUser.save();
                return res.status(200).json({ 
                    code: 200,
                    status: true, 
                    message: "Patient deleted successfully...!" 
                });
            }
            return res.status(404).json({ 
                code: 404,
                status: false, 
                message: "No patients found for this user ID" 
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: `Patients deleted successfully... (${result.modifiedCount} modified)`
        });

    } catch (error) {
        handleError(res, error, "Error deleting patient");
    }
};

//  Toggle active/inactive status of a patient and their linked patients for Admin
exports.togglePatientStatusAdmin = async (req, res) => {
    try {
        const { id } = req.params;   
        let patient = await User.findOne({ parent_id: id });

        if (!patient) { 
             const mainUser = await User.findById(id);
             if(!mainUser) {
                return res.status(404).json({ 
                    code: 404,
                    status: false, 
                    message: "Patient not found" 
                });
             }  
             patient = mainUser;
        }

        // Toggle only between 0 and 1
        let newStatus;
        if (patient.status === 1) {
            newStatus = 0;
        } else if (patient.status === 0) {
            newStatus = 1;
        } else { 
            return res.status(400).json({ 
                code: 400,
                status: false, 
                message: "Cannot change status of a deleted item" 
            });
        } 
        await User.updateMany(
            { parent_id: id },
            { $set: { status: newStatus } }
        ); 
        if (patient._id.toString() === id) {
             patient.status = newStatus;
             await patient.save();
        }

        const message = newStatus === 1 ? 'Patient activated!' : 'Patient deactivated!';
        res.status(200).json({ 
            code: 200,
            status: true, 
            message 
        });

    } catch (error) {
        handleError(res, error, "Error toggling patient status");
    }
};

// Render patients.ejs  
exports.patients = async (req, res) => {
    try {
        const { name, status, page = 1, limit = 10 } = req.query;
 
        const query = { is_user: true, status: { $ne: 2 } };  

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const patientsData = await User.find(query)
            .populate('parent_id', 'name contact_no') 
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);
 
        const totalDocuments = await User.countDocuments(query);

        res.render('admin/patients', {
            title: "Patients",
            patients: patientsData,  
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
        res.render('admin/patients', {
            title: "Patients",
            patients: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load patients.',
            success: null
        });
    }
};

// Render view-patient.ejs 
exports.viewPatient = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.redirect('/admin/patients?error=Invalid ID');
        } 
        const mainUser = await User.findById(id).populate('parent_id');

        if (!mainUser) {
            return res.redirect('/admin/patients?error=Patient not found');
        }

        let relatedPatients = []; 
        if (mainUser.parent_id) { 
            relatedPatients = await User.find({ 
                parent_id: mainUser.parent_id._id,  
                status: { $ne: 2 },
                _id: { $ne: mainUser._id } 
            });
        } else { 
            relatedPatients = await User.find({ 
                parent_id: mainUser._id, 
                status: { $ne: 2 } 
            });
        } 
        res.render('admin/view-patient', {
            title: mainUser.name,
            user: mainUser,     
            patients: relatedPatients,  
            error: null,
            success: null
        });

    } catch (error) {
        console.error("Error in viewPatient:", error);
        res.redirect('/admin/patients?error=Failed to load details');
    }
};