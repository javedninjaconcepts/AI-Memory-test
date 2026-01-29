#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// cli-chat.ts
var readline = __toESM(require("readline"));
var fs = __toESM(require("fs"));
function parseArgs() {
  const args = process.argv.slice(2);
  let apiUrl = process.env.API_URL || "http://localhost:4000";
  let help = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
    } else if (arg === "--url" || arg === "-u") {
      apiUrl = args[++i] || apiUrl;
    } else if (arg.startsWith("--url=")) {
      apiUrl = arg.split("=")[1];
    } else if (arg.startsWith("http://") || arg.startsWith("https://")) {
      apiUrl = arg;
    }
  }
  apiUrl = apiUrl.replace(/\/$/, "");
  return { apiUrl, help };
}
var { apiUrl: API_URL, help: SHOW_HELP } = parseArgs();
if (SHOW_HELP) {
  console.log(`
NestJS ChatGPT Terminal Client

Usage:
  curl -sL <server>/cli.js | node - [options] [url]

Options:
  -u, --url <url>   API server URL (default: http://localhost:4000)
  -h, --help        Show this help message

Examples:
  # Run from hosted server:
  curl -sL https://your-server.com/cli.js | node - https://your-server.com

  # Or download and run locally:
  curl -o chat.js https://your-server.com/cli.js
  node chat.js https://your-server.com

  # Local development:
  npx ts-node cli-chat.ts
  npx ts-node cli-chat.ts http://localhost:3000

Environment:
  API_URL           Can also be set via environment variable
`);
  process.exit(0);
}
var TerminalChat = class {
  constructor() {
    this.mode = "memory";
    this.currentUser = null;
    // private sessionId: string | null = null;
    this.ttyInput = null;
    let input = process.stdin;
    if (!process.stdin.isTTY) {
      try {
        const ttyFd = fs.openSync("/dev/tty", "r");
        this.ttyInput = fs.createReadStream("", { fd: ttyFd });
        this.ttyInput.on("error", () => {
        });
        input = this.ttyInput;
      } catch {
        console.error("\n\u26A0\uFE0F  Interactive mode not available in this environment.");
        console.error("   Please download and run the CLI directly:\n");
        console.error("   curl -o chat.js " + API_URL + "/cli.js");
        console.error("   node chat.js " + API_URL + "\n");
        process.exit(1);
      }
    }
    this.rl = readline.createInterface({
      input,
      output: process.stdout
    });
  }
  async fetch(endpoint, options) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers
        }
      });
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }
  cleanup() {
    this.rl.close();
    if (this.ttyInput) {
      this.ttyInput.close();
    }
  }
  prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
  printHeader() {
    console.clear();
    console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
    console.log("\u2551           \u{1F916} NestJS ChatGPT Terminal Client \u{1F916}             \u2551");
    console.log("\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563");
    console.log(`\u2551  Server: ${API_URL.padEnd(49)}\u2551`);
    console.log("\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563");
    console.log("\u2551  Commands:                                                 \u2551");
    console.log("\u2551    /mode      - Switch between basic and memory chat      \u2551");
    console.log("\u2551    /user      - Create or switch user (memory mode)       \u2551");
    console.log("\u2551    /memories  - View your memories (memory mode)          \u2551");
    console.log("\u2551    /clear     - Clear screen                              \u2551");
    console.log("\u2551    /help      - Show this help                            \u2551");
    console.log("\u2551    /quit      - Exit the chat                             \u2551");
    console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
    console.log();
  }
  printStatus() {
    const modeStr = this.mode === "memory" ? "\u{1F9E0} Memory Mode" : "\u{1F4AC} Basic Mode";
    const userStr = this.currentUser ? `\u{1F464} ${this.currentUser.name}` : "\u{1F464} No user";
    console.log(`
[${modeStr}] [${userStr}]
`);
  }
  async basicChat(message) {
    try {
      console.log("\n\u23F3 Thinking...\n");
      const response = await this.fetch("/chat", {
        method: "POST",
        body: JSON.stringify({ message })
      });
      if (response.success) {
        console.log("\u{1F916} AI:", response.response);
      } else {
        console.log("\u274C Error:", response.error);
      }
    } catch (error) {
      console.log("\u274C Error:", error.message);
    }
  }
  async memoryChat(message) {
    if (!this.currentUser) {
      console.log("\n\u26A0\uFE0F  No user selected. Use /user to create or select a user first.\n");
      return;
    }
    try {
      console.log("\n\u23F3 Thinking (with memory)...\n");
      const response = await this.fetch("/memory/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
          userId: this.currentUser.id
          // sessionId: this.sessionId,
        })
      });
      if (response.success) {
        console.log("\u{1F916} AI:", response.response);
        if (response.newMemoriesCreated > 0) {
          console.log(`
\u{1F4BE} ${response.newMemoriesCreated} new memory(ies) stored`);
        }
      } else {
        console.log("\u274C Error:", response.error || "Unknown error");
      }
    } catch (error) {
      console.log("\u274C Error:", error.message);
    }
  }
  async handleUserCommand() {
    console.log("\n\u{1F464} User Management");
    console.log("  1. Create new user");
    console.log("  2. Select existing user");
    console.log("  3. Cancel\n");
    const choice = await this.prompt("Choose option (1-3): ");
    if (choice === "1") {
      const name = await this.prompt("Enter name: ");
      const email = await this.prompt("Enter email: ");
      if (!name || !email) {
        console.log("\u274C Name and email are required");
        return;
      }
      try {
        const user = await this.fetch("/users", {
          method: "POST",
          body: JSON.stringify({ name, email })
        });
        this.currentUser = user;
        console.log(`
\u2705 User created: ${user.name} (${user.id})`);
      } catch (error) {
        console.log("\u274C Failed to create user:", error.message);
      }
    } else if (choice === "2") {
      try {
        const users = await this.fetch("/users");
        if (!users || users.length === 0) {
          console.log("\n\u{1F4ED} No users found. Create a new user first.\n");
          return;
        }
        console.log("\n\u{1F4CB} Available Users:\n");
        console.log("  #   ID                                      Name");
        console.log("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
        users.forEach((user, index) => {
          const num2 = String(index + 1).padStart(2, " ");
          const id = user.id.padEnd(38, " ");
          console.log(`  ${num2}. ${id} ${user.name}`);
        });
        console.log();
        const input = await this.prompt("Enter # or user ID (or press Enter to cancel): ");
        if (!input) {
          console.log("Cancelled.");
          return;
        }
        let selectedUser;
        const num = parseInt(input, 10);
        if (!isNaN(num) && num >= 1 && num <= users.length) {
          selectedUser = users[num - 1];
        } else {
          selectedUser = users.find((u) => u.id === input);
          if (!selectedUser) {
            try {
              const fetchedUser = await this.fetch(`/users/${input}`);
              if (fetchedUser.id) {
                selectedUser = fetchedUser;
              }
            } catch {
            }
          }
        }
        if (selectedUser) {
          this.currentUser = selectedUser;
          console.log(`
\u2705 Switched to user: ${selectedUser.name} (${selectedUser.id})`);
        } else {
          console.log("\u274C User not found");
        }
      } catch (error) {
        console.log("\u274C Failed to fetch users:", error.message);
      }
    }
  }
  async handleMemoriesCommand() {
    if (!this.currentUser) {
      console.log("\n\u26A0\uFE0F  No user selected. Use /user first.\n");
      return;
    }
    try {
      const result = await this.fetch(`/memory/user/${this.currentUser.id}`);
      if (result.success && result.memories && result.memories.length > 0) {
        console.log(`
\u{1F4DA} Memories for ${this.currentUser.name}:
`);
        result.memories.forEach((m, i) => {
          console.log(`  ${i + 1}. ${m.memory}`);
        });
      } else {
        console.log("\n\u{1F4ED} No memories stored yet.\n");
      }
    } catch (error) {
      console.log("\u274C Failed to fetch memories:", error.message);
    }
  }
  async handleCommand(input) {
    const command = input.toLowerCase();
    switch (command) {
      case "/quit":
      case "/exit":
      case "/q":
        console.log("\n\u{1F44B} Goodbye!\n");
        this.cleanup();
        return false;
      case "/mode":
        this.mode = this.mode === "basic" ? "memory" : "basic";
        console.log(`
\u2705 Switched to ${this.mode} mode
`);
        if (this.mode === "memory" && !this.currentUser) {
          console.log("\u{1F4A1} Tip: Use /user to create or select a user for memory mode\n");
        }
        break;
      case "/user":
        await this.handleUserCommand();
        break;
      case "/memories":
        await this.handleMemoriesCommand();
        break;
      case "/clear":
        this.printHeader();
        break;
      case "/help":
        this.printHeader();
        break;
      default:
        console.log("\u2753 Unknown command. Type /help for available commands.\n");
    }
    return true;
  }
  async run() {
    this.printHeader();
    try {
      await this.fetch("/");
      console.log("\u2705 Connected to API at", API_URL);
    } catch (error) {
      console.log("\u274C Cannot connect to API at", API_URL);
      console.log("   Error:", error.message);
      console.log("");
      console.log("   Make sure the server is running, or specify a different URL:");
      console.log("   npx ts-node cli-chat.ts http://localhost:4000");
      console.log("   npx ts-node cli-chat.ts https://your-hosted-server.com");
      console.log("");
      this.cleanup();
      return;
    }
    this.printStatus();
    while (true) {
      const input = await this.prompt("You: ");
      if (!input) continue;
      if (input.startsWith("/")) {
        const shouldContinue = await this.handleCommand(input);
        if (!shouldContinue) break;
        this.printStatus();
        continue;
      }
      if (this.mode === "memory") {
        await this.memoryChat(input);
      } else {
        await this.basicChat(input);
      }
      console.log();
    }
  }
};
var chat = new TerminalChat();
chat.run().catch(console.error);
