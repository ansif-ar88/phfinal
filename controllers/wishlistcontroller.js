const usermodel = require("../modals/usermodal")
const productmodel = require("../modals/productmodel")
const wishlistmodel = require("../modals/wihlistmodel")
const cartmodel = require("../modals/cartmodel")

//================= LOAD WISHLIST ==================

const loadWishlist = async(req,res,next) => {
    try {
        const session = req.session.user_id
        const userData = await usermodel.find({_id:session})
        let wishlistData = await wishlistmodel.find({userId:session}).populate("products.productId");
        
        if(wishlistData.length > 0){
            const wishlist = wishlistData[0].products;
            const products = wishlist.map(wish => wish.productId);
            console.log(wishlist);
                res.render("wishlist",{
                    products,
                    wishlist,
                    userData:userData,
                    session
                })
            }else{
                res.render("wishlist",{
                    products:[],
                    wishlist:[],
                    userData:userData,
                    session
                })
            }
        
    } catch (error) {
        next(error);
    }
}


// ================ ADD TO WISHLIST =============

const addToWishlist = async(req,res) => {
    try {
        const userId = req.session.user_id
        const userData = await usermodel.findOne({ _id: userId });

        const productId = req.body.id        
        const wishlistData = await wishlistmodel.findOneAndUpdate({userId:userId})
            
            if(wishlistData){
                const checkEmpty = wishlistData.products.findIndex((wishlist) => 
                wishlist.productId == productId
                )
                if(checkEmpty != -1){
                    res.json({check:true});
                }else{
                    await wishlistmodel.updateOne({userId:userId},{
                        $push:{products:{productId:productId}}
                    })
                    res.json({success:true})
                }
            }else{
                const wishlist = new wishlistmodel({
                    userId:userId,
                     userName:userData.name,
                     products:[{
                         productId : productId
                     }]

                })
                const wish = await wishlist.save()
                if(wish){
                    res.json({success:true})
                        }
            
                }
            
    } catch (error) {
        console.log(error.message);
    }
}

// =================== ADD PRODUCT WISHLIST TO CART ====================

const addToCartFromWish = async (req, res) => {
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
          productPrice: productData.newPrice,
          totalPrice: productData.newPrice,
        });
        await cartData.save();
      }
  
      res.json({ success: true });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  //======================= DELETE PRODUCT FROM WISHLIST ==================
const deleteWishlist = async(req,res)=>{
  try{
   const id = req.session.user_id
   const proid = req.body.product
   const wishlistData = await wishlistmodel.findOne({userId:id});

   if (wishlistData.products.length === 1) {
        await wishlistmodel.deleteOne({userId:id})
        
   } else {
    const found = await wishlistmodel.updateOne({userId:id},{$pull:{products:{productId:proid}}})
   }
    res.json({success:true})

      
  }catch(error){
    console.log(error.message);
  }
  
}
module.exports = {
    loadWishlist,
    addToWishlist,
    addToCartFromWish,
    deleteWishlist,

}