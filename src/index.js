// require('dotenv').config();
// const express = require('express');
// const Stripe = require('stripe');
// const cors = require('cors');

// const app = express();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// // 🔴 IMPORTANT: Webhook route FIRST (before express.json)
// // app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
// //   const sig = req.headers['stripe-signature'];

// //   try {
// //     const event = stripe.webhooks.constructEvent(
// //       req.body,
// //       sig,
// //       process.env.STRIPE_WEBHOOK_SECRET,
// //     );

// //     console.log('Webhook received:', event.type);
// //     res.json({ received: true });
// //   } catch (err) {
// //     console.log('Webhook error:', err.message);
// //     res.status(400).send(`Webhook Error: ${err.message}`);
// //   }
// // });

// // 🔴 Webhook route
// app.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   async (req, res) => {
//     const sig = req.headers['stripe-signature'];

//     try {
//       const event = stripe.webhooks.constructEvent(
//         req.body,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET,
//       );

//       console.log('Webhook received:', event.type);

//       // ✅ Handle checkout session completed
//       if (event.type === 'checkout.session.completed') {
//         const session = event.data.object;
//         const email = session.customer_email;
//         console.log(`Payment successful for ${email}`);

//         // For testing: mark subscription true
//         // You can store this in a DB or local storage for the Chrome extension
//         // Example: just log for now
//         console.log(`💡 Set isSubscribed = true for ${email}`);

//         // If you had a database, you could do:
//         // await db.users.update({ email }, { subscribed: true });
//       }

//       res.json({ received: true });
//     } catch (err) {
//       console.log('Webhook error:', err.message);
//       res.status(400).send(`Webhook Error: ${err.message}`);
//     }
//   },
// );

// // ✅ Normal middleware AFTER webhook
// app.use(cors());
// app.use(express.json());

// // 1️⃣ Verify subscription endpoint
// app.post('/verify', async (req, res) => {
//   const { email } = req.body;

//   try {
//     const customers = await stripe.customers.list({
//       email: email,
//       limit: 1,
//     });

//     if (!customers.data.length) {
//       return res.json({ subscribed: false });
//     }

//     const subscriptions = await stripe.subscriptions.list({
//       customer: customers.data[0].id,
//       status: 'active',
//     });

//     const isSubscribed = subscriptions.data.length > 0;

//     res.json({ subscribed: isSubscribed });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// //new changes
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');

// const app = express();
// connectDB();

// // WEBHOOK MUST BE BEFORE express.json()
// app.use('/webhook', require('./routes/Webhook'));

// app.use(cors());
// app.use(express.json());

// app.use('/api/payments', require('./routes/Payment'));

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

// 1. The Webhook Route (MUST come before express.json)
// We use express.raw to keep the body exactly as Stripe sent it for verification
app.use(
  '/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/Webhook'),
);

// 2. General Middlewares
app.use(cors());
app.use(express.json()); // This parses JSON for all routes BELOW this line

// 3. API Routes
app.use('/api/payments', require('./routes/Payment'));
app.use('/api/ai', require('./routes/aiAudit'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
