import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine's localhost
// iOS simulator and web can use localhost directly
const getBaseUrl = () => {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
};

let BASE_URL = getBaseUrl();

export const setBaseUrl = (url) => {
    BASE_URL = url.replace(/\/+$/, ''); // strip trailing slashes
};

export const getCurrentBaseUrl = () => BASE_URL;

/**
 * Check if the server is reachable.
 * Returns true if connected, false otherwise.
 */
export const checkConnection = async () => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${BASE_URL}/api/chats`, {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timeout);
        return response.ok;
    } catch {
        return false;
    }
};

export const fetchChats = async () => {
    const response = await fetch(`${BASE_URL}/api/chats`);
    if (!response.ok) throw new Error('Failed to fetch chats');
    return response.json();
};

export const createChat = async () => {
    const response = await fetch(`${BASE_URL}/api/chats`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to create chat');
    return response.json();
};

export const deleteChat = async (chatId) => {
    const response = await fetch(`${BASE_URL}/api/chats/${chatId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete chat');
    return response.json();
};

export const fetchMessages = async (chatId) => {
    const response = await fetch(`${BASE_URL}/api/chats/${chatId}/messages`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
};

/**
 * Process SSE lines from an XHR response text.
 * Parses only new data since lastIndex.
 */
const processSSEChunk = (responseText, lastIndex, accumulatedText, callbacks) => {
    const { onToken, onStatus, onToolCalling, onDone, onError } = callbacks;
    const newText = responseText.substring(lastIndex);
    const lines = newText.split('\n');
    let newAccumulated = accumulatedText;

    for (const line of lines) {
        if (line.startsWith('data: ')) {
            try {
                const data = JSON.parse(line.slice(6));

                if (data.status) {
                    onStatus?.(data.status);
                }

                if (data.toolCalling) {
                    onToolCalling?.(true);
                }

                if (data.token) {
                    newAccumulated += data.token;
                    onToken?.(newAccumulated);
                }

                if (data.done) {
                    onDone?.();
                }

                if (data.error) {
                    onError?.(data.error);
                }
            } catch (e) {
                // Ignore parse errors for incomplete JSON lines
            }
        }
    }

    return newAccumulated;
};

/**
 * SSE streaming using XMLHttpRequest (React Native compatible).
 * React Native's fetch() does not support response.body.getReader().
 */
const streamWithXHR = (url, body, callbacks) => {
    return new Promise((resolve) => {
        const { onDone, onError } = callbacks;
        const xhr = new XMLHttpRequest();
        let lastIndex = 0;
        let accumulatedText = '';

        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/json');

        // Process chunks as they arrive
        xhr.onprogress = () => {
            accumulatedText = processSSEChunk(
                xhr.responseText, lastIndex, accumulatedText, callbacks
            );
            lastIndex = xhr.responseText.length;
        };

        xhr.onload = () => {
            // Process any remaining data
            if (lastIndex < xhr.responseText.length) {
                accumulatedText = processSSEChunk(
                    xhr.responseText, lastIndex, accumulatedText, callbacks
                );
            }
            // If onDone wasn't called in the SSE data, call it now
            resolve();
        };

        xhr.onerror = () => {
            onError?.('Network request failed');
            resolve();
        };

        xhr.ontimeout = () => {
            onError?.('Request timed out');
            resolve();
        };

        xhr.timeout = 120000; // 2 minutes
        xhr.send(JSON.stringify(body));
    });
};

/**
 * Send a message with SSE streaming.
 */
export const sendMessageStream = async (chatId, message, model, personality, imageData, callbacks) => {
    try {
        await streamWithXHR(
            `${BASE_URL}/api/chats/${chatId}/messages`,
            { message, model, personality, imageData },
            callbacks
        );
    } catch (error) {
        callbacks.onError?.(error.message);
    }
};

/**
 * Regenerate last AI response with SSE streaming.
 */
export const regenerateStream = async (chatId, message, model, personality, callbacks) => {
    try {
        await streamWithXHR(
            `${BASE_URL}/api/chats/${chatId}/regenerate`,
            { message, model, personality },
            callbacks
        );
    } catch (error) {
        callbacks.onError?.(error.message);
    }
};

/**
 * Get all available personas
 */
export const fetchPersonas = async () => {
    const response = await fetch(`${BASE_URL}/api/personas`);
    if (!response.ok) throw new Error('Failed to fetch personas');
    return response.json();
};

/**
 * Get user context
 */
export const fetchContext = async () => {
    const response = await fetch(`${BASE_URL}/api/context`);
    if (!response.ok) throw new Error('Failed to fetch context');
    return response.json();
};

/**
 * Update user context
 */
export const updateContext = async (context) => {
    const response = await fetch(`${BASE_URL}/api/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
    });
    if (!response.ok) throw new Error('Failed to update context');
    return response.json();
};

/**
 * Get all memories
 */
export const fetchMemories = async () => {
    const response = await fetch(`${BASE_URL}/api/memories`);
    if (!response.ok) throw new Error('Failed to fetch memories');
    return response.json();
};
