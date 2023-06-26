const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code : {
        type : String,
        required : true
    },
    startingDate : {
        type : Date,
        required : true
    },
    expiryDate : {
        type : Date,
        required : true
    },
    discount : {
        type : String,
        required : false
    },
    status  : {
        type : Boolean,
        dafault : false
       
    }
})

const Coupon = new mongoose.model("coupons", couponSchema)
module.exports = Coupon