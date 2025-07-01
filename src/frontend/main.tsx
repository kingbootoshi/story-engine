import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth';
import { AudioProvider } from '@/features/audio';
import { router } from '@/app/routes';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AudioProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AudioProvider>
    </QueryClientProvider>
  </React.StrictMode>
);