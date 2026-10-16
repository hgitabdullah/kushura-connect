import { useState } from 'react';
import api, { serverOrigin } from '../api';
import { Modal } from '../components/ui';
import { errMsg } from '../utils';
export default function Login({ onAuth }) {
  const [f, setF] = useState({ email: '', password: '' }); const [err, setErr] = useState(''); const [reg, setReg] = useState(false); const [busy, setBusy] = useState(false);
  const go = async (mode, body) => {
    setErr(''); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, body);
      localStorage.setItem('token', data.token);
      const loaded = await onAuth();
      if (loaded === false) {
        localStorage.removeItem('token');
        setErr('Your credentials were accepted, but your profile could not load. Check the API deployment and MongoDB connection, then try again.');
        setBusy(false);
      }
    } catch (x) {
      const missingApi = !import.meta.env.DEV && !serverOrigin;
      const missingRoute = x.response?.status === 404;
      setErr(missingApi || missingRoute
        ? 'The API is not connected to this Vercel site. Deploy the Express server and set VITE_API_URL to its public URL in Vercel, then redeploy.'
        : !x.response
          ? `Could not reach the API${serverOrigin ? ` at ${serverOrigin}` : ''}. Check the API host, CORS settings, and MongoDB connection.`
          : errMsg(x));
      setBusy(false);
    }
  };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (<div className="login">
    <div className="login-inner">
      <div className="brand"><div className="brand-lockup login-lockup"><span className="logo-f">K</span><span className="brand-wordmark">Kushura<span>Connect</span></span></div><p>A more thoughtful place to keep up with your people, share everyday moments and find communities that feel like home.</p><div className="login-points"><span>✦ Stay close to your circle</span><span>✦ Discover communities</span><span>✦ Share life as it happens</span></div></div>
      <div>
        <form className="card login-card" onSubmit={e => { e.preventDefault(); go('login', f); }}>
          <input placeholder="Email address" type="email" required value={f.email} onChange={set('email')} />
          <input placeholder="Password" type="password" required value={f.password} onChange={set('password')} />
          {err && !reg && <div className="err">{err}</div>}
          <button className="primary big" disabled={busy}>Log in</button>
          <button type="button" className="link" onClick={() => go('login', { email: 'demo@socialbook.com', password: 'demo123' })}>Try the demo account</button>
          <hr /><button type="button" className="green big" onClick={() => { setErr(''); setReg(true); }}>Create new account</button>
        </form>
        <p className="center small"><b>Demo:</b> demo@socialbook.com / demo123</p>
      </div>
    </div>
    {reg && <Register onClose={() => setReg(false)} go={go} err={err} busy={busy} />}
  </div>);
}
function Register({ onClose, go, err, busy }) {
  const [f, setF] = useState({ first: '', last: '', email: '', password: '' }); const set = k => e => setF({ ...f, [k]: e.target.value });
  return <Modal title="Sign Up" onClose={onClose}><p className="muted">It's quick and easy.</p>
    <form className="stack" onSubmit={e => { e.preventDefault(); go('register', { name: `${f.first} ${f.last}`.trim(), email: f.email, password: f.password }); }}>
      <div className="row"><input required placeholder="First name" value={f.first} onChange={set('first')} /><input placeholder="Surname" value={f.last} onChange={set('last')} /></div>
      <input required type="email" placeholder="Email address" value={f.email} onChange={set('email')} />
      <input required type="password" minLength={6} placeholder="New password (6+ characters)" value={f.password} onChange={set('password')} />
      {err && <div className="err">{err}</div>}
      <button className="green big" disabled={busy} style={{ alignSelf: 'center', minWidth: 200 }}>Sign Up</button></form></Modal>;
}
