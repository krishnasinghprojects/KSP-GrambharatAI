# GramBharat AI

A ChatGPT-like AI interface with Indian-themed design, powered by Ollama with real-time streaming responses, intelligent loan eligibility assessment, and earthquake notifications for rural areas.

## 🌟 Key Features

- 🤖 **Multi-Model AI Chat** - Switch between GPT-OSS 20B, Gemma 2, and Llama 3.1
- 💰 **Intelligent Loan Assessment** - Real-time CIBIL score calculation and eligibility checking
- ⚡ **Real-time Streaming** - Token-by-token AI responses
- 🔧 **Ollama Tool Calling** - Native function calling for complex operations
- 💬 **Full Context Memory** - Maintains conversation history
- 🎨 **Glassmorphic UI** - Premium Apple-inspired design
- 🌓 **Dark/Light Mode** - Smooth theme transitions
- 🚨 **Earthquake Alerts** - Real-time notifications for rural safety
- 📝 **Markdown Support** - Rich text formatting with syntax highlighting
- 🔄 **Message Actions** - Copy and regenerate responses

## 📊 Loan Eligibility System

### CIBIL Score Calculation
Our advanced algorithm calculates CIBIL scores (300-900) using:
- **Payment History** (35%): On-time payments, defaults, delays
- **Credit Utilization** (30%): Debt-to-income ratio
- **Credit History Length** (15%): Years of credit activity
- **Income Stability** (10%): Employment type and duration
- **Asset Coverage** (10%): Land, property, gold value

### Eligibility Criteria
- CIBIL ≥ 750: Excellent (up to 20x monthly income)
- CIBIL 650-749: Good (up to 10x monthly income)
- CIBIL 550-649: Fair (up to 5x monthly income, collateral required)
- CIBIL < 550: Poor (rejected or micro-loans only)

### Available Profiles
1. **Mohan Lal** - Retired Government Employee
2. **Radha Sharma** - Primary School Teacher
3. **Ram Vilas** - Farmer
4. **Phool Kumari** - Self Help Group Leader
5. **Sita Devi** - Anganwadi Worker

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Ollama** installed and running
   - Install from: https://ollama.ai
   - Pull models:
     ```bash
     ollama pull gpt-oss:20b
     ollama pull gemma2:latest
     ollama pull llama3.1:8b
     ```

### Installation

1. Install backend dependencies:
```bash
npm install
```

2. Install frontend dependencies:
```bash
cd frontend/grambharat-frontend
npm install
```

3. Add your logo:
   - Place `grambharatlogo.png` in `frontend/grambharat-frontend/public/`

### Running the Application

1. Start Ollama (if not already running):
```bash
ollama serve
```

2. Start the backend server:
```bash
node server.js
```

3. In a new terminal, start the frontend:
```bash
cd frontend/grambharat-frontend
npm run dev
```

4. Open your browser to: http://localhost:5173

## 🧪 Testing Loan Eligibility

### Via Chat Interface
Simply ask the AI:
```
"Is Phool Kumari eligible for a 5 lakh loan?"
"Can Ram Vilas get a loan of 3 lakhs?"
"Check loan eligibility for Mohan Lal for 10 lakhs"
```

The AI will automatically call the loan eligibility tool and provide a detailed assessment.

### Via Test Script
```bash
node test-loan-eligibility.js
```

### Testing Earthquake Notifications
```bash
curl -X POST http://localhost:3000/earthquake
```

Or use the helper script:
```bash
./test-earthquake.sh
```

## 📁 Project Structure

```
├── server.js                          # Backend with Ollama + tool calling
├── loan-eligibility.js                # CIBIL calculation engine
├── financial-profiles/                # User financial data
│   ├── mohan-lal.json
│   ├── radha-sharma.json
│   ├── ram-vilas.json
│   ├── phool-kumari.json
│   └── sita-devi.json
├── chats/                             # Chat history (auto-created)
├── logs/                              # Application logs (auto-created)
├── SHOWCASE.md                        # Technical showcase document
└── frontend/grambharat-frontend/
    └── src/
        ├── components/
        │   ├── Sidebar.jsx            # Chat list
        │   ├── ChatArea.jsx           # Main chat interface
        │   ├── Message.jsx            # Message with copy/regenerate
        │   ├── ThinkingAnimation.jsx  # Streaming indicator
        │   └── EarthquakeNotification.jsx
        └── App.jsx                    # Main app with model selector
```

## 🎯 Key Technologies

### Backend
- Node.js + Express
- Socket.io (WebSocket)
- Axios (Ollama API)
- File-based storage (JSON)
- Custom CIBIL calculation engine

### Frontend
- React 18
- Vite
- Lucide React (icons)
- React Markdown + remark-gfm
- Socket.io Client
- Custom fonts (Luckiest Guy + Noto Serif)

## 🔧 API Endpoints

- `GET /api/chats` - Get all chats
- `POST /api/chats` - Create new chat
- `DELETE /api/chats/:chatId` - Delete a chat
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/chats/:chatId/messages` - Send message (SSE streaming with tool calling)
- `POST /api/chats/:chatId/regenerate` - Regenerate response (SSE streaming)
- `POST /earthquake` - Trigger earthquake notification

## 🎨 UI Features

- **Glassmorphic Design**: Backdrop blur with saturation
- **Liquid Glass Effect**: Apple-inspired premium feel
- **Custom Typography**: Indian aesthetic with Luckiest Guy
- **Theme System**: Smooth dark/light mode transitions
- **Model Selector**: Dropdown to switch AI models
- **Message Actions**: Copy and regenerate buttons
- **Search**: Real-time chat filtering
- **Responsive**: Optimized for desktop

## 📊 Loan Assessment Example

**Query:** "Is Phool Kumari eligible for a ₹5 lakh loan?"

**AI Response:**
```
✅ LOAN APPROVED

Applicant: Phool Kumari
CIBIL Score: 742 (Good)
Requested: ₹5,00,000
Max Eligible: ₹4,50,000

Monthly Income: ₹45,000
New EMI: ₹10,624
Debt-to-Income: 38.7%
Collateral Required: Yes

Reasons:
• Good credit score (742)
• Low debt burden
• Strong asset base (₹30.45L)
• Stable income source
```

## 🏆 Innovation Highlights

1. **Ollama Tool Calling**: Native function calling for loan assessment
2. **Real-time CIBIL**: Instant credit score calculation
3. **Complex Formulas**: Bank-grade eligibility algorithms
4. **Streaming UI**: Token-by-token response display
5. **Context Memory**: Full conversation history
6. **Multi-Model**: Switch between 3 AI models
7. **Rural-Focused**: Designed for Indian villages

## 📝 Future Enhancements

- Multi-language support (Hindi, regional languages)
- Voice input/output
- Mobile app
- Government scheme integration
- Agricultural data
- Weather integration
- Offline mode

## 🤝 Contributing

This is a hackathon prototype. For production use, consider:
- Database integration (MongoDB/PostgreSQL)
- User authentication
- Data encryption
- API rate limiting
- Error monitoring
- Automated testing

## 📄 License

MIT

---

**Built with ❤️ for Rural India**

*Empowering villages through AI-powered financial inclusion*

