const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({

categoryOffer : {
    type:String,
    required:true
},
date:{
    type:Date,
    required:true
},
offer:{
    type:Number,
    required:true
},
status:{
    type:Boolean,
    required:true
}

})

const offer = new mongoose.model("offer",offerSchema)

module.exports = offer;