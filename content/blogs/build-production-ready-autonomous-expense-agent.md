---
title: 'Build a Production-Ready Autonomous Expense Agent'
date: 2025-11-11T09:00:00+03:00
draft: false
canonicalURL: 'https://xpander.ai/blog/build-production-ready-autonomous-expense-agent-upload-read-classify-file-to-google-drive'
summary: 'Upload an invoice and the agent reads it, classifies it, renames it, files it into the right Google Drive folder, and keeps an audit trail: the parts that break in production, solved.'
categories:
  - xpander
tags:
  - AI Agents
  - Engineering
  - Memory
  - Google Drive
  - Tutorial
---

If you have ever tried to build an autonomous agent that works with files, handles multiple users, and remembers preferences across sessions, you know the problem. The demo works perfectly. The LLM understands the task. Then you hit production and everything breaks. File uploads fail silently. User state gets tangled. The agent forgets what it learned yesterday. You end up writing thousands of lines of orchestration code that has nothing to do with your actual agent logic.

This guide walks through building a real autonomous expense agent on xpander.ai that solves these problems. Upload an invoice and the agent reads it, classifies it, renames it consistently, files it in the correct Google Drive folder structure, and maintains an audit trail.

## The System Prompt Architecture

Writing effective system prompts is where most agent projects start and where they often stall. You need enough structure for consistent behavior but enough flexibility for the agent to handle edge cases.

The xpander console provides a structured approach that separates concerns into description, goals, instructions, and expected output. This separation matters because it translates into properly tagged sections in the final system prompt:

```text
You are cool agent

<instructions>
- Always write 2 sentence stories.
</instructions>

<goals>
- Always write 2 sentence stories.
</goals>

<additional_information>
- Use markdown to format your answer
</additional_information>
```

This structure gives the model clear context boundaries. The agent knows what it should do, how it should do it, and what additional context matters. When debugging agent behavior, having these sections separated makes it immediately clear whether the problem is in goal understanding, instruction following, or context application.

## Memory That Actually Works

Most agent frameworks handle memory as an afterthought. You store conversations in a database and hope the retrieval works. The result is agents that contradict themselves or forget critical user preferences. Real memory requires understanding what information matters and how to inject it at the right time.

Each agent in xpander comes with a configured PostgreSQL database and a built-in `update_memories` tool. When a user provides preference information during a conversation, the agent can persist it.

Inside `update_user_memory` the agent stores structured preference data:

```json
{
  "task": "Add/update invoice storage preferences: Use Google Drive Shared Drive named Invoices. Store expenses under path template: Invoices > By-AI > {year} > {month} > {person_name} > <file>. Month format: two-digit MM (01-12). Default year: 2025. Person name: David Twizer. Automatically create missing folders when enabled."
}
```

The important detail is what happens next. When the user starts a new conversation thread, the platform automatically retrieves memories for that specific user and injects them into the system prompt.

Notice the agent does not perform any tool calls. It already knows the user's preferences from memory. This happens through the memory configuration.

When you invoke an agent in xpander, the platform automatically looks up the specific user and retrieves their memories, then appends them to the agent context when the thread is created. The platform handles isolation, user management, and database scaling. You turn on "Enable user memories" and the infrastructure works.

You can inspect exactly what the agent sees by calling the thread API:

```bash
curl --request GET \
  --url https://api.xpander.ai/v1/tasks/<thread-id>/thread \
  --header 'x-api-key: <your-key>'
```

The response shows the full conversation structure:

```json
{
  "id": "65236259-ec52-47b1-a357-625bb8d4d363",
  "role": "system",
  "content": "<instructions>I am an Expense Manager AI agent designed to assist..</instructions><goals> Goal 1... </goals><memories_from_previous_interactions> Memory 1... </memories_from_previous_interactions>",
  "stop_after_tool_call": false,
  "add_to_agent_memory": true,
  "from_history": false,
  "metrics": {
    "input_tokens": 0,
    "output_tokens": 0,
    "total_tokens": 0,
    "cache_read_tokens": 0,
    "cache_write_tokens": 0
  },
  "created_at": 1763182251
}
```

Notice the `memories_from_previous_interactions` tag with the user memories injected directly into the system message. This level of observability matters when debugging why an agent behaves a certain way. You can see the exact prompt, the memory injection, the tool calls, and the responses with token counts and cache statistics.

## The File Problem

File handling is where most agent projects hit a wall. The complexity compounds at every step. The user uploads a file in the UI. Your agent needs to process it. The processing requires OCR which expects a URL. The URL needs to be accessible to the OCR service but not publicly exposed. After OCR, the file needs to be uploaded to Google Drive, which has its own authentication and API requirements. Google Drive only accepts files through specific endpoints and requires signed URLs from your private network.

The typical solution is writing custom code for each step. Handle the upload. Store it temporarily. Generate signed URLs. Pass URLs between services. Clean up temporary storage. Manage authentication for each integration. This is hundreds of lines of code that has nothing to do with your agent logic.

The xpander platform abstracts this entire pipeline behind a unified interface. When you enable file uploading and processing, the platform handles upload to secure storage, format conversion, and makes the file available to your agent through the internal network regardless of whether the file arrives via UI drag-and-drop, API call with base64 data, or webhook. The file is encrypted at rest, accessible only to authorized tools, and automatically cleaned up after a configured retention period.

The expense agent demonstrates this with the OCR tool integration.

Notice the OCR tool receives no base64 data in the parameters. The platform routes the file through its internal network from the agent runtime to the OCR service. The OCR service processes the file and returns structured text to the agent.

The agent never handles file bytes directly. This separation of concerns means your agent code focuses on understanding the invoice content rather than managing file I/O and network routing.

## Tool Orchestration in Practice

The real test of an agent platform is how it handles multi-step workflows where each step depends on context from previous steps. The expense agent needs to determine where to save a file based on user preferences, current folder structure, and file metadata. This requires multiple API calls to Google Drive to list shared drives, search for folders by name, navigate folder hierarchies, and potentially create missing folders.

The important detail is that we do not tell the agent the folder IDs upfront. We provide the logical structure the user wants: "Save to Shared Drive named Invoices under path Invoices > By-AI > {year} > {month} > {person_name}." The agent figures out how to map this logical structure to actual Google Drive IDs.

In the first execution, this takes multiple tool calls. The agent lists shared drives to find the "Invoices" drive. It searches for the "By-AI" folder within that drive. It checks whether the year and month folders exist. If they are missing and folder creation is enabled, it creates them. Finally it uploads the file to the correct location.

This might seem inefficient, but it demonstrates something important about production agents. The agent handles the discovery process autonomously. If the user changes the folder structure or a different user has different preferences, the agent adapts without code changes. The logic lives in the agent's reasoning, not in hardcoded mappings.

The second execution is where the self-improvement becomes visible. After the agent performs this discovery process once, it can update its memory with the resolved folder IDs. The next time the same user uploads an invoice, the agent retrieves the cached IDs from memory and performs the operation in a single API call. The agent learned from experience and optimized its own workflow.

## User Isolation and Scale

Building agents that handle multiple users correctly is harder than it appears. You need to isolate user data, manage separate preference stores, handle authentication per user, and ensure one user cannot access another user's information. Most agent frameworks leave this as an exercise for the builder.

The xpander platform handles user isolation automatically. When you enable user memories in the agent configuration, the platform manages user identification, memory storage, and retrieval. Each user gets isolated memory that persists across conversations. The platform ensures that when User A invokes the agent, only User A's memories are injected into the context. When User B invokes the same agent, they see only their own memories.

This isolation extends to tool authentication. When the agent calls Google Drive APIs, the platform uses the appropriate user's OAuth tokens. User A's agent cannot access User B's Google Drive. This happens automatically without explicit token management in your agent code.

The database scales with your agent usage. The platform handles connection pooling, query optimization, and storage scaling. You define what memories to store and when. The infrastructure handles the rest.

## What You End Up With

The agent handles invoice uploads, OCR processing, folder navigation, and file storage autonomously. It maintains memory across sessions, handles errors gracefully, and provides clear feedback. Most importantly, it learns user preferences through conversation and applies them consistently. The platform handles file upload orchestration, user management, memory persistence, tool authentication, error handling, and scaling. You focus on agent logic: what the agent should do, how it should make decisions, and what preferences matter to users.
