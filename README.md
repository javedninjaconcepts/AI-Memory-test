# NestJS + OpenAI ChatGPT Starter

A NestJS starter project integrated with the **official OpenAI API** for building ChatGPT-powered applications.

![Patrick Star](https://media0.giphy.com/media/XdyyR97fGCELK/giphy.gif?cid=ecf05e47gt29de2jbwlhheibrr895r8qar1w8u40dz99psf8&rid=giphy.gif&ct=g)

## ✨ Features

- ✅ **Official OpenAI SDK** - Uses the maintained and reliable `openai` package
- ✅ **Environment Configuration** - Secure API key management with `@nestjs/config`
- ✅ **TypeScript Support** - Full type safety
- ✅ **Ready-to-use ChatGPT Service** - Pre-configured service for chat completions
- ✅ **REST API Endpoint** - Example POST endpoint to interact with ChatGPT

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
