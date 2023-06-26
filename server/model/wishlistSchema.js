const mongoose = require('mongoose');

const wishlistShema = new mongoose.Schema({
    userId : {
        type  : mongoose.Schema.Types.ObjectId,
        ref : 'users',
        required : true
    },
    product : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required : true 
    }],
    createdAt : {
        type: Date,
        default: Date.now  
    }

})

const wishlist =  mongoose.model("wishlist", wishlistShema);
module.exports = wishlist;