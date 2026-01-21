const Setting = require('../models/setting.model');
const mongoose = require('mongoose');

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
 
// Export the getSettings function
exports.getSettings = async (req, res) => {
    try { 
        let settings = await Setting.findOne();

        if (!settings) { 
            settings = new Setting({});
            await settings.save();
        }

        res.status(200).json({
            code: 200,
            status: true,
            message: "Settings retrieved successfully",
            data: settings
        });

    } catch (error) {
        handleError(res, error, "Error fetching settings");
    }
};

//  Export the getSettings function
exports.updateSettings = async (req, res) => {
    try {
        const { terms_use, privacy_policy, cancellation_refund } = req.body;
 
        const updateData = {};
        if (terms_use !== undefined) updateData.terms_use = terms_use;
        if (privacy_policy !== undefined) updateData.privacy_policy = privacy_policy;
        if (cancellation_refund !== undefined) updateData.cancellation_refund = cancellation_refund;
  
        const updatedSettings = await Setting.findOneAndUpdate(
            {},  
            { $set: updateData },
            { 
                new: true, 
                upsert: true, 
                runValidators: true 
            }
        );

        res.status(200).json({
            code: 200,
            status: true,
            message: "Settings updated successfully",
            data: updatedSettings
        });

    } catch (error) {
        handleError(res, error, "Error updating settings");
    }
};
 
// Helper function to get settings data
const getSettingsData = async () => {
    let settings = await Setting.findOne();
    if (!settings) {
        settings = new Setting({});
        await settings.save();
    }
    return settings;
};

// 1. Terms & Use (GET / POST)
exports.renderTerms = async (req, res) => {
    try {
        const settings = await getSettingsData();
        res.render('admin/Termsanduse', {
            title: "Terms & Use",
            data: settings,
            error: req.flash ? req.flash('error') : null,
            success: req.flash ? req.flash('success') : null
        });
    } catch (error) {
        res.render('admin/Termsanduse', { title: "Terms & Use", data: {}, error: 'Failed to load settings.' });
    }
};

// POST update Terms & Use
exports.updateTerms = async (req, res) => {
    try {
        const { terms_use } = req.body;
        await Setting.findOneAndUpdate({}, { terms_use: terms_use }, { upsert: true }); 
        const settings = await getSettingsData();
        res.render('admin/Termsanduse', {
            title: "Terms & Use",
            data: settings,
            error: null,
            success: "Terms updated successfully!"
        });

    } catch (error) {
        const settings = await getSettingsData();
        res.render('admin/Termsanduse', {
            title: "Terms & Use",
            data: settings,
            error: 'Failed to update terms.',
            success: null
        });
    }
};

// 2. Privacy Policy (GET / POST)
exports.renderPolicy = async (req, res) => {
    try {
        const settings = await getSettingsData();
        res.render('admin/privacypolicy', {
            title: "Privacy Policy",
            data: settings,
            error: null,
            success: null
        });
    } catch (error) {
        res.render('admin/privacypolicy', { title: "Privacy Policy", data: {}, error: 'Failed to load settings.' });
    }
};

// POST update Privacy Policy
exports.updatePolicy = async (req, res) => {
    try {
        const { privacy_policy } = req.body;
        await Setting.findOneAndUpdate({}, { privacy_policy: privacy_policy }, { upsert: true });
        
        const settings = await getSettingsData();
        res.render('admin/privacypolicy', {
            title: "Privacy Policy",
            data: settings,
            error: null,
            success: "Privacy policy updated successfully!"
        });
    } catch (error) {
        const settings = await getSettingsData();
        res.render('admin/privacypolicy', {
            title: "Privacy Policy",
            data: settings,
            error: 'Failed to update policy.',
            success: null
        });
    }
};

// 3. Cancellation Policy (GET / POST)
exports.renderCancellation = async (req, res) => {
    try {
        const settings = await getSettingsData();
        res.render('admin/cancellationpolicy', {
            title: "Cancellation Policy",
            data: settings,
            error: null,
            success: null
        });
    } catch (error) {
        res.render('admin/cancellationpolicy', { title: "Cancellation Policy", data: {}, error: 'Failed to load settings.' });
    }
};

// POST update Cancellation Policy
exports.updateCancellation = async (req, res) => {
    try {
        const { cancellation_refund } = req.body;
        await Setting.findOneAndUpdate({}, { cancellation_refund: cancellation_refund }, { upsert: true });
        
        const settings = await getSettingsData();
        res.render('admin/cancellationpolicy', {
            title: "Cancellation Policy",
            data: settings,
            error: null,
            success: "Cancellation policy updated successfully!"
        });
    } catch (error) {
        const settings = await getSettingsData();
        res.render('admin/cancellationpolicy', {
            title: "Cancellation Policy",
            data: settings,
            error: 'Failed to update policy.',
            success: null
        });
    }
};