const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId : {
        type  : mongoose.Schema.Types.ObjectId,
        ref : 'users',
        required : true
    },
    orderId : [{
        type  : mongoose.Schema.Types.ObjectId,
        ref : 'orders'
    }],
    balance : {
        type : Number,
        required : true
    },
    transactions : [{
        type : String,
        required : true
    }]
})

const wallets = new mongoose.model('wallet',walletSchema)
module.exports = wallets