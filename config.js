/**
 * CONFIGURATION FILE
 * 
 * This file pulls sensitive data from the .env file for security.
 */

const CONFIG = {
    // GOOGLE OAUTH CONFIG
    // Pulled from VITE_GOOGLE_CLIENT_ID in .env
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    
    // GMAIL API SCOPES
    GMAIL_SCOPES: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ],

    // GROQ API CONFIG
    // Pulled from VITE_GROQ_API_KEY and VITE_GROQ_MODEL in .env
    GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY,
    GROQ_MODEL: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
};

export default CONFIG;
