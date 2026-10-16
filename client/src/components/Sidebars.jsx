import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiUsers, HiUserGroup } from 'react-icons/hi';
import { MdOndemandVideo, MdStorefront, MdBookmark, MdFlag, MdSettings } from 'react-icons/md';
import { FaFacebookMessenger } from 'react-icons/fa';
import { IoSearch } from 'react-icons/io5';
import api from '../api';
import { useApp } from '../ctx';
import { Avatar } from './ui';
const items = [['/friends', HiUsers, 'Friends', '#1877f2'], ['/groups', HiUserGroup, 'Groups', '#1877f2'], ['/marketplace', MdStorefront, 'Marketplace', '#1877f2'],
  ['/watch', MdOndemandVideo, 'Watch', '#1877f2'], ['/messages', FaFacebookMessenger, 'Messenger', '#a033ff'], ['/saved', MdBookmark, 'Saved', '#a033ff'],
  ['/pages', MdFlag, 'Pages', '#f7533d'], ['/settings', MdSettings, 'Settings', '#65676b']];
export function LeftSidebar() {
  const { me } = useApp(); const [groups, setGroups] = useState([]);
  useEffect(() => { api.get('/groups', { params: { mine: 1 } }).then(r => setGroups(r.data)); }, []);
  return (<aside className="left-sb">
    <Link to={`/profile/${me._id}`} className="sb-item"><Avatar user={me} size={36} /><span>{me.name}</span></Link>
    {items.map(([to, I, l, c]) => <Link key={to} to={to} className="sb-item"><span className="sb-ic" style={{ color: c }}><I /></span><span>{l}</span></Link>)}
    <hr /><h4 className="muted sb-h">Your shortcuts</h4>
    {groups.map(g => <Link key={g._id} to={`/groups/${g._id}`} className="sb-item"><img className="sq" src={g.cover} alt="" /><span>{g.name}</span></Link>)}
    {!groups.length && <p className="muted small sb-h">Join groups to see shortcuts here.</p>}
    <p className="muted small sb-h foot">Privacy · Terms · Advertising · Cookies · KushuraConnect © {new Date().getFullYear()}</p>
  </aside>);
}
export function Contacts() {
  const { me, online, openChat } = useApp(); const [q, setQ] = useState(''); const [show, setShow] = useState(false);
  const friends = [...me.friends].sort((a, b) => online.includes(b._id) - online.includes(a._id)).filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
  return (<aside className="right-sb">
    {me.requests?.length > 0 && <><h4 className="muted sb-h">Friend requests</h4>
      <Link to="/friends" className="sb-item"><Avatar user={me.requests[0]} size={36} /><span><b>{me.requests[0].name}</b>{me.requests.length > 1 && ` and ${me.requests.length - 1} more`}</span></Link><hr /></>}
    <Link to="/friends" className="sb-item"><span className="sb-ic"><HiUsers /></span><span className="small"><b>Meet more people</b><br /><span className="muted">Find friends and mutuals</span></span></Link><hr />
    <div className="contacts-h"><h4 className="muted">Contacts</h4><button className="icon-btn" onClick={() => setShow(!show)} title="Search contacts"><IoSearch /></button></div>
    {show && <input className="contact-search" autoFocus placeholder="Search contacts" value={q} onChange={e => setQ(e.target.value)} />}
    {friends.map(f => <button key={f._id} className="sb-item" onClick={() => openChat(f)}><Avatar user={f} size={36} online={online.includes(f._id)} /><span>{f.name}</span></button>)}
    {!me.friends.length && <p className="muted small sb-h">No contacts yet. <Link to="/friends">Find friends</Link></p>}
  </aside>);
}
