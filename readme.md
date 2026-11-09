# RecallFlow AI 🧠
### Remember Every Conversation. Resolve Every Problem.

**RecallFlow AI** is an AI-powered customer support assistant designed to remember customer information, understand previous conversations, and provide personalized support using persistent AI memory.

Traditional chatbots often lose context when a conversation ends. RecallFlow AI addresses this limitation by combining conversational AI with long-term memory, helping customers avoid repeatedly explaining the same problems.

---

## 🚀 Project Overview

RecallFlow AI uses Groq-powered language models and Hindsight persistent memory to make customer support more contextual and personalized.

The system maintains customer-specific memory, retrieves relevant information from previous interactions, and uses that context to generate more meaningful responses.

## ✨ Key Features

- **AI-Powered Conversations:** Intelligent responses using Groq language models.
- **Persistent AI Memory:** Retains useful information across conversations using Hindsight.
- **Customer-Specific Memory:** Maintains separate memory spaces for individual customers.
- **Context-Aware Responses:** Uses relevant previous interactions to personalize answers.
- **Conversation History:** Maintains conversational context.
- **Memory Retrieval:** Retrieves previously stored information to improve future interactions.
- **Authentication:** Provides user authentication and protected application access.

## 🏗️ System Architecture

```text
                 CUSTOMER
                    |
                    v
              REACT FRONTEND
                    |
                    v
              FASTAPI BACKEND
                    |
           +--------+--------+
           |                 |
           v                 v
       GROQ AI           HINDSIGHT
           |                 |
           |            Persistent
           |              Memory
           |                 |
           +--------+--------+
                    |
                    v
           CONTEXT-AWARE RESPONSE
                    |
                    v
                 CUSTOMER
```

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Python, FastAPI |
| AI Model Provider | Groq |
| Memory Engine | Hindsight |
| Database | SQLite |
| Authentication | JWT |
| Version Control | Git, GitHub |

## 📁 Project Structure

```text
RecallFlow/
│
├── backend/
│   ├── Application source
│   ├── API routes
│   ├── AI integration
│   └── Memory integration
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

*The exact internal file structure may vary with implementation.*

## ⚙️ Installation and Setup

### Prerequisites

- Python 3.10 or newer
- Node.js and npm
- Git
- Groq API key
- Hindsight service configured and accessible

### 1. Clone the Repository

```bash
git clone https://github.com/Veerendrakumarkr2137/RecallFlow.git
cd RecallFlow
```

### 2. Backend Setup

```bash
cd backend
```

Create and activate a virtual environment:

**Windows PowerShell**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install backend dependencies using the dependency file provided in the backend directory.

For example, if it contains `requirements.txt`:

```bash
pip install -r requirements.txt
```

Configure your environment variables using the project's environment configuration and `.env.example` where provided.

Start the FastAPI application using the actual entry point configured in your backend.

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🔐 Environment Configuration

Configure the following integrations using your local environment files:

- Groq API credentials.
- Hindsight service URL and credentials, if required.
- Database configuration.
- JWT authentication settings.
- Frontend API base URL.

**Important:** Never commit actual API keys, passwords, tokens, or private environment files to GitHub.

Refer to the backend and frontend environment configuration for the exact variable names.

## 💡 How It Works

1. A customer starts a conversation with RecallFlow AI.
2. The backend receives the message.
3. The memory system retrieves relevant customer information.
4. Groq processes the conversation with available context.
5. The AI generates a personalized response.
6. Relevant conversation information is retained for future interactions.

## 🎯 Project Vision

Our vision is to move beyond traditional stateless chatbots and build intelligent support systems that understand customers over time.

RecallFlow AI aims to make every interaction more meaningful by combining AI reasoning, persistent memory, and personalized customer experiences.

## 🔮 Future Enhancements

- Customer 360° profiles.
- Advanced memory management.
- Support ticket management.
- Knowledge base and Retrieval-Augmented Generation (RAG).
- Human-agent escalation.
- Sentiment analysis.
- Customer support analytics.
- AI-powered workflow automation.

## 👨‍💻 Project Repository

**GitHub:** https://github.com/Veerendrakumarkr2137/RecallFlow

**Project Name:** RecallFlow AI

## 🙌 Acknowledgements

- [Hindsight](https://github.com/vectorize-io/hindsight) — Persistent AI memory.
- [Groq](https://groq.com/) — AI inference platform.
- [FastAPI](https://fastapi.tiangolo.com/) — Backend framework.
- [React](https://react.dev/) — Frontend library.

This project builds upon ideas and portions of the original [RecallCare AI](https://github.com/rakeshn7/RecallCare-AI) project. Please refer to the LICENSE file for applicable attribution and licensing terms.

---

**RecallFlow AI — Remember Every Conversation. Resolve Every Problem.** 🚀