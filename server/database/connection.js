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
  userId: {
    type: String,
    required: true
  },
  starred: {
    type: Boolean,
    default: false
  }
});


const Subscription = mongoose.model("Subscription", subscriptionSchema);
const iOSSubscription = mongoose.model("iOSSubscription", subscriptionSchema);

module.exports = {connectDB,Subscription,iOSSubscription}