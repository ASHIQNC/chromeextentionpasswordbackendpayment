const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { Resend } = require('resend');
const crypto = require('crypto');
const User = require('../models/User');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify that this request actually came from Stripe
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userEmail = session.customer_details.email;

    // Generate Key: VAULT-XXXX-XXXX
    const generatedKey = `VAULT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    try {
      // Save to MongoDB
      await User.findOneAndUpdate(
        { email: userEmail },
        {
          isSubscribed: true,
          stripeCustomerId: session.customer,
          licenseKey: generatedKey,
        },
        { upsert: true },
      );

      // Send Email to User
      await resend.emails.send({
        from: 'Zyphora <onboarding@resend.dev>',
        to: userEmail,
        subject: 'Your Pro License Key 🗝️',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
            <h2>Thanks for upgrading!</h2>
            <p>Your unique license key is:</p>
            <h1 style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; color: #6366f1;">
              ${generatedKey}
            </h1>
            <p>Paste this key into the extension settings to unlock all Pro features.</p>
          </div>
        `,
      });
      console.log(
        `Successfully processed payment and sent key to ${userEmail}`,
      );
    } catch (error) {
      console.error('Post-payment processing failed:', error);
    }
  }

  res.json({ received: true });
});

module.exports = router;
