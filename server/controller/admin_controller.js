const express = require('express');
const products = require('../model/add_products');
const category = require('../model/category_schema')
const users =require('../model/userSchema')
const order = require("../model/orderSchema")
const fs = require('fs');
const { log } = require('console');
const paypal = require('paypal-rest-sdk');
const coupons = require('../model/couponSchema')
const wallets = require('../model/walletSchema')
const multer = require('multer');
const sharp = require('sharp')

//getting admin index
exports.admin_Login = async (req,res) => {
    try{
        const today = new Date().toISOString().split("T")[0];
        const startOfDay = new Date(today);
        const endOfDay = new Date(today);
        endOfDay.setDate(endOfDay.getDate() + 1);
        endOfDay.setMilliseconds(endOfDay.getMilliseconds() - 1);

    
        const orders = await order.find(); //Fetching all orders from the database
    
        // Extracting necessary data for the chart
        const salesData = orders.map(order => ({
            createdAt: order.createdAt.toISOString().split('T')[0], // Extracting date only
            total: order.total
          }));
    
            // Calculating the total sales for each date
            const salesByDate = salesData.reduce((acc, curr) => {
                acc[curr.createdAt] = (acc[curr.createdAt] || 0) + curr.total;
                return acc;
              }, {});
    
              // Converting the sales data into separate arrays for chart labels and values
              const chartLabels = Object.keys(salesByDate);
              const chartData = Object.values(salesByDate);
    
              const todaySales = await order
                .countDocuments({
                  createdAt: { $gte: startOfDay, $lt: endOfDay },
                  status: "Delivered",
                })
                .exec();
                console.log('todaySales',todaySales);
    
                const totalsales = await order.countDocuments({ status: "Delivered" });
    
                const todayRevenue = await order.aggregate([
                    {
                      $match: {
                        createdAt: { $gte: startOfDay, $lt: endOfDay },
                        status: "Delivered",
                      },
                    },
                    { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
                  ]);
            
                  const revenue = todayRevenue.length > 0 ? todayRevenue[0].totalRevenue : 0;
                  const TotalRevenue = await order.aggregate([
                    {
                      $match: { status: "Delivered" },
                    },
                    { $group: { _id: null, Revenue: { $sum: "$total" } } },
                  ]);
                  const Revenue = TotalRevenue.length > 0 ? TotalRevenue[0].Revenue : 0;
      
                  console.log('TotalRevenue is',TotalRevenue);
    
                  const Orderpending = await order.countDocuments({ status: "Pending" });
                  const OrderReturn = await order.countDocuments({
                    status: "Returned",
                  });
                  const Ordershipped = await order.countDocuments({ status: "Shipped" });
                
                  const Ordercancelled = await order.countDocuments({
                    status: "Cancelled",
                  });
    
                  const salesCountByMonth = await order.aggregate([
                    {
                      $match: {
                        status: "Delivered",
                      },
                    },
                    {
                      $group: {
                        _id: {
                          month: { $month: "$createdAt" },
                          year: { $year: "$createdAt" },
                        },
                        count: { $sum: 1 },
                      },
                    },
                    {
                      $project: {
                        _id: 0,
                        month: "$_id.month",
                        year: "$_id.year",
                        count: 1,
                      },
                    },
                  ]);
    
                  console.log('salesCountByMonth is',salesCountByMonth);

                 const salesRevenueByMonth = await order.aggregate([
                    {
                        $match: {
                          status: "Delivered",
                        },
                      },
                      {
                        $group: {
                          _id: {
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" },
                          },
                          revenue: { $sum: "$total" }
                        },
                      },
                      {
                        $project: {
                          _id: 0,
                          month: "$_id.month",
                          year: "$_id.year",
                          revenue: 1
                        }
                      }
                
                 ])

                 console.log('salesRevenueByMonth is',salesRevenueByMonth);
    
        res.render('admin/adminIndex', {
            todaySales,
            totalsales,
            revenue,
            Revenue,
            Orderpending,
            Ordershipped,
            Ordercancelled,
            salesCountByMonth,
            salesRevenueByMonth,
            OrderReturn,
            chartLabels: JSON.stringify(chartLabels),
            chartData: JSON.stringify(chartData)
          }); 
    }catch(error){
        console.log(error);
    res.send({message : error.message ||'some error while logging admin' })
    }
   
}


//admin Login
exports.adminLogin = async(req,res) => {
   try{
    const email = req.body.email;
    const password = req.body.password;
    console.log(email,password);
    if(email == "admin@gmail.com"){
        if(password == "123"){
            req.session.admin = true;
            res.redirect('/admin')

        }else{
            res.render('admin/login',{message:"Invalid admin password"})
        }
    }else{
        res.render('admin/login',{message:"Invalid admin email address"})
    }
   }catch(error){
    console.log(error);
    res.send({message : error.message ||'some error while logging admin' })
   }

}

//admin Logout
exports.adminLogOut = (req,res) =>{
    req.session.admin = false;
    res.redirect('/admin')
}

//getting add product page
exports.addProducts = async (req,res)=>{
    try{
   
            const data = await category.find().exec()
            res.render('admin/add_products',{data})
     
    }catch(error){
        console.log(err);
        
        res.status(500).send({
            message: err.message || 'some error while getting add products page'
        })
    }
    
}


//adding products

exports.add_products = async  (req,res)=> {
    try{
        

            const product = new products({
                name : req.body.name,
                category : req.body.category,
                price : req.body.price,
                description : req.body.description,
               
            });
            // Crop and save each uploaded image
            const croppedImages = [];
            for (const file of req.files) {
                const croppedImage = `cropped_${file.filename}`;
          
                await sharp(file.path)
                  .resize(500, 600, { fit: "cover" })
                  .toFile(`uploads/${croppedImage}`);
          
                croppedImages.push(croppedImage);
              }

              product.image = croppedImages
              await product.save()
            console.log(product);
            
            res.redirect('/viewproducts');
    } catch (err) {
        console.log(err);
        res.render('admin/404error',{errMsg : err.message ||'error while adding category'})
       

}
}



//finding products
exports.view_products = async(req, res)=>{
    try {
      
            const productData = await products.find().exec()
            // console.log(productData);
            res.render('admin/products',{productData})
    
        
    } catch (error) {
        console.log(error);
        res.send({message: error.message})
    }
}

//delete products
exports.delete_product = async(req,res) => {
    try{
        const id = req.params.id;
        const result = await products.findByIdAndRemove(id);
        if(result){
            res.redirect('/viewproducts')
        }
        else{
            res.redirect('/viewproducts') 
        }
    }catch (err) {
        console.log(err);
        res.render('admin/404error',{errMsg : err.message ||'error while deleting products'})
       

}
}

// getting update product
exports.updateProduct =  async (req,res)=>{
    try{
    
            const {id} = req.params
            const product_data = await products.findById(id)
            const data = await category.find()
        if(!product_data ){
            // res.redirect('/viewproducts')
            res.status(500).send({
            message: err.message || 'some error while getting add products1 page'
        })
        }
        else{
        return res.render('admin/updateProduct',{product_data,data})
        }
    
      
    }catch(error){
      console.log(error);
      res.status(500).send({
        message: error.message || 'some error while getting add products page'
    })
     
    }
    
  }

//updating products

exports.update_product = async (req, res) => {
    try {
      const id = req.params.id;
      const files = req.files;
      let new_images = [];
      // Check if files were uploaded
      if (files && files.length > 0) {
       
  
        // Delete the previous images
        if (req.body.images && req.body.images.length > 0) {
          for (const image of req.body.images) {
            try {
                fs.unlinkSync(`./uploads/${image}`);
            } catch (error) {
              console.log(error);
            }
          }
        }
  
        // Crop and save the new images
        for (const file of files) {
        //   const newImage = file.filename;
        const newImage = `${file.fieldname}_${Date.now()}_${file.originalname}`;
  
          // Perform image cropping
          await sharp(file.path)
            .resize({ width: 500, height: 600 })
            .toFile(`./uploads/${newImage}`);
  
          new_images.push(newImage);
        }
      } else {
        new_images = req.body.images;
      }
  
      // Update the product using findByIdAndUpdate
      const updatedProduct = await products.findByIdAndUpdate(
        id,
        {
          name: req.body.name,
          category: req.body.category,
          description: req.body.description,
          price: req.body.price,
          image: new_images,
        },
        { new: true }
      );
  
      if (updatedProduct) {
        console.log("Product updated");
        res.redirect("/viewproducts");
      } else {
        console.log("Product not found");
        res.redirect("/viewproducts");
      }
    } catch (err) {
        console.log(err);
        res.render('admin/404error',{errMsg : err.message ||'error while updating product'})
       

}
  };
  



//category management

exports.addCategory = (req,res) => {
 
            res.render('admin/addCategory')
        }
  

//adding categories
exports.add_Category = async (req,res) => {
  try{
    const categories = await category.find().exec()
    const categoryName =  req.body.category

    // Check if the Category already exists
    const categoryExists = categories.some((cat) => cat.category === categoryName);

    //check category should starts with capital letter and remaining small letters
    const categoryRegex = /^[A-Z][a-z]*$/;
    const isValidCategory = categoryRegex.test(categoryName);

    if (categoryExists || !isValidCategory ) {

        // Display a warning message to the user
        console.log('Invalid category name');
        return res.render('admin/addCategory',{msg : 'Invalid category name'})
    }

    const newCategory = new category({
        category: req.body.category,
        description : req.body.description
    })
    console.log(newCategory);
    await newCategory.save()
    res.redirect('/categories')
  }catch(error){
    console.log(error);
    res.render('admin/404error',{errMsg : 'error while adding category'})
  }
}

//find categories
exports.categories = async (req,res) => {
    try{

            const categories = await category.find().exec()
             
            res.render('admin/categories',{categories})
          
            
    }catch(error){
        console.log(error);
        res.status(500).send({
            message : error.message || "some error occured while finding category"
        })
    }
}

// getting update category
exports.update_category = async(req,res) =>{
    try{
        const id = req.params.id;
       
        const data = await category.findById(id);
        console.log("data is",data);
        if(data){
            
            res.render('admin/edit_category',{data});
        }else{
            res.send('category can not found')
        }
    }catch(error){
        console.log(error);
        res.status(500).send({
            message : error.message || "some error occured while updating category"
        })
    }
}

//updating category
exports.updateCategory = async (req,res) => {
    try{
            const id = req.params.id;
            const Category = req.body.category;
            const Description = req.body.description;

            const categories = await category.find().exec()
            const categoryExists = categories.some((cat) => cat.category === Category);

            //check category should starts with capital letter and remaining small letters
            const categoryRegex = /^[A-Z][a-z]*$/;
            const isValidCategory = categoryRegex.test(Category);

            if(categoryExists){
                console.log('Sorry, Category name already exist');
                
                 const msg ='Sorry, Category name already exist'
                 const categories = await category.find().exec()
                 res.render('admin/categories',{categories : categories, msg : msg});
                 return ;
            }
            if(!isValidCategory){
                console.log('Category should starts with capital letter and remaining small letters');
                
                 const msg ='Category should starts with capital letter and remaining small letters'
                 const categories = await category.find().exec()
                 res.render('admin/categories',{categories : categories, msg : msg});
                 return ;
            }

            const updatedCategory = await category.findByIdAndUpdate(id,
                {
                    category : Category,
                    description : Description
                },{new : true})
        
               if(updatedCategory){
                console.log('category updated');
                console.log(updatedCategory);
                res.redirect('/categories')
               }else{
                res.send('can not update category')
               }
   
    }catch (err) {
        console.log(err);
        res.render('admin/404error',{errMsg : err.message ||'error while updating category'})
       

}
    

}

//delete category
exports.delete_category = async(req,res) =>{
    try{
       const id = req.params.id;
       const result = await category.findByIdAndRemove(id);
       if(result){
        res.redirect('/categories');
       }else{
        res.redirect('/categories');
       }
    }catch (err) {
        console.log(err);
        res.render('admin/404error',{errMsg : err.message ||'error while deleting category'})
       

}
}






//find user
exports.find_users = async (req,res)=>{
    try{

                const userdata = await users.find().exec()
            if(userdata){
                res.render('admin/users',{userdata})
            }else{
                res.send('can not find userData')
            }   
    }catch(err){
        console.log(err);
        res.send({message : err.message || "error occured while finding users"})
    }

}


//block user 
exports.block_user = async (req,res) =>{
    try{
        const id = req.params.id;
        const block = await users.findByIdAndUpdate(id,
        {
        isBlocked : true
        },
    { new : true});
    console.log(block);
    res.redirect('/users')

    }catch (err) {
        console.log(err);
        res.render('admin/404error',{errMsg : err.message ||'error while blocking user'})
       

}
    
}

//unblock user

exports.unblock_user = async (req,res) =>{
    try{
        const id = req.params.id;
        const block = await users.findByIdAndUpdate(id,
        {
        isBlocked : false
        },
    { new : true});
    console.log(block);
    res.redirect('/users')

    }catch (err) {
        console.log(err);
        res.render('admin/404error',{errMsg : err.message ||'error while unblocking user'})
       

}
    
}

//order management 

//getting view orders
exports.view_orders = async(req,res)=> {
try{
        const orders = await order.find()
        .populate("user")
        .populate('items.product')

        if(orders){
            res.render('admin/order_details',{orders})
        }
}catch(error){
    console.log(error);
    res.status(500).send({
        message : error.message || "some error occured while getting orders"
    })
}
}

// updating status in orders
exports.update_status = async (req,res) =>{
    try{

    const id = req.params.id;
    const new_status = req.body.status;
    const updation = await order.findByIdAndUpdate(id,
        {status : new_status },{new : true})
    if(updation){
        console.log("updated");
        
        res.redirect('/view_orders')
    }else{
        console.log("can not update status");
    }
    }catch(error){
        console.log(error);
        res.status(500).send({
        message : error.message || "some error occured while getting orders"
    })
    }
    
    
}

//Coupon Management

//getting coupons page
exports.all_coupons = async (req,res)=>{
    const getAllCoupons = await coupons.find().exec()
    if(getAllCoupons){
        res.render('admin/coupons',{coupon : getAllCoupons})
    }else{
        res.send('Can not find coupons')
    }
   
  }

//getting add coupon page
exports.add_coupons = (req,res) => {
    res.render('admin/addCoupons')
}


//add coupon
exports.add_coupon = async (req,res) =>{
    try{
        const{code, startingDate, expiryDate, discount} = req.body;

        const startDate = new Date(startingDate);
        const endDate = new Date(expiryDate);
        if(startDate >= endDate){
            return  res.render('admin/addCoupons',{msg :"Expiry date must be higher than starting date"})
        }

        if (isNaN(discount) || discount <= 0 || !Number.isInteger(+discount)){
            return  res.render('admin/addCoupons',{msg :"Discount should be a positive intiger"})

        }
        const coupon = new coupons({
            code : code,
            startingDate :startingDate,
            expiryDate : expiryDate,
            discount : parseInt(discount, 10),
            status : false
        })
        await coupon.save();
        console.log("coupon added sucessfully");
        return res.render('admin/addCoupons', { messsage : "Coupon added successfully" });
    }catch (err) {
        console.log(err);
        res.render('admin/404error',{errMsg : err.message ||'error while adding coupon'})
       

}
}

//delete coupon
exports.delete_coupon = async (req,res) => {
   try{
    const id = req.params.id;
    const deleteCoupon = await coupons.findByIdAndRemove(id);
    if(deleteCoupon){
        console.log('Coupon deleted successfully');
        res.redirect('/coupons')
    }else{
        console.log('Can not delete coupon');
    }
   }catch (err) {
    console.log(err);
    res.render('admin/404error',{errMsg : err.message ||'error while deleting coupon'})
   

}
}

//Activating coupon
exports.activateCoupon = async(req,res) => {
    const id = req.params.id;
    const coupon = await coupons.findByIdAndUpdate(id,
        {status : true},{new : true});
        if(coupon){
            console.log('Coupon activated');
            res.redirect('/coupons')
        }else{
            console.log('Can not activate coupon');
        }
}

//Deactivating coupon
exports.deactivateCoupon = async (req,res)=> {
    const id = req.params.id;
    const coupon = await coupons.findByIdAndUpdate(id,
        {status : false},{new : true});
        if(coupon){
            console.log('Coupon Deactivated');
            res.redirect('/coupons')
        }else{
            console.log('Can not deactivate coupon');
        }
}

//Editing coupon
exports.edit_Coupon = async (req,res) =>{
    try{
        const {code, startingDate, expiryDate, discount} = req.body;
       
        const id = req.params.id;
        const updatedCoupon = await coupons.findByIdAndUpdate(id,{
            code : code,
            startingDate :startingDate,
            expiryDate : expiryDate,
            discount : parseInt(discount, 10),
        },{new : true});
        if(updatedCoupon){
            console.log('Coupon updated successfully');
            res.redirect('/coupons')
        }else{
            console.log('Can not update coupon');
        }
        
    }catch (err) {
        console.log(err);
        res.render('admin/404error',{errMsg : err.message ||'error while editing coupon'})
       

}
    
    
}

//refund and creating wallet
exports.refund = async (req,res) => {
    const id = req.params.id ;
    try{
        const orders = await order.findById(id).populate("items.product");
        if(!orders){
            return res.send('order not found');
        }
        const wallet = await wallets.findOne({userId : orders.user})
        if(wallet){
              // User's wallet already exists, update the balance
              wallet.balance += orders.total;
            //   wallet.balance.toFixed(2);
              wallet.transactions.push(orders.payment_method);
              await wallet.save()
        }else{
            const newWallet = new wallets({
                userId : orders.user,
                orderId : orders._id,
                balance : orders.total,
                transactions : [orders.payment_method]
            })

            await newWallet.save()
        }

        await order.updateOne({_id:id},{$set :{status : 'Amount Refunded'}})
        res.redirect('/view_orders')
    }catch (err) {
        console.log(err);
        res.render('admin/404error',{errMsg : err.message ||'error while refunding'})
       

}
}

//sales report
exports.salesReport = async (req,res) =>{
    try{
        const sales = await order.find({status : 'Delivered'}).populate('items.product').populate('user')

        res.render('admin/sales_report', {sales});
    }catch(error){
        console.log(error);
        res.status(500).send({message : error.message || "Unable load sales report"})
    }
}


//filtering dates in sales report
exports.FilterbyDates = async(req,res) =>{
    try{
        const fromDate = req.body.fromdate;
        const toDate = req.body.todate;
        const sales = await order.find ({ status : 'Delivered', createdAt: { $gte: fromDate, $lte: toDate } }).populate ('items.product').populate ('user');
        res.render('admin/sales_report', {sales});


    }catch(error){
        console.log(error);
        res.status(500).send({message : error.message || "Unable filter sales report"})
    }
}

//category offer

//getting offer page