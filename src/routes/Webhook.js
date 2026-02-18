const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { Resend } = require('resend');
const crypto = require('crypto');
const User = require('../models/User');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// Stripe hits THIS route: POST /webhook
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // 1. Verify signature using RAW body
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error(`❌ Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. Handle successful payment
  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'invoice.paid'
  ) {
    const session = event.data.object;
    const userEmail = session.customer_details?.email || session.customer_email;

    if (!userEmail) return res.status(200).json({ received: true });

    const generatedKey = `VAULT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    try {
      // 3. Save to MongoDB
      await User.findOneAndUpdate(
        { email: userEmail },
        {
          isSubscribed: true,
          stripeCustomerId: session.customer,
          licenseKey: generatedKey,
        },
        { upsert: true },
      );

      // 4. Send Email via Resend
      await resend.emails.send({
        from: 'Zyphora <onboarding@resend.dev>',
        to: userEmail,
        subject: 'Your Pro License Key 🗝️',
        html: `<h1>Your Key: ${generatedKey}</h1><p>Paste this into the extension.</p>`,
      });

      console.log(`✅ Success: Key sent to ${userEmail}`);
    } catch (error) {
      console.error('❌ DB/Email Error:', error.message);
    }
  }

  // Always return 200 to Stripe immediately
  res.json({ received: true });
});

module.exports = router;
