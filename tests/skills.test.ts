import { describe, it, expect } from "vitest";
import { EchoSkill, echoDefinition } from "../src/examples/echo";
import { WeatherSkill, weatherDefinition } from "../src/examples/weather";
import { validate } from "../src/validate";

describe("skill schema", () => {
  it("defines an echo skill with a string input schema", () => {
    expect(echoDefinition.name).toBe("echo");
    expect((echoDefinition.inputSchema as { type?: string }).type).toBe("object");
    expect((echoDefinition.inputSchema as { required?: string[] }).required).toContain("text");
  });

  it("defines a weather skill with a city input schema", () => {
    expect(weatherDefinition.name).toBe("weather");
    expect((weatherDefinition.inputSchema as { required?: string[] }).required).toContain("city");
  });
});

describe("EchoSkill", () => {
  it("echoes the text back", async () => {
    const skill = new EchoSkill();
    const result = await skill.execute({ text: "hello world" });
    expect(result.ok).toBe(true);
    expect(result.skill).toBe("echo");
    expect(result.data).toEqual({ echo: "hello world" });
  });

  it("reports invalid arguments as a failed step", async () => {
    const skill = new EchoSkill();
    const result = await skill.execute({});
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("validates args before calling the handler", async () => {
    const skill = new EchoSkill();
    expect(() => skill.validateArgs({ text: "ok" })).not.toThrow();
    expect(() => skill.validateArgs({})).toThrow(/required/);
  });
});

describe("WeatherSkill", () => {
  it("returns mock weather for a city", async () => {
    const skill = new WeatherSkill();
    const result = await skill.execute({ city: "Portland" });
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ city: "Portland", temperatureC: 20 });
    expect((result.data as { note?: string }).note).toContain("Mock data");
  });
});

describe("validate", () => {
  it("accepts valid input", () => {
    expect(() => validate({ type: "string" }, "hi")).not.toThrow();
  });

  it("rejects wrong type", () => {
    expect(() => validate({ type: "string" }, 42)).toThrow(/expected type string/);
  });

  it("rejects missing required property", () => {
    expect(() =>
      validate(
        { type: "object", properties: { a: { type: "string" } }, required: ["a"] },
        {},
      ),
    ).toThrow(/required/);
  });

  it("accepts enum values and rejects others", () => {
    expect(() => validate({ type: "string", enum: ["a", "b"] }, "a")).not.toThrow();
    expect(() => validate({ type: "string", enum: ["a", "b"] }, "c")).toThrow();
  });
});
