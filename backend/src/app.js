const express=require('express')
const cookieParser=require('cookie-parser')
const app=express()
const authRouter=require('./routes/auth.route')

app.use(express.json())
app.use(cookieParser())

app.use('/test/auth',authRouter)

module.exports=app