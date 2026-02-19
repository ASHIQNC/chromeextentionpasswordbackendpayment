const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  stripeCustomerId: String,
  isSubscribed: { type: Boolean, default: false },
  licenseKey: String,
  //new variable added for cancelation subcription
  stripeSubscriptionId: String,
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
