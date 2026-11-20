'use client';

import { login } from '@/lib/auth';
import { Button } from '@/components/ui/button';

/**
 * What someone signed out sees (DESIGN.md, Look): a page of its own, without
 * the side bar and the bars (d-public): the app's name huge in the feature
 * fill, then what it does for them, one way in, and three true facts.
 */
export function Welcome() {
  return (
    <div className="d-public">
      <section className="d-welcome">
        <div className="d-welcome-art">
          <div className="d-welcome-mark">Daily</div>
          <p className="text-lg">Write it down. Tick it off.</p>
        </div>
        <div className="d-welcome-body">
          <span className="d-eyebrow">To-do list</span>
          <h1>Your to-dos, everywhere</h1>
          <p className="d-lead">Write down what needs doing and tick it off, on your phone and your computer.</p>
          <Button onClick={login} size="lg">
            Sign in with KOOMPI ID
          </Button>
          <div className="d-facts">
            <div>
              <div className="d-fact-value">0</div>
              <div className="d-fact-label">New passwords: your KOOMPI ID keeps your list</div>
            </div>
            <div>
              <div className="d-fact-value">1</div>
              <div className="d-fact-label">List, the same on every device</div>
            </div>
            <div>
              <div className="d-fact-value">2</div>
              <div className="d-fact-label">Taps to add a to-do, with a photo if you like</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
