const express = require("express")
const userRoute = express()
const Auth = require("../middleware/userAuth")
const errorHandler = require('../middleware/errorHandler')



//view engine
userRoute.set("view engine","ejs");
userRoute.set("views","./views/userViews")

const userController = require("../controllers/usercontroller")
const cartController = require ('../controllers/cartcontroller.js')
const addressController = require('../controllers/addresscontroller')
const orderController =  require ('../controllers/ordercontroller')
const wishlistController = require('../controllers/wishlistcontroller')
const offerController = require('../controllers/offercontroller')



userRoute.get("/signup",Auth.isLogout, userController.loadRegister);
userRoute.post("/signup", userController.insertUser);
userRoute.get("/otp", userController.loadVerification);
userRoute.post("/otp", userController.verifyEmail);
userRoute.get("/forgotPassword", userController.forgotPassword);
userRoute.post('/forgotPassword',userController.forgotVerifyMail)
userRoute.post('/verifyForgot',userController.verifyForgotMail)
userRoute.post('/resubmitPassword',userController.resubmitPassword)

userRoute.get("/",userController.loadHome)

userRoute.get("/login",Auth.isLogout, userController.loadLogin);

userRoute.post("/login", userController.verifyLogin);


userRoute.get("/home",userController.loadHome)
userRoute.get("/logout",Auth.isLogin, userController.userLogout);

userRoute.get("/shop", userController.loadShop)
userRoute.get("/filterCategory/:id",userController.filterByCategory)
userRoute.get("/showProduct/:id", userController.loadShowproduct)
userRoute.post("/form", userController.searchProduct)
userRoute.get("/priceSort/:id", userController.priceSort)



userRoute.get("/profile",Auth.isLogin,userController.loadProfile)



userRoute.post('/addtocart',Auth.isLogin,cartController.addToCart);
userRoute.post('/changeQuantity',Auth.isLogin,cartController.changeProductCount);
userRoute.post('/deletecart',Auth.isLogin,cartController.deletecart);
userRoute.get('/cart',Auth.isLogin,cartController.loadCart);
userRoute.get('/cartEmpty',Auth.isLogin,cartController.loadEmptyCart);


userRoute.get('/address',Auth.isLogin,addressController.showAddress)
userRoute.get('/addAddress',Auth.isLogin,addressController.loadAddAddress)
userRoute.get('/editAddress/:id',Auth.isLogin,addressController.loadEditAddress)
userRoute.post('/addAddress',Auth.isLogin,addressController.addAddress)
userRoute.post('/editAddress/:id',Auth.isLogin,addressController.editAddress)
userRoute.post('/deleteAddress',Auth.isLogin,addressController.deleteAddress)




userRoute.get('/checkout',Auth.isLogin,orderController.loadChekout)
// userRoute.get('/checkout',Auth.isLogin,orderController.loadEmptyCheckout)
userRoute.post('/verifyPayment',orderController.verifyPayment)
userRoute.post('/placeOrder',orderController.placeOrder);
userRoute.post('/returnOrder',orderController.returnOrder);



userRoute.get("/orders",Auth.isLogin,orderController.loadOrderUser)
userRoute.get("/vieworder/:id",Auth.isLogin, orderController.loadViewSingleUser)
userRoute.post('/cancelOrder',Auth.isLogin,orderController.CancelOrder);

userRoute.get('/wishlist',Auth.isLogin,wishlistController.loadWishlist)
userRoute.post('/addtoWishlist',Auth.isLogin,wishlistController.addToWishlist);
userRoute.post('/addtocartfromwish',Auth.isLogin,wishlistController.addToCartFromWish);
userRoute.post('/deletewishlist',Auth.isLogin,wishlistController.deleteWishlist);

userRoute.post('/applyCoupon',offerController.applyCoupon)

userRoute.get('/invoiceDownload/:id',Auth.isLogin,userController.loadinvoice)



userRoute.use(errorHandler)

userRoute.get("*",function(req,res) {
    res.redirect("/")
})

module.exports = userRoute