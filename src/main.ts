import './style.css';
import WorldStoryApp from './frontend/app';

const appElement = document.querySelector<HTMLDivElement>('#app');

if (appElement) {
  new WorldStoryApp(appElement);
} else {
  console.error('App element not found');
}