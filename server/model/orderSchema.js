const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required : true
    },
    items : [{
        product : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
            required : true 
        },
        quantity : {
            type: Number,
            required: true,
            min: 1
        },
        price : {
            type: Number,
            required: true,
            min: 0
        }
    }],
    total : {
        type: Number,
        required: true,
        min: 0
    },
    status : {
        type: String,
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled','Returned','Amount Refunded'],
        default: 'Pending'
    },
    createdAt : {
        type: Date,
        default: Date.now  
    },
    payment_method : {
        type: String,
        enum: ['cod', 'paypal', 'banktransfer'],
        required: true,
    },
    address : {
        type: Object,
        required: true
    }

});

const Order = mongoose.model("orders",orderSchema);
module.exports = Order;