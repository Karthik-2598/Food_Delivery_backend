const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register',async(req,res)=>{
    const {username, password, role} = req.body;
    console.log('Register request body:', req.body);
    if (!username || !password) {
      return res.status(400).json({ error: "All fields required" });
    }
    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: "Username ≥3, Password ≥6 characters" });
    }

    // Check if user exists
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: "Username already taken" });
    }
    try{
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({username, password: hashedPassword, role});
        await user.save();
        res.status(201).json({message:'User registered'});
    }catch (err) {
    console.error('Register error:', err);
  }
});
router.post('/login',async(req,res)=>{
    const {username, password} = req.body;
    console.log('Login cred', req.body);
    try{
        const user = await User.findOne({username});
        if(!user || !(await bcrypt.compare(password, user.password))){
            console.log('password login', user.password);
            return res.status(401).json({error: 'Invalid cred'});
        }
        const token = jwt.sign({id: user._id, role: user.role, username: user.username}, process.env.JWT_SECRET_KEY, {expiresIn: '60d'});
        const expirydate = new Date(Date.now()+ 60*24*60*60*1000);
        console.log('Token generated expires on:', expirydate.toISOString());
       await user.save();
        res.cookie('token', token,{
            httpOnly: true,
            secure : process.env.NODE_ENV==='production',
            maxAge: 60*24*60*60* 1000,
            sameSite: 'strict',
        });
        res.json({id: user._id,token, role: user.role, username: user.username});
    }catch(err){
        res.status(500).json({error: err.message});
    }
});

router.get('/verify', (req,res)=>{
    let token;
   // 1. Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
    console.log("Verfied token:", token);
  }
  

  // 2. Fallback to cookie
  if (!token) {
    token = req.cookies.token;
  }

  console.log('Verify token:', token ? 'Present' : 'Missing');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log('Decoded token valid until:', new Date(decoded.exp * 1000));
        return res.json({id: decoded.id, username: decoded.username, role: decoded.role});
    }catch(err){
        console.error('Verify token error: ', err);
        return res.status(401).json({error: 'Invalid token'});
    }
});

router.post('/logout', (req,res)=>{
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
        sameSite: 'strict',
    });
    return res.json({message: 'Logged out successfully'});
})

//on login, set token cookie and return token in response body for frontend to use with socket.io

module.exports = router;