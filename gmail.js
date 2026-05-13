/**
 * GMAIL API MODULE
 * 
 * This module interacts with the Gmail API to fetch messages and send replies.
 */

import auth from './auth.js';

const gmail = {
    /**
     * Fetches the user's profile information (name, email, picture).
     */
    getUserProfile: async () => {
        const token = auth.getToken();
        if (!token) return null;

        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch user profile');
            
            return await response.json();
        } catch (error) {
            console.error('Profile Fetch Error:', error);
            return null;
        }
    },

    /**
     * Fetches real emails from the user's inbox.
     */
    getRecentEmails: async (maxResults = 50) => {
        const token = auth.getToken();
        if (!token) throw new Error('No access token found. Please log in.');

        try {
            const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=label:INBOX`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.error?.message || response.statusText;
                throw new Error(`Gmail API Error (${response.status}): ${message}`);
            }
            
            const data = await response.json();
            if (!data.messages) return [];

            return await Promise.all(data.messages.map(msg => gmail.getMessageSnippet(msg.id)));
        } catch (error) {
            console.error('Gmail API Catch Error:', error);
            throw error;
        }
    },

    /**
     * Fetches a message snippet.
     */
    getMessageSnippet: async (id) => {
        const token = auth.getToken();
        const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return { id, snippet: '[Error loading snippet]', from: 'Unknown', subject: 'Unknown', date: '' };

        const data = await response.json();
        const getHeader = (name) => data.payload.headers.find(h => h.name === name)?.value || '';
        
        return {
            id: data.id,
            threadId: data.threadId,
            snippet: data.snippet,
            from: getHeader('From'),
            subject: getHeader('Subject'),
            date: getHeader('Date')
        };
    },

    /**
     * Fetches full email details.
     */
    getEmailDetails: async (id) => {
        const token = auth.getToken();
        const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to load email (${response.status})`);

        const data = await response.json();
        
        let body = '';
        if (data.payload.parts) {
            const textPart = data.payload.parts.find(part => part.mimeType === 'text/plain');
            if (textPart && textPart.body.data) {
                body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            } else {
                body = data.snippet;
            }
        } else if (data.payload.body?.data) {
            body = atob(data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }

        const getHeader = (name) => data.payload.headers.find(h => h.name === name)?.value || '';

        return {
            id: data.id,
            threadId: data.threadId,
            subject: getHeader('Subject'),
            from: getHeader('From'),
            date: getHeader('Date'),
            body: body
        };
    },

    /**
     * Sends a reply to an email.
     */
    sendReply: async (originalMsgId, to, subject, replyBody) => {
        const token = auth.getToken();
        
        const email = [
            `To: ${to}`,
            `Subject: Re: ${subject}`,
            `In-Reply-To: ${originalMsgId}`,
            `References: ${originalMsgId}`,
            'Content-Type: text/plain; charset="UTF-8"',
            '',
            replyBody
        ].join('\n');

        const encodedEmail = btoa(unescape(encodeURIComponent(email)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                raw: encodedEmail,
                threadId: originalMsgId
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || 'Failed to send reply');
        }
        
        return await response.json();
    }
};

export default gmail;