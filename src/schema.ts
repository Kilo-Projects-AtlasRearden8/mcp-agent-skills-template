export type JsonSchema =
  | { type: "string"; enum?: string[]; description?: string }
  | { type: "number"; minimum?: number; maximum?: number; description?: string }
  | { type: "integer"; minimum?: number; maximum?: number; description?: string }
  | { type: "boolean"; description?: string }
  | {
      type: "object";
      properties?: Record<string, JsonSchema>;
      required?: string[];
      additionalProperties?: boolean;
      description?: string;
    }
  | { type: "array"; items?: JsonSchema; description?: string };

export interface SkillDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

export interface SkillCall {
  skill: string;
  arguments: Record<string, unknown>;
}

export interface SkillStepResult {
  skill: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

export interface Plan {
  rationale?: string;
  steps: SkillCall[];
}
