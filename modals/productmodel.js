const { ObjectId } = require('mongodb');
const mongoose = require ('mongoose');

 const productSchema = new mongoose.Schema({

    productName : {
        type :String,
        required :true,
    },
  
    price : {
       type : Number,
       required:true
    },
    offName : {
       type : String,
       
    },
    offPercentage : {
       type : Number,
       default:0
    },
    offPrice : {
       type : Number,
    //    default:0
    },
    image:{
        type : Array,
        required: true
    },
    brand:{
        type : String,
        required: true
    },
    idealfor : {  //gender
        type : String,
        required:true,
    },
    category : { 
        type :  mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Catagory"
    },
    StockQuantity:{
        type :Number,
        required:true,
    },
    Status:{
        type :Boolean,
        default:true
    },
    description : {
        type :String,
        required:true,
    }
 })

 module.exports = mongoose.model ('product',productSchema);





 