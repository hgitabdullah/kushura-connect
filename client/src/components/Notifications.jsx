import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoNotifications } from 'react-icons/io5';
import { FaComment, FaShare, FaUserPlus, FaUserCheck, FaUsers, FaFlag, FaThumbsUp, FaReply } from 'react-icons/fa';
import api from '../api';
import { getSocket } from '../socket';
import { Avatar, Toast } from './ui';
import { REACTIONS, timeAgo } from '../utils';
export function describe(n) {
  return ({ react: `reacted ${REACTIONS[n.text]?.emoji || '👍'} to your post`, like: 'liked your post', comment: 'commented on your post', reply: 'replied to your comment',
    comment_like: 'liked your comment', share: 'shared your post', request: 'sent you a friend request', accept: 'accepted your friend request',
    group_post: `posted in ${n.text}`, group_join: `joined your group ${n.text}`, group_admin: `made you an admin of ${n.text}`, page_follow: `started following ${n.text}` })[n.type] || 'interacted with you';
}
const icon = t => ({ comment: [FaComment, '#42b72a'], reply: [FaReply, '#42b72a'], share: [FaShare, '#1877f2'], request: [FaUserPlus, '#1877f2'], accept: [FaUserCheck, '#1877f2'],
  group_post: [FaUsers, '#1877f2'], group_join: [FaUsers, '#1877f2'], group_admin: [FaUsers, '#f7b125'], page_follow: [FaFlag, '#e41e3f'] })[t] || [FaThumbsUp, '#1877f2'];
export default function Notifications() {
  const [list, setList] = useState(null); const [open, setOpen] = useState(false); const [toast, setToast] = useState(null); const [filter, setFilter] = useState('all');
  const nav = useNavigate(); const ref = useRef();
  useEffect(() => { api.get('/notifications').then(r => setList(r.data));
    const s = getSocket(); const h = n => { setList(l => [n, ...(l || [])]); setToast(n); setTimeout(() => setToast(null), 4000); };
    s.on('notification', h); const c = e => ref.current && !ref.current.contains(e.target) && setOpen(false); document.addEventListener('mousedown', c);
    return () => { s.off('notification', h); document.removeEventListener('mousedown', c); }; }, []);
  const unread = (list || []).filter(n => !n.read).length;
  const toggle = () => { setOpen(!open); if (!open && unread) { api.post('/notifications/read'); setTimeout(() => setList(l => l.map(n => ({ ...n, read: true }))), 2500); } };
  const go = n => { setOpen(false); setToast(null); nav(n.link || (n.post ? `/post/${n.post._id || n.post}` : `/profile/${n.from?._id}`)); };
  const row = n => { const [I, c] = n.type === 'react' ? [null] : icon(n.type);
    return <div key={n._id} className={'notif-item ' + (n.read ? '' : 'unread')} onClick={() => go(n)}>
      <div className="notif-av"><Avatar user={n.from} size={56} /><span className="notif-ic" style={{ background: c || 'transparent' }}>{I ? <I /> : REACTIONS[n.text]?.emoji || '👍'}</span></div>
      <div className="grow"><div><b>{n.from?.name}</b> {describe(n)}</div><div className={'small ' + (n.read ? 'muted' : 'blue')}>{timeAgo(n.createdAt)}</div></div>
      {!n.read && <span className="blue-dot" />}</div>; };
  const shown = (list || []).filter(n => filter === 'all' || !n.read);
  return (<div className="notif menu-wrap" ref={ref}>
    <button className={'circle-btn ' + (open ? 'active' : '')} onClick={toggle} title="Notifications"><IoNotifications />{unread > 0 && <span className="badge">{unread}</span>}</button>
    {open && <div className="dropdown card notif-dd"><h2>Notifications</h2>
      <div className="pills"><button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All</button><button className={filter === 'unread' ? 'on' : ''} onClick={() => setFilter('unread')}>Unread</button></div>
      {list === null ? <p className="muted pad">Loading…</p> : shown.length === 0 ? <div className="center pad muted"><IoNotifications size={48} /><p>No notifications</p></div> : shown.map(row)}</div>}
    {toast && <Toast><div className="row click" onClick={() => go(toast)}><Avatar user={toast.from} size={40} /><span><b>{toast.from?.name}</b> {describe(toast)}</span></div></Toast>}
  </div>);
}
