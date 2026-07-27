---
title: 'Announcing Agent Graph System: 4x Better Multi-Step Tool Use'
date: 2024-11-20T09:00:00+03:00
draft: false
canonicalURL: 'https://xpander.ai/blog/announcing-agent-graph-system-a-new-approach-to-multi-step-agent-tool-use-improving-gpt-4o-success-rate-by-4x'
summary: 'An agent built with Agentic Interfaces and Agent Graph System hit a 98% success rate on multi-step tasks, versus 24% for GPT-4o alone, and did it 38% faster with 31.5% fewer tokens.'
categories:
  - xpander
tags:
  - AI Agents
  - Agent Graph System
  - Function Calling
  - Benchmarks
---

AI Agents will usher in a new era of human-computer interfaces, automation, personal AI assistants and AI employees. Function calling enables AI Agents to execute complex, multi-step workflows with precision, and plays a big part in fulfilling the promise of AI Agents.

This blog post explores how xpander.ai's two novel technologies, **Agentic Interfaces** and **Agent Graph System**, tackle the challenges of building multi-step AI Agents that access tools through function calling.

The benchmarking shared in this blog post demonstrates how an AI Agent built with Agentic Interfaces and Agent Graph System achieved a success rate of 98% in multi-step Agentic tasks, compared to an AI Agent driven only by GPT-4o, which achieved a 24% success rate. Moreover, the xpander.ai-driven AI Agent succeeded in completing the multi-step benchmarking task 38% faster and used 31.5% fewer tokens.

## Function calling is the key to unlocking the full potential of AI Agents

Today, AI Agents are typically built using "function calling": an AI model is given definitions of functions (sometimes referred to as tools) that are available to it, and the model decides whether or not to invoke specific functions. This gives an AI model the ability to assess if a function call is appropriate based on context, and to construct the exact input parameters required, enabling flexible, dynamic task execution within defined constraints.

AI-driven function calls present unique challenges. Complex API schemas in function definitions can lead to AI-generated payloads with missing parameters or incorrect data types. OpenAI's Structured Output feature helps address these issues by enforcing schema-specific outputs with high accuracy, but even an output that adheres to a schema can still result in an error.

For example, when creating a new page in Notion's API, the object you send in the request must match the parent database's exact setup. Even if your data format is technically valid, it will fail if it doesn't match the parent database's specific property names and types. If the parent has properties for "name" and "status", your new page must use those exact fields, not "title" or "state", even though those would be valid properties according to the API schema.

## Upping the complexity: Multi-step AI Agents

**Multi-step AI Agents** must adaptively choose and call APIs on the fly as they handle complex tasks, adjusting their actions based on continuous feedback from previous interactions. Unlike traditional workflow automation, which follows a fixed sequence, these agents dynamically assess which APIs to call next, enabling flexibility in task execution. However, this dynamic approach introduces significant challenges.

A primary difficulty is ensuring that the agent consistently selects the correct API and provides the necessary parameters and endpoint details based on its evolving understanding of the task. Each API call depends on both recent context and past interactions, and errors can easily arise if the agent loses track of its actions, leading to redundant or conflicting steps. Additionally, as each step generates new data, the context window can quickly fill up, risking the loss of crucial information from earlier steps and impacting the agent's decision-making accuracy.

When an API is selected by the model, the agent must also generate a payload that fits the API's object schema, accurately filling in each parameter. This requires an in-depth understanding of the API's structure and the ability to transform information from previous steps to match the schema exactly. If even a single parameter is incorrectly filled or omitted, the API call may fail or return incorrect results, interrupting the workflow and potentially requiring manual intervention.

Additionally, error handling is inherently more complex in this adaptive environment. Each API call carries the risk of failure due to issues like incorrect parameters, server errors, or network disruptions. In these cases, the agent must detect the failure and decide on an appropriate response, such as retrying the call, adjusting the payload, or selecting an alternate API. Managing these real-time decisions while maintaining the continuity of multi-step workflows is challenging, making API selection and payload generation a critical, yet error-prone, aspect of AI Agent functionality.

## How xpander.ai solves those challenges

At xpander.ai, we've developed a specialized interface optimized for AI function calling, which improves the accuracy of AI-generated parameters in API calls by up to 5x (see the NVIDIA blog for details on xpander.ai's Agentic Interface technology).

**Now we're introducing Agent Graph System (AGS)**, a new approach that brings structure and reliability to tool selection in multi-step workflows.

With traditional AI Agents all of the available tools are provided at every step, regardless of whether they are relevant. Agents make independent decisions about which functions to call and when, which can lead to sequences of function calls that are entirely illogical in the context of the task.

With AGS, AI builders define high-level function-calling flows, and a graph is constructed that represents all of the allowed sequences of function calls. Based on this graph, AGS provides a guided path, enforcing workflows that match the desired task by providing to the model at each step only the function calls that match an allowed transition on the graph. It can be thought of as a state machine for AI Agents: instead of allowing the agent complete freedom in choosing from all possible API calls, AGS only presents the contextually relevant options based on where the agent is in its workflow.

This approach **significantly reduces errors** by preventing out-of-sequence or conflicting API calls, while still maintaining flexibility through fallback options and manual override capabilities. The system also handles the technical complexities of API interactions by automatically managing schemas, payloads, and error handling. In essence, AGS transforms the typically unpredictable nature of AI agent interactions into a more structured and reliable process, while still preserving the agent's ability to adapt to different scenarios within the defined constraints.

AGS helps prevent context overflows that can cause agents to lose track of past interactions by providing only contextually relevant information at each step. For error handling, AGS embeds fallback options directly within the graph structure, allowing it to manage common API issues such as incorrect parameters or network failures. When errors occur, the system can automatically guide the agent to either retry with adjusted parameters or follow alternative paths, maintaining workflow stability without requiring human intervention.

## Multi-step AI Agents in a real-world use-case

For the purpose of benchmarking AI Agents built using Agentic Interfaces and Agent Graph System, we created an agent that addresses a real-world use-case. The AI Agent was tasked with researching companies and building a comprehensive company overview. It collected data from several APIs, including Crunchbase and LinkedIn, and stored the results in Notion.

This use-case illustrates the primary challenges of a multi-step AI Agent: correct API (tool) selection by the agent, payload generation according to an API schema, managing context, handling errors, and maintaining workflow continuity in the face of unpredictable API responses and errors.

- **Tools Used**: LinkedIn API, Crunchbase API, X API, Perplexity, Tavily, Notion API
- **Number of Function Calls**: 16 distinct operations across APIs
- **Task Overview**: The agent iteratively gathers, processes, and integrates data from multiple sources into Notion, dynamically selecting API calls based on evolving requirements.
- **Limits**: Both AI Agents that were benchmarked (xpander-driven agent and non xpander-driven agent) were limited to a 15-step run per task, to avoid having the agent endlessly attempt to complete the task.

### Steps to perform

The task involves two main steps: gathering company data and storing it in Notion. In the first step, the agent queries multiple data sources through APIs: it searches the company on Tavily, finds and retrieves detailed company information from Crunchbase, gathers insights from LinkedIn (including company details, posts, and employee data), and collects additional context from Twitter and Perplexity. In the second step, the agent stores this information in Notion by locating the "Companies Analysis" database, understanding its schema, creating a new page that matches the required structure, and finally adding the collected data as blocks within that page.

We created the graph structure for the benchmarked agent automatically using our platform's AI Agent Builder. It allows you to select the required Agentic Interfaces and prompt the agent with sample tasks, and the system generates the appropriate graph structure. This graph was then connected to the agent through the xpander SDK to guide its function calling behavior during the benchmark.

The xpander SDK enforces that the AI Agent only uses the tools that should be available to it at every step based on the graph. For example, the AI Agent will never try calling Notion Append Child Blocks before the new page is created.

## Scoring and benchmarks

We compared multi-step AI Agents with and without using Agentic Interfaces and Agent Graph System by running a benchmark job and scoring the success and failure of 50 runs, each on a different company. We ran the same job with an xpander-driven AI Agent, and a standard AI Agent built with the OpenAI SDK using the state-of-the-art ReAct framework.

A run was only counted as successful if the AI Agent completed the research using Crunchbase and LinkedIn APIs, created a page in Notion, created Blocks inside the page which contain the research data, and returned an answer with the Notion page URL. If an agent run failed to complete any of those steps, the run was counted as a failure. The results show that the AI Agent using xpander.ai achieved a 98% success rate, only failing in one run to return the final answer within the step number limitation. The non-xpander AI Agent succeeded in 24% of its runs. Moreover, the xpander.ai agent completed tasks in a shorter time, as the agent required fewer steps and API call retries. This also resulted in run costs being substantially lower for the xpander.ai agent.

## In summary

As demonstrated in the results of our benchmarking, the novel technology around Agentic Interfaces and Agent Graph System can help organizations build practical AI Agents that accomplish real-world tasks. This can replace static workflow automations and opens a new world of Agentic AI.

Start building AI Agents today at xpander.ai.
