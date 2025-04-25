const mongoose = require('mongoose');

const connectDB = () => {
  mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

}
const subscriptionSchema = new mongoose.Schema({
  subscription: {
    type: Object,
    required: true
  },
  starred: {
    type: [Number],
    default: []
  }
});


const Subscription = mongoose.model("Subscriptions", subscriptionSchema);
const iOSSubscription = mongoose.model("iOSSubscriptions", subscriptionSchema);

module.exports = {connectDB,Subscription,iOSSubscription}