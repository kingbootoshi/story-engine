import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import { Login } from './auth/Login';
import { Dashboard } from './pages/Dashboard';
import { Playground } from './pages/Playground';
import { WorldsList } from './pages/WorldsList';
import { WorldDetail } from './pages/WorldDetail';
import { Locations } from './pages/Locations';

function PrivateRoute() {
  const { user, isInitialized } = useAuth();
  
  // Until the auth context has finished resolving persisted session data we
  // render *nothing*. This prevents a flash-of-redirect to the login page when
  // the user actually still has a valid session stored in `localStorage`.
  if (!isInitialized) {
    return null; // Optionally, replace with a loading spinner component.
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'playground',
        element: <Playground />,
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
    ],
  },
]);