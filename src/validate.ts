import { JsonSchema } from "./schema";

export class ValidationError extends Error {
  public readonly path: string;

  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "ValidationError";
    this.path = path;
  }
}

function matchesType(schema: JsonSchema, value: unknown): boolean {
  if (schema.type === "string") return typeof value === "string";
  if (schema.type === "number") return typeof value === "number" && !Number.isNaN(value);
  if (schema.type === "integer")
    return typeof value === "number" && Number.isInteger(value);
  if (schema.type === "boolean") return typeof value === "boolean";
  if (schema.type === "object") return typeof value === "object" && value !== null && !Array.isArray(value);
  if (schema.type === "array") return Array.isArray(value);
  return true;
}

export function validate(schema: JsonSchema, value: unknown, path = "input"): void {
  if (!matchesType(schema, value)) {
    throw new ValidationError(path, `expected type ${schema.type ?? "any"}`);
  }

  if (schema.type === "object" && typeof value === "object" && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const properties = schema.properties ?? {};
    for (const key of schema.required ?? []) {
      if (!(key in obj)) {
        throw new ValidationError(`${path}.${key}`, "required property is missing");
      }
    }
    for (const [key, propSchema] of Object.entries(properties)) {
      if (key in obj) {
        validate(propSchema, obj[key], `${path}.${key}`);
      }
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(properties));
      for (const key of Object.keys(obj)) {
        if (!allowed.has(key)) {
          throw new ValidationError(`${path}.${key}`, "additional properties are not allowed");
        }
      }
    }
  }

  if (schema.type === "array" && Array.isArray(value) && schema.items) {
    for (let i = 0; i < value.length; i++) {
      validate(schema.items, value[i], `${path}[${i}]`);
    }
  }

  if (schema.type === "string" && typeof value === "string" && schema.enum) {
    if (!schema.enum.includes(value)) {
      throw new ValidationError(path, `value must be one of: ${schema.enum.join(", ")}`);
    }
  }
}
