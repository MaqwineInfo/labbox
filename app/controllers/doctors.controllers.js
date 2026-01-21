const Docter = require('../models/docter.model');
const mongoose = require('mongoose');

//  error responses
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

// Get all active doctors
exports.getActiveDoctors = async (req, res) => {
    try {
        const doctors = await Docter.find({ status: 1 });

        if (!doctors.length) {
            return res.status(404).json({
                code : 404,
                status: false,
                message: 'No doctors found.'
            });
        }

        res.status(200).json({
            code : 200,
            status: true,
            message: "Data retrieved successfully...!",
            data: doctors
        });

    } catch (error) {
        handleError(res, error, "Error fetching active doctors");
    }
};

// =================================================================
//                 ADMIN-ONLY API
// ================================================================= 

//  Get all doctors for admin with filters and pagination (Render View)
exports.doctors = async (req, res) => {
    try {
        const { name, status, page = 1, limit = 10 } = req.query;
 
        const query = { status: { $ne: 2 } }; // 2 = Deleted

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = Number(status);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum; 
         
        const doctorsData = await Docter.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);
 
        const totalDocuments = await Docter.countDocuments(query);

        res.render('admin/doctors', {
            title: "Doctors",
            doctors: doctorsData,  
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
        res.render('admin/doctors', {
            title: "Doctors",
            doctors: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load doctors.',
            success: null
        });
    }
};

//  Get all doctors for admin with filters and pagination
exports.getAllDoctorsAdmin = async (req, res) => {
    try {
        const { name, status, page = 1, limit = 10 } = req.query;
 
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
        const doctors = await Docter.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip(skip);
 
        const totalDocuments = await Docter.countDocuments(query);

        res.status(200).json({
            code : 200,
            status: true,
            message: "Doctors retrieved for admin",
            data: doctors,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching admin doctors");
    }
};

// Create a new doctor
exports.createDoctor = async (req, res) => {
    try {
        const { name, contact_no, hospital, degree } = req.body;
 
        if (!name || !contact_no || !hospital || !degree) {
            return res.status(400).json({ 
                code : 400,
                status: false, 
                message: "Name, contact number, hospital, and degree are required" 
            });
        }
 
        const newDoctor = new Docter({
            name,
            contact_no,
            hospital,
            degree
        });

        await newDoctor.save();

        res.status(201).json({
            code : 201,
            status: true,
            message: "Doctor created successfully",
            data: newDoctor
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                code : 400, 
                status: false,  
                message: "A doctor with this name already exists"
            });
        }
        handleError(res, error, "Error creating doctor");
    }
};

//  Update an existing doctor
exports.updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact_no, hospital, degree } = req.body;
 
        const doctor = await Docter.findById(id);
        if (!doctor) {
            return res.status(404).json({ 
                code : 404,
                status: false, 
                message: "Doctor not found"  
            });
        }
         
        if (!name || !contact_no || !hospital || !degree) {
            return res.status(400).json({ 
                code : 400,
                status: false, 
                message: "Name, contact number, hospital, and degree are required" 
            });
        }
 
        doctor.name = name;
        doctor.contact_no = contact_no;
        doctor.hospital = hospital;
        doctor.degree = degree;

        await doctor.save();

        res.status(200).json({
            code : 200,
            status: true,
            message: "Doctor updated successfully",
            data: doctor
        });

    } catch (error)
        {
        if (error.code === 11000) {
            return res.status(400).json({ 
                code : 400,
                status: false, 
                message: "A doctor with this name already exists" 
            });
        }
        handleError(res, error, "Error updating doctor");
    }
};

//  Delete a doctor (soft delete by setting status to 2)
exports.deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await Docter.findByIdAndUpdate(
            id,
            { status: 2 }, // 2 = Deleted
            { new: true }
        );

        if (!doctor) {
            return res.status(404).json({ 
                code : 404,
                status: false, 
                message: "Doctor not found" 
            });
        }

        res.status(200).json({
            code : 200,
            status: true,
            message: "Doctor deleted successfully...!"
        });

    } catch (error) {
        handleError(res, error, "Error deleting doctor");
    }
};

// Toggle doctor status between active (1) and inactive (0)
exports.toggleDoctorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor = await Docter.findById(id);

        if (!doctor) {
            return res.status(404).json({ 
                code : 404,
                status: false, 
                message: "Doctor not found" 
            });
        }

        // Toggle only between 0 and 1
        let newStatus;
        if (doctor.status === 1) {
            newStatus = 0;
        } else if (doctor.status === 0) {
            newStatus = 1;
        } else {
            // Do not change status if it's 2 (deleted)
            return res.status(400).json({ 
                code : 400,
                status: false, 
                message: "Cannot change status of a deleted item" 
            });
        }

        doctor.status = newStatus;
        await doctor.save();

        const message = newStatus === 1 ? 'Doctor activated!' : 'Doctor deactivated!';
        res.status(200).json({ 
            code : 200,
            status: true, 
            message, 
            data: doctor 
        });

    } catch (error) {
        handleError(res, error, "Error toggling doctor status");
    }
};
 