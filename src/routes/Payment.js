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

module.exports = router;
