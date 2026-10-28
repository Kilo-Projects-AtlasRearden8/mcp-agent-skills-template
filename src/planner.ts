import { Plan, SkillCall, SkillDefinition } from "./schema";

export interface PlannerOptions {
  baseUrl?: string;
  model?: string;
  fetch?: typeof fetch;
}

const DEFAULT_BASE_URL = "http://localhost:11434/v1";
const DEFAULT_MODEL = "llama3.2";

export class PlannerClient {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly fetch: typeof fetch;

  constructor(options: PlannerOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.model = options.model ?? DEFAULT_MODEL;
    this.fetch = options.fetch ?? (globalThis.fetch as typeof fetch);
  }

  public async plan(query: string, skills: SkillDefinition[]): Promise<Plan> {
    const system =
      "You are a planner for an MCP agent. Given a user request and a list of available skills " +
      "(each with a name, description, and JSON Schema inputSchema), produce a JSON plan of skill " +
      "calls to satisfy the request. Respond with JSON only, no markdown fences or extra text. " +
      "The JSON shape must be: { \"rationale\": \"optional short explanation\", \"steps\": [ { " +
      "\"skill\": \"skill name\", \"arguments\": { ... args matching inputSchema ... } } ] }. " +
      "If no skill can help, return { \"rationale\": \"...\", \"steps\": [] }.";

    const payload = {
      model: this.model,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            "Available skills:\n" +
            JSON.stringify(skills, null, 2) +
            "\n\nRequest: " +
            query,
        },
      ],
      stream: false,
      temperature: 0,
    };

    const response = await this.fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Planner request failed (${response.status}): ${text}`);
    }

    const body = await response.json();
    const content = body.choices?.[0]?.message?.content ?? "";
    return this.parsePlan(content);
  }

  private parsePlan(content: string): Plan {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start === -1 || end === -1 || end <= start) {
        throw new Error("Planner returned no parseable JSON");
      }
      parsed = JSON.parse(content.slice(start, end + 1));
    }

    const raw = parsed as { rationale?: unknown; steps?: unknown };
    const steps: SkillCall[] = (Array.isArray(raw.steps) ? raw.steps : []).map((step, index) => {
      if (!step || typeof step !== "object") {
        throw new Error(`Plan step ${index} is not an object`);
      }
      const s = step as Record<string, unknown>;
      if (typeof s.skill !== "string") {
        throw new Error(`Plan step ${index} is missing a string "skill"`);
      }
      const args =
        s.arguments && typeof s.arguments === "object" && !Array.isArray(s.arguments)
          ? (s.arguments as Record<string, unknown>)
          : {};
      return { skill: s.skill, arguments: args };
    });

    return {
      rationale: typeof raw.rationale === "string" ? raw.rationale : undefined,
      steps,
    };
  }
}
