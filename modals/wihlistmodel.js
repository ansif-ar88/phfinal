const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')
const wishlistSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    userName:{
        type:String,
        required:true
    },
    products:[{
        productId:{
            type:ObjectId,
            ref:"product",
            required:true
        }
    }]
}) 

module.exports = mongoose.model("wishlist",wishlistSchema)