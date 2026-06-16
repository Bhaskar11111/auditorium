import mongoose from "mongoose";

const songSchema=mongoose.Schema({
    url:{
        type:String,
        required:true
    },
    imgUrL:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    genre:{
        type:String,
        required:true
    }
})

const songModel=mongoose.model('song',songSchema)

module.exports=songModel