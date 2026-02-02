# NestJS + OpenAI ChatGPT Starter

A NestJS starter project integrated with the **official OpenAI API** for building ChatGPT-powered applications.

![Patrick Star](https://media0.giphy.com/media/XdyyR97fGCELK/giphy.gif?cid=ecf05e47gt29de2jbwlhheibrr895r8qar1w8u40dz99psf8&rid=giphy.gif&ct=g)

## ✨ Features

- ✅ **Official OpenAI SDK** - Uses the maintained and reliable `openai` package
- ✅ **Environment Configuration** - Secure API key management with `@nestjs/config`
- ✅ **TypeScript Support** - Full type safety
- ✅ **Ready-to-use ChatGPT Service** - Pre-configured service for chat completions
- ✅ **REST API Endpoint** - Example POST endpoint to interact with ChatGPT
- ✅ **Mem0 Integration** - Built-in memory management for personalized conversations
- ✅ **Terminal CLI** - Interactive command-line interface accessible globally
- ✅ **User Management** - Multi-user support with persistent memory

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then add your OpenAI API key to `.env`:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Get your API key from:** [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### 3. Running the Application

```bash
# development mode
npm run start

# watch mode (recommended for development)
npm run start:dev

# production mode
npm run start:prod
```

The server will start on `http://localhost:3000`

## 🖥️ Terminal CLI (Interactive Chat)

This project includes a powerful terminal-based chat client that you can use anywhere!

### Using the Hosted CLI (Global Access)

Anyone can use the CLI without installing anything - just Node.js required:

```bash
# Option 1: Run directly from URL (one-liner)
curl -sL https://ai-memory-test.onrender.com/cli.js | node - https://ai-memory-test.onrender.com

# Option 2: Download and run (recommended)
curl -o chatgpt-cli.js https://ai-memory-test.onrender.com/cli.js
node chatgpt-cli.js https://ai-memory-test.onrender.com
```

### Using the CLI Locally

```bash
# Run with local server
npm run chat

# Or with ts-node directly
npx ts-node cli-chat.ts

# Connect to different server
npx ts-node cli-chat.ts http://localhost:4000
npx ts-node cli-chat.ts https://your-hosted-api.com
```

### CLI Features

The terminal client includes:

- 🧠 **Memory Mode** - Conversations with persistent memory per user
- 💬 **Basic Mode** - Stateless ChatGPT conversations
- 👤 **User Management** - Create and switch between users
- 📚 **View Memories** - See what the AI remembers about you
- 🎨 **Beautiful Interface** - Clean, intuitive terminal UI

### CLI Commands

| Command | Description |
|---------|-------------|
| `/mode` | Switch between basic and memory chat modes |
| `/user` | Create or switch user (required for memory mode) |
| `/memories` | View your stored memories |
| `/clear` | Clear the screen |
| `/help` | Show help message |
| `/quit` | Exit the chat |

### Example CLI Session

```
╔════════════════════════════════════════════════════════════╗
║           🤖 NestJS ChatGPT Terminal Client 🤖             ║
╠════════════════════════════════════════════════════════════╣
║  Server: https://ai-memory-test.onrender.com              ║
╚════════════════════════════════════════════════════════════╝

✅ Connected to API

[🧠 Memory Mode] [👤 No user]

You: /user
👤 User Management
  1. Create new user
  2. Select existing user
  3. Cancel

Choose option (1-3): 1
Enter name: John
Enter email: john@example.com

✅ User created: John (abc123...)

You: My favorite color is blue
🤖 AI: That's lovely! Blue is a great choice...
💾 1 new memory(ies) stored

You: What's my favorite color?
🤖 AI: Your favorite color is blue!
```

## 📡 API Usage

### Chat Endpoint

Send a POST request to `/chat` with a message:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, ChatGPT!"}'
```

**Response:**

```json
{
  "success": true,
  "message": "Hello, ChatGPT!",
  "response": "Hello! How can I assist you today?"
}
```

### Example with JavaScript/Fetch

```javascript
fetch('http://localhost:3000/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What is NestJS?'
  })
})
  .then(res => res.json())
  .then(data => console.log(data.response));
```

## 🏗️ Project Structure

```
src/
├── app.controller.ts      # Main controller with /chat endpoint
├── app.module.ts          # Root module with ConfigModule
├── app.service.ts         # App service
├── chatgpt.service.ts     # ChatGPT service with OpenAI integration
└── main.ts                # Application entry point
```

## 🔧 Configuration

The `ChatGPTService` is configured with:

- **Model:** `gpt-3.5-turbo` (you can change to `gpt-4` or other models)
- **Max Tokens:** 500
- **Temperature:** 0.7

Modify these in `src/chatgpt.service.ts` as needed.

## 🧪 Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## 📝 Why This Boilerplate?

The old `chatgpt` package (v3.x) had several issues:
- ❌ Used unofficial browser-based authentication
- ❌ Deprecated and unreliable
- ❌ CommonJS/ESM module conflicts
- ❌ No longer maintained

This starter uses the **official OpenAI SDK** which:
- ✅ Is actively maintained by OpenAI
- ✅ Supports all latest models (GPT-4, GPT-3.5-turbo, etc.)
- ✅ Has proper TypeScript support
- ✅ Uses official API keys (secure and reliable)

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Keep your OpenAI API key secret
- The `.env` file is already in `.gitignore`
- Use `.env.example` as a template for sharing

## 📚 Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)

## 💡 Tips

- Monitor your API usage at [platform.openai.com/usage](https://platform.openai.com/usage)
- Set usage limits to avoid unexpected charges
- Consider implementing rate limiting for production use
- Add error handling and retry logic for production applications

## 📄 License

This project is [MIT licensed](LICENSE).

---

If this boilerplate saved you time, please **leave a ⭐** on the repository!
