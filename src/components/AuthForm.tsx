import { FormEvent, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/App.css';

function AuthForm(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const authFn = mode === 'signin' ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { error } = await authFn({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(mode === 'signup' ? 'Kontrollera din e-post för bekräftelse.' : 'Inloggning lyckades.');
    }

    setLoading(false);
  };

  return (
    <div className="panel" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h2>{mode === 'signin' ? 'Logga in' : 'Skapa konto'}</h2>
      <p className="muted">Du måste vara inloggad för att se portföljen.</p>
      {message && <div className="alert">{message}</div>}
      <form className="stack" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">E-post</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="du@example.com"
          />
        </div>
        <div>
          <label htmlFor="password">Lösenord</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minst 6 tecken"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Bearbetar…' : mode === 'signin' ? 'Logga in' : 'Skapa konto'}
        </button>
        <button
          className="secondary"
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? 'Skapa nytt konto' : 'Jag har redan konto'}
        </button>
      </form>
    </div>
  );
}

export default AuthForm;
