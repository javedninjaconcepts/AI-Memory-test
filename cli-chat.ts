#!/usr/bin/env node

import * as readline from 'readline';

// Parse command line arguments
function parseArgs(): { apiUrl: string; help: boolean } {
  const args = process.argv.slice(2);
  let apiUrl = process.env.API_URL || 'http://localhost:4000';
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--url' || arg === '-u') {
      apiUrl = args[++i] || apiUrl;
    } else if (arg.startsWith('--url=')) {
      apiUrl = arg.split('=')[1];
    } else if (arg.startsWith('http://') || arg.startsWith('https://')) {
      // Direct URL as argument
      apiUrl = arg;
    }
  }

  // Remove trailing slash
  apiUrl = apiUrl.replace(/\/$/, '');

  return { apiUrl, help };
}

const { apiUrl: API_URL, help: SHOW_HELP } = parseArgs();

// Show help and exit
if (SHOW_HELP) {
  console.log(`
NestJS ChatGPT Terminal Client

Usage:
  npx ts-node cli-chat.ts [options] [url]

Options:
  -u, --url <url>   API server URL (default: http://localhost:4000)
  -h, --help        Show this help message

Examples:
  npx ts-node cli-chat.ts                           # Connect to localhost:4000
  npx ts-node cli-chat.ts http://localhost:3000     # Connect to localhost:3000
  npx ts-node cli-chat.ts --url https://myapi.com   # Connect to hosted server
  npx ts-node cli-chat.ts -u https://myapi.com      # Short form

Environment:
  API_URL           Can also be set via environment variable
`);
  process.exit(0);
}

interface ChatResponse {
  success: boolean;
  message: string;
  response: string;
  error?: string;
}

interface MemoryChatResponse extends ChatResponse {
  memoriesUsed: string[];
  newMemoriesCreated: number;
  // sessionId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

class TerminalChat {
  private rl: readline.Interface;
  private mode: 'basic' | 'memory' = 'memory';
  private currentUser: User | null = null;
  // private sessionId: string | null = null;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private async fetch(endpoint: string, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Return text for non-JSON responses
        return await response.text();
      }
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private printHeader(): void {
    console.clear();
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           🤖 NestJS ChatGPT Terminal Client 🤖             ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  Server: ${API_URL.padEnd(49)}║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  Commands:                                                 ║');
    console.log('║    /mode      - Switch between basic and memory chat      ║');
    console.log('║    /user      - Create or switch user (memory mode)       ║');
    console.log('║    /memories  - View your memories (memory mode)          ║');
    console.log('║    /clear     - Clear screen                              ║');
    console.log('║    /help      - Show this help                            ║');
    console.log('║    /quit      - Exit the chat                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log();
  }

  private printStatus(): void {
    const modeStr = this.mode === 'memory' ? '🧠 Memory Mode' : '💬 Basic Mode';
    const userStr = this.currentUser ? `👤 ${this.currentUser.name}` : '👤 No user';
    console.log(`\n[${modeStr}] [${userStr}]\n`);
  }

  private async basicChat(message: string): Promise<void> {
    try {
      console.log('\n⏳ Thinking...\n');
      const response: ChatResponse = await this.fetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });

      if (response.success) {
        console.log('🤖 AI:', response.response);
      } else {
        console.log('❌ Error:', response.error);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  private async memoryChat(message: string): Promise<void> {
    if (!this.currentUser) {
      console.log('\n⚠️  No user selected. Use /user to create or select a user first.\n');
      return;
    }

    try {
      console.log('\n⏳ Thinking (with memory)...\n');
      const response: MemoryChatResponse = await this.fetch('/memory/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          userId: this.currentUser.id,
          // sessionId: this.sessionId,
        }),
      });

      if (response.success) {
        // this.sessionId = response.sessionId;
        
        // if (response.memoriesUsed && response.memoriesUsed.length > 0) {
        //   console.log('📚 Memories used:');
        //   response.memoriesUsed.forEach((m, i) => console.log(`   ${i + 1}. ${m}`));
        //   console.log();
        // }
        
        console.log('🤖 AI:', response.response);
        
        if (response.newMemoriesCreated > 0) {
          console.log(`\n💾 ${response.newMemoriesCreated} new memory(ies) stored`);
        }
      } else {
        console.log('❌ Error:', response.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  private async handleUserCommand(): Promise<void> {
    console.log('\n👤 User Management');
    console.log('  1. Create new user');
    console.log('  2. Select existing user');
    console.log('  3. Cancel\n');

    const choice = await this.prompt('Choose option (1-3): ');

    if (choice === '1') {
      const name = await this.prompt('Enter name: ');
      const email = await this.prompt('Enter email: ');

      if (!name || !email) {
        console.log('❌ Name and email are required');
        return;
      }

      try {
        const user = await this.fetch('/users', {
          method: 'POST',
          body: JSON.stringify({ name, email }),
        });
        this.currentUser = user;
        // this.sessionId = null;
        console.log(`\n✅ User created: ${user.name} (${user.id})`);
      } catch (error) {
        console.log('❌ Failed to create user:', error.message);
      }
    } else if (choice === '2') {
      try {
        // Fetch all users
        const users: User[] = await this.fetch('/users');
        
        if (!users || users.length === 0) {
          console.log('\n📭 No users found. Create a new user first.\n');
          return;
        }

        // Display users list
        console.log('\n📋 Available Users:\n');
        console.log('  #   ID                                      Name');
        console.log('  ─────────────────────────────────────────────────────────');
        users.forEach((user, index) => {
          const num = String(index + 1).padStart(2, ' ');
          const id = user.id.padEnd(38, ' ');
          console.log(`  ${num}. ${id} ${user.name}`);
        });
        console.log();

        const input = await this.prompt('Enter # or user ID (or press Enter to cancel): ');
        
        if (!input) {
          console.log('Cancelled.');
          return;
        }

        let selectedUser: User | undefined;

        // Check if input is a number (serial number)
        const num = parseInt(input, 10);
        if (!isNaN(num) && num >= 1 && num <= users.length) {
          selectedUser = users[num - 1];
        } else {
          // Try to find by user ID
          selectedUser = users.find(u => u.id === input);
          
          // If not found in list, try fetching from API
          if (!selectedUser) {
            try {
              const fetchedUser = await this.fetch(`/users/${input}`);
              if (fetchedUser.id) {
                selectedUser = fetchedUser;
              }
            } catch {
              // User not found
            }
          }
        }

        if (selectedUser) {
          this.currentUser = selectedUser;
          console.log(`\n✅ Switched to user: ${selectedUser.name} (${selectedUser.id})`);
        } else {
          console.log('❌ User not found');
        }
      } catch (error) {
        console.log('❌ Failed to fetch users:', error.message);
      }
    }
  }

  private async handleMemoriesCommand(): Promise<void> {
    if (!this.currentUser) {
      console.log('\n⚠️  No user selected. Use /user first.\n');
      return;
    }

    try {
      const result = await this.fetch(`/memory/user/${this.currentUser.id}`);
      
      if (result.success && result.memories && result.memories.length > 0) {
        console.log(`\n📚 Memories for ${this.currentUser.name}:\n`);
        result.memories.forEach((m: any, i: number) => {
          console.log(`  ${i + 1}. ${m.memory}`);
        });
      } else {
        console.log('\n📭 No memories stored yet.\n');
      }
    } catch (error) {
      console.log('❌ Failed to fetch memories:', error.message);
    }
  }

  private async handleCommand(input: string): Promise<boolean> {
    const command = input.toLowerCase();

    switch (command) {
      case '/quit':
      case '/exit':
      case '/q':
        console.log('\n👋 Goodbye!\n');
        this.rl.close();
        return false;

      case '/mode':
        this.mode = this.mode === 'basic' ? 'memory' : 'basic';
        console.log(`\n✅ Switched to ${this.mode} mode\n`);
        if (this.mode === 'memory' && !this.currentUser) {
          console.log('💡 Tip: Use /user to create or select a user for memory mode\n');
        }
        break;

      case '/user':
        await this.handleUserCommand();
        break;

      case '/memories':
        await this.handleMemoriesCommand();
        break;

      case '/clear':
        this.printHeader();
        break;

      case '/help':
        this.printHeader();
        break;

      default:
        console.log('❓ Unknown command. Type /help for available commands.\n');
    }

    return true;
  }

  async run(): Promise<void> {
    this.printHeader();

    // Check API connection
    try {
      await this.fetch('/');
      console.log('✅ Connected to API at', API_URL);
    } catch (error) {
      console.log('❌ Cannot connect to API at', API_URL);
      console.log('   Error:', error.message);
      console.log('');
      console.log('   Make sure the server is running, or specify a different URL:');
      console.log('   npx ts-node cli-chat.ts http://localhost:4000');
      console.log('   npx ts-node cli-chat.ts https://your-hosted-server.com');
      console.log('');
      this.rl.close();
      return;
    }

    this.printStatus();

    while (true) {
      const input = await this.prompt('You: ');

      if (!input) continue;

      if (input.startsWith('/')) {
        const shouldContinue = await this.handleCommand(input);
        if (!shouldContinue) break;
        this.printStatus();
        continue;
      }

      // Send chat message
      if (this.mode === 'memory') {
        await this.memoryChat(input);
      } else {
        await this.basicChat(input);
      }

      console.log();
    }
  }
}

// Run the chat client
const chat = new TerminalChat();
chat.run().catch(console.error);
