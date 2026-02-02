# Mem0 Implementation Status

## Overview

This document provides a detailed explanation of the Mem0 integration in the NestJS ChatGPT Starter project. Mem0 is a memory layer that enables AI applications to have persistent, contextual memory across conversations.

## Current Status: ✅ Fully Implemented & Running

The Mem0 integration is **fully implemented and functional**. The application is running on port 4000 with Pro tier features enabled.

### Features Implemented:
- Core Mem0 service for memory management
- Memory-enhanced chat endpoint (Fitness Coach AI)
- **Personalized diet plan generation** based on user preferences and allergies
- **Custom workout plan creation** considering injuries, goals, and equipment
- File upload for memory extraction
- User management with JSON file persistence
- Full CRUD operations for memories
- **Advanced search** with reranking, filters, and keyword search (Pro)
- **Knowledge Graph** queries - entities and relationships (Pro)
- **Project configuration** - custom instructions and categories (Pro)
- Profile completeness analysis
- Motivational responses for mood/energy states
- Terminal CLI chat client

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
- `dto/search-memory.dto.ts` - DTOs for searching memories with advanced filters

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

### 4. Constants (`src/constants.ts`)

Centralized configuration including:
- OpenAI settings (model, tokens, temperature)
- Fitness Coach system prompt
- Profile categories and questions
- Memory search thresholds and limits
- Fitness-optimized Mem0 Pro options (includes, excludes, customInstructions)
- Motivational response templates

### 5. CLI Chat Client (`cli-chat.ts`)

Terminal-based chat interface with commands:
- `/profile` - View fitness profile analysis
- `/memories` - View all stored memories
- `/user` - Switch or create user
- `/mode` - Toggle between basic and memory chat
- `/clear`, `/help`, `/quit`

---

## Mem0 Service Features

The `Mem0Service` (`src/mem0/mem0.service.ts`) provides the following capabilities:

### Memory Operations

| Method | Description |
|--------|-------------|
| `addMemory(dto)` | Add memories from conversation messages |
| `addFromText(dto)` | Add memory from raw text (for file uploads) |
| `updateMemory(memoryId, text, metadata)` | Update an existing memory |
| `searchMemory(dto)` | Semantic search with filters |
| `advancedSearch(dto)` | Search with reranking and graph data (Pro) |
| `getMemories(userId)` | Get all memories for a user |
| `getMemoriesByAgent(agentId)` | Get memories by agent ID |
| `getMemory(memoryId)` | Get a specific memory by ID |
| `deleteMemory(memoryId)` | Delete a specific memory |
| `deleteAllUserMemories(userId)` | Delete all memories for a user |
| `getMemoryHistory(memoryId)` | Get history of a memory's changes |

### Graph Operations (Pro Feature)

| Method | Description |
|--------|-------------|
| `getGraphEntities(dto)` | Get entities (people, exercises, foods) |
| `getGraphRelationships(dto)` | Get relationships between entities |
| `searchGraphByEntity(userId, entityName)` | Find all connections to an entity |
| `getEntitiesByType(userId, type, limit)` | Get entities of specific type |
| `searchWithGraphContext(query, userId, depth)` | Semantic search + graph traversal |

### Project Configuration (Pro Feature)

| Method | Description |
|--------|-------------|
| `getProjectSettings()` | Get current project settings |
| `updateCustomInstructions(instructions)` | Update extraction guidelines |
| `updateCustomCategories(categories)` | Update memory categories |
| `configureFitnessProject()` | Apply fitness-optimized configuration |

---

## Type Definitions

### Core Interfaces

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
  categories?: string[];
  created_at?: string;
}
```

### Graph Interfaces

```typescript
interface GraphEntity {
  name: string;
  type: string;
  properties?: Record<string, any>;
}

interface GraphRelationship {
  source: string;
  target: string;
  relationship: string;
  properties?: Record<string, any>;
}

interface GraphSearchResult {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
}

interface AdvancedSearchResult {
  memories: SearchResult[];
  graph?: GraphSearchResult;
  totalCount?: number;
  reranked?: boolean;
}
```

### Mem0 Options Interface

```typescript
interface Mem0Options {
  // Selective memory extraction (Pro feature)
  includes?: string;
  excludes?: string;

  // Extraction guidelines (Pro feature)
  customInstructions?: string;

  // NOTE: customCategories must be configured in Mem0 Dashboard
  // See: https://app.mem0.ai/dashboard/project-settings

  // Control options
  infer?: boolean;        // Default true - extract structured memories
  enableGraph?: boolean;  // Build knowledge graph (Pro feature)

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
- **PRO ($249/mo)**: + enable_graph, custom_instructions, includes, excludes, reranking, keyword search

### Free Tier Defaults:
```typescript
const FITNESS_MEM0_DEFAULTS: Mem0Options = {
  infer: true,
};
```

### Pro Tier Options (enabled with `MEM0_PRO_TIER=true`):

The Pro options include comprehensive extraction rules:

**MUST EXTRACT categories:**
- Personal & Health Profile (name, age, medical conditions, allergies)
- Fitness Information (goals, preferences, routines)
- Injuries & Limitations (current/past injuries, chronic pain)
- Nutrition & Diet (preferences, allergies, supplements)
- Lifestyle Factors (sleep, stress, work schedule)

**RESPOND WITH MOTIVATION:**
- Bored → Suggest fun workout or challenge
- Tired → Encourage, remind of goals, suggest rest if needed
- Low energy → Quick energy-boosting exercises
- Unmotivated → Remind why they started, celebrate progress
- Stressed → Suggest walking, yoga, breathing
- Discouraged → Positive reinforcement

**IGNORE COMPLETELY:**
- Greetings, thank you, small talk
- One-time events unrelated to fitness
- Vague statements, hypotheticals
- General knowledge questions

---

## API Endpoints

### Memory Controller Routes (`/memory`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/memory/chat` | Chat with memory context |
| `POST` | `/memory/upload` | Upload file for memory extraction |
| `GET` | `/memory/search` | Semantic search memories |
| `POST` | `/memory/search/advanced` | Advanced search with reranking (Pro) |
| `GET` | `/memory/search/graph` | Search with graph context (Pro) |
| `GET` | `/memory/graph/entities` | Get graph entities (Pro) |
| `GET` | `/memory/graph/relationships` | Get graph relationships (Pro) |
| `GET` | `/memory/graph/entity/:entity` | Search by entity name (Pro) |
| `GET` | `/memory/graph/type/:type` | Get entities by type (Pro) |
| `GET` | `/memory/user/:userId` | Get all memories for a user |
| `GET` | `/memory/agent/:agentId` | Get all memories for an agent |
| `GET` | `/memory/:memoryId` | Get a specific memory |
| `GET` | `/memory/:memoryId/history` | Get memory change history |
| `PUT` | `/memory/:memoryId` | Update a specific memory |
| `DELETE` | `/memory/:memoryId` | Delete a specific memory |
| `DELETE` | `/memory/user/:userId/all` | Delete all user memories |
| `GET` | `/memory/profile/:userId/analysis` | Get profile completeness analysis |
| `GET` | `/memory/onboarding/prompt` | Get onboarding prompt |
| `GET` | `/memory/project/settings` | Get project settings (Pro) |
| `PUT` | `/memory/project/instructions` | Update custom instructions (Pro) |
| `PUT` | `/memory/project/categories` | Update custom categories (Pro) |

### Users Controller Routes (`/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users` | Create a new user |
| `GET` | `/users` | List all users |
| `GET` | `/users/:id` | Get a specific user |
| `DELETE` | `/users/:id` | Delete a user |
| `POST` | `/users/:id/session` | Generate a session ID for a user |

### Basic Routes (`/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/chat` | Basic chat (no memory) |

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
│ Get ALL Memories  │──▶ Build complete user profile context
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Search Relevant   │──▶ Semantic search (threshold: 0.5, limit: 3)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Analyze Profile   │──▶ Calculate completeness, find missing info
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Build Context     │──▶ Combine full profile + relevant memories
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Get AI Response   │──▶ ChatGPT with Fitness Coach persona
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Store Conversation│──▶ Add to Mem0 with Pro extraction rules
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Return Response   │──▶ Include response, memories, profile %
└───────────────────┘
```

### Memory Search Configuration (from constants.ts)

```typescript
// Score threshold (0-1) for memory relevance
const MEMORY_SEARCH_THRESHOLD = 0.5;

// Maximum memories to retrieve in chat
const MEMORY_SEARCH_LIMIT = 3;

// Default limit for search API endpoint
const MEMORY_SEARCH_DEFAULT_LIMIT = 10;

// Reranking candidates (higher = better results, more latency)
const SEARCH_RERANK_TOP_K = 20;
```

### Response Structure

```typescript
interface ChatResponse {
  success: boolean;
  message: string;           // Original user message
  response: string;          // AI response
  memoriesUsed: string[];    // Memories retrieved for context
  newMemoriesCreated: number;
  profileCompleteness?: number;  // 0-100%
  isNewUser?: boolean;
}
```

---

## Profile Analysis

The system tracks 6 fitness profile categories:

| Category | What It Tracks |
|----------|----------------|
| Basic Info | Name, age, gender, height, weight |
| Fitness Goals | Weight loss, muscle gain, timeline |
| Current Fitness | Experience level, routine, frequency |
| Injuries & Limitations | Current/past injuries, conditions |
| Diet & Nutrition | Diet type, allergies, supplements |
| Lifestyle | Sleep, stress, equipment access |

Profile completeness is calculated as percentage of categories with data.

---

## File Upload for Memory

The `/memory/upload` endpoint allows uploading text files to extract and store memories:

### Request:
- `file` - The file to upload (multipart/form-data)
- `userId` - Required user ID

### Response:
```typescript
interface UploadResponse {
  success: boolean;
  fileName: string;
  memoriesExtracted: number;
  message: string;
}
```

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

### Dependencies (package.json)

```json
{
  "mem0ai": "^2.2.1",
  "openai": "^6.16.0",
  "multer": "^1.4.5-lts.1",
  "uuid": "^13.0.0"
}
```

---

## Running the Application

### Start Server

```bash
# Development
npm run start:dev

# Clean start (clears build artifacts)
npm run start:clean

# Production
npm run build && npm run start:prod
```

### CLI Chat Client

```bash
# Run locally
npx ts-node cli-chat.ts

# With custom server URL
npx ts-node cli-chat.ts http://your-server.com

# Or download and run
curl -o chat.js http://localhost:4000/cli.js
node chat.js
```

---

## Usage Examples

### 1. Chat with Memory

```bash
curl -X POST http://localhost:4000/memory/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to lose 10kg in 3 months",
    "userId": "user-demo-001"
  }'
```

### 2. Advanced Search with Reranking

```bash
curl -X POST http://localhost:4000/memory/search/advanced \
  -H "Content-Type: application/json" \
  -d '{
    "query": "what are my fitness goals?",
    "userId": "user-demo-001",
    "rerank": true,
    "includeGraph": true
  }'
```

### 3. Get Graph Entities

```bash
curl "http://localhost:4000/memory/graph/entities?userId=user-demo-001&type=Exercise"
```

### 4. Search by Entity

```bash
curl "http://localhost:4000/memory/graph/entity/running?userId=user-demo-001"
```

### 5. Get Profile Analysis

```bash
curl http://localhost:4000/memory/profile/user-demo-001/analysis
```

### 6. Request a Diet Plan

```bash
curl -X POST http://localhost:4000/memory/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you create a weekly meal plan for me?",
    "userId": "user-demo-001"
  }'
```

The AI will use stored memories about:
- Dietary preferences (vegetarian, keto, etc.)
- Food allergies and intolerances
- Calorie/macro goals
- Foods they like/dislike
- Meal timing preferences

### 7. Request a Workout Plan

```bash
curl -X POST http://localhost:4000/memory/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a 4-day workout plan for me",
    "userId": "user-demo-001"
  }'
```

The AI will consider:
- Fitness goals (weight loss, muscle gain, etc.)
- Injuries and limitations (will avoid exercises that could worsen them)
- Experience level
- Available equipment (gym vs home)
- Preferred workout days/times

---

## Key Implementation Details

### 1. Graceful Initialization
The Mem0 service implements `OnModuleInit` to initialize the client on startup. If `MEM0_API_KEY` is not set, it logs a warning instead of throwing an error.

### 2. Pro Tier Auto-Detection
```typescript
this.isProTier = this.configService.get<string>('MEM0_PRO_TIER') === 'true';
```
When enabled, logs: `✅ Mem0 Pro tier enabled - using advanced fitness extraction features`

### 3. Profile Categorization
The controller categorizes memories by keywords for profile analysis:
- Personal Info: name, age, height, weight
- Fitness Goals: goal, want to, target
- Exercise: workout, gym, cardio, lift
- Injuries: pain, injury, surgery, limitation
- Diet: diet, allergy, protein, meal
- Lifestyle: sleep, stress, equipment

### 4. Motivational Responses
When users express mood states (tired, bored, stressed), the system provides motivation instead of ignoring these comments. Templates are in `FITNESS_FOLLOWUP_TEMPLATES.after_mood_mention` and `after_low_motivation`.

### 5. Graph Features (Pro)
Graph endpoints use internal SDK methods:
- `(this.client as any).getEntities(options)`
- `(this.client as any).getRelations(options)`

### 6. Custom Categories Note
Custom categories must be configured in the Mem0 Dashboard at project level, not via API:
https://app.mem0.ai/dashboard/project-settings

---

## Summary

| Component | Status |
|-----------|--------|
| Mem0 Service | ✅ Complete |
| Memory Controller | ✅ Complete |
| Chat with Memory | ✅ Complete |
| File Upload | ✅ Complete |
| Memory CRUD | ✅ Complete |
| Advanced Search | ✅ Complete (Pro) |
| Graph Queries | ✅ Complete (Pro) |
| Project Config | ✅ Complete (Pro) |
| Profile Analysis | ✅ Complete |
| Motivational Responses | ✅ Complete |
| User Management | ✅ Complete |
| CLI Chat Client | ✅ Complete |
| Error Handling | ✅ Complete |
| Type Definitions | ✅ Complete |

---

## Limitations & Considerations

1. **File-Based User Storage**: Users are stored in `users.json`. For production, integrate a database.

2. **No Authentication**: Add JWT or API key auth for production use.

3. **Mem0 Cloud Dependency**: Uses Mem0 Cloud API. For self-hosted, modify client initialization.

4. **Rate Limits**: Both OpenAI and Mem0 have API rate limits.

5. **Custom Categories**: Must be configured in Mem0 Dashboard, not via API.

6. **Telemetry Errors**: You may see `Telemetry event capture failed` errors - these are non-blocking and from the mem0ai SDK trying to send analytics.

---

## Postman Collection

A Postman collection is available at `postman/NestJS-Mem0-Collection.postman_collection.json`.
