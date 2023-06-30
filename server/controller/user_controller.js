const users = require('../model/userSchema')
const products = require('../model/add_products');
const cart = require('../model/cartSchema')
const category = require('../model/category_schema')
const order = require("../model/orderSchema")
const bcrypt = require("bcrypt")
const fs = require('fs');
const { log } = require('console');
const Swal = require('sweetalert2');
const { resourceLimits } = require('worker_threads');
const paypal = require('paypal-rest-sdk');
const coupons = require('../model/couponSchema')
const wallets = require('../model/walletSchema')
const wishlists = require('../model/wishlistSchema')
const mongoosePaginate = require('mongoose-paginate-v2');

exports.homepage = async (req,res) =>{
        const user = req.session.user;
        const userId = req.session.user?._id
        //finding cart count
        const userCart = await cart.findOne({userId : userId})
        const count = userCart ? userCart.products.length : null;
        res.render('user/index',{user, count});
}

exports.userLogin = (req,res)=>{
    res.render('user/login');
}


exports.userSignup = (req,res)=>{
    res.render('user/signup');
}

//Otp login
exports.otp_login = (req,res) => {
    res.render('user/otpLogin')
}

// creating user
exports.createUser = async (req,res)=>{
  let existingEmail = await users.findOne({email : req.body.email})
  if(existingEmail){
    console.log('email already exists');
    return res.render('user/signUp',{message : " Sorry, Email already in use "})
   
  }

  let existingPhone = await users.findOne({phone :  req.body.phone})
  if(existingPhone){
    console.log('phone number already exists');
    return res.render('user/signUp',{message : " Sorry, Phone number already in use "})
  }

    const saltRounds = 10;
    bcrypt.hash(req.body.password,saltRounds,(err,hash)=>{
        if(err){
            res.status(500).send ({
                message: err.message || 'Some error occurred while hashing the password'
            })
            return;  
        }
        const userdata = new users ({
            name : req.body.name,
            email : req.body.email,
            phone : req.body.phone,
            password: hash
            
        })
        userdata.save()
        .then(()=>{
            let msg = "Registered Successfully"
            res.render('user/login',{msg})
        })
        .catch((err) => {
                res.status(500).send({
                  message: err.message || "Some error occurred while creating a create operation",
                });
            })
                                            
        })
        
    }
    
//finding user

exports.find_user = async (req,res) => {
    const email = req.body.email;
    const password = req.body.password;
    try{
        const user = await users.findOne({email : email})
        if(user){
            if(user.isBlocked){
                return res.render('user/login',{messsage: "User is blocked"})
            }
            const isMatch = await bcrypt.compare(password,user.password) 
            if (isMatch) {
                // password is valid
               req.session.user = user
               res.redirect('/');

            }else{
                res.render('user/login',{messsage: "Password is incorrect"})
            }
           
                
        }else{
            res.render('user/login',{messsage : "User not found. Please register"})
        }
    }catch(err){
        console.log(err);
        res.send("an error occured while logging in")
    }
}

//user log out
exports.log_out = (req,res)=>{
    req.session.user = null;
    res.redirect('/')
}
    
//getting products page
exports.shop = async (req, res) => {
  try {
    //finding cart count
    
    const userId = req.session.user?._id
    const userCart = await cart.findOne({userId : userId})
    const count = userCart ? userCart.products.length : null;


    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = 4; // Number of products per page
    const Category = req.query.category;
    console.log(Category);
    const search = req.query.search;
    const sort = req.query.sort; // Sort parameter (asc for low to high, desc for high to low)

    let productQuery = {};

    if (Category) {
      productQuery.category = Category;
    }
    
    if (search) {
      productQuery.name = { $regex: new RegExp(search, 'i') };
    }
    const data = await category.find(); //finding all categories
    
    const categoryCounts = {}; // Object to store category counts
     // Iterate over categories and count the products in each category
     for (const category of data) {
      const countCat = await products.countDocuments({
        ...productQuery,
        category: category.category,
      });
      categoryCounts[category.category] = countCat;
    }


    const sortOptions = {
      asc: { price: 1 }, // Low to high sorting
      desc: { price: -1 }, // High to low sorting
    };
    const sortOption = sortOptions[sort] || {}; // Get the corresponding sort option

    const options = {
      page,
      limit,
      sort: sortOption, // Apply the sort option to the query
    };

    const result = await products.paginate(productQuery, options);
    
    const { docs, totalPages } = result;
    // const product = await products.find(productQuery);
    const user = req.session.user;

    if (docs.length > 0) {
      res.render('user/shop', { product: docs,
         user,
          data,
           selectedCategory: Category,
            totalPages,
             currentPage: page,
              count,
               categoryCounts,
               selectedSort: sort, });
    } else {
      res.render('user/shop', { product: null, user, data, selectedCategory: Category, totalPages, currentPage: page, count, categoryCounts, selectedSort: sort, });
      // res.send("Cannot find products from the database.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error.message || "Some error occurred while finding shop",
    });
  }
};


//getting single product page
exports.single_product = async (req,res) => {
    try{
      //getting cart count
      const userId = req.session.user?._id
      const userCart = await cart.findOne({userId : userId})
      const count = userCart ? userCart.products.length : null;

        const {id} = req.params
        const product = await products.findById(id) 
        const user = req.session.user;
     
        if(product){
            res.render('user/shop_single',{product, user, count})
        }else{
            res.send("can not find product ")
        }
    }catch(error){
        console.log(error);
        res.status(500).send({
            message: error.message || "Some error occurred while finding single shop",
          });
    }
}

//getting cart page
exports.cart = async (req,res) =>{
    const user = req.session.user;
    if(user){
        try{
            const userId = req.session.user?._id;
            const data = await users.findOne({_id :userId });
            const userCart = await cart
            .findOne({userId:userId})
            .populate("products.productId");

            const count = userCart ? userCart.products.length : null;
            if(userCart){
                let products = userCart.products;
                res.render('user/cart',{userCart, products, user, data :data.address, count});
            }else{
                res.render('user/cart',{user, count})
            }
        }catch(error){
            console.log(error);
            res.status(500).send({message:error || "some error occured while getting cart"})
        }
    }else{
        res.redirect('/')
    }
        
   
}

//adding products to cart
exports.add_to_cart = async(req,res) =>{
    try{
    const userId = req.session.user?._id;
    const productId = req.params.id;
    let userCart = await cart.findOne({userId :userId });
    
    if(!userCart){
       // If the user's cart doesn't exist, create a new cart
       const newCart = new cart({
        userId :userId,
        products : []
       });
       await newCart.save()
       userCart = newCart;
    }

    const productIndex = userCart.products.findIndex(
        (product) => product.productId == productId 
    )

    if(productIndex === -1){
        //If the product is not in the cart, add it
        userCart.products.push({productId,quantity : 1})
    }else{
         // If the product is already in the cart, increase its quantity by 1
         userCart.products[productIndex].quantity += 1
    }
    await userCart.save()
    res.status(200).json({message : 'Product added to the cart sucessfully'})
    // res.redirect('/cart');
    console.log("Product added to cart successfully");


    }catch(error){
        console.log(error);
        res.status(500).json({message:error || "some error occured while adding to the cart"})
    }
    
}

//deleting cart item
exports.delete_CartItem = async (req,res) =>{
    try{
        const userId = req.session.user?._id;
        const productId = req.params.id;
        const productDeleted = await cart.findOneAndUpdate({userId : userId},
            {$pull : {products : {productId : productId}}},
            {new : true});
        if(productDeleted){
            res.redirect('/cart')
            console.log("product deleted sucessfully");
        }else{
            console.log("product deletion failed");
        }

    }catch(error){
        console.log(error);
        res.status(500).send({message:error || "some error occured while deleting product in the cart"}) 
    }
}

//increment quantities 
exports.incrementQuantity = async(req, res) =>{
    console.log("quantity incremented");
    const userId = req.session.user?._id;
    const cartId = req.body.cartId;
    try{

        const userCart = await cart
        .findOne({userId: userId })
        .populate('products.productId');
        const cartIndex = userCart.products.findIndex((items)=> 
            items.productId.equals(cartId)
            );
  
        console.log(cartIndex);
        userCart.products[cartIndex].quantity += 1;
        let result = await userCart.save();
        // console.log(result);
       
        
        const total = userCart.products[cartIndex].quantity *
                      userCart.products[cartIndex].productId.price ;
        
        const quantity = userCart.products[cartIndex].quantity;

        res.json({
            success: "Quantity updated",
            total,
            quantity,
          });

    }catch(error){
        console.log(error);
    res.json({ success: false, message: "Failed to update quantity" });
    }
}

//decrement quantities
exports.decrementQuantity = async(req, res) =>{
    console.log("quantity decremented");
  const cartItemId = req.body.cartItemId;
  const userId = req.session.user?._id;
  try{
    const userCart = await cart
    .findOne({userId: userId })
    .populate('products.productId');
    const cartIndex = userCart.products.findIndex((items)=> 
     items.productId.equals(cartItemId)
        );
    
    if(cartIndex === -1){
        return res.json({ success: false, message: "cart item not found" });
    }
    userCart.products[cartIndex].quantity -= 1;
    await userCart.save();
    const total = userCart.products[cartIndex].quantity *
                  userCart.products[cartIndex].productId.price ;
    
    const quantity = userCart.products[cartIndex].quantity;
    res.json({
        success: true,
        message: "Quantity updated successfully",
        total,
        quantity,
      });
  }catch(error){
    res.json({ success: false, message: "Failed to update Quantity" });
  }
};

//checkout page
exports.check_out =async (req, res) =>{
    try{
        const user = req.session.user;
        const userId = req.session.user?._id
        
        let addressDatas = await users.findOne({_id : userId})
                        
        let cartItems = await cart.findOne({userId : userId})
                    .populate('products.productId');

        const count = cartItems ? cartItems.products.length : null;
       
        res.render('user/checkout',{user, addressData : addressDatas.address, cartItems, count}); 

    
    }catch(error){
        console.log(error);
        res.status(500).send({message:error || "some error occured while loading checkout page"}) 
    }
    
}

//adding address to check out page
exports.add_address = async (req, res) => {
    try{
        const userId = req.session.user?._id ;
        console.log(userId);
        console.log(req.body);
        const {name, address, city, state, pincode, phone } = req.body;
        const user = await users.findOne({_id :userId})
        if(user){
            user.address.push({name,address, phone, pincode, city, state});
            let result = await user.save();
      
            console.log('address added sucessfully');
            res.redirect('/checkout');

        }else{
            console.log('can not find user');
            res.send('can not find user')
        }
    }catch(error){
        console.log(error);
        res.status(500).send({message : error ||"some error occured while adding address to checkout page" })
    }
}

//editing address in the checkout page
exports.edit_address = async(req, res) =>{
    try{
        const user = req.session.user;
        const userId = req.session.user?._id
        const {id} = req.params;

        const {name, address, city, state, pincode, phone } = req.body;
        const updateUser = await users.findOne({_id :  userId })
        addressIndex = await updateUser.address.findIndex((address)=> address._id.equals(id));
        updateUser.address[addressIndex].name = name;
        updateUser.address[addressIndex].address = address;
        updateUser.address[addressIndex].city = city;
        updateUser.address[addressIndex].state = state;
        updateUser.address[addressIndex].pincode = pincode;
        updateUser.address[addressIndex].phone = phone;
        await updateUser.save()
        console.log('address edited successfully');
        res.redirect('/checkout');
        // const address = await users.findOne({_id :userId},{address : {$elemMatch : {_id  : id}}})

    }catch(error){
        console.log(error);
        res.status(500).send({message:error || "some error occured while loading checkout page"}) 
    }
    
    
}

//deleting address in the checkout page
exports.deleteAddress = async (req, res) =>{
  try{
    const userId = req.session.user?._id;
    const addressId = req.params.id;

    const delAddress = await users.findByIdAndUpdate(
      userId,
      { $pull: { address: { _id: addressId } } },
      { new: true }
    );

    if(!delAddress){

      console.log('can not find the address to delete')
    res.json({success : false})
       
    }else{
      
      console.log('Address deleted successfully');
       res.json({success : true})
    }
  }catch(error){
        console.log(error);
        res.status(500).json({ success: false, error: error.message || "some error occured while deleting address in the  checkout page"});
       
    }
}

//confirm order for user
exports.confirm_orderPage = async (req, res) => {
    try{
        const user = req.session.user;
        const userId = req.session.user?._id
        
        const addressId = req.params.id
        let cartItems = await cart.findOne({userId : userId})
                        .populate('products.productId')
        const count = cartItems ? cartItems.products.length : null;
        const data = await users.findOne({_id :userId},{address : {$elemMatch : {_id : addressId}}})
        const coupon = await coupons.find({status : true})

       

        if(data){
            res.render('user/confirmOrder',{user, cartItems, data : data.address[0], coupon, count});

        }else{
            res.send("can not find data")
        }
                    

       
    }catch(error){
        console.log(error);
        res.status(500).send({message : error || 'some error occured'})
    }
   
}

let paypalTotal = 0
exports.confirm_order = async (req, res) => {
    try {
      const user = req.session.user;
      const userId = req.session.user?._id;

      const addressId = req.params.id;
      // console.log("id is", addressId);
      const payment = req.body.payment;
      console.log(payment);
      const currentUser = await users.findById(userId);
      console.log("currentUser is", currentUser);
  
      if (!currentUser) {
        return res.status(404).send('User not found');
      }
  
      const addressIndex = currentUser.address.findIndex((item) => item._id.equals(addressId));
      const specifiedAddress = currentUser.address[addressIndex];
  
      if (!specifiedAddress) {
        return res.status(404).send('Address not found');
      }
  
      const userCart = await cart.findOne({ userId: userId }).populate('products.productId');
      userCart ? console.log(userCart) : console.log("Cart not found");
      
      const discount = userCart.discount;
      const wallet = userCart.wallet;
  
      const items = userCart.products.map((item) => {
        const product = item.productId;
        const quantity = item.quantity;
        const price = product.price;
  
        if (!price) {
          throw new Error("Product price is required");
        }
        if (!product) {
          throw new Error("Product is required");
        }
        return {
          product: product._id,
          quantity: quantity,
          price: price,
        };
      });
  
      console.log('items are',items);
      let totalPrice = 0;
      items.forEach((item) => {
        totalPrice += item.price * item.quantity;
      });

      if(wallet){
        totalPrice -= wallet;
      }

      if(discount){
        totalPrice -= discount ;
      }
  
      if (payment === 'cod') {
        const orderDetails = new order({
          user: userId,
          items: items,
          total: totalPrice,
          status: 'Pending',
          payment_method: payment,
          createdAt: new Date(),
          address: specifiedAddress,
        });
  
        await orderDetails.save();
        await cart.deleteOne({ userId: userId });
        //to get the cart count on header
        const userCart = await cart.findOne({ userId: userId }).populate('products.productId');
        const count = userCart ? userCart.products.length : null;
        res.render('user/thankYou', { user, count });
      }


      else if(payment == "paypal"){

        const orderDetails = new order({
            user: userId,
            items: items,
            total: totalPrice,
            status: "Pending",
            payment_method: payment,
            createdAt: new Date(),
            address: specifiedAddress,
          })
          await orderDetails.save();
  
          userCart.products.forEach((element) => {
            paypalTotal += totalPrice
          })
  
          let createPayment = {
            intent: "sale",
            payer: { payment_method: "paypal" },
            redirect_urls: {
              return_url: `http://localhost:5000/paypal-success/${userId}`,
              cancel_url: "http://localhost:5000/paypal-err",
            },
            transactions: [ 
              {
                amount: {
                  currency: "USD",
                  total: (paypalTotal / 82).toFixed(2), // Divide by 82 to convert to USD
                },
                description: "Super User Paypal Payment",
              },
            ],
          };
  
          paypal.payment.create(createPayment, function (error, payment) {
            if (error) {
              console.log(error);
              throw error;
              
            } else {
              for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === "approval_url") {
                  res.redirect(payment.links[i].href);
                }
              }
            }
          });
          await cart.deleteOne({ userId: userId });
          
      }

      else {
        throw new Error('Invalid payment method');
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message || "Checkout failed!" });
    }
  };


  exports.paypal_success = async (req, res) => {
    const payerId = req.query.PayerID;

    const paymentId = req.query.paymentId;
    
    const userId = req.params.id
    const user = await users.findOne({ _id: userId });
    
    console.log("hgvfcg");
    console.log(paypalTotal);
    console.log("hgvfcg");
  
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
        "amount": {
          "currency": "USD",
          "total": paypalTotal
        }
      }]
    };
  
    paypal.payment.execute(paymentId, execute_payment_json, async function(error, payment) {
      if (error) {
        if (error.response && error.response.name === 'PAYER_ACTION_REQUIRED') {
          // Redirect the buyer to the PayPal resolution link
          const resolutionLink = error.response.links.find(link => link.rel === 'https://uri.paypal.com/rel/resolution');
          if (resolutionLink) {
            res.redirect(resolutionLink.href);
          } else {
            // Handle the case when resolution link is not available
            console.log('Resolution link not found.');
            throw error;
          }
        } else {
          console.log(error);
          throw error;
        }
      } else {
    
        console.log(JSON.stringify(payment));
        req.session.user = user;
        //to get the cart count on header
        const userCart = await cart.findOne({ userId: userId }).populate('products.productId');
        const count = userCart ? userCart.products.length : null;
        res.render("user/paypal_success", { payment, user, count });
      }
    });
  };
  
  
  
  exports.paypal_err = (req, res) => {
    console.log("Hi Error");
    console.log(req.query)
    res.send("error")
  }
  
  //view orders
  exports.view_orders = async (req,res)=>{
    try{
        const user = req.session.user;
        const userId = req.session.user?._id;
        const orders = await order.find({user : userId })
        .populate('user')
        .populate('items.product')
         //finding cart count
         const userCart = await cart.findOne({userId : userId})
         const count = userCart ? userCart.products.length : null;
                        
        res.render("user/viewOrders",{orders,user, count})

       
    }catch(error){
        console.log(error);
        res.status(500).send({message : error.message || "can not view orders"})
    }
       
    }

    //getting single orders page
    exports.single_orderPage = async (req, res) =>{
      try{
        const orderId = req.params.id;
        const user = req.session.user;
        const userId = req.session.user?._id;

        const singleOrder = await order.findOne({_id : orderId})
        .populate('user')
        .populate('items.product')

         //finding cart count
         const userCart = await cart.findOne({userId : userId})
         const count = userCart ? userCart.products.length : null;

        const orderedProducts = singleOrder.items;
        console.log('ordered product is', orderedProducts);

        console.log('single order is',singleOrder );
        if(singleOrder){
          res.render('user/singleOrderPg',{orders : singleOrder, user, orderedProducts, count})
        }else{
          res.send('can not find single order')
        }
      }catch(error){
        console.log(error);
        res.status(500).send({message : error.message || "can not view orders"})
      }
    }


 //cancel orders
exports.cancel_order = async (req, res) => {
    try {
      const user = req.session.user;
      const userId = req.session.user?._id;
      const orderId = req.params.id;
  
     
          // If the user confirms the cancellation, proceed with the cancellation logic
          const deletedOrder = await order.findByIdAndUpdate({ _id: orderId }, { status: 'Cancelled' }, { new: true });
  
          if (deletedOrder) {
            console.log('Order deleted successfully');
            res.redirect('/user/vieworders');
          } else {
            console.log('Order deletion failed');
          }
        }
      
     catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message || 'Some error occurred while cancelling an order' });
    }
  };


  //return order
  exports.return_order = async (req,res) =>{
    try{
      const user = req.session.user;
      const orderId = req.params.id;
      const returnOrder = await order.findByIdAndUpdate({_id : orderId},{status : 'Returned'},{new : true});
      if(returnOrder){
        console.log('order returned');
        res.redirect('/user/vieworders')
      }else{
        console.log('can not return order');
      }
    }catch(error){
      console.log(error);
      res.status(500).send({ message: error.message || 'Some error occurred while returning an order' });
    }
    
  }

  //invoice download
  exports.invoice = async (req,res) =>{
    try{
      const {id}= req.params
      const user = req.session.user
      const orders = await order.findById(id).populate('user').populate('items.product')

      res.render("user/invoice",{orders, user})

    }catch(error){
      console.log(error);
      res.status(500).send({ message: error.message || 'Some error occurred while getting invoice page' });
    }
  }

  //user profile Management 
  //getting user Profile
  exports.user_profile = async(req,res)=>{
    try{
    const id = req.session.user?._id
    const user = await users.findOne({_id : id});
  
    //finding cart count
    const userCart = await cart.findOne({userId : id})
    const count = userCart ? userCart.products.length : null;
    if(user){
        res.render('user/userProfile',{user, count})
    }else{
        console.log('user can not found');
        res.send('user can not found')
    }
    }catch(error){
        console.log(error);
        res.status(500).send({ message: error.message || 'Some error occurred while getting user page' });
    }
    
    
  }

  //updating user profile
  exports.update_profile = async (req,res) =>{
    const id = req.session.user?._id
    const user = req.session.user;
    const Name = req.body.name;
    const Email = req.body.email;
    const Phone = req.body.phone
    console.log(req.body);
    const updatedUser = await users.findByIdAndUpdate(id,
        {name : Name,
         email : Email,
         phone : Phone
        },
        {new : true})
        
        if(updatedUser){
            console.log("profile updated");
            res.redirect('/user/profile');
        }
  }

  //coupon management
  exports.redeemCoupon = async (req, res) => {
    const { coupon } = req.body;
    console.log('coupon from the body',coupon);
    const userId = req.session.user?._id
  
    const couponFind = await coupons.findOne({ code: coupon });
    const userCoupon = await users.findOne({_id:userId});

    //checking if coupon amount is larger than cart amount
    const userCart = await cart.findOne({userId: userId}).populate('products.productId')
       
      let totalPrice = 0

       const items = userCart.products.map(item =>{
        const product = item.productId;
        const quantity = item.quantity;
        const price = item.productId.price
       
       
        totalPrice += price * quantity;
  
      })

      if(couponFind.discount >= totalPrice){
        return res.json({
          success: false,
          message: 'Can not use, Discount amount exceeded'
        });
      }

  
    if (userCoupon.coupon.includes(coupon)) {
      return res.json({
        success: false,
        message: 'Coupon Already used'
      });
    }
  
    if (!couponFind || couponFind.status === false) {
      return res.json({
        success: false,
        message: couponFind ? 'Coupon Deactivated' : 'Coupon not found'
      });
    }
    userCoupon.coupon.push(coupon);
    await userCoupon.save();
  
    const currentDate = new Date();
    const expirationDate = new Date(couponFind.expiryDate);
  
    if (currentDate > expirationDate) {
      return res.json({
        success: false,
        message: 'Coupon Expired'
      });
    }
  
    const amount = couponFind.discount;
  
    res.json({
      success: true,
      message: 'Coupon available',
      couponFind,
      amount: parseInt(amount)
    });
  
  
    try {
      
      const userCart = await cart.findOne({userId:userId})
      userCart.discount=amount
     
      if (!userCart) {
        console.log("Cart not found");
        return; // or throw an error
      }
    
      userCart.discount = amount;
  
      await userCart.save();
  
    } catch (error) {
      console.error("Error updating cart:", error);
      // handle the error appropriately
    }
    
  
  };

  //getting wallet
  exports.wallet_page = async (req,res) =>{
    try{
      const userId = req.session.user?._id;
      const user = req.session.user;
      let sum = 0;
      const walletbalance = await wallets.findOne({ userId :userId}).populate('orderId');
      const orderDetails = await order.find({user : userId, status : 'Amount Refunded'}).populate('items.product');

       //finding cart count
       const userCart = await cart.findOne({userId : userId})
       const count = userCart ? userCart.products.length : null;
      
  
      if(walletbalance){
        sum += walletbalance.balance;
      }
      res.render('user/wallet',{walletbalance, wallet : walletbalance?.orderId, user, orderDetails, sum, count})

    }catch(error){
      console.log(error);
        res.status(500).send({ message: error.message || 'Some error occurred while getting wallet page' });
    }
   
  }

  //wallet pay
  exports.walletPay = async(req,res) =>{
    try{
      const userId = req.session.user?._id;
      const wallet = await wallets.findOne({userId: userId});
      const userCart = await cart.findOne({userId: userId}).populate('products.productId')
       
      let totalPrice = 0

       const items = userCart.products.map(item =>{
        const product = item.productId;
        const quantity = item.quantity;
        const price = item.productId.price
       
       
        totalPrice += price * quantity;
  
      })
      console.log(totalPrice,"before");
      let balance = (10 / 100) * totalPrice;
      
      let wallet_balance = wallet.balance;

      if(balance < wallet_balance){
        totalPrice -= balance;
        userCart.wallet = balance;
        await userCart.save()
        console.log(totalPrice,"after");

        console.log( wallet.balance,"before");
        wallet.balance -= balance;
        await wallet.save() ;
        console.log(wallet.balance,"after");

        res.json({
          success: true,
          message: "Wallet add Successful",
          totalPrice,
          wallet_balance
        });
    

      }else{

        res.json({
          success: false,
          message: "Wallet Payment failed",
          totalPrice,
          wallet_balance
        });
      }
    }catch(error){
      console.log(error);
        res.status(500).send({ message: error.message || 'Some error occurred while paying through wallet' });
    }
  }

  //wishlist management

  //adding to wishlist
  exports.addToWishlist = async (req, res) => {
    try {
      const userId = req.session.user?._id;
      const productId = req.params.id;
      let userWishlist = await wishlists.findOne({ userId: userId });
  
      if (!userWishlist) {
        // creating one
        let newWishlist = new wishlists({
          userId: userId,
          product: []
        });
        await newWishlist.save(); // <--- Use save() on the newWishlist object
        newWishlist.product.push(productId);
        console.log('new wishlist is', newWishlist);
        userWishlist = newWishlist;
      } else {
        const productExisted = userWishlist.product.includes(productId);

          if (productExisted) {
            return res.send('Product already exists in the wishlist');
          }
        userWishlist.product.push(productId);
        console.log('product added to wishlist');
        console.log(userWishlist);
      }
  
      // Save the changes to the userWishlist
      await userWishlist.save();
      res.status(200).json({message : 'Product added to the wishlist sucessfully'})
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message || 'Failed to add to the wishlist' });
    }
  }
  
  //getting wishlist page
  exports.wishlists = async(req,res) =>{
    try{
      const user = req.session.user;
      const userId = req.session.user?._id;
      const userWishlist = await wishlists.findOne({ userId: userId }).populate('product');
       //finding cart count
       const userCart = await cart.findOne({userId : userId})
       const count = userCart ? userCart.products.length : null;
      if(userWishlist){
        console.log("bbbbbbbbbbbb",userWishlist.product);
        res.render('user/wishlist',{user, userWishlist : userWishlist.product, count})
      }else{
        res.render('user/wishlist',{user, count})
        // res.send('failed to load wishlist')
      }
    }catch(error){
      console.log(error);
      res.status(500).send({ message: error.message || 'Failed to load the wishlist' });
    }
  }
  

  //deleting wishlist itemsl
  exports.deleteWishlist = async(req,res) => {
    try{
      const user = req.session.user;
      const userId = req.session.user?._id;
      const productId = req.params.id;

      const deletedItem = await wishlists.findOneAndUpdate({userId :userId},
        {$pull : {product : productId }},
            {new : true});

            if(deletedItem){
              console.log('Item deleted successfully');
              console.log(deletedItem);
              res.redirect('/wishlist')
            }

    }catch(error){
      console.log(error);
      res.status(500).send({ message: error.message || 'Failed to delete the wishlist' })
    }
  }

  