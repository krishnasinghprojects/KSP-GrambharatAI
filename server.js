const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { checkLoanEligibility } = require("./loan-eligibility");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE"]
    }
});

app.use(cors());
app.use(express.json());

// Storage paths
const CHATS_DIR = path.join(__dirname, "chats");
const LOGS_DIR = path.join(__dirname, "logs");
const USER_MEMORY_FILE = path.join(__dirname, "user-memory.json");
const USER_CONTEXT_FILE = path.join(__dirname, "user-context.json");

// Ensure directories exist
if (!fs.existsSync(CHATS_DIR)) fs.mkdirSync(CHATS_DIR);
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR);

// Initialize memory file if not exists
if (!fs.existsSync(USER_MEMORY_FILE)) {
    fs.writeFileSync(USER_MEMORY_FILE, JSON.stringify({ memories: [] }, null, 2));
}

// Initialize context file if not exists
if (!fs.existsSync(USER_CONTEXT_FILE)) {
    fs.writeFileSync(USER_CONTEXT_FILE, JSON.stringify({
        season: "Summer",
        location: "",
        cropCycle: "",
        festival: ""
    }, null, 2));
}

// Ollama configuration
const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL_NAME = "gpt-oss:20b";

// Personas
const PERSONAS = {
    sarpanch: "You are a wise village Sarpanch (village head) with deep knowledge of rural life, governance, and community welfare. Use rural analogies, speak with a respectful and authoritative tone, and provide guidance like an experienced village elder. Reference traditional wisdom and local customs when appropriate.",
    sahakar: "You are a rural cooperative banker specializing in micro-finance, savings schemes, and government welfare programs. Focus on financial inclusion, self-help groups (SHGs), agricultural loans, and schemes like PM-KISAN, MGNREGA, and rural banking. Explain financial concepts in simple, relatable terms for rural communities.",
    mitra: "You are a friendly, energetic village youth who is tech-savvy and enthusiastic about helping others. Keep responses highly energetic, simple, and encouraging. Use casual language, emojis occasionally, and make complex topics easy to understand. Be like a helpful friend who's always excited to assist!"
};

// Define tools for Ollama
const LOAN_ELIGIBILITY_TOOL = {
    type: "function",
    function: {
        name: "check_loan_eligibility",
        description: "Check if a person is eligible for a loan based on their financial profile. Use this when someone asks about loan eligibility, loan approval, or if someone can get a loan. Available profiles: Ram Vilas, Phool Kumari, Sita Devi, Mohan Lal, Radha Sharma",
        parameters: {
            type: "object",
            properties: {
                person_name: {
                    type: "string",
                    description: "The full name of the person (e.g., 'Ram Vilas', 'Phool Kumari', 'Sita Devi', 'Mohan Lal', 'Radha Sharma')"
                },
                loan_amount: {
                    type: "number",
                    description: "The requested loan amount in Indian Rupees (e.g., 500000 for 5 lakhs)"
                }
            },
            required: ["person_name", "loan_amount"]
        }
    }
};

const SAVE_MEMORY_TOOL = {
    type: "function",
    function: {
        name: "save_to_memory",
        description: "Save important user information to long-term memory. Use this when the user explicitly asks to remember something, shares personal details, preferences, or important context that should be recalled in future conversations. Examples: 'remember that I have 5 acres of land', 'my name is Ramesh', 'I grow wheat and rice', 'remember my village is Sultanpur'.",
        parameters: {
            type: "object",
            properties: {
                memory_content: {
                    type: "string",
                    description: "The information to remember, written as a clear, concise statement (e.g., 'User has 5 acres of agricultural land', 'User name is Ramesh Kumar', 'User grows wheat and rice crops')"
                },
                category: {
                    type: "string",
                    enum: ["personal", "agricultural", "financial", "family", "preferences", "other"],
                    description: "Category of the memory for better organization"
                }
            },
            required: ["memory_content", "category"]
        }
    }
};

// Helper functions
function getChatPath(chatId) {
    return path.join(CHATS_DIR, `${chatId}.json`);
}

function loadChat(chatId) {
    const chatPath = getChatPath(chatId);
    if (fs.existsSync(chatPath)) {
        return JSON.parse(fs.readFileSync(chatPath, "utf8"));
    }
    return null;
}

function saveChat(chatId, chatData) {
    const chatPath = getChatPath(chatId);
    fs.writeFileSync(chatPath, JSON.stringify(chatData, null, 2));
}

function getAllChats() {
    const files = fs.readdirSync(CHATS_DIR);
    return files
        .filter(file => file.endsWith(".json"))
        .map(file => {
            const chatId = file.replace(".json", "");
            const chat = loadChat(chatId);
            return {
                id: chatId,
                title: chat.title,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt
            };
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function logToFile(message) {
    const logPath = path.join(LOGS_DIR, `${new Date().toISOString().split('T')[0]}.log`);
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

// Memory management functions
function loadMemories() {
    try {
        const data = fs.readFileSync(USER_MEMORY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { memories: [] };
    }
}

function saveMemory(content, category) {
    const memories = loadMemories();
    const newMemory = {
        id: uuidv4(),
        content,
        category,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    memories.memories.unshift(newMemory);
    fs.writeFileSync(USER_MEMORY_FILE, JSON.stringify(memories, null, 2));
    logToFile(`Memory saved: ${content.substring(0, 50)}...`);
    return newMemory;
}

function getMemoriesContext() {
    const memories = loadMemories();
    if (memories.memories.length === 0) return "";
    
    const memoryLines = memories.memories.map(m => `- ${m.content}`);
    return `\n\nUser's Saved Information:\n${memoryLines.join('\n')}\n`;
}

// Context management functions
function loadUserContext() {
    try {
        const data = fs.readFileSync(USER_CONTEXT_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { season: "Summer", location: "", cropCycle: "", festival: "" };
    }
}

function saveUserContext(context) {
    fs.writeFileSync(USER_CONTEXT_FILE, JSON.stringify(context, null, 2));
    logToFile(`Context updated: ${JSON.stringify(context)}`);
}

function getUserContextString() {
    const context = loadUserContext();
    const parts = [];
    
    if (context.season) parts.push(`Current Season: ${context.season}`);
    if (context.location) parts.push(`Location: ${context.location}`);
    if (context.cropCycle) parts.push(`Crop Cycle: ${context.cropCycle}`);
    if (context.festival) parts.push(`Current Festival/Event: ${context.festival}`);
    
    if (parts.length === 0) return "";
    return `\n\nLocal Context:\n${parts.join('\n')}\n`;
}

// API Routes

// Get all personas
app.get("/api/personas", (req, res) => {
    try {
        const personaList = Object.keys(PERSONAS).map(key => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            description: PERSONAS[key]
        }));
        res.json(personaList);
    } catch (error) {
        console.error("Error fetching personas:", error);
        res.status(500).json({ error: "Failed to fetch personas" });
    }
});

// Get user context
app.get("/api/context", (req, res) => {
    try {
        const context = loadUserContext();
        res.json(context);
    } catch (error) {
        console.error("Error fetching context:", error);
        res.status(500).json({ error: "Failed to fetch context" });
    }
});

// Update user context
app.post("/api/context", (req, res) => {
    try {
        const context = req.body;
        saveUserContext(context);
        res.json({ success: true, context });
    } catch (error) {
        console.error("Error updating context:", error);
        res.status(500).json({ error: "Failed to update context" });
    }
});

// Get all memories
app.get("/api/memories", (req, res) => {
    try {
        const memories = loadMemories();
        res.json(memories);
    } catch (error) {
        console.error("Error fetching memories:", error);
        res.status(500).json({ error: "Failed to fetch memories" });
    }
});

// Get all chats
app.get("/api/chats", (req, res) => {
    try {
        const chats = getAllChats();
        res.json(chats);
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Failed to fetch chats" });
    }
});

// Create new chat
app.post("/api/chats", (req, res) => {
    try {
        const chatId = uuidv4();
        const newChat = {
            id: chatId,
            title: "New Chat",
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        saveChat(chatId, newChat);
        logToFile(`Created new chat: ${chatId}`);
        res.json({ id: chatId, title: newChat.title, createdAt: newChat.createdAt, updatedAt: newChat.updatedAt });
    } catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).json({ error: "Failed to create chat" });
    }
});

// Delete chat
app.delete("/api/chats/:chatId", (req, res) => {
    try {
        const { chatId } = req.params;
        const chatPath = getChatPath(chatId);
        if (fs.existsSync(chatPath)) {
            fs.unlinkSync(chatPath);
            logToFile(`Deleted chat: ${chatId}`);
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: "Failed to delete chat" });
    }
});

// Get chat messages
app.get("/api/chats/:chatId/messages", (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = loadChat(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }
        res.json(chat.messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// Send message and get AI response with streaming
app.post("/api/chats/:chatId/messages", async (req, res) => {
    try {
        const { chatId } = req.params;
        const { message, model, personality } = req.body;

        const selectedModel = model || MODEL_NAME;

        // Load fresh chat from disk
        const chat = loadChat(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        console.log(`📝 Current chat has ${chat.messages.length} messages before adding new one`);
        console.log(`🤖 Using model: ${selectedModel}`);

        // Add user message
        const userMessage = {
            role: "user",
            content: message,
            timestamp: new Date().toISOString()
        };
        chat.messages.push(userMessage);

        // Update title if first message
        if (chat.messages.length === 1) {
            chat.title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
        }

        // Save chat with user message immediately
        chat.updatedAt = new Date().toISOString();
        saveChat(chatId, chat);
        console.log(`💾 Saved chat with ${chat.messages.length} messages`);

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Build context from ALL previous messages (excluding the current user message)
        const previousMessages = chat.messages.slice(0, -1);

        console.log(`🧠 Building context with ${previousMessages.length} previous messages`);

        let promptWithContext;

        if (previousMessages.length > 0) {
            // Build conversation history - include ALL messages in order
            const contextLines = [];

            for (const msg of previousMessages) {
                if (msg.role === 'user') {
                    contextLines.push(`Human: ${msg.content}`);
                } else if (msg.role === 'assistant') {
                    contextLines.push(`Assistant: ${msg.content}`);
                }
            }

            // Add current message
            contextLines.push(`Human: ${message}`);
            contextLines.push('Assistant:');

            promptWithContext = contextLines.join('\n\n');

            console.log(`📋 Full prompt length: ${promptWithContext.length} chars`);
            console.log(`📋 Context includes ${previousMessages.filter(m => m.role === 'user').length} user messages and ${previousMessages.filter(m => m.role === 'assistant').length} assistant messages`);
        } else {
            promptWithContext = `Human: ${message}\n\nAssistant:`;
        }

        // Get AI response from Ollama with streaming using chat API
        logToFile(`Sending to Ollama with ${previousMessages.length} previous messages`);
        let fullResponse = '';

        try {
            // Build messages array for Ollama chat API
            const ollamaMessages = [];

            // Build system prompt with persona, context, and memories
            let systemPrompt = "";
            
            // Add persona if provided
            if (personality && personality.trim()) {
                systemPrompt += personality.trim();
            }
            
            // Add user context
            const contextString = getUserContextString();
            if (contextString) {
                systemPrompt += contextString;
            }
            
            // Add memories
            const memoriesString = getMemoriesContext();
            if (memoriesString) {
                systemPrompt += memoriesString;
            }
            
            // Add system message if we have any context
            if (systemPrompt) {
                ollamaMessages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            // Add all previous messages
            for (const msg of previousMessages) {
                ollamaMessages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            }

            // Add current user message
            ollamaMessages.push({
                role: 'user',
                content: message
            });

            console.log(`📤 Sending ${ollamaMessages.length} messages to Ollama with tools`);

            const response = await axios.post(OLLAMA_URL, {
                model: selectedModel,
                messages: ollamaMessages,
                tools: [LOAN_ELIGIBILITY_TOOL, SAVE_MEMORY_TOOL],
                stream: true
            }, {
                responseType: 'stream'
            });

            let toolCalls = [];

            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);

                        // Send status updates
                        if (parsed.status) {
                            res.write(`data: ${JSON.stringify({ status: parsed.status })}\n\n`);
                        }

                        // Check for tool calls
                        if (parsed.message && parsed.message.tool_calls) {
                            console.log('Tool call detected:', parsed.message.tool_calls);
                            toolCalls = parsed.message.tool_calls;
                        }

                        // For chat API, response is in message.content
                        if (parsed.message && parsed.message.content) {
                            fullResponse += parsed.message.content;
                            res.write(`data: ${JSON.stringify({ token: parsed.message.content })}\n\n`);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            });

            response.data.on('end', async () => {
                // If tool was called, execute it and get response
                if (toolCalls.length > 0) {
                    console.log('Executing tool calls...');

                    for (const toolCall of toolCalls) {
                        if (toolCall.function.name === 'save_to_memory') {
                            // Parse arguments
                            let args;
                            if (typeof toolCall.function.arguments === 'string') {
                                args = JSON.parse(toolCall.function.arguments);
                            } else {
                                args = toolCall.function.arguments;
                            }

                            console.log('💾 Saving to memory:', args);

                            // Send status to frontend
                            res.write(`data: ${JSON.stringify({
                                status: 'Saving to memory...',
                                toolCalling: true
                            })}\n\n`);

                            const savedMemory = saveMemory(args.memory_content, args.category);

                            console.log('✅ Memory saved:', savedMemory.id);

                            // Send saved confirmation
                            res.write(`data: ${JSON.stringify({
                                status: '✓ Saved to memory',
                                toolCalling: true,
                                memorySaved: true
                            })}\n\n`);

                            // Continue with response
                            const toolResult = JSON.stringify({ success: true, message: "Information saved to memory successfully" });

                            // Send tool result back to Ollama
                            const toolMessages = [...ollamaMessages];
                            toolMessages.push({
                                role: 'assistant',
                                content: fullResponse,
                                tool_calls: toolCalls
                            });
                            toolMessages.push({
                                role: 'tool',
                                content: toolResult
                            });

                            // Get final response from Ollama with tool result
                            const finalResponse = await axios.post(OLLAMA_URL, {
                                model: selectedModel,
                                messages: toolMessages,
                                stream: true
                            }, {
                                responseType: 'stream'
                            });

                            let finalFullResponse = '';

                            finalResponse.data.on('data', (chunk) => {
                                const lines = chunk.toString().split('\n').filter(line => line.trim());
                                for (const line of lines) {
                                    try {
                                        const parsed = JSON.parse(line);
                                        if (parsed.message && parsed.message.content) {
                                            finalFullResponse += parsed.message.content;
                                            res.write(`data: ${JSON.stringify({ token: parsed.message.content })}\n\n`);
                                        }
                                    } catch (e) {
                                        // Ignore
                                    }
                                }
                            });

                            finalResponse.data.on('end', () => {
                                const latestChat = loadChat(chatId);
                                const aiMessage = {
                                    role: "assistant",
                                    content: finalFullResponse || "I've saved that information to memory.",
                                    timestamp: new Date().toISOString()
                                };
                                latestChat.messages.push(aiMessage);
                                latestChat.updatedAt = new Date().toISOString();
                                saveChat(chatId, latestChat);

                                console.log(`✅ Completed with memory save. Chat now has ${latestChat.messages.length} messages`);
                                logToFile(`Memory saved and response completed`);

                                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                                res.end();
                            });

                            finalResponse.data.on('error', (error) => {
                                console.error("Final response error:", error);
                                res.write(`data: ${JSON.stringify({ error: "Error generating final response" })}\n\n`);
                                res.end();
                            });

                        } else if (toolCall.function.name === 'check_loan_eligibility') {
                            // Parse arguments - handle both string and object
                            let args;
                            if (typeof toolCall.function.arguments === 'string') {
                                args = JSON.parse(toolCall.function.arguments);
                            } else {
                                args = toolCall.function.arguments;
                            }

                            console.log('📊 Checking loan eligibility:', args);

                            // Send tool calling status to frontend
                            res.write(`data: ${JSON.stringify({
                                status: `Checking loan eligibility for ${args.person_name}...`,
                                toolCalling: true
                            })}\n\n`);

                            const eligibilityResult = checkLoanEligibility(
                                args.person_name,
                                args.loan_amount
                            );

                            console.log('✅ Eligibility result:', eligibilityResult);

                            // Send calculation complete status
                            res.write(`data: ${JSON.stringify({
                                status: 'Calculation complete. Generating response...',
                                toolCalling: true
                            })}\n\n`);

                            // Format the result for AI
                            const toolResult = JSON.stringify(eligibilityResult, null, 2);

                            // Send tool result back to Ollama
                            const toolMessages = [...ollamaMessages];
                            toolMessages.push({
                                role: 'assistant',
                                content: fullResponse,
                                tool_calls: toolCalls
                            });
                            toolMessages.push({
                                role: 'tool',
                                content: toolResult
                            });

                            // Get final response from Ollama with tool result
                            const finalResponse = await axios.post(OLLAMA_URL, {
                                model: selectedModel,
                                messages: toolMessages,
                                stream: true
                            }, {
                                responseType: 'stream'
                            });

                            let finalFullResponse = '';

                            finalResponse.data.on('data', (chunk) => {
                                const lines = chunk.toString().split('\n').filter(line => line.trim());
                                for (const line of lines) {
                                    try {
                                        const parsed = JSON.parse(line);
                                        if (parsed.message && parsed.message.content) {
                                            finalFullResponse += parsed.message.content;
                                            res.write(`data: ${JSON.stringify({ token: parsed.message.content })}\n\n`);
                                        }
                                    } catch (e) {
                                        // Ignore
                                    }
                                }
                            });

                            finalResponse.data.on('end', () => {
                                // Reload chat to ensure we have latest state
                                const latestChat = loadChat(chatId);

                                // Add AI message with tool result
                                const aiMessage = {
                                    role: "assistant",
                                    content: finalFullResponse || "I've checked the loan eligibility.",
                                    timestamp: new Date().toISOString()
                                };
                                latestChat.messages.push(aiMessage);

                                latestChat.updatedAt = new Date().toISOString();
                                saveChat(chatId, latestChat);

                                console.log(`✅ Completed with tool call. Chat now has ${latestChat.messages.length} messages`);
                                logToFile(`AI Response with tool completed`);

                                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                                res.end();
                            });

                            finalResponse.data.on('error', (error) => {
                                console.error("Final response error:", error);
                                res.write(`data: ${JSON.stringify({ error: "Error generating final response" })}\n\n`);
                                res.end();
                            });
                        }
                    }
                } else {
                    // No tool call, save normal response
                    const latestChat = loadChat(chatId);

                    const aiMessage = {
                        role: "assistant",
                        content: fullResponse || "I apologize, but I couldn't generate a response.",
                        timestamp: new Date().toISOString()
                    };
                    latestChat.messages.push(aiMessage);

                    latestChat.updatedAt = new Date().toISOString();
                    saveChat(chatId, latestChat);

                    console.log(`✅ Completed. Chat now has ${latestChat.messages.length} messages`);
                    logToFile(`AI Response completed: ${fullResponse.substring(0, 100)}...`);

                    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                    res.end();
                }
            });

            response.data.on('error', (error) => {
                console.error("Stream error:", error);
                res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
                res.end();
            });

        } catch (error) {
            console.error("Ollama error:", error.message);
            const errorMessage = "I'm having trouble connecting to the AI model. Please make sure Ollama is running with the gpt-oss:20b model.";

            // Reload chat to ensure we have latest state
            const latestChat = loadChat(chatId);

            const aiMessage = {
                role: "assistant",
                content: errorMessage,
                timestamp: new Date().toISOString()
            };
            latestChat.messages.push(aiMessage);
            saveChat(chatId, latestChat);

            res.write(`data: ${JSON.stringify({ token: errorMessage })}\n\n`);
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
        }

    } catch (error) {
        console.error("Error processing message:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to process message" });
        }
    }
});

// Regenerate last response with streaming
app.post("/api/chats/:chatId/regenerate", async (req, res) => {
    try {
        const { chatId } = req.params;
        const { message, model, personality } = req.body;

        const selectedModel = model || MODEL_NAME;

        const chat = loadChat(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        console.log(`🔄 Regenerating with model: ${selectedModel}`);

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Build context for regenerate
        const previousMessages = chat.messages.slice(0, -1);

        console.log(`🔄 Regenerating with ${previousMessages.length} previous messages`);

        logToFile(`Regenerating response for chat: ${chatId} with ${previousMessages.length - 1} previous messages`);
        let fullResponse = '';

        try {
            // Build messages array for Ollama chat API
            const ollamaMessages = [];

            // Build system prompt with persona, context, and memories
            let systemPrompt = "";
            
            // Add persona if provided
            if (personality && personality.trim()) {
                systemPrompt += personality.trim();
            }
            
            // Add user context
            const contextString = getUserContextString();
            if (contextString) {
                systemPrompt += contextString;
            }
            
            // Add memories
            const memoriesString = getMemoriesContext();
            if (memoriesString) {
                systemPrompt += memoriesString;
            }
            
            // Add system message if we have any context
            if (systemPrompt) {
                ollamaMessages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            // Add all previous messages except the last AI response
            for (let i = 0; i < previousMessages.length - 1; i++) {
                const msg = previousMessages[i];
                ollamaMessages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            }

            // Add the last user message again
            const lastUserMsg = previousMessages[previousMessages.length - 1];
            if (lastUserMsg && lastUserMsg.role === 'user') {
                ollamaMessages.push({
                    role: 'user',
                    content: lastUserMsg.content
                });
            }

            console.log(`📤 Regenerating with ${ollamaMessages.length} messages to Ollama`);

            const response = await axios.post(OLLAMA_URL, {
                model: selectedModel,
                messages: ollamaMessages,
                stream: true
            }, {
                responseType: 'stream'
            });

            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);

                        if (parsed.status) {
                            res.write(`data: ${JSON.stringify({ status: parsed.status })}\n\n`);
                        }

                        // For chat API, response is in message.content
                        if (parsed.message && parsed.message.content) {
                            fullResponse += parsed.message.content;
                            res.write(`data: ${JSON.stringify({ token: parsed.message.content })}\n\n`);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            });

            response.data.on('end', () => {
                // Store as alternative on the last AI message instead of pushing new
                const latestChat = loadChat(chatId);
                const lastMsg = latestChat.messages[latestChat.messages.length - 1];

                if (lastMsg && lastMsg.role === 'assistant') {
                    // Initialize alternatives array if not present
                    if (!lastMsg.alternatives) {
                        lastMsg.alternatives = [lastMsg.content];
                    }
                    // Add new response as an alternative
                    const newContent = fullResponse || "I apologize, but I couldn't generate a response.";
                    lastMsg.alternatives.push(newContent);
                    lastMsg.activeIndex = lastMsg.alternatives.length - 1;
                    lastMsg.content = newContent;
                } else {
                    // Fallback: just push a new message
                    const aiMessage = {
                        role: "assistant",
                        content: fullResponse || "I apologize, but I couldn't generate a response.",
                        timestamp: new Date().toISOString()
                    };
                    latestChat.messages.push(aiMessage);
                }

                latestChat.updatedAt = new Date().toISOString();
                saveChat(chatId, latestChat);

                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                res.end();
            });

            response.data.on('error', (error) => {
                console.error("Stream error:", error);
                res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
                res.end();
            });

        } catch (error) {
            console.error("Ollama error:", error.message);
            const errorMessage = "I'm having trouble connecting to the AI model. Please make sure Ollama is running with the gpt-oss:20b model.";

            const aiMessage = {
                role: "assistant",
                content: errorMessage,
                timestamp: new Date().toISOString()
            };
            chat.messages.push(aiMessage);
            saveChat(chatId, chat);

            res.write(`data: ${JSON.stringify({ token: errorMessage })}\n\n`);
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
        }

    } catch (error) {
        console.error("Error regenerating response:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to regenerate response" });
        }
    }
});

// Switch active alternative for a message
app.post("/api/chats/:chatId/messages/:msgIndex/switch", async (req, res) => {
    try {
        const { chatId, msgIndex } = req.params;
        const { activeIndex } = req.body;

        const chat = loadChat(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        const idx = parseInt(msgIndex);
        const msg = chat.messages[idx];
        if (!msg || !msg.alternatives) {
            return res.status(400).json({ error: "No alternatives for this message" });
        }

        if (activeIndex < 0 || activeIndex >= msg.alternatives.length) {
            return res.status(400).json({ error: "Invalid alternative index" });
        }

        msg.activeIndex = activeIndex;
        msg.content = msg.alternatives[activeIndex];
        saveChat(chatId, chat);

        res.json({ success: true, content: msg.content });
    } catch (error) {
        console.error("Error switching alternative:", error);
        res.status(500).json({ error: "Failed to switch alternative" });
    }
});

// Ollama integration
async function getOllamaResponse(prompt, conversationHistory = []) {
    try {
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL_NAME,
            prompt: prompt,
            stream: false
        });

        return response.data.response || "I apologize, but I couldn't generate a response.";
    } catch (error) {
        console.error("Ollama error:", error.message);
        logToFile(`Ollama error: ${error.message}`);
        return "I'm having trouble connecting to the AI model. Please make sure Ollama is running with the gpt-oss:20b model.";
    }
}

// Socket.io connection
io.on("connection", (socket) => {
    console.log("✅ Frontend connected:", socket.id);
    logToFile(`Frontend connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log("❌ Frontend disconnected:", socket.id);
        logToFile(`Frontend disconnected: ${socket.id}`);
    });
});

// Earthquake endpoint
app.post("/earthquake", (req, res) => {
    const now = new Date();
    const formattedTime = now.toLocaleString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

    console.log(`🚨 EARTHQUAKE DETECTED at ${formattedTime}`);
    logToFile(`🚨 EARTHQUAKE DETECTED at ${formattedTime}`);

    io.emit("earthquake", {
        message: "Seismic activity detected in your area. Please stay alert and follow safety protocols.",
        timestamp: formattedTime
    });

    res.status(200).json({
        status: "logged",
        time: formattedTime
    });
});

// IMPORTANT: listen on all interfaces
server.listen(3000, "0.0.0.0", () => {
    console.log("🚀 GramBharat AI Server running on port 3000");
    console.log("📁 Chats directory:", CHATS_DIR);
    console.log("📝 Logs directory:", LOGS_DIR);
    logToFile("Server started");
});