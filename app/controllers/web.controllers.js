// Render the home page index page
exports.index = (req, res) => {
    res.render('index', { title: "Home Page" });
};

// // Render the privacy policy page
// exports.privacyPolicy = (req, res) => {
//     res.render('privacypolicy', { title: "Privacy Policy" });
// };


// GET - Sign In page
exports.signIn = (req, res) => { 
    res.render('auth/signin', { 
        title: "Sign In",
        error: null,
        success: null,
        errors: {},
        old: {}
    });
};

// GET - Sign Up page
exports.signUp = (req, res) => { 
    res.render('auth/signup', { 
        title: "Sign Up",
        error: null,
        success: null,
        errors: {},
        old: {}
    });
};

//  dahsboard page
exports.dashboard = (req, res) => {
    res.render('admin/dashboard', { currentPage: 'dashboard' });
};

// settings page
exports.settings = (req, res) => {
    res.render('admin/settings', { title: "Settings" });
};

// order page
exports.orders = (req, res) => {
    res.render('admin/orders', { title: "Orders" });
};

// view order page
exports.viewOrder = (req, res) => {
    res.render('admin/view-order', { title: "View Order" });
};

// reports page
exports.reports = (req, res) => {
    res.render('admin/reports', { title: "Reports" });
};

// patient page
exports.patients = (req, res) => {
    res.render('admin/patients', { title: "Patients" });
}
// view patient page
exports.viewPatient = (req, res) => {
    res.render('admin/view-patient', { title: "View Patient" });
}
//  address page
exports.addresses = (req, res) => {
    res.render('admin/addresses', { title: "Addresses" });
}

// Laboratory page
exports.laboratory = (req, res) => {
    res.render('admin/laboratory', { title: "Laboratory" });
};

// view laboratory page
exports.viewLaboratory = (req, res) => {
    res.render('admin/view-laboratory', { title: "View Laboratory" });
};

// // categories page
// exports.categories = (req, res) => {
//     res.render('admin/categories', { title: "Categories" });
// }

// packages page
exports.packages = (req, res) => {
    res.render('admin/packages', { title: "Packages" });
}

// sub packages page
exports.subPackages = (req, res) => {
    res.render('admin/sub-packages', { title: "Sub Packages" });
}

// banners page
exports.banners = (req, res) => {
    res.render('admin/banners', { title: "Banners" });
};
    
// offers page
exports.offers = (req, res) => {
    res.render('admin/offers', { title: "Offers" });
}

//  doctors page
exports.doctors = (req, res) => {
    res.render('admin/doctors', { title: "Doctors" });
}

// users page
exports.users = (req, res) => {
    res.render('admin/users', { title: "Users" });
}

// user permissions page
exports.userPermissions = (req, res) => {
    res.render('admin/user-permissions', { title: "User Permissions" });
}

// privacy policy page
exports.privacyPolicy = (req, res) => {
    res.render('admin/privacypolicy', { title: "Privacy Policy" });
}

// terms and conditions page
exports.termsAndConditions = (req, res) => {
    res.render('admin/termsandconditions', { title: "Terms and Conditions" });
}

// Cancellation Policy page
exports.cancellationPolicy = (req, res) => {
    res.render('admin/cancellationpolicy', { title: "Cancellation Policy" });
}