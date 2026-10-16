import { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import api from './api';
import { Ctx } from './ctx';
import { getSocket, resetSocket } from './socket';
import Navbar from './components/Navbar';
import ChatPopups from './components/ChatPopups';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Messenger from './pages/Messenger';
import Search from './pages/Search';
import { Groups, GroupDetail } from './pages/Groups';
import { Pages, PageDetail } from './pages/Pages';
import { Marketplace, ListingDetail } from './pages/Marketplace';
import Watch from './pages/Watch';
import Saved from './pages/Saved';
import Settings from './pages/Settings';
import PostPage from './pages/PostPage';
import AdminPanel from './pages/AdminPanel';
import { Spinner } from './components/ui';
export default function App() {
  const [me, setMe] = useState(null); const [ready, setReady] = useState(false);
  const [online, setOnline] = useState([]); const [chats, setChats] = useState([]);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const loc = useLocation();
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('theme', dark ? 'dark' : 'light'); }, [dark]);
  const load = useCallback(async () => {
    try { const { data } = await api.get('/users/me'); setMe(data); return true; }
    catch { localStorage.removeItem('token'); setMe(null); return false; }
    finally { setReady(true); }
  }, []);
  useEffect(() => { localStorage.getItem('token') ? load() : setReady(true); }, [load]);
  useEffect(() => { if (!me?._id) return; const s = getSocket(); api.get('/online').then(r => setOnline(r.data));
    const onN = n => { if (['request', 'accept'].includes(n.type)) load(); };
    s.on('online', setOnline); s.on('notification', onN); return () => { s.off('online', setOnline); s.off('notification', onN); }; }, [me?._id, load]);
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  const logout = () => { localStorage.removeItem('token'); resetSocket(); setMe(null); setChats([]); };
  const openChat = u => { if (window.innerWidth < 700) { window.location.href = `/messages/${u._id}`; return; } setChats(c => c.some(x => x._id === u._id) ? c : [...c.slice(-2), u]); };
  const closeChat = id => setChats(c => c.filter(x => x._id !== id));
  if (!ready) return <div className="boot"><Spinner /></div>;
  if (!me) return <Login onAuth={load} />;
  const v = { me, reload: load, online, openChat, dark, setDark, logout };
  return (<Ctx.Provider value={v}>
    <Navbar />
    <main className="app-main">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/messages" element={<Messenger />} />
        <Route path="/messages/:id" element={<Messenger />} />
        <Route path="/search" element={<Search />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/pages" element={<Pages />} />
        <Route path="/pages/:id" element={<PageDetail />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:id" element={<ListingDetail />} />
        <Route path="/watch" element={<Watch />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/control-room" element={me.role === 'admin' ? <AdminPanel /> : <Navigate to="/" replace />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </main>
    {!loc.pathname.startsWith('/messages') && <ChatPopups chats={chats} close={closeChat} />}
  </Ctx.Provider>);
}
