const Order = require('../models/order.model');
const User = require('../models/users.model');
const Package = require('../models/packages.model');
const Prescription = require('../models/prescription.model');
const Address = require('../models/address.model');
const mongoose = require('mongoose');

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require('dotenv'); 
const fs = require('fs');

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const sanitizeFileName = (fileName) => {
  let sanitizedFileName = fileName
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return sanitizedFileName.length > 5
    ? sanitizedFileName.substring(0, 50)
    : sanitizedFileName;
};

const uploadFileToS3 = async (file) => {    
  if (!file) return null;

  const sanitizedImageName = sanitizeFileName(file.name);
  const filePath = `reports/${Date.now()}_${sanitizedImageName}`;  

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET,
    Key: filePath,
    Body: fs.createReadStream(file.tempFilePath),
    ContentType: file.mimetype,
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));
    fs.unlinkSync(file.tempFilePath);
    return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${filePath}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    if (fs.existsSync(file.tempFilePath)) fs.unlinkSync(file.tempFilePath);
    throw new Error("S3 upload failed");
  }
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
//                 ADMIN-ONLY API
// ================================================================= 
 
// Render reports page with pagination and filtering
exports.reports = async (req, res) => {
    try {
        const { user: userName, page = 1, limit = 10 } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
  
        const matchStage = {
            status: 5,
            is_delete: 0
        };
 
        let pipeline = [
            { $match: matchStage },
            {
                $lookup: { from: 'users', localField: 'patient_id', foreignField: '_id', as: 'patient' }
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            {
                $lookup: { from: 'packages', localField: 'package_id', foreignField: '_id', as: 'package' }
            },
            { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
            {
                $lookup: { from: 'prescriptions', localField: 'prescription_id', foreignField: '_id', as: 'prescription' }
            },
            { $unwind: { path: '$prescription', preserveNullAndEmptyArrays: true } },
            {
                $lookup: { from: 'addresses', localField: 'address_id', foreignField: '_id', as: 'address' }
            },
            { $unwind: { path: '$address', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1, status: 1, avatar: 1, date: 1,
                    user: '$patient.name',
                    package_name: { $ifNull: [ "$package.name", "--" ] }, 
                    prescription_details: '$prescription.avatar',
                    user_address: '$address.address',
                    createdAt: 1
                }
            }
        ];
 
        if (userName) {
            pipeline.push({
                $match: {
                    user: { $regex: userName, $options: 'i' }
                }
            });
        }
        
        pipeline.push({ $sort: { createdAt: -1 } });
         
        const aggregationData = await Order.aggregate(pipeline);
        const totalDocuments = aggregationData.length;
        
        const data = aggregationData.slice(skip, skip + limitNum);
        
        res.render('admin/reports', {
            title: "Reports",
            reports: data,  
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
        console.error("Error rendering reports page:", error);
        res.render('admin/reports', {
            title: "Reports",
            reports: [],
            query: req.query,
            pagination: null,
            error: 'Failed to load reports.',
            success: null
        });
    }
};

// Get all reports with pagination and filtering
exports.getAllReportsAdmin = async (req, res) => {
    try {
        const { user: userName, page = 1, limit = 10 } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
 
        const matchStage = {
            status: 5,
            is_delete: 0
        };
 
        let pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users',
                    localField: 'patient_id',
                    foreignField: '_id',
                    as: 'patient'
                }
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'packages',
                    localField: 'package_id',
                    foreignField: '_id',
                    as: 'package'
                }
            },
            { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'prescriptions',
                    localField: 'prescription_id',
                    foreignField: '_id',
                    as: 'prescription'
                }
            },
            { $unwind: { path: '$prescription', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'addresses',
                    localField: 'address_id',
                    foreignField: '_id',
                    as: 'address'
                }
            },
            { $unwind: { path: '$address', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    status: 1,
                    avatar: 1,  
                    date: 1,
                    user: '$patient.name',
                    package_id: '$package.name',  
                    prescription_details: '$prescription.avatar',
                    user_address: '$address.address',
                    createdAt: 1
                }
            }
        ];
 
        if (userName) {
            pipeline.push({
                $match: {
                    user: { $regex: userName, $options: 'i' }
                }
            });
        }
        
        pipeline.push({ $sort: { createdAt: -1 } });
 
        const [result] = await Order.aggregate([
            {
                $facet: {
                    data: [
                        ...pipeline,
                        { $skip: skip },
                        { $limit: limitNum }
                    ],
                    metadata: [
                        { $match: matchStage }, 
                        ... (userName ? [{
                            $lookup: { from: 'users', localField: 'patient_id', foreignField: '_id', as: 'patient' }
                        }, {
                            $unwind: '$patient'
                        }, {
                             $match: { 'patient.name': { $regex: userName, $options: 'i' } }
                        }] : []),
                        { $count: 'totalDocuments' }
                    ]
                }
            }
        ]);

        const data = result.data;
        const totalDocuments = result.metadata[0]?.totalDocuments || 0;
        
        res.status(200).json({
            code : 200,
            status: true,
            message: "Reports retrieved successfully",
            data: data,
            pagination: {
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching admin reports");
    }
};

//  Upload a report file (set the avatar URL in order)
exports.uploadReportFileAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { avatar } = req.body;  

        if (!avatar) {
            return res.status(400).json({ 
                code: 400,
                status: false,
                message: "Avatar (file URL) is required"
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                code: 404, 
                status: false, 
                message: "Order not found" 
            });
        } 
        
        order.avatar = avatar;  
        await order.save();

        res.status(200).json({
            code: 200,
            status: true,
            message: "Report uploaded successfully",
            data: order
        });

    } catch (error) {
        handleError(res, error, "Error uploading report file");
    }
};

//  Delete a report (soft delete by setting is_delete flag)
exports.deleteReportAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByIdAndUpdate(
            id,
            { is_delete: 1 }, // Soft delete
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ 
                code: 404,
                status: false,
                message: "Report not found"
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Report deleted successfully...!"
        });

    } catch (error) {
        handleError(res, error, "Error deleting report");
    }
};

// =================================================================
//                 USER-FACING/PUBLIC API
// ================================================================= 
 
exports.getReportUrlUser = async (req, res) => {
    try {
        const { id } = req.params; // Order ID
         
        const report = await Order.findById(id).select('avatar user_id');

        if (!report) {
            return res.status(404).json({ 
                code: 404,
                status: false,
                message: "Report not found"
            });
        }
         
        if (report.user_id.toString() !== req.user.id) {
            return res.status(403).json({ 
                code: 403,
                status: false,
                message: "Forbidden"
            });
        }

        if (!report.avatar) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Report file not yet available"
            });
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Data retrieved successfully...!",
            data: {
                report_url: report.avatar
            }
        });

    } catch (error) {
        handleError(res, error, "Error fetching report URL");
    }
};

 