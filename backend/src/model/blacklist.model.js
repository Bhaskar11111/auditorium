const { default: mongoose } = require("mongoose");

const blacklistSchema=new mongoose.Schema({
    token:{
        type:String,
        required:[true,'token is required']
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expiresIn:"3d"
    }

})

const blacklistModel=mongoose.model('blacklist',blacklistSchema)

module.exports=blacklistModel