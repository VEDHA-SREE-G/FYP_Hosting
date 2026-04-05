const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Groq = require('groq-sdk');
const Scheme = require('../models/Schem');

router.post('/', auth(['user', 'admin']), async (req, res) => {
    try {
        console.log("Using API Key:", process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + "..." : "UNDEFINED");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const { message, previousMessages } = req.body;


        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Fetch scheme context from DB
        let schemeContext = '';
        try {
            const schemes = await Scheme.findAll({ limit: 50 });
            schemeContext = schemes
                .map(s => `${s.scheme_name}: ${s.description || ''}`)
                .join('\n')
                .substring(0, 3000);
        } catch (dbErr) {
            console.warn('Could not fetch schemes:', dbErr.message);
        }

        const systemPrompt = `You are a helpful Indian Government Schemes AI Assistant. 
Answer concisely and accurately about Indian government welfare schemes, eligibility, and benefits.
${schemeContext ? `\nAvailable schemes for context:\n${schemeContext}` : ''}`;

        // Build message history
        const msgs = [
            { role: 'system', content: systemPrompt },
            ...(previousMessages || []).filter(m => m.role === 'user' || m.role === 'assistant'),
            { role: 'user', content: message }
        ];

        const completion = await groq.chat.completions.create({
            messages: msgs,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 1000
        });

        const reply = completion.choices[0]?.message?.content || 'I am unable to assist at the moment.';
        res.json({ reply });

    } catch (error) {
        const errMsg = error?.message || 'Unknown error';
        console.error('Chat error:', errMsg);
        res.status(500).json({ error: 'Failed to generate reply: ' + errMsg });
    }
});

module.exports = router;
