import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import { Login } from './auth/Login';
import { Dashboard } from './pages/Dashboard';
import { Playground } from './pages/Playground';
import { WorldsList } from './pages/WorldsList';
import { WorldDetail } from './pages/WorldDetail';

function PrivateRoute() {
  const { user } = useAuth();
  
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
    ],
  },
]);