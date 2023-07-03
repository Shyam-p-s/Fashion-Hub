const express = require('express');
const route = express.Router();
const user_controller = require('../controller/user_controller') 
const middleware = require('../middlewares/middlewares')





route.get('/',middleware.isLoggedIn,user_controller.homepage)
route.get('/login',middleware.isLogged, user_controller.userLogin)
route.get('/otp/login', user_controller.otp_login)
route.get('/user/logout',user_controller.log_out)
route.post('/login',middleware.isLogged, user_controller.find_user)
route.get('/signup', middleware.isLogged, user_controller.userSignup)
route.post('/signup',user_controller.createUser)
route.get('/shop',middleware.isLoggedIn,user_controller.shop)
route.get('/shop/single/:id',middleware.isLoggedIn, user_controller.single_product)
route.get('/cart', middleware.isLoggedIn, user_controller.cart)
route.get('/addToCart/:id', middleware.isLoggedIn, user_controller.add_to_cart)
route.get('/deleteCartItem/:id',user_controller.delete_CartItem)
route.post('/incrementQuantity',user_controller.incrementQuantity)
route.post('/decrementQuantity',user_controller.decrementQuantity)
route.get('/checkout', middleware.isLoggedIn, user_controller.check_out)
route.post('/addAddress',user_controller.add_address)
route.post('/edit/address/:id', user_controller.edit_address)
route.delete('/deleteAddress/:id',middleware.isLoggedIn,user_controller.deleteAddress )
route.get('/confirmOrder/:id', middleware.isLoggedIn, user_controller.confirm_orderPage)
route.post('/confirmOrder/:id',middleware.isLoggedIn, user_controller.confirm_order)
route.get('/user/vieworders', middleware.isLoggedIn, user_controller.view_orders)
route.get('/orderCancelled/:id', middleware.isLoggedIn, user_controller.cancel_order)
route.get('/orderReturned/:id', middleware.isLoggedIn, user_controller.return_order)
route.get('/user/profile', middleware.isLoggedIn, user_controller.user_profile)
route.post('/user/profile', middleware.isLoggedIn, user_controller.update_profile)
route.get('/paypal-success/:id', user_controller.paypal_success)
route.get('/paypal-err/:id', user_controller.paypal_err)
route.post("/redeem_coupon",middleware.isLoggedIn, user_controller.redeemCoupon)
route.get('/wallet',middleware.isLoggedIn,user_controller.wallet_page )
route.put('/wallet-pay',middleware.isLoggedIn,user_controller.walletPay )
route.post("/addToWishlist/:id",middleware.isLoggedIn,user_controller.addToWishlist);
route.get('/wishlist',middleware.isLoggedIn, user_controller.wishlists)
route.get('/deleteWishlistItem/:id',middleware.isLoggedIn, user_controller.deleteWishlist)
route.get('/user/orderDetails/:id',middleware.isLoggedIn, user_controller.single_orderPage);
route.get('/invoice/:id',middleware.isLoggedIn, user_controller.invoice)


module.exports = route;