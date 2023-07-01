// const { match } = require ('assert')
const cartmodel = require("../modals/cartmodel");
// const categorymodel = require ('../modals/categorymodel')
const session = require ('express-session')
const usermodel = require("../modals/usermodal");
const productmodel = require("../modals/productmodel");

//================== LOAD CART PAGE ===============

const loadCart = async (req, res,next) => {
  try {
    let id = req.session.user_id;
    const session = req.session.user_id;
    let userName = await usermodel.findById({ _id:id });

    let cartData = await cartmodel.findOne({ userId: id }).populate("products.productId");
    if (id) {
        if(cartData){
      if (cartData.products.length > 0) {
        const products = cartData.products;
        const total = await cartmodel.aggregate([
          { $match: { userId: id } },
          { $unwind: "$products" },

          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: ["$products.productPrice", "$products.count"],
                },
              },
            },
          },
        ]);

        const Total = total.length > 0 ? total[0].total : 0;
        
        const totalAmount = Total;
        const userId = userName._id;
        
        res.render("cart", {
          products: products,
          Total: Total,
          userId,
          session,
          totalAmount,
          userData:userName
        });
      } else {
        res.render("CartEmpty", {
           
        userData: userName,
        session,
        message: "No Products Added to Cart",
        });
      }
    }else{
        res.render("CartEmpty", {
            
            userData: userName,
            session,
            message: "No Products Added to Cart",
            });
    }
    } else {
        res.redirect("/login");

    }
  } catch (error) {
    next(error);
  }
};


//================== LOAD EMPTYCART PAGE ===============

const loadEmptyCart = async (req,res,next) =>{
    try {
        res.render("cartEmpty")
    } catch (error) {
      next(error);
    }
}

//================ ADD TO CART ===============



const addToCart = async (req, res,next) => {
  try {
    const userId = req.session.user_id;
    const userData = await usermodel.findOne({ _id: userId });
    
    const productId = req.body.id;
    const productData = await productmodel.findOne({ _id: productId });

    const productQuantity = productData.StockQuantity;

    const cartData = await cartmodel.findOneAndUpdate(
      { userId: userId },
      {
        $setOnInsert: {
          userId: userId,
          userName: userData.name,
          products: [],
        },
      },
      { upsert: true, new: true }
    );

    const updatedProduct = cartData.products.find((product) => product.productId === productId);
    const updatedQuantity = updatedProduct ? updatedProduct.count : 0;

    if (updatedQuantity + 1 > productQuantity) {
      return res.json({
        success: false,
        message: "Quantity limit reached!",
      });
    }

    const cartProduct = cartData.products.find((product) => product.productId === productId);

    let newPrice;

if(productData.offPrice > 0){
  newPrice = productData.offPrice
}else{
  newPrice = productData.price
}
    if (cartProduct) {
      await cartmodel.updateOne(
        { userId: userId, "products.productId": productId },
        {
          $inc: {
            "products.$.count": 1,
            "products.$.totalPrice": newPrice,
          },
        }
      );
    } else {
      cartData.products.push({
        productId: productId,
        productPrice : newPrice,
        totalPrice : newPrice,
      });
      await cartData.save();
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
  
//============ CHANGE PRODUCT QUANTITY =============

const changeProductCount = async (req, res,next) => {
  try {
    const userData = req.session.user_id;
    const proId = req.body.product;
    let count = req.body.count;
    count = parseInt(count);
    const cartData = await cartmodel.findOne({ userId: userData });
    const product = cartData.products.find((product) => product.productId === proId);
    const productData = await productmodel.findOne({ _id: proId });
    
    const productQuantity = productData.StockQuantity
    const updatedCartData = await cartmodel.findOne({ userId: userData });
    const updatedProduct = updatedCartData.products.find((product) => product.productId === proId);
    const updatedQuantity = updatedProduct.count;
    
    if (count > 0) {
      
      if (updatedQuantity + count > productQuantity) {
        res.json({ success: false, message: 'Quantity limit reached!' });
        return;
      }
    } else if (count < 0) {
     
      if (updatedQuantity <= 1 || Math.abs(count) > updatedQuantity) {
       
        res.json({ success: true });
        return;
      }
    }

    const cartdata = await cartmodel.updateOne(
      { userId: userData, "products.productId": proId },
      { $inc: { "products.$.count": count } }
    );
    const updateCartData = await cartmodel.findOne({ userId: userData });
    const updateProduct = updateCartData.products.find((product) => product.productId === proId);
    const updateQuantity = updateProduct.count;

    let newPrice;

    if(productData.offPrice > 0){
      newPrice = productData.offPrice
    }else{
      newPrice = productData.price
    }
    const price = updateQuantity *newPrice;

    await cartmodel.updateOne(
      { userId: userData, "products.productId": proId },
      { $set: { "products.$.totalPrice": price } }
    );
  
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};


//======================= DELETE PRODUCT FROM CART ==================
const deletecart = async(req,res)=>{
  try{
   const id = req.session.user_id
   const proid = req.body.product
   const cartData = await cartmodel.findOne({userId:id});

   if (cartData.products.length === 1) {
        await cartmodel.deleteOne({userId:id})
        
   } else {
    const found = await cartmodel.updateOne({userId:id},{$pull:{products:{productId:proid}}})

   }

  
   
    res.json({success:true})

      
  }catch(error){
    console.log(error.message);
  }
  
}

module.exports = {
  loadCart,
  addToCart,
  changeProductCount,
  loadEmptyCart,
  deletecart
};
