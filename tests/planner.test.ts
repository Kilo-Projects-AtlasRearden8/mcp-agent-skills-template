import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PlannerClient } from "../src/planner";
import { echoDefinition } from "../src/examples/echo";

const skills = [echoDefinition];

function installMockFetch(handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  const mockFetch = vi.fn(handler);
  vi.stubGlobal("fetch", mockFetch);
  return mockFetch;
}

describe("PlannerClient", () => {
  let mockFetch: ReturnType<typeof installMockFetch>;

  beforeEach(() => {
    mockFetch = installMockFetch(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  rationale: "The user wants the text echoed.",
                  steps: [{ skill: "echo", arguments: { text: "hi" } }],
                }),
              },
            },
          ],
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to the default Ollama-compatible endpoint", async () => {
    const client = new PlannerClient();
    await client.plan("say hi", skills);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:11434/v1/chat/completions");
    expect(init!.method).toBe("POST");
    expect(init!.headers).toMatchObject({ "Content-Type": "application/json" });
    const body = JSON.parse(init!.body as string);
    expect(body.model).toBe("llama3.2");
    expect(body.stream).toBe(false);
    expect(body.temperature).toBe(0);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[1].role).toBe("user");
  });

  it("uses a custom baseUrl", async () => {
    const client = new PlannerClient({ baseUrl: "https://example.com/v1" });
    await client.plan("say hi", skills);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://example.com/v1/chat/completions");
  });

  it("uses a custom model", async () => {
    const client = new PlannerClient({ model: "mistral" });
    await client.plan("say hi", skills);
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("mistral");
  });

  it("parses the plan from the model response", async () => {
    const client = new PlannerClient();
    const plan = await client.plan("say hi", skills);
    expect(plan.rationale).toBe("The user wants the text echoed.");
    expect(plan.steps).toEqual([{ skill: "echo", arguments: { text: "hi" } }]);
  });

  it("returns empty steps when the model returns none", async () => {
    mockFetch = installMockFetch(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ rationale: "nothing applies", steps: [] }) } }],
        }),
      ),
    );
    const client = new PlannerClient();
    const plan = await client.plan("do something unrelated", skills);
    expect(plan.steps).toEqual([]);
  });

  it("extracts JSON embedded in surrounding text", async () => {
    mockFetch = installMockFetch(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "Sure, here is the plan: {\"rationale\":\"x\",\"steps\":[{\"skill\":\"echo\",\"arguments\":{\"text\":\"yo\"}}]}",
              },
            },
          ],
        }),
      ),
    );
    const client = new PlannerClient();
    const plan = await client.plan("say yo", skills);
    expect(plan.steps).toEqual([{ skill: "echo", arguments: { text: "yo" } }]);
  });

  it("throws on non-ok response", async () => {
    mockFetch = installMockFetch(async () => new Response("server error", { status: 500 }));
    const client = new PlannerClient();
    await expect(client.plan("x", skills)).rejects.toThrow(/Planner request failed/);
  });
});
