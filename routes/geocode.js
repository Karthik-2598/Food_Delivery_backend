const express = require('express');
const axios = require('axios');
const router = express.Router();

const GOOGLE_GEOCODE_API='https://maps.googleapis.com/maps/api/geocode/json';
const API_KEY = process.env.GOOGLE_MAPS_KEY;

router.get('/geocode', async(req,res)=>{
    try{
        const {address} = req.query;
        const response = await axios.get(GOOGLE_GEOCODE_API, {
            params: {address, key:API_KEY},
        });
        res.json(response.data);
    }catch(err){
        res.status(500).json({error: err.message});
    }
});


router.get('/reverse-geocode', async(req,res)=>{
    try{
        const {latlng} = req.query;
        const response = await axios.get(GOOGLE_GEOCODE_API, {
            params: {latlng, key:API_KEY},
        });
        res.json(response.data);
    }catch(err){
        res.status(500).json({error: err.message});
    }
});

module.exports = router;