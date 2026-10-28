import { Skill, skillDefinition } from "../skill";
import { JsonSchema } from "../schema";

export const echoDefinition = skillDefinition(
  "echo",
  "Echoes the given text back to the caller.",
  {
    type: "object",
    properties: {
      text: { type: "string", description: "Text to echo back." },
    },
    required: ["text"],
  } as JsonSchema,
);

export class EchoSkill extends Skill {
  public constructor() {
    super(echoDefinition);
  }

  public async call(args: Record<string, unknown>): Promise<unknown> {
    return { echo: String(args.text) };
  }
}
