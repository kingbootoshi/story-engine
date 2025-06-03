import './style.css';
import WorldStoryApp from './frontend/app';

const appElement = document.querySelector<HTMLDivElement>('#app');

if (appElement) {
  // Create app instance and make it globally available
  const app = new WorldStoryApp(appElement);
  (window as any).app = app;
} else {
  console.error('App element not found');
} 