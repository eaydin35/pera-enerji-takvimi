---
name: prompt-engineering
description: Advanced prompt engineering techniques to maximize LLM performance, reliability, and controllability.
---

# Prompt Engineering Patterns

## Core Capabilities

### 1. Few-Shot Learning
Teach the model by showing 2-5 examples instead of explaining rules. Include input-output pairs that demonstrate desired behavior and edge cases.

### 2. Chain-of-Thought Prompting
Request step-by-step reasoning before the final answer. "Let's think step by step" improves accuracy on analytical tasks by 30-50%.

### 3. Progressive Disclosure
Start with simple prompts, add complexity (constraints, reasoning, examples) only when needed.

## Instruction Hierarchy
```
[System Context] → [Task Instruction] → [Examples] → [Input Data] → [Output Format]
```

## Agent Prompting Best Practices
- **Concise is key**: The context window is a public good. Only add context Claude doesn't already have.
- **Match Degrees of Freedom**:
    - **High Freedom**: Use for text-based tasks where multiple approaches are valid.
    - **Low Freedom**: Use for fragile, error-prone operations (e.g., database migrations).

## Persuasion Principles (for compliant AI behavior)
- **Authority**: Use imperative language like "YOU MUST", "No exceptions".
- **Commitment**: Require announcements like "I'm using [Skill Name]".
- **Social Proof**: Establish norms ("Every time", "Always").

## Common Pitfalls
- Over-engineering (complex prompts for simple tasks)
- Example pollution (examples that don't match the target)
- Context overflow (excessive examples)
