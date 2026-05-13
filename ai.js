/**
 * AI GENERATION MODULE (Groq API)
 * 
 * This module interacts with Groq's API to generate email replies.
 */

import CONFIG from './config.js';

const ai = {
    /**
     * Generates a professional reply using Groq (Llama 3.3 70b).
     */
    generateReply: async (emailContent, tone = 'professional') => {
        if (!CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY === 'your-groq-key') {
            throw new Error('Groq API Key is missing. Please add it to config.js');
        }

        const prompt = `
            I received the following email:
            ---
            ${emailContent}
            ---
            Please generate a ${tone} reply to this email. 
            Output ONLY the reply content itself, no intro or outro text.
        `;

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: CONFIG.GROQ_MODEL,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Groq AI Generation failed');
            }

            const data = await response.json();

            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            } else {
                throw new Error('Unexpected response format from Groq');
            }
        } catch (error) {
            console.error('AI Error:', error);
            throw error;
        }
    }
};

export default ai;