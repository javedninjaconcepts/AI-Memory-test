import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  OPENAI_MODEL,
  OPENAI_MAX_TOKENS,
  OPENAI_TEMPERATURE,
  OPENAI_NO_RESPONSE_MESSAGE,
  FITNESS_COACH_SYSTEM_PROMPT,
  FITNESS_PROFILE_CATEGORIES,
  FITNESS_ONBOARDING_PROMPTS,
} from './constants';

export interface UserProfileAnalysis {
  hasBasicInfo: boolean;
  hasGoals: boolean;
  hasCurrentFitness: boolean;
  hasInjuryInfo: boolean;
  hasDietInfo: boolean;
  hasLifestyleInfo: boolean;
  missingCategories: string[];
  completionPercentage: number;
  suggestedQuestion?: string;
}

@Injectable()
export class ChatGPTService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in .env file');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Send a message to ChatGPT and get a response
   * @param message - The user's message
   * @returns The AI's response
   */
  async chat(message: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: FITNESS_COACH_SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        max_tokens: OPENAI_MAX_TOKENS,
        temperature: OPENAI_TEMPERATURE,
      });

      return (
        response.choices[0]?.message?.content || OPENAI_NO_RESPONSE_MESSAGE
      );
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Send a message to ChatGPT with memory context as a fitness coach
   * @param message - The user's message
   * @param memoryContext - Memory context from Mem0
   * @param isNewUser - Whether this is a new user (for onboarding)
   * @returns The AI's response
   */
  async chatWithContext(
    message: string,
    memoryContext: string,
    isNewUser: boolean = false,
  ): Promise<string> {
    try {
      const messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }> = [];

      // Build the system prompt with coaching instructions
      let systemPrompt = FITNESS_COACH_SYSTEM_PROMPT;

      // Analyze profile and add guidance for asking questions
      if (memoryContext) {
        const profileAnalysis = this.analyzeProfileCompleteness(memoryContext);

        systemPrompt += `\n\n--- USER PROFILE FROM MEMORY ---\n${memoryContext}`;

        // Add coaching hints based on profile completeness
        if (profileAnalysis.missingCategories.length > 0) {
          systemPrompt += `\n\n--- COACHING GUIDANCE ---
The user's profile is ${profileAnalysis.completionPercentage}% complete.
Missing information: ${profileAnalysis.missingCategories.join(', ')}.
Try to naturally gather this information during the conversation.
${profileAnalysis.suggestedQuestion ? `Suggested question: "${profileAnalysis.suggestedQuestion}"` : ''}`;
        }
      } else if (isNewUser) {
        // New user - start with onboarding
        systemPrompt += `\n\n--- NEW USER ---
This appears to be a new user with no stored memories.
Start by warmly welcoming them and gathering basic information.
Ask for their name first, then learn about their fitness goals.`;
      }

      messages.push({ role: 'system', content: systemPrompt });

      // Add the user's message
      messages.push({ role: 'user', content: message });

      const response = await this.openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages,
        max_tokens: OPENAI_MAX_TOKENS,
        temperature: OPENAI_TEMPERATURE,
      });

      return (
        response.choices[0]?.message?.content || OPENAI_NO_RESPONSE_MESSAGE
      );
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Analyze the completeness of user profile from memory context
   * @param memoryContext - The memory context string
   * @returns Analysis of profile completeness with suggestions
   */
  analyzeProfileCompleteness(memoryContext: string): UserProfileAnalysis {
    const context = memoryContext.toLowerCase();

    // Check for each category
    const hasBasicInfo =
      this.hasKeywords(context, ['name is', 'years old', 'age', 'height', 'weight', 'kg', 'lbs', 'cm', 'feet']) ||
      this.hasKeywords(context, ['male', 'female', 'man', 'woman']);

    const hasGoals = this.hasKeywords(context, [
      'goal',
      'want to',
      'trying to',
      'lose weight',
      'gain muscle',
      'build muscle',
      'get stronger',
      'target',
      'aim',
      'objective',
      'endurance',
      'flexibility',
      'body composition',
      'timeline',
      'wants to',
    ]);

    const hasCurrentFitness = this.hasKeywords(context, [
      'workout',
      'exercise',
      'training',
      'gym',
      'run',
      'lift',
      'cardio',
      'strength',
      'hiit',
      'yoga',
      'pilates',
      'boxing',
      'martial art',
      'mma',
      'kickboxing',
      'jiu-jitsu',
      'bjj',
      'karate',
      'taekwondo',
      'muay thai',
      'crossfit',
      'calisthenics',
      'swimming',
      'cycling',
      'beginner',
      'intermediate',
      'advanced',
      'times a week',
      'days a week',
      'fitness level',
      'home workout',
      'dojo',
      'studio',
      'class',
    ]);

    const hasInjuryInfo = this.hasKeywords(context, [
      'injury',
      'pain',
      'hurt',
      'injured',
      'surgery',
      'condition',
      'limitation',
      'avoid',
      'can\'t do',
      'problem with',
      'chronic',
      'back pain',
      'knee',
      'shoulder',
      'joint',
      'recovery',
      'physical limitation',
      'disability',
    ]);

    const hasDietInfo = this.hasKeywords(context, [
      'diet',
      'eat',
      'food',
      'vegetarian',
      'vegan',
      'keto',
      'paleo',
      'allergy',
      'allergic',
      'intoleran',
      'calories',
      'protein',
      'carb',
      'macro',
      'supplement',
      'meal',
      'nutrition',
      'creatine',
      'vitamin',
      'pre-workout',
      'water intake',
    ]);

    const hasLifestyleInfo = this.hasKeywords(context, [
      'sleep',
      'hours of sleep',
      'work',
      'job',
      'stress',
      'equipment',
      'home gym',
      'schedule',
      'sedentary',
      'active job',
      'dumbbell',
      'barbell',
      'treadmill',
      'rest day',
      'recovery',
    ]);

    // Calculate missing categories
    const missingCategories: string[] = [];
    if (!hasBasicInfo) missingCategories.push('basic_info');
    if (!hasGoals) missingCategories.push('fitness_goals');
    if (!hasCurrentFitness) missingCategories.push('current_fitness');
    if (!hasInjuryInfo) missingCategories.push('injuries_limitations');
    if (!hasDietInfo) missingCategories.push('dietary_info');
    if (!hasLifestyleInfo) missingCategories.push('lifestyle');

    // Calculate completion percentage
    const totalCategories = 6;
    const completedCategories = totalCategories - missingCategories.length;
    const completionPercentage = Math.round(
      (completedCategories / totalCategories) * 100,
    );

    // Get suggested question for the highest priority missing category
    let suggestedQuestion: string | undefined;
    if (missingCategories.length > 0) {
      const priorityCategory = missingCategories[0];
      const categoryConfig =
        FITNESS_PROFILE_CATEGORIES[
          priorityCategory as keyof typeof FITNESS_PROFILE_CATEGORIES
        ];
      if (categoryConfig?.questions?.length > 0) {
        // Pick a random question from the category
        const randomIndex = Math.floor(
          Math.random() * categoryConfig.questions.length,
        );
        suggestedQuestion = categoryConfig.questions[randomIndex];
      }
    }

    return {
      hasBasicInfo,
      hasGoals,
      hasCurrentFitness,
      hasInjuryInfo,
      hasDietInfo,
      hasLifestyleInfo,
      missingCategories,
      completionPercentage,
      suggestedQuestion,
    };
  }

  /**
   * Check if context contains any of the given keywords
   */
  private hasKeywords(context: string, keywords: string[]): boolean {
    return keywords.some((keyword) => context.includes(keyword.toLowerCase()));
  }

  /**
   * Get a random onboarding prompt for new users
   */
  getOnboardingPrompt(): string {
    const randomIndex = Math.floor(
      Math.random() * FITNESS_ONBOARDING_PROMPTS.length,
    );
    return FITNESS_ONBOARDING_PROMPTS[randomIndex];
  }

  /**
   * Generate a contextual follow-up question based on the conversation
   * @param userMessage - The user's message
   * @param aiResponse - The AI's response
   * @returns A relevant follow-up question or null
   */
  suggestFollowUp(
    userMessage: string,
    memoryContext: string,
  ): string | null {
    const analysis = this.analyzeProfileCompleteness(memoryContext);

    // If profile is mostly complete, don't force questions
    if (analysis.completionPercentage >= 80) {
      return null;
    }

    return analysis.suggestedQuestion || null;
  }
}
