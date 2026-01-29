# Mem0 Advanced Features Guide

This document covers advanced Mem0 API features for improving memory accuracy and management.

---

## Table of Contents

1. [Includes / Excludes (Selective Memory)](#1-includes--excludes-selective-memory)
2. [Custom Instructions](#2-custom-instructions)
3. [Custom Categories](#3-custom-categories)
4. [Infer Option](#4-infer-option)
5. [Version v2](#5-version-v2)
6. [Enable Graph](#6-enable-graph)
7. [Timestamp](#7-timestamp)
8. [Expiration Date](#8-expiration-date)
9. [Immutable Memories](#9-immutable-memories)
10. [Update Memory](#10-update-memory)
11. [Complete API Examples](#11-complete-api-examples)

---

## 1. Includes / Excludes (Selective Memory)

Control exactly what information gets extracted and stored.

### API Request

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "Hi! I'm John, 32 years old. I love pizza but I'm allergic to shellfish. The weather is nice today." }
  ],
  "includes": "Extract personal details, food preferences, allergies, and health information",
  "excludes": "Ignore weather comments, greetings, and small talk"
}
```

### Result

**Without includes/excludes:**
```
- User's name is John
- User is 32 years old
- User loves pizza
- User is allergic to shellfish
- User mentioned nice weather
```

**With includes/excludes:**
```
- User's name is John
- User is 32 years old
- User loves pizza
- User is allergic to shellfish
```

### Use Cases

| Use Case | Includes | Excludes |
|----------|----------|----------|
| Health App | `"dietary restrictions, allergies, medications, health goals"` | `"casual conversation, opinions about apps"` |
| E-commerce | `"product preferences, sizes, brands, purchase intent"` | `"complaints about shipping, general browsing"` |
| Personal Assistant | `"schedules, reminders, preferences, contacts"` | `"thank you messages, confirmations"` |

---

## 2. Custom Instructions

Natural language guidelines that define extraction behavior at a deeper level.

### API Request

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "I usually work from 9-5 but sometimes stay late on Thursdays for team meetings. My manager is Sarah." }
  ],
  "custom_instructions": "Focus on extracting: 1) Work schedule and patterns, 2) Important relationships and contacts, 3) Recurring events. Always note the frequency of activities (daily, weekly, sometimes). Ignore one-time events unless explicitly marked as important."
}
```

### Result

```
- User works 9-5 (regular schedule)
- User stays late on Thursdays (recurring - weekly)
- User has team meetings on Thursdays (recurring - weekly)
- User's manager is Sarah (relationship)
```

### Advanced Examples

**For a Fitness App:**
```json
{
  "custom_instructions": "Extract and categorize: 1) Exercise preferences with intensity levels (light/moderate/intense), 2) Injuries or physical limitations with affected body parts, 3) Fitness goals with timeframes if mentioned, 4) Dietary patterns including meal timing. Convert relative dates to absolute dates when possible. Flag any mentioned allergies as high-priority memories."
}
```

**For a Customer Support Bot:**
```json
{
  "custom_instructions": "Focus on: 1) Product issues with specific error codes or symptoms, 2) Customer sentiment (frustrated/neutral/satisfied), 3) Previous solutions attempted, 4) Preferred contact method and timezone. Do not store: credit card details, passwords, or PII beyond name and contact preference."
}
```

---

## 3. Custom Categories

Replace Mem0's default categories with domain-specific labels.

### API Request

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "I prefer TypeScript over JavaScript. My current project uses NestJS and PostgreSQL." }
  ],
  "custom_categories": {
    "tech_stack": "Programming languages, frameworks, and databases the user works with",
    "dev_preferences": "Coding style preferences, tools, and IDE choices",
    "project_context": "Current and past projects, their tech stack and status",
    "learning_goals": "Technologies the user wants to learn or improve"
  }
}
```

### Result (with custom categories)

```
- User prefers TypeScript over JavaScript [category: dev_preferences]
- User's current project uses NestJS [category: project_context, tech_stack]
- User's current project uses PostgreSQL [category: project_context, tech_stack]
```

### Category Examples by Domain

**Healthcare:**
```json
{
  "custom_categories": {
    "conditions": "Medical conditions, diagnoses, and symptoms",
    "medications": "Current and past medications with dosages",
    "allergies": "Drug allergies and sensitivities",
    "providers": "Healthcare providers and specialists",
    "vitals": "Blood pressure, weight, glucose readings"
  }
}
```

**E-commerce:**
```json
{
  "custom_categories": {
    "size_preferences": "Clothing sizes, shoe sizes, fit preferences",
    "brand_affinity": "Preferred and disliked brands",
    "price_sensitivity": "Budget ranges and price expectations",
    "style_preferences": "Color, style, and aesthetic preferences",
    "purchase_history": "Past purchases and satisfaction"
  }
}
```

**Education:**
```json
{
  "custom_categories": {
    "learning_style": "Visual, auditory, reading/writing, kinesthetic",
    "knowledge_level": "Beginner, intermediate, advanced per topic",
    "goals": "Certifications, skills, career objectives",
    "schedule": "Available study times and session preferences",
    "progress": "Completed topics and current learning path"
  }
}
```

---

## 4. Infer Option

Control whether Mem0 uses AI to infer memories or stores text as-is.

### With Inference (default: `infer: true`)

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "I moved to Austin last month because of a new job at a tech startup." }
  ],
  "infer": true
}
```

**Result:**
```
- User lives in Austin (since December 2025)
- User recently relocated
- User works at a tech startup
- User changed jobs recently
```

### Without Inference (`infer: false`)

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "IMPORTANT: User's API key is sk-xxx123. Store exactly as provided." }
  ],
  "infer": false
}
```

**Result:**
```
- IMPORTANT: User's API key is sk-xxx123. Store exactly as provided.
```

### When to Use `infer: false`

| Scenario | Why |
|----------|-----|
| Storing structured data | Preserve exact format (JSON, configs) |
| Critical exact values | API keys, IDs, codes |
| Legal/compliance text | Must be stored verbatim |
| Pre-processed memories | Already extracted by your system |

---

## 5. Version v2

Use the latest API version for new applications.

### API Request

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "I prefer dark mode and vim keybindings." }
  ],
  "version": "v2"
}
```

### Differences

| Feature | v1 (deprecated) | v2 (recommended) |
|---------|-----------------|------------------|
| Response format | Direct array | Wrapped in `results` |
| Memory quality | Standard | Improved extraction |
| Graph support | Limited | Full support |
| Performance | Baseline | Optimized |

---

## 6. Enable Graph

Build knowledge graphs with entity relationships for complex queries.

### API Request

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "I met with Dr. Sarah Chen at Austin General Hospital. She referred me to Dr. Mike Johnson, a cardiologist." }
  ],
  "enable_graph": true
}
```

### Result (Graph Entities)

```
Entities:
  - Dr. Sarah Chen (Person, Doctor)
  - Austin General Hospital (Organization, Hospital)
  - Dr. Mike Johnson (Person, Doctor, Cardiologist)
  - User (Person)

Relationships:
  - User -> MET_WITH -> Dr. Sarah Chen
  - Dr. Sarah Chen -> WORKS_AT -> Austin General Hospital
  - Dr. Sarah Chen -> REFERRED_TO -> Dr. Mike Johnson
  - Dr. Mike Johnson -> SPECIALTY -> Cardiology
```

### Graph Query Examples

After enabling graph, you can query relationships:

```bash
# Find all doctors the user has interacted with
GET /v1/entities/?user_id=user_123&type=Doctor

# Find connections to a specific entity
GET /v1/relations/?user_id=user_123&entity=Dr. Sarah Chen
```

### Use Cases

- **Healthcare**: Patient-Doctor-Hospital relationships
- **Business**: Contact-Company-Deal relationships
- **Education**: Student-Course-Instructor relationships
- **Social**: Person-Event-Location relationships

---

## 7. Timestamp

Attach explicit timestamps for temporal context.

### API Request

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "I just signed up for the premium plan." }
  ],
  "timestamp": 1737932400
}
```

### Use Cases

```javascript
// Backfilling historical data
{
  "messages": [{ "role": "user", "content": "Started using product X" }],
  "timestamp": 1704067200  // Jan 1, 2024
}

// Importing from external system
{
  "messages": [{ "role": "user", "content": "Completed onboarding" }],
  "timestamp": Math.floor(new Date("2025-06-15T10:30:00Z").getTime() / 1000)
}
```

### Why Use Explicit Timestamps

| Scenario | Benefit |
|----------|---------|
| Data migration | Preserve original event times |
| Offline sync | Record when event actually occurred |
| Historical import | Maintain accurate timeline |
| Batch processing | Correct temporal ordering |

---

## 8. Expiration Date

Set memories to auto-expire for temporary or time-sensitive information.

### API Request

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "I'm staying at the Hilton downtown until Friday." }
  ],
  "expiration_date": "2026-02-07"
}
```

### Use Cases

```json
// Temporary preferences
{
  "messages": [{ "role": "user", "content": "For this project, I want all responses in Spanish." }],
  "expiration_date": "2026-03-31"
}

// Trial period info
{
  "messages": [{ "role": "user", "content": "User is on 14-day trial." }],
  "expiration_date": "2026-02-12"
}

// Event-based memory
{
  "messages": [{ "role": "user", "content": "Preparing for AWS certification exam." }],
  "expiration_date": "2026-04-15"
}
```

### Expiration Strategies

| Memory Type | Expiration |
|-------------|------------|
| Location (traveling) | End of trip |
| Temporary preferences | Project end date |
| Trial/promo info | Trial expiry |
| Seasonal preferences | Season end |
| Event preparation | Event date + buffer |

---

## 9. Immutable Memories

Protect critical memories from being updated or modified.

### API Request

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "User's verified email is john@example.com. Account created on 2025-01-15." }
  ],
  "immutable": true,
  "infer": false
}
```

### Behavior

| Action | Mutable Memory | Immutable Memory |
|--------|---------------|------------------|
| Update | ✅ Allowed | ❌ Rejected |
| Delete | ✅ Allowed | ✅ Allowed |
| Search | ✅ Included | ✅ Included |

### Use Cases

```json
// Legal agreements
{
  "messages": [{ "role": "user", "content": "User accepted Terms of Service v2.1 on 2026-01-29" }],
  "immutable": true,
  "metadata": { "document_version": "2.1", "ip_address": "192.168.1.1" }
}

// Compliance records
{
  "messages": [{ "role": "user", "content": "User completed KYC verification" }],
  "immutable": true,
  "metadata": { "verification_id": "kyc_abc123" }
}

// Audit trail
{
  "messages": [{ "role": "user", "content": "User upgraded from Basic to Premium plan" }],
  "immutable": true,
  "timestamp": 1737932400
}
```

---

## 10. Update Memory

Update existing memories instead of creating duplicates.

### Get Memory ID First

```bash
# Search for existing memory
POST /v1/memories/search/
{
  "query": "user's email",
  "user_id": "user_123"
}

# Response
{
  "results": [
    {
      "id": "mem_01JF8ZS4Y0R0SPM13R5R6H32CJ",
      "memory": "User's email is john@oldmail.com",
      "score": 0.95
    }
  ]
}
```

### Update the Memory

```bash
PUT /v1/memories/mem_01JF8ZS4Y0R0SPM13R5R6H32CJ/
{
  "text": "User's email is john@newmail.com"
}
```

### Update with Metadata

```bash
PUT /v1/memories/mem_01JF8ZS4Y0R0SPM13R5R6H32CJ/
{
  "text": "User's email is john@newmail.com",
  "metadata": {
    "updated_reason": "user_request",
    "previous_email": "john@oldmail.com"
  }
}
```

### NestJS Implementation

```typescript
// mem0.service.ts
async updateMemory(
  memoryId: string, 
  text: string, 
  metadata?: Record<string, any>
): Promise<any> {
  this.ensureClient();
  
  const options: Record<string, any> = { text };
  if (metadata) options.metadata = metadata;
  
  return await this.client.update(memoryId, options);
}

// Usage
await mem0Service.updateMemory(
  'mem_01JF8ZS4Y0R0SPM13R5R6H32CJ',
  'User prefers dark mode (updated from light mode)',
  { updated_at: new Date().toISOString() }
);
```

### Memory History

After updates, you can view the history:

```bash
GET /v1/memories/mem_01JF8ZS4Y0R0SPM13R5R6H32CJ/history/
```

**Response:**
```json
[
  {
    "id": "history_v1",
    "memory": "User's email is john@oldmail.com",
    "event": "ADD",
    "created_at": "2026-01-15T10:00:00Z"
  },
  {
    "id": "history_v2", 
    "memory": "User's email is john@newmail.com",
    "event": "UPDATE",
    "created_at": "2026-01-29T14:30:00Z"
  }
]
```

---

## 11. Complete API Examples

### Example 1: Healthcare Application

```json
{
  "user_id": "patient_456",
  "messages": [
    { "role": "user", "content": "I'm diabetic and take metformin 500mg twice daily. I'm allergic to penicillin. My doctor is Dr. Smith at City Hospital." }
  ],
  "includes": "medications with dosages, allergies, medical conditions, healthcare providers",
  "excludes": "general symptoms, temporary complaints",
  "custom_instructions": "Flag all allergies as critical. Include dosage and frequency for medications. Extract provider specialties when mentioned.",
  "custom_categories": {
    "conditions": "Chronic and acute medical conditions",
    "medications": "Current medications with dosage",
    "allergies": "Drug and food allergies (CRITICAL)",
    "providers": "Healthcare providers and facilities"
  },
  "enable_graph": true,
  "version": "v2",
  "metadata": {
    "source": "patient_intake",
    "verified": false
  }
}
```

### Example 2: E-commerce Personalization

```json
{
  "user_id": "customer_789",
  "messages": [
    { "role": "user", "content": "I wear size 10 shoes and medium shirts. I love Nike but hate Adidas. My budget is usually under $100 for shoes." }
  ],
  "includes": "sizes, brand preferences, price ranges, style preferences",
  "excludes": "shipping complaints, return requests",
  "custom_categories": {
    "sizes": "Clothing and shoe sizes",
    "brands": "Preferred and disliked brands",
    "budget": "Price ranges and spending limits",
    "style": "Fashion preferences and aesthetics"
  },
  "version": "v2",
  "metadata": {
    "source": "style_quiz",
    "confidence": "high"
  }
}
```

### Example 3: Legal/Compliance with Immutable Record

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "User John Doe (john@example.com) accepted Terms of Service version 3.2 and Privacy Policy version 2.1" }
  ],
  "infer": false,
  "immutable": true,
  "timestamp": 1737932400,
  "metadata": {
    "tos_version": "3.2",
    "privacy_version": "2.1",
    "ip_address": "203.0.113.42",
    "user_agent": "Mozilla/5.0...",
    "acceptance_method": "checkbox_click"
  }
}
```

### Example 4: Temporary Context (Travel)

```json
{
  "user_id": "user_123",
  "messages": [
    { "role": "user", "content": "I'm in Tokyo for a business trip. Staying at Park Hyatt until Feb 5th. Meetings are at Shibuya office." }
  ],
  "includes": "travel location, accommodation, meeting locations, trip dates",
  "expiration_date": "2026-02-06",
  "enable_graph": true,
  "custom_categories": {
    "travel": "Current travel and location info",
    "accommodation": "Hotels and stays",
    "meetings": "Business meetings and locations"
  },
  "metadata": {
    "trip_type": "business",
    "trip_id": "trip_tokyo_2026"
  }
}
```

---

## Quick Reference

| Feature | Parameter | Type | Default |
|---------|-----------|------|---------|
| Selective extraction | `includes` | string | - |
| Selective exclusion | `excludes` | string | - |
| Extraction guidelines | `custom_instructions` | string | - |
| Domain categories | `custom_categories` | object | - |
| AI inference | `infer` | boolean | `true` |
| API version | `version` | string | `"v1"` |
| Knowledge graph | `enable_graph` | boolean | `false` |
| Event timestamp | `timestamp` | integer (unix) | now |
| Auto-expiry | `expiration_date` | string (YYYY-MM-DD) | - |
| Prevent updates | `immutable` | boolean | `false` |

---

## References

- [Add Memories API](https://docs.mem0.ai/api-reference/memory/add-memories)
- [Update Memory API](https://docs.mem0.ai/api-reference/memory/update-memory)
- [Custom Instructions](https://docs.mem0.ai/platform/features/custom-instructions)
- [Custom Categories](https://docs.mem0.ai/platform/features/custom-categories)
- [Graph Memory](https://docs.mem0.ai/platform/features/graph-memory)
- [Memory Filters](https://docs.mem0.ai/platform/features/v2-memory-filters)
