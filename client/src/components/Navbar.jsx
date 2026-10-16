import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaFacebookMessenger } from 'react-icons/fa';
import { GoHomeFill } from 'react-icons/go';
import { HiUserGroup, HiUsers } from 'react-icons/hi';
import { MdOndemandVideo, MdStorefront, MdDarkMode, MdLightMode, MdLogout, MdSettings } from 'react-icons/md';
import { MdAdminPanelSettings } from 'react-icons/md';
import { IoSearch, IoMenu } from 'react-icons/io5';
import { useApp } from '../ctx';
import { Avatar } from './ui';
import Notifications from './Notifications';
import api from '../api';
import { getSocket } from '../socket';
export default function Navbar() {
  const { me, dark, setDark, logout } = useApp(); const nav = useNavigate();
  const [q, setQ] = useState(''); const [menu, setMenu] = useState(false); const [unread, setUnread] = useState(0); const ref = useRef(); const searchRef = useRef();
  useEffect(() => { const c = e => ref.current && !ref.current.contains(e.target) && setMenu(false); document.addEventListener('mousedown', c); return () => document.removeEventListener('mousedown', c); }, []);
  useEffect(() => { const f = () => api.get('/unread').then(r => setUnread(r.data.length)); f(); const s = getSocket(); s.on('message', f); s.on('seen', f);
    const t = setInterval(f, 15000); return () => { s.off('message', f); s.off('seen', f); clearInterval(t); }; }, []);
  useEffect(() => { const shortcut = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut); }, []);
  const search = e => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`); };
  const tab = (to, Icon, label, badge) => <NavLink to={to} end={to === '/'} className="tab" title={label}><Icon />{badge > 0 && <span className="badge">{badge}</span>}</NavLink>;
  return (<nav className="nav">
    <div className="nav-left">
      <Link to="/" className="brand-lockup" aria-label="KushuraConnect home"><span className="logo-f">K</span><span className="brand-wordmark">Kushura<span>Connect</span></span></Link>
      <form className="search" onSubmit={search}><IoSearch /><input ref={searchRef} placeholder="Search people, groups, posts" aria-label="Search KushuraConnect" value={q} onChange={e => setQ(e.target.value)} /><kbd>Ctrl/⌘ K</kbd></form>
    </div>
    <div className="nav-center">
      {tab('/', GoHomeFill, 'Home')}{tab('/friends', HiUsers, 'Friends', me.requests?.length)}{tab('/watch', MdOndemandVideo, 'Watch')}
      {tab('/marketplace', MdStorefront, 'Marketplace')}{tab('/groups', HiUserGroup, 'Groups')}
    </div>
    <div className="nav-right">
      <Link to="/search" className="circle-btn only-mobile" title="Search"><IoSearch /></Link>
      <Link to="/messages" className="circle-btn" title="Messenger"><FaFacebookMessenger />{unread > 0 && <span className="badge">{unread}</span>}</Link>
      <Notifications />
      <div className="menu-wrap" ref={ref}>
        <button className="avatar-btn" onClick={() => setMenu(!menu)} title="Account"><Avatar user={me} size={40} /></button>
        {menu && <div className="dropdown card account-menu" onClick={() => setMenu(false)}>
          <Link to={`/profile/${me._id}`} className="menu-profile"><Avatar user={me} size={40} /><div><b>{me.name}</b><div className="muted small">See your profile</div></div></Link>
          <hr />
          <Link to="/settings" className="menu-item"><span className="mi"><MdSettings /></span>Settings & privacy</Link>
          {me.role === 'admin' && <Link to="/control-room" className="menu-item"><span className="mi"><MdAdminPanelSettings /></span>Admin control room</Link>}
          <button className="menu-item" onClick={e => { e.stopPropagation(); setDark(!dark); }}><span className="mi">{dark ? <MdLightMode /> : <MdDarkMode />}</span>{dark ? 'Light mode' : 'Dark mode'}</button>
          <Link to="/pages" className="menu-item only-mobile"><span className="mi"><IoMenu /></span>Pages</Link>
          <button className="menu-item" onClick={logout}><span className="mi"><MdLogout /></span>Log out</button>
          <p className="muted small foot">Privacy · Terms · KushuraConnect © {new Date().getFullYear()}</p>
        </div>}
      </div>
    </div>
  </nav>);
}
