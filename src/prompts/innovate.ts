import { OFF_LIMITS } from "./helpers";

/**
 * Build the innovate prompt — deterministic creative brief with wiki summary + Wikipedia article.
 */
export function buildInnovatePrompt(
  wikiSummary: string,
  article?: { title: string; summary: string },
): string {
  const hasArticle = !!article;

  const conceptSection = hasArticle
    ? `## The Random Concept

**${article.title}**

${article.summary}`
    : `## The Random Concept

No Wikipedia article was available this tick. Pick your own creative lens — choose an unexpected domain (biology, music theory, urban planning, game design, economics, etc.) and use it as the starting point for forced serendipity.`;

  const taskInstructions = hasArticle
    ? `Read the shoe-makers codebase through the lens of this concept. Find a connection — however abstract — between the concept and something in the system. Then write a concrete proposal.

Your insight **MUST** use the Wikipedia article provided above as the lens. Do not use general knowledge — the whole point is forced serendipity from an outside concept. If you ignore the article and write about something unrelated, you have failed the task.`
    : `Pick a concept from an unexpected domain and read the shoe-makers codebase through that lens. Find a connection — however abstract — between your chosen concept and something in the system. Then write a concrete proposal.

Since no Wikipedia article was fetched, you choose the lens — but it **MUST** be from a domain unrelated to software engineering. The whole point is forced serendipity from an outside concept.`;

  const lensTemplate = hasArticle
    ? `## Lens

**${article.title}** — [YOUR CONTENT HERE — describe what this article is about and how you'll use it as a creative lens]`
    : `## Lens

[YOUR CONTENT HERE — pick a concept from an unexpected domain (biology, music theory, urban planning, game design, economics, etc.) and explain what it is and why you chose it]`;

  return `# Innovate — Creative Insight from Random Conceptual Collision

You are in **divergent/creative mode**. Your job is to make a connection between a random concept and the shoe-makers system. Most ideas will be bad — that's fine. Your job is to make the connection, not to judge it.

## The System

${wikiSummary}

${conceptSection}

## Your Task

${taskInstructions}

You **MUST** write an insight file to \`.shoe-makers/insights/YYYY-MM-DD-NNN.md\` (where NNN is a sequence number). "No connection found" is NOT acceptable output. Be creative. Be speculative. A bad idea is better than no idea.

Write the insight file using this exact format:

\`\`\`markdown
${lensTemplate}

## Connection

[YOUR CONTENT HERE — how does the concept relate to the shoe-makers system? What parallel, analogy, or structural similarity do you see?]

## Proposal

[YOUR CONTENT HERE — a concrete change or improvement inspired by the connection. Be specific about files, modules, or mechanisms.]

## Why

[YOUR CONTENT HERE — why would this be better than the current approach? What does the system gain?]
\`\`\`

Commit the insight file when done.${OFF_LIMITS}`;
}
