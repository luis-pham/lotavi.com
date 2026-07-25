import { z } from "zod";

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    correlationId: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

export function errorEnvelope(
  code: string,
  message: string,
  correlationId: string,
  details?: Record<string, unknown>,
): ErrorEnvelope {
  return {
    error: {
      code,
      message,
      correlationId,
      ...(details ? { details } : {}),
    },
  };
}
