import { Skill, skillDefinition } from "../skill";
import { JsonSchema } from "../schema";

export const weatherDefinition = skillDefinition(
  "weather",
  "Returns mock weather for a city. Example data only, not a real forecast.",
  {
    type: "object",
    properties: {
      city: { type: "string", description: "City name." },
    },
    required: ["city"],
  } as JsonSchema,
);

export class WeatherSkill extends Skill {
  public constructor() {
    super(weatherDefinition);
  }

  public async call(args: Record<string, unknown>): Promise<unknown> {
    const city = String(args.city);
    return {
      city,
      temperatureC: 20,
      condition: "clear",
      note: "Mock data for demonstration only.",
    };
  }
}
