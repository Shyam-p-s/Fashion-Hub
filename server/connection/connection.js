const mongoose = require('mongoose')

const connectDB = async ()=>{
    try{
        const abc = await mongoose.connect('mongodb://127.0.0.1:27017/Project1',{
        useNewUrlParser: true,
        useUnifiedTopology: true,
        
    })
    console.log('mongodb connected');
    }catch(err){
        console.log(err);
        process.exit(1);
    }
}

module.exports = connectDB