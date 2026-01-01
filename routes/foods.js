const express = require('express');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

let foodCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

const DUMMYJSON_API = 'https://dummyjson.com';

const fetchFoods = async()=>{
    try{
        const response = await fetch(`${DUMMYJSON_API}/recipes`);
        if(!response.ok){
            throw new Error(`Failed to fetch from API, ${response.status}`);
        }
        const data = await response.json();
        const recipes = data.recipes || [];

        const foods = recipes.map(recipe => ({
            _id: String(recipe.id),
            name: recipe.name,
            price: Math.floor(Math.random()* 11)+ 10,
            image: recipe.image,
            description: recipe.instructions.join(' ').substring(0,100)+ '...' || `Delicious ${recipe.name.toLowerCase()}` ,
            cuisine: recipe.cuisine || 'Unknown',
        }));
        return foods;
    }catch(err){
        console.error('Error fetching foods:', err);
        return [];
    }
};
router.get('/', async(req,res)=> {
    try{
        const now = Date.now();
        if(!foodCache || (now - cacheTimestamp) >= CACHE_DURATION){
            console.log('Cache expired or empty, fetching new data');
            foodCache = await fetchFoods();
            cacheTimestamp = now;
        }else{
            console.log('Serving from cache');
        }
        let fullFoods = foodCache;

        //Search logic
        const search = req.query.search ? req.query.search.toLowerCase(): '';
        if(search){
            fullFoods = fullFoods.filter(food => food.name.toLowerCase().includes(search)|| food.description.toLowerCase().includes(search));
        }

        //filter by cuisine
        const cuisine = req.query.cuisine ? req.query.cuisine: '';
        if(cuisine){
            fullFoods = fullFoods.filter(food => food.cuisine === cuisine);
        }

        //sort by price
        const sort = req.query.sort || '';
        if(sort === 'price_asc'){
            fullFoods.sort((a,b)=> a.price - b.price);
        }else if(sort === 'price_desc'){
            fullFoods.sort((a,b)=> b.price - a.price);
        }
        //Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex  = startIndex + limit;
        const paginatedFoods = fullFoods.slice(startIndex, endIndex);

        res.json({
            foods: paginatedFoods,
            total: fullFoods.length,
            currentPage: page,
            totalPages : Math.ceil(fullFoods.length/ limit)
        });
}catch(err){
    console.error('Error in /api/foods', err);
    res.status(500).json({error: 'Failed to fetch'});
}
});


module.exports = router;