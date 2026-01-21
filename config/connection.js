const mongoose = require('mongoose');

const connection = async () => {
    global.connection = await mongoose.connect(process.env.MONGO_DB_URL, {});
}

module.exports = {connection}