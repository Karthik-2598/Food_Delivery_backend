require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const {Server} = require('socket.io');
const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/foods');
const orderRoutes = require('./routes/orders');
const geocodeRoutes = require('./routes/geocode');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');

const app = express();
app.use(helmet());
const server = http.createServer(app);
const io = new Server(server, {
  cors:{
    origin: 'https://karthik-2598.github.io/Food_Delivery',
    methods:['GET','POST', 'PUT','DELETE'],
    credentials: true, //allow cookies
  }
})
const PORT = process.env.PORT || 5000;

app.use(cors({
origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods:['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders:['Content-Type', 'Authorization'],
}));
app.use(cookieParser());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(()=> console.log('MongoDB connected')).catch(err=> console.log(err));

app.use((req,res,next)=>{
  const token = req.cookies.token; //Get token from cookie
  if(token){
    try{
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.user = decoded;
    }catch(err){
      console.error('Invalid token', err);
    }
  }
  next();
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: { error: "Too many attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', geocodeRoutes);


io.on('connection', (socket)=>{
  console.log('User connected:', socket.id);
  const token = socket.handshake.auth.token; // Get token from the client
  if(token){
    try{
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      socket.join(decoded.id);
      console.log(`User ${decoded.id} joined room`);
    }catch(err){
      console.error('Socket auth error:', err);
    }
  }
  socket.on('disconnect', ()=>{
    console.log('User disconnect:', socket.id);
  });
});

app.io = io;

server.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
