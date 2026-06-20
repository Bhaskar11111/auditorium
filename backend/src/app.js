console.log("APP IMPORTED");
console.log("SRC APP LOADED");
const express=require('express')
const cookieParser=require('cookie-parser')
const authRouter = require('./routes/auth.route')
const songRouter=require('./routes/songs.route')
const app=express()
app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.originalUrl);
    next();
});
const cors=require('cors')

app.use(cors({
    origin:'https://auditorium-air.onrender.com',
    credentials:true
}))
app.use(express.json())
app.use(cookieParser())
app.use('/test/auth',authRouter)
app.use('/test/song',songRouter)
console.log("Auth Router:", authRouter);

app.get('/hello', (req, res) => {
    res.send('hello');
});

module.exports=app;

