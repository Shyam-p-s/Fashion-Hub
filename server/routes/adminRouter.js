const express = require('express');
const route = express.Router();
const admin_controller = require('../controller/admin_controller')
const multer = require('multer');
const fs = require('fs');
const middleware = require('../middlewares/middlewares')

//multer
//multer configuration for single pics

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage}).single('image');



//multer configuration for multiple pics
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // make sure directory exists
//     const uploadDir = './uploads';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir);
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     // remove spaces and special characters from original filename
//     const originalname = file.originalname.replace(/[^a-zA-Z0-9]/g, "");
//     // set filename to fieldname + current date + original filename
//     cb(null, `${file.fieldname}_${Date.now()}_${originalname}`);
//   },
// });

// var upload = multer({ storage: storage })
// .array('image', 4);


  


route.get('/admin',middleware.isAdminLoggedIn, admin_controller.admin_Login)
route.post('/admin',admin_controller.adminLogin)
route.get('/admin/logout',admin_controller.adminLogOut)
route.get('/addproducts', middleware.isAdminLoggedIn, admin_controller.addProducts)
route.post('/addproducts',upload, admin_controller.add_products)
route.get('/viewproducts', middleware.isAdminLoggedIn, admin_controller.view_products)
route.get('/delete_product/:id',middleware.isAdminLoggedIn, admin_controller.delete_product)
route.get('/updateProduct/:id',middleware.isAdminLoggedIn, admin_controller.updateProduct)
route.post('/updateProduct/:id', upload, admin_controller.update_product)
route.get('/addCategory',middleware.isAdminLoggedIn, admin_controller.addCategory)
route.post('/addCategory',admin_controller.add_Category)
route.get('/categories',middleware.isAdminLoggedIn, admin_controller.categories)
route.get('/delete_category/:id', middleware.isAdminLoggedIn, admin_controller.delete_category)
route.get('/users',middleware.isAdminLoggedIn, admin_controller.find_users)
route.get('/block_user/:id',middleware.isAdminLoggedIn, admin_controller.block_user)
route.get('/unblock_user/:id',middleware.isAdminLoggedIn, admin_controller.unblock_user)
route.get('/update_category/:id',middleware.isAdminLoggedIn, admin_controller.update_category)
route.post('/update_category/:id',admin_controller.updateCategory)
route.get('/view_orders',middleware.isAdminLoggedIn, admin_controller.view_orders)
route.post('/update_order/:id',middleware.isAdminLoggedIn, admin_controller.update_status)
route.get('/coupons', middleware.isAdminLoggedIn, admin_controller.all_coupons)
route.get('/addCoupons', middleware.isAdminLoggedIn, admin_controller.add_coupons)
route.post('/addCoupons', middleware.isAdminLoggedIn, admin_controller.add_coupon)
route.get('/deleteCoupons/:id', middleware.isAdminLoggedIn, admin_controller.delete_coupon)
route.get('/activate_coupon/:id', middleware.isAdminLoggedIn, admin_controller.activateCoupon)
route.get('/deactivate_coupon/:id', middleware.isAdminLoggedIn, admin_controller.deactivateCoupon)
route.post('/editCoupon/:id', middleware.isAdminLoggedIn, admin_controller.edit_Coupon)
route.get('/refund/:id',middleware.isAdminLoggedIn,admin_controller.refund )
route.get('/salesReport',middleware.isAdminLoggedIn,admin_controller.salesReport)
route.post('/adminSalesReportFilter',middleware.isAdminLoggedIn,admin_controller.FilterbyDates)


module.exports = route;