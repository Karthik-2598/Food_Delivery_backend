const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref:'User', required: true},
  items:[{
    foodId: {type: String},
    quantity: {type: Number, default: 1},
  }],
  address: {type: String, required: true},
  status:{type: String, enum:['Pending', 'In Transit', 'Delivered'], default:'Pending'},
  ratings:[{
    foodId: {type: String, required: true},
    rating: {type: Number,min:1, max:5, required: true },
    comment: {type:String, maxlength: 500},
    ratedAt:{type: Date, default: Date.now},
  }],
  createdAt: {type: Date, default: Date.now},
});
module.exports = mongoose.model('Order', orderSchema);