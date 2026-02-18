const stripe = require('../config/stripe');

exports.verifySubscription = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (!customers.data.length) {
      return res.json({ subscribed: false });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
    });

    const isSubscribed = subscriptions.data.length > 0;

    res.json({ subscribed: isSubscribed });
  } catch (error) {
    next(error);
  }
};
