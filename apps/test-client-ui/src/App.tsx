import { useState, useEffect } from 'react'
import { AuthGateClient } from '@sujithx/authgate'

// Initialize the AuthGate Client SDK to point to your running AuthGate Server
const authClient = new AuthGateClient({
  baseUrl: import.meta.env.VITE_AUTHGATE_URL || 'http://localhost:3004/api/auth' 
});

function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 1. Test Fetching Current User Session
  const fetchSession = async () => {
    try {
      const user = await authClient.me();
      setSession(user);
    } catch (err) {
      setSession(null);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // 2. Test Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await authClient.login(email, password);
      setSession(data.user);
      alert('Login Successful!');
    } catch (error: any) {
      alert('Login Failed: ' + error.message);
    }
  };

  // 3. Test Logout
  const handleLogout = async () => {
    await authClient.logout();
    setSession(null);
  };

  // 4. Test OIDC Discovery (Stage 5)
  const handleTestOIDC = async () => {
    const discovery = await authClient.getOidcDiscovery();
    console.log("OIDC Discovery Document:", discovery);
    alert(`OIDC Issuer found: ${discovery.issuer}\nCheck console for full document!`);
  };

  // 5. Test Authenticated Backend Request
  const handleTestBackend = async () => {
    try {
      // Assuming test-client-api runs on 3004 by default
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3004";
      const response = await fetch(`${apiUrl}/api/protected`);
      const data = await response.json();
      alert("Backend Response: " + JSON.stringify(data));
    } catch (err: any) {
      alert("Backend Request Failed: " + err.message);
    }
  };

  if (session) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Welcome, {session.name || session.email}!</h1>
        <pre>{JSON.stringify(session, null, 2)}</pre>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleLogout}>Log Out</button>
          <button onClick={handleTestOIDC}>Test OIDC Discovery</button>
          <button onClick={handleTestBackend}>Test Authenticated Backend (Port 3004)</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>AuthGate Test Client</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit">Sign In to AuthGate</button>
      </form>
    </div>
  )
}

export default App
