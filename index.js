require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const { connection } = require('./config/connection');
const apiRoutes = require('./app/routes/api.routes');
const adminRoutes = require('./app/routes/admin.routes');
// const webRoutes = require('./app/routes/web.routes');
const authRoutes = require('./app/routes/auth.router'); 
const auth = require('./app/middlewares/auth.middleware');

const PORT = process.env.PORT || 2222;
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(fileUpload({
    useTempFiles: true,  
    tempFileDir: '/tmp/'  
}));

app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: true,
    saveUninitialized: true,
    cookie: { 
        // secure: process.env.NODE_ENV === 'production',  
        maxAge: 1000 * 60 * 60 * 24  
    }
}));
connection().then(() => {
    console.log('Connected to MongoDB');
    app.use('/', authRoutes); 
    app.use('/api', apiRoutes);
    app.use('/admin', adminRoutes);

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});