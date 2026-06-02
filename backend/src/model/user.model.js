const { default: mongoose } = require("mongoose");

const userSchema=mongoose.Schema({
    username:{
        type:String,
        required:[true,' Username is required'],
        unique:[true,' Username must be unique']
    },
    email:{
        type:String,
        required:[true,' Email is required'],
        unique:[true,' Email must be unique']
    },
    password:{
        type:String,
        required:true,
        select:false
    }

})

const userModel=mongoose.model('user',userSchema)

module.exports=userModel