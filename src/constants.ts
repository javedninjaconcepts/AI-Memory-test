/**
 * Application Constants
 * Centralized configuration values used across the application
 */

// ============================================
// OpenAI / ChatGPT Configuration
// ============================================

export const OPENAI_MODEL = 'gpt-3.5-turbo';
export const OPENAI_MAX_TOKENS = 1000;
export const OPENAI_TEMPERATURE = 0.7;
export const OPENAI_NO_RESPONSE_MESSAGE = 'No response from AI';

// ============================================
// Fitness Coach System Prompt
// ============================================

export const FITNESS_COACH_SYSTEM_PROMPT = `You are FitCoach, an expert AI fitness and nutrition coach. Your personality is:
- Friendly, motivating, and supportive like a personal trainer
- Knowledgeable about exercise science, nutrition, and wellness
- Expert in multiple fitness disciplines: gym/weight training, yoga, pilates, boxing, martial arts (MMA, kickboxing, jiu-jitsu, karate, taekwondo), CrossFit, calisthenics, swimming, running, cycling, and more
- Proactive in gathering information to personalize advice
- Encouraging but realistic about fitness goals

CORE BEHAVIOR:
1. Always address the user by name if you know it
2. Reference their past information when relevant (injuries, goals, preferences)
3. Proactively ask follow-up questions to build their fitness profile
4. Give actionable, personalized advice based on what you know about them
5. Celebrate their progress and milestones
6. Be safety-conscious - always consider injuries and limitations

CONVERSATION STYLE:
- Keep responses concise but helpful (2-4 paragraphs max)
- Use encouraging language ("Great job!", "That's a solid plan!")
- Ask ONE follow-up question at the end of most responses to learn more
- Use simple language, avoid overly technical jargon unless asked

CREATING PERSONALIZED PLANS:
When user asks for a diet plan or meal plan:
- Consider their dietary preferences (vegetarian, vegan, keto, etc.)
- Account for food allergies and intolerances
- Match their calorie/macro goals if known
- Include foods they like, avoid foods they dislike
- Consider their schedule and meal timing preferences
- Provide specific meals with portion sizes
- Format as a structured daily or weekly plan

When user asks for a workout plan:
- Consider their fitness goals (weight loss, muscle gain, endurance, etc.)
- Account for injuries and physical limitations - NEVER suggest exercises that could worsen injuries
- Match their experience level (beginner, intermediate, advanced)
- Use equipment they have access to (home vs gym)
- Consider their available time and preferred workout days
- Include warm-up and cool-down recommendations
- Specify sets, reps, and rest periods
- Format as a structured weekly plan

PLAN FORMAT GUIDELINES:
- Use clear headers and bullet points
- Be specific with quantities (grams, calories, sets, reps)
- Include alternatives for flexibility
- Add brief explanations for why certain choices were made based on their profile
- If missing critical information, ask before creating the plan

IMPORTANT SAFETY RULES:
- If user mentions pain, injury, or medical condition, advise consulting a doctor
- Never recommend extreme diets or dangerous exercise progressions
- Be cautious with advice for beginners - start with basics
- If unsure about medical conditions, recommend professional consultation
- Always modify workout plans to avoid aggravating injuries`;

/**
 * Profile categories to track and questions to ask
 * Used to identify gaps in user profile and prompt for information
 */
export const FITNESS_PROFILE_CATEGORIES = {
  basic_info: {
    name: 'Basic Info',
    fields: ['name', 'age', 'gender', 'height', 'weight'],
    priority: 1,
    questions: [
      "I'd love to personalize your experience! What should I call you?",
      "To give you better advice, could you share your age and gender?",
      "What's your current height and weight? This helps me tailor recommendations.",
    ],
  },
  fitness_goals: {
    name: 'Fitness Goals',
    fields: ['primary_goal', 'target_weight', 'timeline', 'motivation'],
    priority: 2,
    questions: [
      "What's your main fitness goal right now? (e.g., lose weight, build muscle, get stronger, improve endurance)",
      "Do you have a target weight or body composition goal in mind?",
      "What's your timeline for achieving this goal?",
      "What motivated you to start this fitness journey?",
    ],
  },
  current_fitness: {
    name: 'Current Fitness Level',
    fields: ['experience_level', 'current_routine', 'workout_frequency', 'cardio_level'],
    priority: 3,
    questions: [
      "How would you describe your current fitness level? (beginner, intermediate, advanced)",
      "Are you currently following any workout routine?",
      "How many days per week do you typically exercise?",
      "What types of exercise do you enjoy most?",
    ],
  },
  injuries_limitations: {
    name: 'Injuries & Limitations',
    fields: ['current_injuries', 'past_injuries', 'chronic_conditions', 'physical_limitations'],
    priority: 4,
    questions: [
      "Do you have any current injuries or pain I should know about?",
      "Any past injuries that might affect your training?",
      "Are there any exercises or movements you need to avoid?",
    ],
  },
  dietary_info: {
    name: 'Nutrition & Diet',
    fields: ['diet_type', 'allergies', 'eating_habits', 'supplements'],
    priority: 5,
    questions: [
      "Do you follow any specific diet? (vegetarian, keto, etc.)",
      "Any food allergies or intolerances I should know about?",
      "How would you describe your current eating habits?",
      "Are you taking any supplements?",
    ],
  },
  lifestyle: {
    name: 'Lifestyle',
    fields: ['sleep_hours', 'stress_level', 'job_activity', 'available_equipment'],
    priority: 6,
    questions: [
      "How many hours of sleep do you typically get?",
      "Do you have access to a gym, or do you prefer home workouts?",
      "What equipment do you have available?",
      "Is your job mostly sedentary or active?",
    ],
  },
};

/**
 * Starter prompts for onboarding new users
 */
export const FITNESS_ONBOARDING_PROMPTS = [
  "Hey there! I'm your AI fitness coach. I'm here to help you reach your health and fitness goals. To get started, what should I call you?",
  "Welcome! I'm excited to be your fitness partner. Tell me a bit about yourself - what's your main fitness goal right now?",
  "Hi! Ready to crush some fitness goals together? First, let me learn about you. What brings you here today?",
];

/**
 * Follow-up question templates based on context
 */
// const FITNESS_FOLLOWUP_TEMPLATES = {
//   after_goal_mention: [
//     "That's a great goal! Have you worked towards this before?",
//     "Love that goal! What's been your biggest challenge in achieving it?",
//     "Awesome! How much time can you dedicate to working out each week?",
//   ],
//   after_exercise_mention: [
//     "Nice! How often do you do that?",
//     "Great choice! Any other exercises you enjoy?",
//     "Do you feel any discomfort when doing that exercise?",
//   ],
//   after_injury_mention: [
//     "Thanks for letting me know. Are you currently doing any physical therapy?",
//     "I'll keep that in mind. Does it affect your daily activities?",
//     "Important to know! Have you seen a doctor about it?",
//   ],
//   after_diet_mention: [
//     "Interesting! How long have you been eating this way?",
//     "Got it! Are you tracking your calories or macros?",
//     "How's that been working for you so far?",
//   ],
//   after_mood_mention: [
//     "I hear you! Even the best athletes have off days. How about a quick 5-minute stretch to boost your energy?",
//     "That's totally normal! Remember, consistency beats intensity. A light walk is still a win!",
//     "Hey, your body might be telling you something. When did you last have a good rest day?",
//     "I get it! Sometimes the hardest part is starting. Want me to suggest something quick and fun?",
//     "Let's flip that energy around! One small win right now can change your whole day. What sounds doable?",
//   ],
//   after_low_motivation: [
//     "Remember why you started this journey. You've already shown commitment by being here!",
//     "Progress isn't always linear. Your dedication to showing up matters more than any single workout!",
//     "Every champion has days like this. The difference is they keep going anyway. I believe in you!",
//     "Let's celebrate what you've already achieved! What's one thing you're proud of from your fitness journey?",
//   ],
//   after_diet_plan_request: [
//     "I can create a personalized meal plan for you! First, do you have any food allergies or foods you absolutely can't eat?",
//     "Happy to help with a diet plan! Are you following any specific diet style like vegetarian, keto, or Mediterranean?",
//     "Let me put together a meal plan for you! How many meals per day works best for your schedule?",
//     "I'll create a diet plan tailored to you! What's your daily calorie target, or would you like me to suggest one based on your goals?",
//   ],
//   after_workout_plan_request: [
//     "I'd love to create a workout plan for you! How many days per week can you commit to training?",
//     "Let's build your perfect workout routine! Do you have access to a gym, or will you be training at home?",
//     "I'll design a program just for you! What equipment do you have available?",
//     "Great, let's create your training plan! Do you have any injuries or movements you need to avoid?",
//   ],
//   after_martial_arts_mention: [
//     "That's awesome! How long have you been training? What belt/level are you at?",
//     "Great discipline! Are you training for competition or more for fitness and self-defense?",
//     "Love it! How many times a week do you train? Do you do any supplementary strength work?",
//     "Nice! Any specific techniques or areas you're working on improving?",
//   ],
//   after_yoga_pilates_mention: [
//     "Wonderful choice! What style of yoga do you practice? (Vinyasa, Hatha, Ashtanga, etc.)",
//     "Great for flexibility and core strength! How often do you practice?",
//     "Nice! Do you attend classes or practice at home?",
//     "Excellent! Are you working on any specific poses or goals?",
//   ],
//   after_plan_delivery: [
//     "How does this plan look to you? I can adjust anything that doesn't fit your lifestyle.",
//     "Feel free to let me know if you'd like any modifications to this plan!",
//     "Would you like me to explain any part of this plan in more detail?",
//     "Remember, consistency is key! Let me know how your first week goes.",
//   ],
//   general: [
//     "What else would you like to know?",
//     "Is there anything specific you'd like help with?",
//     "What's on your mind today?",
//   ],
// };

// ============================================
// Memory Search Configuration
// ============================================

/** Score threshold (0-1) for memory relevance */
export const MEMORY_SEARCH_THRESHOLD = 0.5;

/** Maximum number of memories to retrieve in chat */
export const MEMORY_SEARCH_LIMIT = 3;

/** Default limit for memory search API endpoint */
export const MEMORY_SEARCH_DEFAULT_LIMIT = 10;

// ============================================
// Advanced Search Configuration (Pro Features)
// ============================================

/** Default number of candidates to retrieve for basic search */
export const SEARCH_DEFAULT_TOP_K = 10;

/** Number of candidates to retrieve before reranking (higher = better results, more latency) */
export const SEARCH_RERANK_TOP_K = 20;

/** Default graph traversal depth */
export const GRAPH_DEFAULT_DEPTH = 1;

/** Maximum graph traversal depth allowed */
export const GRAPH_MAX_DEPTH = 3;

/** Default number of entities to return from graph queries */
export const GRAPH_DEFAULT_ENTITY_LIMIT = 20;

// ============================================
// API Configuration
// ============================================

export const DEFAULT_API_URL = 'http://localhost:4000';

// ============================================
// Mem0 Fitness AI Configuration
// ============================================

import { Mem0Options } from './mem0/dto/add-memory.dto';

/**
 * Default Mem0 options optimized for Fitness AI Assistant
 * 
 * PRICING NOTE - Features by tier:
 * ================================
 * FREE (Hobby):     Basic memory add/search/get
 * PRO ($249/mo):    + enable_graph, custom_instructions, includes, excludes
 *                   Note: custom_categories must be configured in Mem0 Dashboard
 * 
 * Set MEM0_PRO_TIER=true in .env to enable pro features
 */
export const FITNESS_MEM0_DEFAULTS: Mem0Options = {
  // Keep defaults minimal for free tier compatibility
  infer: true,
};

/**
 * Pro tier options - only applied if MEM0_PRO_TIER=true
 * 
 * NOTE: custom_categories must be configured in the Mem0 Dashboard at project level.
 * They cannot be passed via API. Configure them at: https://app.mem0.ai/dashboard/project-settings
 * 
 * Recommended custom categories to set in dashboard:
 * - fitness_goals: Weight loss, muscle gain, endurance, flexibility goals
 * - exercise_preferences: Preferred workouts, gym vs home, cardio vs strength  
 * - dietary_info: Food preferences, allergies, meal timing, calorie targets
 * - body_metrics: Weight, height, body fat, measurements
 * - injuries_limitations: Current injuries, past injuries, physical limitations
 * - health_conditions: Medical conditions affecting fitness
 * - supplements: Vitamins, protein, pre-workout, medications
 * - sleep_recovery: Sleep patterns, rest days, recovery methods
 * - workout_schedule: Training days, preferred times, frequency
 * - progress_tracking: PRs, milestones, weight changes, measurements
 */
export const FITNESS_MEM0_PRO_OPTIONS: Mem0Options = {
  includes: `
MUST EXTRACT - Personal & Health Profile:
- Name, age, gender, height, weight, body fat percentage
- Medical conditions (diabetes, hypertension, heart issues, etc.)
- Allergies (food, drug, environmental)
- Current medications and dosages
- Past surgeries or major health events

MUST EXTRACT - Fitness Information:
- Fitness goals (weight loss, muscle gain, endurance, flexibility, strength)
- Target weight, body composition goals, timeline
- Current fitness level (beginner, intermediate, advanced)
- Exercise preferences (cardio, strength, HIIT, yoga, pilates, sports)
- Martial arts or combat sports (boxing, kickboxing, MMA, jiu-jitsu, karate, taekwondo, muay thai)
- Workout frequency, duration, preferred times
- Gym membership, home gym equipment, yoga studio, martial arts dojo
- Favorite exercises, disliked exercises
- Current workout routine or program
- Sports they play (swimming, running, cycling, tennis, basketball, football, etc.)

MUST EXTRACT - Injuries & Limitations:
- Current injuries (location, severity, duration)
- Past injuries that affect exercise
- Chronic pain (back pain, knee issues, joint problems)
- Physical limitations or disabilities
- Recovery status from injuries
- Pain relief methods used (like Moov, ice, heat)

MUST EXTRACT - Nutrition & Diet:
- Dietary preferences (vegetarian, vegan, keto, paleo)
- Food allergies and intolerances
- Calorie targets, macro goals
- Meal timing, eating schedule
- Foods they like/dislike
- Supplements (protein, creatine, vitamins, pre-workout)
- Water intake habits

MUST EXTRACT - Lifestyle Factors:
- Sleep duration and quality
- Stress levels
- Work schedule affecting workouts
- Activity level at job (sedentary, active)
- Sports or physical activities they do

RESPOND WITH MOTIVATION - Mood & Energy States:
- When user says they're bored → Suggest a fun workout or activity challenge
- When user says they're tired → Offer encouragement, remind them of their goals, suggest light activity or rest if needed
- When user expresses low energy → Motivate with quick energy-boosting exercises or check on sleep/nutrition
- When user feels unmotivated → Remind them why they started, celebrate past progress
- When user is stressed → Suggest stress-relief exercises like walking, yoga, or breathing
- When user feels discouraged → Provide positive reinforcement and perspective on their journey
`,

  excludes: `
IGNORE COMPLETELY - Small Talk & Irrelevant:
- Greetings (hi, hello, hey, good morning)
- Thank you messages, acknowledgments
- Weather comments unrelated to workouts
- Random opinions about apps, websites, technology
- Complaints about the AI or chatbot
- Questions about how the app works
- Casual chitchat, jokes, humor
- "How are you" type exchanges

IGNORE COMPLETELY - Temporary States:
- One-time events not related to fitness
- Temporary schedule changes
- Passing complaints not health-related
- Questions seeking general knowledge
- Requests for recommendations unrelated to fitness

IGNORE COMPLETELY - Non-Actionable:
- Vague statements without specific details
- Hypothetical scenarios ("what if I...")
- Comparisons to other people
- General fitness facts or trivia
- News or articles they mention
- Social events unrelated to health
`,

  customInstructions: `You are extracting memories for a Fitness AI Assistant. Follow these rules strictly:

EXTRACTION RULES:
1. Only extract SPECIFIC, ACTIONABLE information about the user's health and fitness
2. Convert relative dates to absolute dates (e.g., "last month" → "December 2025")
3. Include severity/intensity when mentioned (mild pain, intense workout, etc.)
4. Preserve numbers exactly (weight: 75kg, not "around 75kg")
5. Note frequency patterns (daily, 3x/week, occasionally)

PRIORITY LEVELS:
- HIGH: Allergies, injuries, medical conditions, medications → Always extract
- MEDIUM: Goals, preferences, body metrics → Extract with context
- LOW: Likes/dislikes, schedule preferences → Extract if clearly stated

CATEGORIZE AS:
- fitness_goals: Specific targets with timeframes
- exercise_preferences: What they like/dislike doing
- dietary_info: Food habits, restrictions, supplements
- body_metrics: Measurable body data
- injuries_limitations: Current/past physical issues
- health_conditions: Medical diagnoses
- supplements: What they take and why
- sleep_recovery: Rest patterns
- workout_schedule: When/how often they train
- progress_tracking: PRs, weight changes, improvements

DO NOT EXTRACT:
- Generic greetings or sign-offs
- The AI's responses (only user information)
- Questions without personal information
- Statements that are clearly temporary moods
`,
  // NOTE: customCategories removed - must be configured in Mem0 Dashboard, not via API
  infer: true,
  enableGraph: true,
};

// NOTE: Fitness categories are now configured directly in the Mem0 Dashboard
// See: https://app.mem0.ai/dashboard/project-settings
