const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Extension hits THIS: POST /api/payments/verify-key
router.post('/verify-key', async (req, res) => {
  const { licenseKey } = req.body;

  if (!licenseKey) {
    return res.status(400).json({ success: false, message: 'No key provided' });
  }

  try {
    const user = await User.findOne({ licenseKey: licenseKey });

    if (user && user.isSubscribed) {
      res.json({ success: true, message: 'Key verified!' });
    } else {
      res
        .status(401)
        .json({ success: false, message: 'Invalid or inactive key.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/cancel-subscription', async (req, res) => {
  const { licenseKey } = req.body;

  try {
    const user = await User.findOne({ licenseKey });
    console.log('use', user);
    if (!user || !user.stripeSubscriptionId) {
      return res
        .status(404)
        .json({ success: false, message: 'Subscription not found' });
    }

    // This cancels the subscription at the end of the current billing month
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update your database immediately so the key stops working
    user.isSubscribed = false;
    await user.save();

    res.json({ success: true, message: 'Subscription canceled successfully' });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
