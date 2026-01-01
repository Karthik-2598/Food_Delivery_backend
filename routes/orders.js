const express = require('express');
const Order = require('../models/Order');
const verifyToken = require('../middleware/verifyToken');


const router= express.Router();
const DUMMYJSON_API = 'https://dummyjson.com';

const getFoods = async(foodId)=>{
    try{
        // console.log(`Fetching food details for ID:${foodId}`);
        const response = await fetch(`${DUMMYJSON_API}/recipes/${foodId}`);
        if(!response.ok) throw new Error(`API request failed with status ${response.status}`);
        const recipe = await response.json();
        // console.log('Food details response:', recipe);
        return {
            _id: String(recipe.id),
            name: recipe.name,
            price: Math.floor(Math.random()* 11)+10,
            image: recipe.image,
            description: recipe.instructions.join(' ').substring(0,100)+ '...' || `Delicious ${recipe.name.toLowerCase()}` ,
        };

    }catch(err){
        console.error('Error fetching food : ', err);
        return null;
    }
};

//Create order (customer only)
router.post('/', verifyToken, async(req,res)=>{
    console.log('Order POST-User:', req.user);
    if(req.user.role !== 'customer') return res.status(403).json({error: 'Access denied'});
    const {items, address} = req.body;
    try{
        const order = new Order({userId: req.user.id, items, address});
        await order.save();

        //Populate food details for response
        const populatedItems = await Promise.all(order.items.map(async(item)=>{
            const foodDetails = await getFoods(item.foodId);
            return {...item.toObject(), foodId: foodDetails};
        }));
        res.status(201).json({...order.toObject(), items: populatedItems});
        req.app.io.to('admin-room').emit('newOrder', {
    orderId: order._id,
    username: req.user.username,
    message: `New Order #${order._id.substring(0,8)} created by ${req.user.username}`
});
console.log('New order notification sent to admins');
}catch(err){
       return res.status(400).json({error: err.message});
    }
});

//GET ORDERS (admin sees all orders, customer sees own)
router.get('/', verifyToken, async(req,res)=>{
    try{
        let orders;
        if(req.user.role === 'admin'){
            orders = await Order.find().populate('userId', 'username').sort({createdAt: -1});
        }else{
            orders = await Order.find({userId: req.user.id}).populate('userId', 'username').sort({createdAt: -1});
        }
        const populatedOrders = await Promise.all(orders.map(async(order)=>{
            const populatedItems = await Promise.all(order.items.map(async(item)=>{
                const foodDetails = await getFoods(item.foodId);
                return {...item.toObject(), foodId: foodDetails || {name: 'Unknown', price: 0}};
            }));
            return {...order.toObject(), items: populatedItems};
        }));
        // console.log('Fetched orders: ', JSON.stringify(populatedOrders, null, 2));
        return res.json(populatedOrders);
    }catch(err){
        return res.status(500).json({error: err.message});
    }
});

//UPDATE ORDER - Admin can change status and customer can submit rating

router.put('/:id', verifyToken, async(req,res)=>{

    const {status, ratings} = req.body;
    console.log('PUT /orders/:id - User role:', req.user.role, 'Body:', { status, ratings }); // Debug
    try{
        if(req.user.role=='admin' && status){
        const order = await Order.findByIdAndUpdate(req.params.id, {status} , {new : true});
        if(!order) return res.status(404).json({error:'Order not found'});
        const populatedItems = await Promise.all(order.items.map(async(item)=>{
            const foodDetails = await getFoods(item.foodId);
            return {...item.toObject(), foodId: foodDetails || {name: 'Unknown', price: 0}};
        }));
        res.json({...order.toObject(), items: populatedItems});
        req.app.io.to(order.userId.toString()).emit('orderUpdate', {
            orderId: order._id,
            status,
            message: `Your order #${order._id.toString().substring(0,8)} is now ${status.toLowerCase()}`,
        });
        console.log('Status update notification sent to the user:', order.userId);
        return;
    }
    //Customer rating
    else if(req.user.role == 'customer' && Array.isArray(ratings) && ratings.length> 0){
        console.log('Customer rating for order:', req.params.id);
        const order = await Order.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });
        if(!order){
            console.log('Order not found for user:', req.user.id);
            return res.status(404).json({error:'Order not found'});
        } 
        if(order.status.trim().toLowerCase()!=='delivered'){
            console.log('Rating denied - status: ', order.status);
            return res.status(403).json({error:'Rating is only allowed for delivered orders'})
        }

        ratings.forEach((newRating)=>{
            if(newRating.foodId && typeof newRating.rating == 'number'){
            const alreadyRated = order.ratings.some((r)=> r.foodId === newRating.foodId);
            if(!alreadyRated){
                order.ratings.push({
                    foodId: newRating.foodId,
                    rating: newRating.rating,
                    comment: newRating.comment || '',
                });
            }
        }
        });
        await order.save();

        const populatedItems = await Promise.all(order.items.map(async(item)=>{
            const foodDetails = await getFoods(item.foodId);
            return {...item.toObject(), foodId: foodDetails};
        })
    );
    return res.json({...order.toObject(), items:populatedItems});
}else {
//Fallback for invalid requests
console.log('Invalid request - role or body mismatch:', req.user.role, 'status:', status, 'ratings:', ratings);
return res.status(400).json({ error: 'Invalid request: Admin must provide status, customer must provide ratings array' });}
}catch(err){
    console.error('Error updating order:', err);
    return res.status(400).json({error: err.message});
    }
});

module.exports = router;