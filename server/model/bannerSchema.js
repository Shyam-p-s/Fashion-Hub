const mongoose=require('mongoose')

const bannerSchema = await mongoose.Schema({
    heading : {
        type : String,
        required : true
    },
    subHeading : {
        type : String,
        required : true
    },
    image : [{
        type : String,
        required : true
    }],
    createdAt: {
        type: Date,
        default :Date.now

    },
    status : {
        type : Boolean,
        default : false
    }
})

const banner = new mongoose.model('banner',bannerSchema);
module.exports = banner;