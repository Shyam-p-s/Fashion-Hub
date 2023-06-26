const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    phone : {
        type : Number,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    isBlocked : {
        type : Boolean,
        default : false
    },
    address : [{
        name : String,
        address : String,
        phone : Number,
        pincode : Number,
        city : String,
        state : String
    }],
    coupon:[String]
    
})

const userDB = new mongoose.model('users',userSchema);
module.exports = userDB;