import { vi } from 'vitest';

export function makeFakeChat(payload: unknown) {
  return vi.fn().mockResolvedValue({
    choices: [{
      message: {
        tool_calls: [{
          function: { 
            arguments: JSON.stringify(payload) 
          }
        }]
      }
    }],
    usage: { 
      prompt_tokens: 10, 
      completion_tokens: 10 
    }
  });
}

export function makeFakeChatWithError(error: Error) {
  return vi.fn().mockRejectedValue(error);
}