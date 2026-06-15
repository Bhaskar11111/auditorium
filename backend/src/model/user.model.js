const { default: mongoose } = require("mongoose");

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:[true,'username is required'],
        unique:[true,'username should be unique'],
    },
    email:{
        type:String,
        required:[true,'email is required'],
        unique:[true,'email should be unique'],
    },
    password:{
        type:String,
        required:true,
        select:false
    }
})

const userModel=mongoose.model('user',userSchema)

module.exports=userModel