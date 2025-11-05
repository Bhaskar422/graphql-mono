import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Post schema validation', () => {
  const schema = z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    tags: z.array(z.string()).default([]),
  });

  it('validates a proper post', () => {
    const result = schema.safeParse({ title: 'T', body: 'B' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = schema.safeParse({ title: '', body: 'B' });
    expect(result.success).toBe(false);
  });
});
