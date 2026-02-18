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
      //   await resend.emails.send({
      //     from: 'Zyphora <onboarding@resend.dev>',
      //     to: userEmail,
      //     subject: 'Your Pro License Key 🗝️',
      //     html: `<h1>Your Key: ${generatedKey}</h1><p>Paste this into the extension.</p>`,
      //   });

      await resend.emails.send({
        from: 'Zyphora <onboarding@resend.dev>', // Change this once domain is verified
        to: userEmail,
        subject: 'Your Zyphora Pro License Key 🗝️',
        html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
        
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">ZYPHORA PRO</h1>
        </div>

        <div style="padding: 30px; text-align: center;">
          <h2 style="color: #1f2937; margin-top: 0;">Thanks for upgrading!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
            Your payment was successful. Use the license key below to unlock all Pro features in your extension.
          </p>

          <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border: 2px dashed #6366f1; border-radius: 12px;">
            <span style="display: block; color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Your Unique License Key</span>
            <code style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: bold; color: #4f46e5; letter-spacing: 2px;">
              ${generatedKey}
            </code>
          </div>

          <p style="color: #6b7280; font-size: 13px;">
            Copy this key and paste it into the <strong>"Already purchased?"</strong> section in your extension settings.
          </p>

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <div style="text-align: left;">
            <h4 style="color: #1f2937; margin-bottom: 10px;">What's included in Pro:</h4>
            <ul style="color: #4b5563; font-size: 14px; padding-left: 20px; line-height: 1.8;">
              <li>Unlimited Password Storage</li>
              <li>Auto-fill & Auto-save everywhere</li>
              <li>Secure JSON Export/Backup</li>
              <li>Priority Developer Support</li>
            </ul>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Zyphora Manager. Secure & Private.
          </p>
        </div>
      </div>
    </div>
  `,
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
