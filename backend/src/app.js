const express=require('express');
const cookieParser=require('cookie-parser')
const authRouter = require('./routes/auth.route');
const app=express()
const cors=require('cors')

app.use(cors({
    origin:'http://localhost:5173',
    credentials:true
}))
app.use(express.json())
app.use(cookieParser())
app.use('/test/auth',authRouter)

module.exports=app;

