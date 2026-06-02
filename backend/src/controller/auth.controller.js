const userModel = require("../model/user.model")
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const blacklistModel = require("../model/blacklist.model")
const redis=require('../config/cache')

const registerUser=(async(req,res)=>
{
    const{username,email,password}=req.body

    const isUserExist=await userModel.findOne({
        $or:
        [
            {username},
            {email}
        ]
    })

    if(isUserExist)
    {
        return res.status(400).json({
            message:"User already exists"
        })
    }

    const hash=await bcrypt.hash(password,10)

    const user=await userModel.create({
        username,
        email,
        password:hash
    })

    const token=jwt.sign({
        id:user._id,
        username
    },process.env.JWT_SECRET,
{
    expiresIn:"3d"
})

    res.cookie('token',token)

    return res.status(200).json({
        message:'User registered successfully',
        user:{
            id:user._id,
            username,
            email
        }
    })
})

const loginUser=(async(req,res)=>
{
    const{username,email,password}=req.body

    const user=await userModel.findOne({
        $or:
        [
            {email},
            {username}
        ]
    }).select("+password")

    if(!user)
    {
        return res.status(401).json({
            message:'Invalid Credentials'
        })
    }

    const hash=await bcrypt.compare(password,user.password)
    
    if(!hash)
    {
        return res.status(401).json({
            message:'Invalid Credentials'
        })
    }

    const token=jwt.sign({
        id:user._id,
        username
    },process.env.JWT_SECRET,
{
    expiresIn:"3d"
})

    res.cookie('token',token)

    return res.status(200).json({
        message:'User logged in successfully',
        user:{
            id:user._id,
            username,
            email
        }
    })
})

const getUser=(async(req,res)=>
{
    const user=await userModel.findById(req.user.id)

    return res.status(200).json({
        message:'User fetched successfully',
        user
    })
})

const logoutUser=(async(req,res)=>
{
    const token=req.cookies.token

    if(!token)
    {
        return res.status(401).json({
            message:'Token not found'
        })
    }

    res.clearCookie('token',token)

    await blacklistModel.findOne({
        token
    })

    return res.status(200).json({
        message:'Logged out successfully'
    })
})

module.exports=
{
    registerUser,
    loginUser,
    getUser,
    logoutUser
}


