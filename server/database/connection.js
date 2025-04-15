const mongoose = require('mongoose');

const connectDB = () => {
  mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

}
const sub = mongoose.model('Subscriptions', new mongoose.Schema({
  subscription: [String],
  starred:[Number]
}));
module.exports = {connectDB,sub}