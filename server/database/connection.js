const mongoose = require('mongoose');

const connectDB = () => {
  mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

}
const userSchema = new mongoose.Schema({
    userId: String,
    subscriptions: [
      {
        endpoint: String,
        keys: {
          p256dh: String,
          auth: String
        }
      }
    ],
    starred: [Number]
  });
const Subscription = mongoose.model('Subscription', userSchema);

module.exports = {connectDB,Subscription}