import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth, Login } from '@/features/auth';
import { LandingPage } from '@/features/landing';
import { AppLayout } from '@/app/layout/AppLayout';
import { Dashboard } from '@/app/pages/Dashboard';
import { WorldsList, WorldDetail } from '@/features/worlds';
import { Locations } from '@/features/locations/components/Locations';
import { Factions } from '@/features/factions/components/Factions';
import { Characters } from '@/features/characters/components/Characters';
import { ApiKeys } from '@/features/api-keys/components/ApiKeys';
import { ApiDocs } from '@/features/api-docs';

/**
 * Private route component that checks authentication status
 * Redirects to login page if user is not authenticated
 */
function PrivateRoute() {
  const { user, isInitialized } = useAuth();
  
  // Until the auth context has finished resolving persisted session data we
  // render *nothing*. This prevents a flash-of-redirect to the login page when
  // the user actually still has a valid session stored in `localStorage`.
  if (!isInitialized) {
    return null; // Optionally, replace with a loading spinner component.
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <AppLayout />;
}

/**
 * Application router configuration
 * Defines all routes and their corresponding components
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/app',
    element: <PrivateRoute />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'worlds',
        element: <WorldsList />,
      },
      {
        path: 'worlds/:worldId',
        element: <WorldDetail />,
      },
      {
        path: 'worlds/:worldId/locations',
        element: <Locations />,
      },
      {
        path: 'worlds/:worldId/factions',
        element: <Factions />,
      },
      {
        path: 'worlds/:worldId/characters',
        element: <Characters />,
      },
      {
        path: 'api-keys',
        element: <ApiKeys />,
      },
      {
        path: 'api-docs',
        element: <ApiDocs />,
      },
    ],
  },
  // Catch-all redirect to landing page
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);