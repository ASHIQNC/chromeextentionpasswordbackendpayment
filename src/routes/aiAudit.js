const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/analyze-password', async (req, res) => {
  const { licenseKey, passwordPattern } = req.body;

  try {
    // 1. Subscription Guard
    const user = await User.findOne({ licenseKey });
    if (!user || !user.isSubscribed) {
      return res
        .status(403)
        .json({ success: false, message: 'Pro subscription required.' });
    }

    // 2. AI Processing (Using 1.5 Flash for speed)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Act as a security expert. I have a password pattern: "${passwordPattern}". 
    In exactly one sentence, tell the user why this specific pattern is vulnerable to hackers. 
    Be technical but easy to understand.`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('AI Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'AI Auditor is temporarily busy.' });
  }
});

module.exports = router;
