const mongoose = require('mongoose');

var categorySchema = new mongoose.Schema({
    category :{
        type : String,
        required : true,
        unique : true
    },
    description : {
        type : String,
        required : true
    }
})

const Category = new mongoose.model('category',categorySchema)
module.exports = Category