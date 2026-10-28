import { SkillDefinition, JsonSchema, SkillStepResult } from "./schema";
import { validate } from "./validate";

export abstract class Skill {
  public readonly name: string;
  public readonly description: string;
  public readonly inputSchema: JsonSchema;

  protected constructor(def: SkillDefinition) {
    this.name = def.name;
    this.description = def.description;
    this.inputSchema = def.inputSchema;
  }

  public validateArgs(args: unknown): void {
    validate(this.inputSchema, args);
  }

  public abstract call(args: Record<string, unknown>): Promise<unknown>;

  public async execute(args: unknown): Promise<SkillStepResult> {
    try {
      this.validateArgs(args);
      const data = await this.call(args as Record<string, unknown>);
      return { skill: this.name, ok: true, data };
    } catch (err) {
      return {
        skill: this.name,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export function skillDefinition(
  name: string,
  description: string,
  inputSchema: JsonSchema,
): SkillDefinition {
  return { name, description, inputSchema };
}
