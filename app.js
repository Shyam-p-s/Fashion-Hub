const express = require('express');
const dotenv = require('dotenv')
const bodyparser = require('body-parser')
const path = require('path')
const session = require('express-session')
const nocache = require('nocache')
const userRouter = require('./server/routes/userRouter')
const adminRouter = require('./server/routes/adminRouter')
const twilioRouter = require('./server/routes/twilioRouter')
const connection = require('./server/connection/connection');
const connectDB = require('./server/connection/connection');
const paypal = require('paypal-rest-sdk');



const app = express();


const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;



const PORT = process.env.PORT || 5000

app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json())
app.use(nocache())


//session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { sameSite: "strict" }
}));

paypal.configure({
    'mode':'sandbox',
    'client_id':PAYPAL_CLIENT_ID,
    'client_secret':PAYPAL_CLIENT_SECRET
})


app.use('/twilio-sms',twilioRouter)

//seting view engine
app.set('view engine','ejs')

//loading assets
app.use(express.static(path.resolve(__dirname,"public")))
app.use(express.static("uploads"));

//loading routes
app.use('/',userRouter);
app.use('/',adminRouter);
app.use('/',twilioRouter);


//mongoDB connection
connectDB()


app.listen(PORT,()=>console.log(`Server started on http://localhost:${PORT}`));