import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { supabase } from './supabaseClient';
import type { AppRouter } from '../../../core/trpc/rootRouter';
import superjson from 'superjson';

export type { AppRouter };

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink<AppRouter>({
      url: '/api/trpc',
      transformer: superjson,
      headers: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (token) {
          console.debug('[trpcClient] JWT injected:', token.substring(0, 6) + '...');
        }
        
        return {
          Authorization: token ? `Bearer ${token}` : '',
        };
      },
    }),
  ],
});