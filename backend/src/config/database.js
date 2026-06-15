require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");

const connectDB = async () => {
  mongoose.connect(process.env.CONNECTION_STRING)
  .then(()=>
{
    console.log('Connected to database');
})
.catch((err)=>
{
    console.log(err);
})
};

module.exports = connectDB;

