require('dotenv').config()
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')

const redis=require('../config/cache')

const userModel = require("../model/user.model")
const blacklistModel = require('../model/blacklist.model')

const TOKEN_MAX_AGE_MS = 7 * 60 * 60 * 1000
const TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE_MS
}

const createToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7h'
    })

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

    const token=createToken({
        id:user._id,
        username
    })

    res.cookie('token',token,TOKEN_COOKIE_OPTIONS)

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
        return res.status(401).json({
            message:'Unauthorized access'

        })
    }

    const hash=await bcrypt.compare(password,user.password)

    if(!hash)
    {
         return res.status(401).json({
            message:'Invalid credentials'

        })
    }

    const token=createToken({
        id:user._id,
        identifier

    })
    res.cookie('token',token,TOKEN_COOKIE_OPTIONS)

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

    res.clearCookie('token', {
        httpOnly: TOKEN_COOKIE_OPTIONS.httpOnly,
        sameSite: TOKEN_COOKIE_OPTIONS.sameSite
    })

    if(token)
    {
        await redis.set(token, Date.now().toString(), 'EX', 7 * 60 * 60)
    }

    return res.status(200).json({
         message:'Logged out successfully',
         user:false
    })
})

module.exports={

    registerUser,
    loginUser,
    getUser,
    logoutUser
}
