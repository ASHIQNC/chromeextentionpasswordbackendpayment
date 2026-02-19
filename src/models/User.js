// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   stripeCustomerId: String,
//   isSubscribed: { type: Boolean, default: false },
//   licenseKey: String,
//   //new variable added for cancelation subcription
//   stripeSubscriptionId: String,
//   updatedAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('User', UserSchema);

//testing
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },

  stripeCustomerId: String,
  stripeSubscriptionId: String,

  // Access control
  isSubscribed: { type: Boolean, default: false },

  // Stripe status (active, canceled, past_due, etc.)
  subscriptionStatus: { type: String },

  // If user scheduled cancel at period end
  cancelAtPeriodEnd: { type: Boolean, default: false },

  // When access should expire
  currentPeriodEnd: { type: Date },

  licenseKey: String,

  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
