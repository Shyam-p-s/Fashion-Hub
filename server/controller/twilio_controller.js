require('dotenv').config();
const users =require('../model/userSchema');
const cart = require('../model/cartSchema');
const banners = require('../model/bannerSchema');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const client = require('twilio')(accountSid, authToken);

//send otp
exports.sendOTP = async (req, res, next) => {
    console.log("sms");
    const { phone } = req.body;
    req.session.phone = phone
    try{
        const user = await users.findOne({phone : phone })
        if(!user){
            return res.render('user/otpLogin',{message : "User can not be found, Please Signup"})
        }else{
            if(user.isBlocked){
               return res.render('user/otpLogin',{message : "User is blocked"})
            }else{
                const otpResponse = await client.verify.v2
                .services(serviceSid)
                .verifications.create({
                    to:"+91"+phone,
                 channel: "sms",})
            }
        }
        return res.render('user/otpLogin',{msg : "OTP sent successfully"})

    }catch(error){
        res.status(error?.status || 400).send(error?.message || 'Something went wrong!');
    }
    
}

//verify otp
exports.verifyOTP = async (req, res, next) =>{
    const verificationCode = req.body.otp;
    const phoneNumber = req.session.phone;

    if(!phoneNumber){
        return res.render('user/otpLogin',{message : "Phone number is required"});

    }
    try{
        const verification_check = await client.verify.v2
          .services(serviceSid)
          .verificationChecks.create({
              to:"+91"+phoneNumber,
              code: verificationCode,
          });

          if (verification_check.status === 'approved') {
             // If the verification is successful,
             const user = await users.findOne({phone : phoneNumber });
             
             req.session.user =user;
             const userId = req.session.user?._id
              //finding cart count
                const userCart = await cart.findOne({userId : userId})
                const count = userCart ? userCart.products.length : null;
                const bannerData = await banners.find({status : true}).exec()
                
                res.render('user/index',{user, count, bannerData});
}
             

          else{
            // If the verification fails, return an error message
            return res.render('user/otpLogin',{message : "otp verification failed"});
          }
    }catch(error){
        res.status(500).send({ message: error.message || 'Some error occurred while verifying the code' });
    }
}