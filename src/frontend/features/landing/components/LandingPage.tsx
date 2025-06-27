import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div>
      <header>
        <nav>
          <Link to="/">Story Engine</Link>
          <div>
            <Link to="/login">Login</Link>
          </div>
        </nav>
      </header>
      
      <main>
        <section>
          <h1>Welcome to Story Engine</h1>
          <p>Create dynamic, self-evolving game-world narratives</p>
          <Link to="/login">Get Started</Link>
        </section>
        
        <section>
          <h2>Features</h2>
          <div>
            <div>
              <h3>World Building</h3>
              <p>Create immersive worlds with rich lore and history</p>
            </div>
            <div>
              <h3>Character Management</h3>
              <p>Design complex characters with unique personalities</p>
            </div>
            <div>
              <h3>Dynamic Narratives</h3>
              <p>Generate evolving storylines based on your world's events</p>
            </div>
          </div>
        </section>
      </main>
      
      <footer>
        <p>&copy; 2024 Story Engine. All rights reserved.</p>
      </footer>
    </div>
  );
}