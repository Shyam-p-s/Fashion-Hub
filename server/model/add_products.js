const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');

var productSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    category : {
        type : String,
        required : true,
        ref : 'category'
    },
    description : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true,
        min: 0
    },
    image : {
        type : String,
        required : true
    }
})

productSchema.plugin(mongoosePaginate);
const products = new mongoose.model('Products',productSchema);

module.exports = products