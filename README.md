# MCP Agent Skills Template

A template repo for building **MCP agent skills**: a skill schema, example skills, and an
OpenAI-compatible planner client (default Ollama). Configurable endpoint, no API keys
required.

Created and maintained by **Asdale Dynamics, LLC** — beginner-friendly AI education,
books, and practical tools (dylanasdale.github.io).

## What's inside

- `src/schema.ts` — skill schema types (`SkillDefinition`, `SkillCall`, `Plan`, JSON Schema).
- `src/skill.ts` — `Skill` base class with input validation and `execute()`.
- `src/validate.ts` — small JSON Schema subset validator used by skills.
- `src/planner.ts` — `PlannerClient`: posts planning requests to any OpenAI-compatible
  `/chat/completions` endpoint (defaults to Ollama at `http://localhost:11434/v1`), parses
  the returned JSON plan, and falls back to extracting JSON embedded in text.
- `src/examples/` — `echo` and `weather` example skills (mock data only).
- `tests/` — Vitest tests covering the planner client and skills.
- `LICENSE` — MIT, Copyright (c) 2026 Asdale Dynamics, LLC.

## Quick start

```bash
npm install        # install dev dependencies (TypeScript, Vitest)
npm run typecheck  # type-check the project
npm run build      # compile src/ to dist/
npm test           # run the test suite
```

No API keys, secrets, or personal data are required or stored. The planner talks to your
local LLM endpoint (Ollama by default), so nothing leaves your machine unless you point it
elsewhere.

## Planner client

```ts
import { PlannerClient } from "./src/planner";
import { echoDefinition } from "./src/examples/echo";

const client = new PlannerClient({
  baseUrl: "http://localhost:11434/v1", // Ollama default; change for another OpenAI-compatible endpoint
  model: "llama3.2",
});

const plan = await client.plan("echo 'hello'", [echoDefinition]);
// plan.steps => [{ skill: "echo", arguments: { text: "hello" } }]
```

Options:
- `baseUrl` — endpoint base URL (default `http://localhost:11434/v1`)
- `model` — model name (default `llama3.2`)
- `fetch` — custom fetch implementation (useful for testing)

The client sends `POST {baseUrl}/chat/completions` with a system prompt that asks the model
to answer with JSON only, then parses and returns a `Plan`.

## Writing a skill

```ts
import { Skill, skillDefinition } from "./src/skill";

export const mySkillDefinition = skillDefinition(
  "my-skill",
  "Does something useful.",
  { type: "object", properties: { x: { type: "number" } }, required: ["x"] },
);

export class MySkill extends Skill {
  constructor() {
    super(mySkillDefinition);
  }
  async call(args: Record<string, unknown>) {
    return { result: Number(args.x) * 2 };
  }
}
```

## Credit

Template created by **Asdale Dynamics, LLC** (Indiana, formed Oct 2026), founded by Dylan
Asdale, registered nurse turned AI author. See *The Massive AI Manual* and dylanasdale.github.io
for plain-English, step-by-step AI writing "like a friend would."

## License

MIT. See `LICENSE` for details.
