// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const { GoogleGenerativeAI } = require('@google/generative-ai');

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// router.post('/analyze-password', async (req, res) => {
//   const { licenseKey, passwordPattern } = req.body;

//   try {
//     // 1. Subscription Guard
//     const user = await User.findOne({ licenseKey });
//     if (!user || !user.isSubscribed) {
//       return res
//         .status(403)
//         .json({ success: false, message: 'Pro subscription required.' });
//     }

//     // 2. AI Processing (Using 1.5 Flash for speed)
//     const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

//     const prompt = `Act as a security expert. I have a password pattern: "${passwordPattern}".
//     In exactly one sentence, tell the user why this specific pattern is vulnerable to hackers.
//     Be technical but easy to understand.`;

//     const result = await model.generateContent(prompt);
//     console.log('result', result);
//     const analysis = result.response.text();
//     console.log('analyse', analysis);

//     res.json({ success: true, analysis });
//   } catch (error) {
//     console.error('AI Error:', error);
//     res
//       .status(500)
//       .json({ success: false, message: 'AI Auditor is temporarily busy.' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check if API Key exists on startup
if (!process.env.GEMINI_API_KEY) {
  console.error(
    '❌ CRITICAL: GEMINI_API_KEY is missing from Environment Variables',
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// router.post('/analyze-password', async (req, res) => {
//   const { licenseKey, passwordPattern } = req.body;

//   try {
//     // 1. Subscription Guard
//     const user = await User.findOne({ licenseKey });
//     if (!user || !user.isSubscribed) {
//       return res
//         .status(403)
//         .json({ success: false, message: 'Pro subscription required.' });
//     }

//     // 2. AI Processing
//     const model = genAI.getGenerativeModel({
//       model: 'gemini-2.5-flash',
//     });

//     const prompt = `Act as a security expert. I have a password pattern: "${passwordPattern}".
//     In exactly one sentence, tell the user why this specific pattern is vulnerable to hackers.
//     Be technical but easy to understand. Do not mention specific passwords.`;

//     const result = await model.generateContent(prompt);

//     // 3. Robust Response Handling
//     const response = await result.response;

//     // Safety Check: Gemini sometimes returns empty if safety filters trigger
//     const candidates = response.candidates;
//     if (!candidates || candidates.length === 0 || !candidates[0].content) {
//       return res.status(200).json({
//         success: true,
//         analysis:
//           'The AI could not analyze this specific pattern due to safety constraints, but generally, short or predictable patterns are high risk.',
//       });
//     }

//     const analysis = response.text();
//     res.json({ success: true, analysis });
//   } catch (error) {
//     // Log the full error to Render logs so you can see the REAL reason
//     console.error('--- DETAILED AI ERROR ---');
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: 'AI Auditor is temporarily busy.',
//       debug: process.env.NODE_ENV === 'development' ? error.message : undefined,
//     });
//   }
// });

router.post('/analyze-password', async (req, res) => {
  const { licenseKey, passwordPattern } = req.body;

  try {
    const user = await User.findOne({ licenseKey });
    if (!user || !user.isSubscribed) {
      return res
        .status(403)
        .json({ success: false, message: 'Pro subscription required.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 1. UPDATED PROMPT: Requesting a structured, user-friendly response
    const prompt = `Act as a friendly cybersecurity expert. 
    Analyze this password pattern: "${passwordPattern}".
    
    Provide your response in exactly this format:
    EXPLANATION: (One simple sentence explaining why this pattern is risky for a normal user)
    ADVICE: (One actionable tip to make it better, like using a passphrase or adding symbols)
    
    Keep it friendly and do not use overly complex jargon. Do not mention specific passwords.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0 || !candidates[0].content) {
      return res.status(200).json({
        success: true,
        analysis:
          'EXPLANATION: This pattern is too predictable. \nADVICE: Try making your password longer than 12 characters.',
      });
    }

    const analysis = response.text();
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('--- DETAILED AI ERROR ---');
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: 'AI Auditor is temporarily busy.' });
  }
});

module.exports = router;
