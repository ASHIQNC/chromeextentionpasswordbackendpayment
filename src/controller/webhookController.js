const stripe = require('../config/stripe');

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    console.log('Webhook received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_email;

      console.log(`Payment successful for ${email}`);

      // TODO: update database subscription status
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
