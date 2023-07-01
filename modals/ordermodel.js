const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({

deliveryAddress:{
    type:String,
    required:true
},
userId:{
    type:String,
    required:true
},
userName:{
    type:String,
    required:true
},
paymentMethod:{
    type:String,
    required:true
},
paymentId:{
    type:String
},
products: [{
    productId:{
        type:String,
        required:true,
        ref:"product"
    },
    count:{
        type:Number,
        default:1,
    },
    productPrice:{
        type:Number,
        required:true,
    },
    totalPrice:{
        type:Number,
        default:0,
    },
    status:{
        type:String,
        default:"placed"
    },
    deliveryDate:{
        type:Date,
        
    },
    cancelReason:{
        type:String,
        
    },
    returnReason:{
        type:String,
        
    },

}],
totalAmount:{
    type:Number,
    required:true
},
date:{
    type:Date
},
status:{
    type:String
},
orderWallet:{
    type:Number
},
},
)

const ordermodel = mongoose.model("order",orderSchema);
module.exports = ordermodel;