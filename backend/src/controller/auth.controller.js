require('dotenv').config()
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')

const redis=require('../config/cache')

const userModel = require("../model/user.model")
const blacklistModel = require('../model/blacklist.model')


const registerUser=(async(req,res)=>
{
    const{username,email,password}=req.body

    const isUserExists=await userModel.findOne({
        $or:[

            {username},
            {email}
        ]
    })

    if(isUserExists)

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

    res.status(200).json({

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
    const{identifier,password}=req.body
    console.log(req.body);
    console.log(identifier)

        const user=await userModel.findOne({
            $or:[
                {username:identifier},
                {email:identifier}
            ]
        }).select("+password")

    if(!user)
    {
        res.status(401).json({
            message:'Unauthorized access'

        })
    }

    const hash=await bcrypt.compare(password,user.password)

    if(!hash)
    {
         res.status(401).json({
            message:'Invalid credentials'

        })
    }

    const token=jwt.sign({
        id:user._id,
        identifier

    },process.env.JWT_SECRET,
{
    expiresIn:"3d"
})
    res.cookie('token',token)

    res.status(200).json({
        message:'Logged in successfully',
        user:{
            id:user._id,
            identifier

        }
    })
})

const getUser=(async(req,res)=>
{
    const token=req.cookies.token
    
    if(!token)
    {
        return res.status(401).json({
            message:'Token not found'
        })
    }

    // console.log(req.user.id)


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

    redis.set(token,Date.now().toString,"EX",60*60)

    return res.status(200).json({
         message:'Logged out successfully'
    })
})

module.exports={

    registerUser,
    loginUser,
    getUser,
    logoutUser
}
