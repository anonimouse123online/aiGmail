/**
 * AUTHENTICATION MODULE (Google OAuth 2.0)
 * 
 * This module handles the "Sign in with Google" flow and manages the access token.
 */

import CONFIG from './config.js';

const auth = {
    /**
     * Redirects the user to Google's OAuth 2.0 server.
     */
    login: () => {
        const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
        
        // Parameters for the OAuth request
        const params = {
            'client_id': CONFIG.GOOGLE_CLIENT_ID,
            'redirect_uri': window.location.origin + '/app.html',
            'response_type': 'token',
            'scope': CONFIG.GMAIL_SCOPES.join(' '),
            'include_granted_scopes': 'true',
            'state': 'pass-through value'
        };

        // Create a dynamic form to submit the GET request
        const form = document.createElement('form');
        form.setAttribute('method', 'GET');
        form.setAttribute('action', oauth2Endpoint);

        for (const p in params) {
            const input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', p);
            input.setAttribute('value', params[p]);
            form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
    },

    /**
     * Checks if the user is currently logged in by looking for a valid token.
     */
    isLoggedIn: () => {
        const token = localStorage.getItem('gmail_access_token');
        const expiry = localStorage.getItem('gmail_token_expiry');
        
        if (!token || !expiry) return false;
        
        // Check if token has expired (current time > expiry time)
        return Date.now() < parseInt(expiry);
    },

    /**
     * Handles the callback from Google after successful login.
     * Parses the access token from the URL hash.
     */
    handleCallback: () => {
        const fragmentString = location.hash.substring(1);
        const params = {};
        const regex = /([^&=]+)=([^&]*)/g;
        let m;

        while (m = regex.exec(fragmentString)) {
            params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        }

        if (params['access_token']) {
            localStorage.setItem('gmail_access_token', params['access_token']);
            // Token usually expires in 3600 seconds (1 hour)
            const expiryTime = Date.now() + (parseInt(params['expires_in']) * 1000);
            localStorage.setItem('gmail_token_expiry', expiryTime);
            
            // Clear hash from URL for security
            history.replaceState(null, null, ' ');
            return true;
        }
        return false;
    },

    /**
     * Logs the user out by clearing the token from local storage.
     */
    logout: () => {
        localStorage.removeItem('gmail_access_token');
        localStorage.removeItem('gmail_token_expiry');
        window.location.href = 'index.html';
    },

    /**
     * Returns the current access token.
     */
    getToken: () => {
        return localStorage.getItem('gmail_access_token');
    }
};

// Auto-handle callback if we are on app.html with a hash
if (window.location.pathname.endsWith('app.html') && window.location.hash) {
    if (auth.handleCallback()) {
        console.log('Successfully logged in via callback');
    }
}

export default auth;
