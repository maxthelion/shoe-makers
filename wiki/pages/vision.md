---
title: Vision
category: overview
tags: [vision, core, philosophy]
summary: The overarching vision for shoe-makers — autonomous AI agents that improve codebases overnight like the elves in the fairy tale.
last-modified-by: user
---

## The Elves and the Shoemaker

Shoe-makers is a system for autonomous AI agents that work overnight to improve codebases — inspired by the Brothers Grimm fairy tale where elves do useful work while the shoemaker sleeps.

The core insight: agents working autonomously can take their time. They don't need to be fast — they need to be thorough and careful. No impatient human watching means no agentic slop.

## Key Principles

- Agents should work *unbidden*, producing unexpected, delightful results — not just executing pre-made task lists
- People are messy when exploring ideas, don't like cleaning up, have new ideas as they see things being built, and are bad at remembering plans they made
- The system should maintain a good source of truth, have good tests, and enforce architectural contracts
- Agents can run adversarial reviews, screenshots, fuzz tests — quality over speed
- "Agentic slop is exacerbated by working under time pressure with an impatient human who wants to move on to the next idea"

## Trust Spectrum

The system supports a range of trust levels:

- **Low trust**: wake up to proposals and PRs to review
- **Medium trust**: code quality, test coverage, docs, QA, bug fixes — merge automatically
- **High trust**: fully-built features extrapolated from recent work

## What Good Elf Work Looks Like

Middle-ground tasks that are high-value and low-risk:

- Improving code quality (reduce complexity, deduplicate)
- Improving test coverage
- Organizing and syncing documentation
- QA reviews
- Workflow friction analysis
- Backlog organization
- Implementing bug fixes

## Source

Blog post: https://blog.maxthelion.me/blog/shoe-maker-elves/
