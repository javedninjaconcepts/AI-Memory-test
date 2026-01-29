# Mem0 Implementation Status

## Overview

This document provides a detailed explanation of the Mem0 integration in the NestJS ChatGPT Starter project. Mem0 is a memory layer that enables AI applications to have persistent, contextual memory across conversations.

## Current Status: ✅ Fully Implemented

The Mem0 integration is **fully implemented and functional**. The implementation includes:

- Core Mem0 service for memory management
- Memory-enhanced chat endpoint with intelligent context retrieval
- File upload for memory extraction
- User management system with JSON file persistence
- Full CRUD operations for memories
- Fitness AI-optimized memory extraction (Pro tier)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        App Module                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ UsersModule │  │ Mem0Module  │  │     MemoryModule        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │                │                      │                │
│         ▼                ▼                      ▼                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │UsersService │  │ Mem0Service │  │   MemoryController      │  │
│  │(JSON file)  │  │(Pro/Free)   │  │   + ChatGPTService      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Mem0 Cloud    │
                    │   (mem0ai SDK)  │
                    └─────────────────┘
```

---

## Module Structure

### 1. Mem0 Core Module (`src/mem0/`)

#### Files:
- `mem0.module.ts` - NestJS module definition
- `mem0.service.ts` - Core service with Mem0 API integration and Pro/Free tier support
- `dto/add-memory.dto.ts` - DTOs for adding memories with Mem0Options
- `dto/search-memory.dto.ts` - DTO for searching memories

### 2. Memory Feature Module (`src/memory/`)

#### Files:
- `memory.module.ts` - Feature module combining Mem0 + ChatGPT + Users
- `memory.controller.ts` - REST API endpoints for memory operations
- `dto/chat-with-memory.dto.ts` - DTOs for chat requests

### 3. Users Module (`src/users/`)

#### Files:
- `users.module.ts` - User management module
- `users.service.ts` - File-backed user storage service (users.json)
- `users.controller.ts` - REST API endpoints for user management
- `dto/create-user.dto.ts` - DTO for user creation

---

## Mem0 Service Features

The `Mem0Service` (`src/mem0/mem0.service.ts`) provides the following capabilities:

### Memory Operations

| Method | Description |
|--------|-------------|
| `addMemory(dto)` | Add memories from conversation messages |
| `addFromText(dto)` | Add memory from raw text (for file uploads) |
| `updateMemory(memoryId, text, metadata)` | Update an existing memory |
| `searchMemory(dto)` | Semantic search across memories |
| `getMemories(userId)` | Get all memories for a user |
| `getMemoriesByAgent(agentId)` | Get memories by agent ID |
| `getMemory(memoryId)` | Get a specific memory by ID |
| `deleteMemory(memoryId)` | Delete a specific memory |
| `deleteAllUserMemories(userId)` | Delete all memories for a user |
| `getMemoryHistory(memoryId)` | Get history of a memory's changes |

### Type Definitions

```typescript
interface MemoryResult {
  id: string;
  memory: string;
  user_id?: string;
  agent_id?: string;
  run_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

interface AddMemoryResult {
  results: Array<{
    id: string;
    memory: string;
    event: string;
  }>;
}

interface SearchResult {
  id: string;
  memory: string;
  score: number;
  user_id?: string;
  agent_id?: string;
  metadata?: Record<string, any>;
}
```

### Mem0 Options Interface

```typescript
interface Mem0Options {
  // Selective memory extraction
  includes?: string;
  excludes?: string;

  // Extraction guidelines
  customInstructions?: string;

  // Custom categories for domain-specific labeling
  customCategories?: Record<string, string>;

  // Control options
  infer?: boolean;        // Default true
  version?: string;       // "v2" recommended
  enableGraph?: boolean;  // Build knowledge graph

  // Temporal options
  timestamp?: number;     // Unix timestamp
  expirationDate?: string; // YYYY-MM-DD
  immutable?: boolean;    // Prevent updates
}
```

---

## Pro Tier Features (Fitness AI Optimized)

The implementation includes fitness-optimized memory extraction settings for Pro tier users.

### Pricing Tiers:
- **FREE (Hobby)**: Basic memory add/search/get
- **PRO ($249/mo)**: + enable_graph, custom_categories, custom_instructions, includes, excludes

### Free Tier Defaults:
```typescript
const FITNESS_MEM0_DEFAULTS: Mem0Options = {
  infer: true,
};
```

### Pro Tier Options (enabled with `MEM0_PRO_TIER=true`):
```typescript
const FITNESS_MEM0_PRO_OPTIONS: Mem0Options = {
  includes: 'Extract personal details, food preferences, allergies, health information, exercise routines, fitness goals, body measurements, workout preferences, dietary restrictions, supplements, sleep patterns, injuries, and physical limitations',
  excludes: 'Ignore casual conversation, opinions about apps, weather comments, greetings, small talk, and temporary complaints',
  customInstructions: `Extract and categorize fitness-related information:
    1) Exercise preferences with intensity levels (light/moderate/intense)
    2) Injuries or physical limitations with affected body parts
    3) Fitness goals with timeframes if mentioned
    4) Dietary patterns including meal timing and calorie targets
    5) Body measurements (weight, height, body fat percentage)
    6) Sleep and recovery patterns
    7) Supplement and medication usage
    Convert relative dates to absolute dates when possible.
    Flag any mentioned allergies as high-priority memories.
    Track progress metrics when user shares workout results.`,
  customCategories: {
    fitness_goals: 'Weight loss, muscle gain, endurance, flexibility goals',
    exercise_preferences: 'Preferred workouts, gym vs home, cardio vs strength',
    dietary_info: 'Food preferences, allergies, meal timing, calorie targets',
    body_metrics: 'Weight, height, body fat, measurements',
    injuries_limitations: 'Current injuries, past injuries, physical limitations',
    health_conditions: 'Medical conditions affecting fitness',
    supplements: 'Vitamins, protein, pre-workout, medications',
    sleep_recovery: 'Sleep patterns, rest days, recovery methods',
    workout_schedule: 'Training days, preferred times, frequency',
    progress_tracking: 'PRs, milestones, weight changes, measurements',
  },
  infer: true,
  enableGraph: true,
};
```

---

## API Endpoints

### Memory Controller Routes (`/memory`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/memory/chat` | Chat with memory context |
| `POST` | `/memory/upload` | Upload file for memory extraction |
| `GET` | `/memory/search` | Semantic search memories |
| `GET` | `/memory/user/:userId` | Get all memories for a user |
| `GET` | `/memory/agent/:agentId` | Get all memories for an agent |
| `GET` | `/memory/:memoryId` | Get a specific memory |
| `GET` | `/memory/:memoryId/history` | Get memory change history |
| `PUT` | `/memory/:memoryId` | Update a specific memory |
| `DELETE` | `/memory/:memoryId` | Delete a specific memory |
| `DELETE` | `/memory/user/:userId/all` | Delete all user memories |

### Users Controller Routes (`/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users` | Create a new user |
| `GET` | `/users` | List all users |
| `GET` | `/users/:id` | Get a specific user |
| `DELETE` | `/users/:id` | Delete a user |
| `POST` | `/users/:id/session` | Generate a session ID for a user |

---

## Chat with Memory Flow

The `/memory/chat` endpoint implements a complete memory-enhanced conversation flow:

```
┌──────────────────────────────────────────────────────────────────┐
│                     Chat with Memory Flow                         │
└──────────────────────────────────────────────────────────────────┘

1. User sends message
        │
        ▼
┌───────────────────┐
│ Validate Request  │──▶ Check userId exists in users.json
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Search Memories   │──▶ Semantic search (limit: 10 results)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Filter by Score   │──▶ Keep memories with score > 3.5
└───────────────────┘    Sort by score descending, take top 3
        │
        ▼
┌───────────────────┐
│ Build Context     │──▶ Format memories as system context
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Get AI Response   │──▶ ChatGPT with memory context
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Store Conversation│──▶ Add user message + AI response to Mem0
└───────────────────┘    (by user_id only, no agent_id or session_id)
        │
        ▼
┌───────────────────┐
│ Return Response   │──▶ Include response, memories used, new memories created
└───────────────────┘
```

### Memory Score Filtering Logic

The implementation uses intelligent score-based filtering:
1. Fetch up to 10 memories from semantic search
2. Filter to keep only memories with `score > 3.5`
3. Sort remaining memories by score (highest first)
4. Take the top 3 most relevant memories for context

```typescript
const relevantMemories = searchResults
  .filter((m) => m.score > 3.5)
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);
```

### Response Structure

```typescript
interface ChatResponse {
  success: boolean;
  message: string;        // Original user message
  response: string;       // AI response
  memoriesUsed: string[]; // Memories retrieved for context
  newMemoriesCreated: number;
}
```

### Request Structure

```typescript
interface ChatWithMemoryDto {
  message: string;  // Required: The user's message
  userId: string;   // Required: The user ID for memory association
}
```

---

## File Upload for Memory

The `/memory/upload` endpoint allows uploading text files to extract and store memories:

### Supported Features:
- Accepts any text file via multipart/form-data
- Associates memories with a specific user (user_id only)
- Stores file metadata (filename, mimetype, size, upload timestamp)

### Request:
- `file` - The file to upload (multipart/form-data)
- `userId` - Required user ID

### Response Structure:
```typescript
interface UploadResponse {
  success: boolean;
  fileName: string;
  memoriesExtracted: number;
  message: string;
}
```

### Process:
1. Read file buffer as UTF-8 text
2. Validate file is not empty
3. Convert to message format for Mem0
4. Store with user association and metadata

---

## Configuration

### Required Environment Variables

```bash
# OpenAI API Key (required for ChatGPT)
OPENAI_API_KEY=sk-your-openai-key

# Mem0 API Key (required for memory features)
MEM0_API_KEY=your-mem0-api-key

# Optional: Enable Pro tier features
MEM0_PRO_TIER=true
```

### Dependencies

```json
{
  "mem0ai": "^2.2.1",
  "openai": "^6.16.0",
  "multer": "^1.4.5-lts.1",
  "uuid": "^13.0.0"
}
```

---

## User Management

The implementation includes a file-backed user management system:

### Features:
- Create users with unique IDs (`user-{uuid}` format)
- Persistent storage in `users.json` file
- Get, update, delete users
- Check user existence (required for memory operations)
- Generate session IDs for conversations
- Default demo user created on startup if no users exist

### User Interface:
```typescript
interface User {
  id: string;
  name: string;
  email?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Default Demo User:
```json
{
  "id": "user-demo-001",
  "name": "Demo User",
  "email": "demo@example.com",
  "metadata": { "role": "demo" }
}
```

### Storage:
Users are stored in `users.json` at the project root and persist across server restarts.

---

## Usage Examples

### 1. Chat with Memory

```bash
curl -X POST http://localhost:4000/memory/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My favorite color is blue",
    "userId": "user-demo-001"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "My favorite color is blue",
  "response": "That's great! Blue is a wonderful color...",
  "memoriesUsed": [],
  "newMemoriesCreated": 1
}
```

### 2. Search Memories

```bash
curl "http://localhost:4000/memory/search?q=favorite%20color&userId=user-demo-001&limit=5"
```

### 3. Get User Memories

```bash
curl http://localhost:4000/memory/user/user-demo-001
```

### 4. Upload File for Memory

```bash
curl -X POST http://localhost:4000/memory/upload \
  -F "file=@document.txt" \
  -F "userId=user-demo-001"
```

### 5. Update Memory

```bash
curl -X PUT http://localhost:4000/memory/memory-id-here \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Updated memory content",
    "metadata": { "updated": true }
  }'
```

### 6. Delete Memory

```bash
curl -X DELETE http://localhost:4000/memory/memory-id-here
```

### 7. Create User

```bash
curl -X POST http://localhost:4000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "metadata": { "plan": "premium" }
  }'
```

### 8. Generate Session ID

```bash
curl -X POST http://localhost:4000/users/user-demo-001/session
```

---

## Key Implementation Details

### 1. Graceful Initialization
The Mem0 service implements `OnModuleInit` to initialize the client on startup. If `MEM0_API_KEY` is not set, it logs a warning instead of throwing an error, allowing the app to run without memory features.

### 2. Client Validation
All service methods call `ensureClient()` to verify the Mem0 client is initialized before making API calls.

### 3. Memory Context Building
The controller builds a formatted context string from retrieved memories:

```typescript
private buildMemoryContext(memories: SearchResult[]): string {
  if (!memories || memories.length === 0) {
    return '';
  }
  const memoryStrings = memories.map((m, i) => `${i + 1}. ${m.memory}`);
  return `Here is what I remember about this user:\n${memoryStrings.join('\n')}\n\nUse this context to provide a personalized response.`;
}
```

### 4. User-Only Memory Association
The current implementation uses **only `user_id`** for memory association. The `agent_id` and `session_id` parameters are commented out throughout the codebase for simplicity.

### 5. Score Logging
Memory search scores are logged to console for debugging:
```typescript
console.log('Memory search scores:', searchResults.map(m => m.score));
```

### 6. Pro Tier Detection
The service automatically detects and applies Pro tier options based on the `MEM0_PRO_TIER` environment variable:
```typescript
this.isProTier = this.configService.get<string>('MEM0_PRO_TIER') === 'true';
```

---

## Postman Collection

A Postman collection is available at `postman/NestJS-Mem0-Collection.postman_collection.json` with pre-configured requests for testing all endpoints.

---

## Deployment

### Render Deployment

The application includes a `render.yaml` for easy deployment to Render:

```yaml
services:
  - type: web
    name: nestjs-chatgpt-starter
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: OPENAI_API_KEY
        sync: false
      - key: MEM0_API_KEY
        sync: false
```

**Note:** The `users.json` file uses local file storage which will reset on each deploy on Render's free tier (ephemeral filesystem).

---

## Limitations & Considerations

1. **File-Based User Storage**: Users are stored in `users.json` which persists locally but will reset on deployment to ephemeral environments. For production, integrate a proper database.

2. **No Authentication**: The API currently has no authentication layer. Add JWT or other auth for production use.

3. **Mem0 Cloud Dependency**: The implementation uses Mem0 Cloud API. For self-hosted Mem0, modify the client initialization.

4. **Rate Limits**: Both OpenAI and Mem0 have API rate limits. Consider implementing rate limiting for production.

5. **Score Threshold**: The 3.5 score threshold for memory relevance may need tuning based on your use case.

6. **Pro Tier Features**: Advanced memory extraction features (custom categories, graph, includes/excludes) require Mem0 Pro subscription.

---

## Summary

| Component | Status |
|-----------|--------|
| Mem0 Service | ✅ Complete |
| Memory Controller | ✅ Complete |
| Chat with Memory | ✅ Complete |
| File Upload | ✅ Complete |
| Memory CRUD | ✅ Complete |
| Memory Update | ✅ Complete |
| User Management | ✅ Complete |
| User Persistence | ✅ Complete (JSON file) |
| Score-Based Filtering | ✅ Complete |
| Pro Tier Support | ✅ Complete |
| Error Handling | ✅ Complete |
| Type Definitions | ✅ Complete |

The Mem0 implementation is production-ready for demo/development purposes. For production deployment, consider adding:
- Persistent user storage (database)
- Authentication/Authorization
- Rate limiting
- Input validation with class-validator
- Logging and monitoring
- Adjusting score threshold based on usage patterns
