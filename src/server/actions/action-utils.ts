import "server-only";

import { z, ZodError } from "zod";

export type ActionResult<T = unknown> =
  | {
      data: T;
      ok: true;
    }
  | {
      error: string;
      fieldErrors?: Record<string, string[]>;
      ok: false;
    };

export function toPlainInput(input: unknown): unknown {
  if (!(input instanceof FormData)) {
    return input;
  }

  const entries = Array.from(input.entries()).map(([key, value]) => [
    key,
    value === "" ? undefined : value,
  ]);

  return Object.fromEntries(entries);
}

export function parseActionInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.infer<TSchema> {
  return schema.parse(toPlainInput(input));
}

export function actionFailure(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return {
      error: "Please check the submitted fields.",
      fieldErrors: z.flattenError(error).fieldErrors,
      ok: false,
    };
  }

  return {
    error: "The request could not be completed.",
    ok: false,
  };
}

export function actionSuccess<T>(data: T): ActionResult<T> {
  return {
    data,
    ok: true,
  };
}
