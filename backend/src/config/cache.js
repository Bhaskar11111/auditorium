require('dotenv').config()
const Redis = require('ioredis').default;

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
});

redis.on('connect', () => {
    console.log('Connected to Redis');
    
});

redis.on('error', (err) => {
    console.error('Redis Error:', err);
});

module.exports = redis;