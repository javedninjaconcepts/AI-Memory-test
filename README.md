# NestJS Fitness Coach AI with Mem0 Memory

A NestJS application featuring a **Fitness Coach AI** powered by OpenAI ChatGPT with **persistent memory** using Mem0. The AI remembers user preferences, fitness goals, injuries, and dietary needs across conversations.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐     ┌──────────────┐     ┌───────────────┐   │
│   │   Users      │     │   Mem0       │     │   Memory      │   │
│   │   Module     │     │   Module     │     │   Module      │   │
│   └──────┬───────┘     └──────┬───────┘     └───────┬───────┘   │
│          │                    │                     │            │
│          ▼                    ▼                     ▼            │
│   ┌──────────────┐     ┌──────────────┐     ┌───────────────┐   │
│   │  PostgreSQL  │     │  Mem0 Cloud  │     │    OpenAI     │   │
│   │  (TypeORM)   │     │  (Memory)    │     │   (ChatGPT)   │   │
│   └──────────────┘     └──────────────┘     └───────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What Each Component Does

| Component | Purpose | Storage |
|-----------|---------|---------|
| **Users Module** | User management (create, list, delete users) | PostgreSQL database |
| **Mem0 Module** | AI memory layer - stores what the AI learns about users | Mem0 Cloud (remote) |
| **Memory Module** | Chat endpoint combining users + memory + ChatGPT | - |
| **ChatGPT Service** | Fitness Coach AI responses | - |

## ✨ Features

- 🧠 **Persistent AI Memory** - The AI remembers user preferences, goals, injuries, and dietary needs
- 🏋️ **Fitness Coach Persona** - Specialized AI that acts as a personal fitness coach
- 📊 **Profile Completeness** - Tracks how much the AI knows about each user
- 🔍 **Semantic Search** - Search through memories by meaning, not exact text
- 📈 **Knowledge Graph** - Entity relationships (Pro feature)
- 👥 **Multi-user Support** - Each user has their own memory context
- 🖥️ **Terminal CLI** - Interactive command-line chat client

---

## 🧠 How Mem0 Memory Works

Mem0 uses **two complementary systems** to store and retrieve memories:

> **Note:** Vector memory is always enabled. Graph memory is an **additive** Pro feature - 
> when turned on, you get BOTH systems working together, not one or the other.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Mem0 Dual Memory System                          │
├─────────────────────────────────┬───────────────────────────────────────┤
│                                 │                                        │
│   🔢 VECTOR MEMORY              │   🕸️ GRAPH MEMORY (Pro)                │
│   (Semantic Search)             │   (Relationship Search)               │
│                                 │                                        │
│   "What do I know about         │   "How are things connected?"         │
│    this topic?"                 │                                        │
│                                 │                                        │
│   ┌─────────────────────┐       │   ┌─────────────────────┐             │
│   │ Memory → Vector     │       │   │ Entity → Entity     │             │
│   │ [0.12, 0.45, 0.78]  │       │   │ knee ──INJURED──→   │             │
│   └─────────────────────┘       │   │    running          │             │
│                                 │   └─────────────────────┘             │
│   Best for:                     │   Best for:                           │
│   • Finding similar memories    │   • Understanding cause-effect        │
│   • Answering "what" questions  │   • Answering "why" questions         │
│   • Retrieving context          │   • Finding related entities          │
│                                 │                                        │
└─────────────────────────────────┴───────────────────────────────────────┘
```

---

## 🔢 Vector Memory (Semantic Search)

### What is a Vector?

A vector is a list of numbers that represents the **meaning** of text. Similar meanings = similar vectors.

```
"I have a knee injury"     → [0.82, 0.15, 0.43, 0.91, ...]
"My knee hurts"            → [0.80, 0.17, 0.45, 0.89, ...]  ← Very similar!
"I like pizza"             → [0.12, 0.67, 0.23, 0.04, ...]  ← Very different
```

### How Vector Storage Works

1. **User says something** → Mem0 extracts facts
2. **Each fact → Embedding Model** → Converts text to vector (1536 dimensions)
3. **Vector stored in index** → Ready for similarity search

```
User: "I'm 28 years old, weigh 75kg, and injured my knee while running"
                                    ↓
                    ┌───────────────────────────────────┐
                    │      Mem0 Extraction Engine       │
                    └───────────────────────────────────┘
                                    ↓
            ┌─────────────────────────────────────────────────┐
            │  Fact 1: "User is 28 years old"                 │
            │          ↓                                      │
            │  Embedding Model (e.g., text-embedding-ada-002) │
            │          ↓                                      │
            │  Vector: [0.12, 0.45, 0.23, ... 1536 dims]      │
            ├─────────────────────────────────────────────────┤
            │  Fact 2: "User weighs 75kg"                     │
            │          ↓                                      │
            │  Vector: [0.33, 0.21, 0.67, ... 1536 dims]      │
            ├─────────────────────────────────────────────────┤
            │  Fact 3: "User has knee injury from running"    │
            │          ↓                                      │
            │  Vector: [0.67, 0.89, 0.12, ... 1536 dims]      │
            └─────────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────────┐
                    │   Vector Database (Mem0 Cloud)    │
                    │   Indexed for fast similarity     │
                    └───────────────────────────────────┘
```

### How Vector Search Works

When querying, the same process happens in reverse:

```
Query: "What exercises should I avoid?"
                    ↓
        ┌───────────────────────────────────┐
        │      Convert to Query Vector       │
        │  [0.55, 0.82, 0.11, ... 1536 dims] │
        └───────────────────────────────────┘
                    ↓
        ┌───────────────────────────────────┐
        │     Cosine Similarity Search       │
        │                                    │
        │  Compare query vector to ALL       │
        │  stored memory vectors             │
        │                                    │
        │  similarity = cos(query, memory)   │
        │  Range: 0.0 (opposite) to 1.0 (same)│
        └───────────────────────────────────┘
                    ↓
        ┌───────────────────────────────────┐
        │     Results (sorted by score)      │
        │                                    │
        │  1. "knee injury from running"     │
        │     Score: 0.82 ✓ (above 0.5)      │
        │                                    │
        │  2. "User likes HIIT workouts"     │
        │     Score: 0.61 ✓ (above 0.5)      │
        │                                    │
        │  3. "User is 28 years old"         │
        │     Score: 0.34 ✗ (below 0.5)      │
        └───────────────────────────────────┘
                    ↓
        AI receives: ["knee injury", "likes HIIT"]
        AI response: "Given your knee injury, avoid high-impact 
                      exercises. Try low-impact HIIT instead."
```

### Why Vector Search is Powerful

| Query | Finds Memory | Why It Works |
|-------|--------------|--------------|
| "leg problems" | "knee injury" | Same semantic meaning |
| "food restrictions" | "allergic to peanuts" | Related concept |
| "what can't I eat" | "lactose intolerant" | Intent understood |
| "workout limitations" | "bad shoulder" | Context understood |

---

## 🕸️ Graph Memory (Knowledge Graph)

> **Important:** Graph memory is **ADDITIVE**, not a replacement for vector memory.
> When you enable graph, you get **both** vector + graph working together.
> Vector memory always works - graph is an optional layer on top.

```
Graph OFF (default):        Graph ON (Pro feature):
                           
┌─────────────┐             ┌─────────────┐
│   Vector    │             │   Vector    │ ← Still works!
│   Memory    │             │   Memory    │
└─────────────┘             └──────┬──────┘
                                   +
      ✓                     ┌──────▼──────┐
                            │    Graph    │ ← Additional layer
                            │   Memory    │
                            └─────────────┘

You get:                    You get:
• Semantic search           • Semantic search (vector)
                            • Entity relationships (graph)
                            • Both working together
```

### What is a Knowledge Graph?

A knowledge graph stores **entities** (things) and **relationships** (connections between things).

```
┌─────────────────────────────────────────────────────────────────┐
│                      Knowledge Graph                             │
│                                                                  │
│     ┌──────────┐                          ┌──────────┐          │
│     │  KNEE    │◄────── INJURED_BY ───────│ RUNNING  │          │
│     │(BodyPart)│                          │(Exercise)│          │
│     └────┬─────┘                          └──────────┘          │
│          │                                      ▲                │
│          │ LIMITS                               │                │
│          ▼                                      │ ENJOYS         │
│     ┌──────────┐                          ┌─────┴────┐          │
│     │ SQUATS   │                          │   USER   │          │
│     │(Exercise)│                          │ (Person) │          │
│     └──────────┘                          └─────┬────┘          │
│                                                 │                │
│                              HAS_GOAL           │                │
│                                  ▼              │                │
│                            ┌──────────┐         │                │
│                            │LOSE 10KG │◄────────┘                │
│                            │  (Goal)  │                          │
│                            └──────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### How Graph Storage Works

When memories are stored, Mem0 also extracts entities and relationships:

```
User: "I injured my knee while running last month"
                    ↓
        ┌───────────────────────────────────┐
        │      Entity Extraction             │
        └───────────────────────────────────┘
                    ↓
        Entities found:
        ┌────────────────────────────────────┐
        │  • knee (BodyPart)                 │
        │  • running (Exercise)              │
        │  • injury (Condition)              │
        │  • last month → January 2026 (Time)│
        └────────────────────────────────────┘
                    ↓
        Relationships extracted:
        ┌────────────────────────────────────┐
        │  • knee ──HAS──→ injury            │
        │  • running ──CAUSED──→ injury      │
        │  • injury ──OCCURRED──→ Jan 2026   │
        └────────────────────────────────────┘
                    ↓
        Stored in Graph Database
```

### How Graph Search Works

Graph queries traverse relationships to find connected information:

```
Query: "Why should I avoid squats?"
                    ↓
        ┌───────────────────────────────────┐
        │      Graph Traversal               │
        │                                    │
        │  Start: "squats" entity            │
        │  Traverse: Find all connections    │
        └───────────────────────────────────┘
                    ↓
        Path found:
        ┌────────────────────────────────────┐
        │                                    │
        │  squats ──STRESSES──→ knee         │
        │                  │                 │
        │                  ▼                 │
        │           knee ──HAS──→ injury     │
        │                  │                 │
        │                  ▼                 │
        │         injury ──CAUSED_BY──→      │
        │                  running           │
        │                                    │
        └────────────────────────────────────┘
                    ↓
        AI understands: "Squats stress the knee, 
        which has an injury caused by running.
        Therefore, avoid squats."
```

### Graph vs Vector: When to Use Each

| Question Type | Best Approach | Example |
|--------------|---------------|---------|
| "What do you know about my diet?" | **Vector** | Finds all diet-related memories |
| "Why does running hurt my knee?" | **Graph** | Traverses cause-effect relationships |
| "What are my fitness goals?" | **Vector** | Semantic search for goal memories |
| "What exercises affect my injury?" | **Graph** | Finds exercises connected to injury |
| "Tell me about my workout routine" | **Vector** | Retrieves workout-related context |
| "How is my sleep affecting my recovery?" | **Graph** | Connects sleep → recovery → performance |

---

## 🔄 How Vector + Graph Work Together

In practice, Mem0 combines both for the best results:

```
User asks: "Create a leg workout for me"
                    ↓
    ┌─────────────────────────────────────────────────────┐
    │              STEP 1: Vector Search                   │
    │                                                      │
    │  Query: "leg workout preferences and limitations"    │
    │                                                      │
    │  Results:                                            │
    │  • "User enjoys running" (score: 0.78)               │
    │  • "User has knee injury" (score: 0.85)              │
    │  • "User prefers gym workouts" (score: 0.72)         │
    └─────────────────────────────────────────────────────┘
                    ↓
    ┌─────────────────────────────────────────────────────┐
    │              STEP 2: Graph Enrichment                │
    │                                                      │
    │  Found "knee injury" → Query graph for connections   │
    │                                                      │
    │  Graph returns:                                      │
    │  • squats ──STRESSES──→ knee (Avoid!)               │
    │  • lunges ──STRESSES──→ knee (Avoid!)               │
    │  • leg press ──SAFE_FOR──→ knee (OK!)               │
    │  • swimming ──SAFE_FOR──→ knee (OK!)                │
    └─────────────────────────────────────────────────────┘
                    ↓
    ┌─────────────────────────────────────────────────────┐
    │              STEP 3: AI Response                     │
    │                                                      │
    │  Context provided to ChatGPT:                        │
    │  - User has knee injury                              │
    │  - Avoid: squats, lunges (stress knee)               │
    │  - Safe: leg press, swimming                         │
    │  - Prefers gym workouts                              │
    │                                                      │
    │  AI generates safe, personalized leg workout         │
    └─────────────────────────────────────────────────────┘
```

---

## 📊 Search Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| **Threshold** | 0.5 | Only return memories with 50%+ similarity |
| **Limit** | 3 | Return top 3 most relevant memories per query |
| **Top K** | 20 | Consider top 20 candidates before reranking (Pro) |
| **Graph Depth** | 1-3 | How many relationship hops to traverse |

---

## 📂 Custom Categories

Custom categories help **organize and filter memories** by topic. They're configured in the Mem0 Dashboard (not in code).

### Purpose of Categories

1. **Organization** - Group related memories together
2. **Filtered Search** - Query only specific categories
3. **Better Extraction** - Mem0 knows how to classify memories

### Categories Used in This App

| Category | What It Stores |
|----------|----------------|
| `fitness_goals` | Weight loss, muscle gain, endurance, flexibility goals |
| `exercise_preferences` | Preferred workouts, gym vs home, cardio vs strength |
| `dietary_info` | Food preferences, allergies, meal timing, calorie targets |
| `body_metrics` | Weight, height, body fat, measurements |
| `injuries_limitations` | Current injuries, past injuries, physical limitations |
| `health_conditions` | Medical conditions affecting fitness |
| `supplements` | Vitamins, protein, pre-workout, medications |
| `sleep_recovery` | Sleep patterns, rest days, recovery methods |
| `workout_schedule` | Training days, preferred times, frequency |
| `progress_tracking` | PRs, milestones, weight changes, measurements |

### How Categories Are Used

```
User: "I'm allergic to peanuts and lactose intolerant"
                    ↓
        Mem0 extracts and categorizes:
                    ↓
        ┌────────────────────────────────────────┐
        │  Category: dietary_info                 │
        │  Memory: "Allergic to peanuts"         │
        │  Memory: "Lactose intolerant"          │
        └────────────────────────────────────────┘

Later, when AI creates a meal plan:
                    ↓
        Search memories in category: dietary_info
                    ↓
        AI knows to exclude peanuts and dairy
```

---

## 🎯 What Gets Extracted vs Ignored

### MUST EXTRACT (High Priority)

The app is configured to always save:

- **Personal Info** - Name, age, gender, height, weight
- **Fitness Goals** - Weight loss, muscle gain, specific targets with timelines
- **Exercise Preferences** - Cardio, strength, HIIT, yoga, martial arts
- **Injuries & Limitations** - Current/past injuries, chronic pain, physical limitations
- **Dietary Info** - Allergies, diet type (vegan, keto), food preferences
- **Lifestyle Factors** - Sleep, stress, work schedule, available equipment

### IGNORE (Not Saved)

The app ignores:

- **Small Talk** - "Hi", "Thanks", "How are you"
- **Generic Questions** - Questions seeking general knowledge
- **Temporary States** - One-time events unrelated to fitness
- **Vague Statements** - Hypothetical scenarios without specifics
- **AI Responses** - Only user information is extracted

---

## 📈 Pro Features (Mem0 Pro Tier)

| Feature | What It Does |
|---------|--------------|
| **Knowledge Graph** | Entity-relationship storage (explained above) |
| **Reranking** | Re-scores search results for better precision |
| **Keyword Search** | Combines exact matching with semantic search |
| **Custom Categories** | Organize memories by topic (configured in dashboard) |
| **Advanced Filters** | Filter by date, category, metadata |

### Reranking Explained

Vector search is fast but approximate. Reranking uses a more expensive model to re-score results:

```
Without reranking (fast, approximate):
  1. "User likes running" (score: 0.75)
  2. "User has knee injury" (score: 0.72)  ← actually more relevant

With reranking (slower, precise):
  1. "User has knee injury" (score: 0.89)  ← correctly prioritized
  2. "User likes running" (score: 0.71)
```

---

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Database Setup

```bash
npm run migration:run
```

### 4. Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build && npm run start:prod
```

---

## 🖥️ Terminal CLI

Interactive chat client for terminal:

```bash
npm run chat
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `/mode` | Switch between basic and memory chat modes |
| `/user` | Create or switch user |
| `/memories` | View stored memories |
| `/profile` | View fitness profile analysis |
| `/clear` | Clear screen |
| `/quit` | Exit |

---

## 🏗️ Project Structure

```
src/
├── app.module.ts           # Root module with TypeORM config
├── chatgpt.service.ts      # OpenAI ChatGPT integration
├── constants.ts            # Fitness coach prompts & Mem0 config
├── main.ts                 # Application entry point
│
├── users/                  # User management (PostgreSQL)
│   ├── users.service.ts
│   └── entities/user.entity.ts
│
├── mem0/                   # Mem0 memory layer
│   ├── mem0.service.ts     # Memory storage & retrieval
│   └── dto/                # Search & filter options
│
└── memory/                 # Memory-enhanced chat
    └── memory.controller.ts
```

---

## 🧪 Testing

```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

## 📚 Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Mem0 Documentation](https://docs.mem0.ai/)

## 📄 License

This project is [MIT licensed](LICENSE).
