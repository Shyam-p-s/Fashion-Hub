const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'users',
        required : true
    },
    products : [
        {
        productId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Products',
            required : true
        },
        quantity : {
            type : Number,
            required : true,
            default : 1
        }
     }
    ],
    discount: {
        type: Number,
  
    },
    wallet:{
        type:Number
    }
  
},{timestamps : true});

const cart = new mongoose.model("cart",cartSchema);
module.exports = cart;