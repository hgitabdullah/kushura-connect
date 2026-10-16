import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFacebookMessenger } from 'react-icons/fa';
import { IoSearch } from 'react-icons/io5';
import { MdOutlineStar, MdStar, MdRefresh } from 'react-icons/md';
import api from '../api';
import { getSocket } from '../socket';
import { useApp } from '../ctx';
import { Avatar } from '../components/ui';
import ChatBox from '../components/ChatBox';
import { timeAgo } from '../utils';

export default function Messenger() {
  const { id } = useParams(); const nav = useNavigate(); const { me, online } = useApp();
  const [convs, setConvs] = useState([]); const [q, setQ] = useState(''); const [other, setOther] = useState(null);
  const [filter, setFilter] = useState('all'); const [loadError, setLoadError] = useState(''); const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem(`kc-chat-favorites:${me._id}`) || '[]'); } catch { return []; } });
  const load = useCallback(async () => {
    setLoadError(''); setLoading(true);
    try { const { data } = await api.get('/conversations'); setConvs(data); }
    catch (e) { setLoadError(e.response?.data?.error || 'Could not load conversations. Check your connection and try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); const s = getSocket(); s.on('message', load); s.on('seen', load); return () => { s.off('message', load); s.off('seen', load); }; }, [load]);
  useEffect(() => {
    let active = true; setOther(null);
    if (!id) return;
    const friend = me.friends.find(x => x._id === id);
    if (friend) setOther(friend);
    else api.get(`/users/${id}`).then(r => { if (active) setOther(r.data); }).catch(() => { if (active) setLoadError('This conversation could not be opened. The account may no longer be available.'); });
    const timer = setTimeout(load, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [id, me.friends, load]);

  const ids = new Set(convs.map(c => c.user._id));
  const rows = [...convs, ...me.friends.filter(f => !ids.has(f._id)).map(f => ({ user: f }))]
    .filter(c => `${c.user.name} ${c.last?.text || ''}`.toLowerCase().includes(q.toLowerCase()))
    .filter(c => filter === 'all' || (filter === 'unread' ? c.unread > 0 : favorites.includes(c.user._id)))
    .sort((a, b) => Number(favorites.includes(b.user._id)) - Number(favorites.includes(a.user._id)));
  const toggleFavorite = userId => setFavorites(current => {
    const next = current.includes(userId) ? current.filter(x => x !== userId) : [...current, userId];
    localStorage.setItem(`kc-chat-favorites:${me._id}`, JSON.stringify(next)); return next;
  });

  return (<div className={'messenger card ' + (id ? 'has-chat' : '')}>
    <aside>
      <div className="messenger-title"><div><span>YOUR INBOX</span><h2>Messages</h2></div><span className="messenger-count" title="Unread messages">{convs.reduce((n, c) => n + (c.unread || 0), 0) || '✦'}</span></div>
      <label className="messenger-search"><IoSearch /><input aria-label="Search conversations" placeholder="Search people or chats" value={q} onChange={e => setQ(e.target.value)} /></label>
      {me.friends.some(f => online.includes(f._id)) && <div className="messenger-online"><div className="messenger-subtitle">ONLINE NOW</div><div className="online-row">{me.friends.filter(f => online.includes(f._id)).map(f => <button key={f._id} title={`Message ${f.name}`} onClick={() => nav(`/messages/${f._id}`)}><Avatar user={f} size={48} online /><span className="small">{f.name.split(' ')[0]}</span></button>)}</div></div>}
      <div className="messenger-list-heading"><div className="messenger-subtitle conversation-label">CONVERSATIONS</div><button className="icon-btn" title="Refresh conversations" aria-label="Refresh conversations" onClick={load}><MdRefresh /></button></div>
      <div className="messenger-filters" role="tablist" aria-label="Filter conversations">{[['all', 'All'], ['unread', 'Unread'], ['favorites', 'Favorites']].map(([key, label]) => <button role="tab" aria-selected={filter === key} key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}{key === 'unread' && convs.some(c => c.unread) && <i />}</button>)}</div>
      {loadError && <div className="messenger-error" role="alert"><span>{loadError}</span><button onClick={load}>Retry</button></div>}
      {loading && convs.length === 0 && !loadError && <div className="messenger-list-status">Loading conversations…</div>}
      {!loading && !loadError && rows.length === 0 && <div className="messenger-empty-list"><FaFacebookMessenger /><b>{filter === 'unread' ? 'All caught up' : filter === 'favorites' ? 'No favorites yet' : q ? 'No matches found' : 'No conversations yet'}</b><p>{filter === 'favorites' ? 'Star a conversation to keep it close.' : q ? 'Try another name or keyword.' : 'Choose a friend above to start chatting.'}</p></div>}
      {rows.map(c => {
        const favorite = favorites.includes(c.user._id); const mine = c.last?.from === me._id;
        const preview = c.last ? (mine ? 'You: ' : '') + (c.last.text || '📷 Photo') : 'Start a conversation';
        return <div key={c.user._id} className={'messenger-conv-wrap ' + (c.user._id === id ? 'active' : '')}>
          <button className={'conv ' + (c.user._id === id ? 'active' : '') + (c.unread ? ' unread' : '')} onClick={() => nav(`/messages/${c.user._id}`)}>
            <Avatar user={c.user} size={52} online={online.includes(c.user._id)} /><div className="grow"><div className="conv-name">{c.user.name}</div><div className="small conv-prev"><span className="ellipsis">{preview}</span>{c.last && <span className="muted"> · {timeAgo(c.last.createdAt)}</span>}</div></div>
            {c.unread > 0 && <span className="blue-dot" />}</button>
          <button className={'conv-favorite ' + (favorite ? 'on' : '')} title={favorite ? 'Remove favorite' : 'Add favorite'} aria-label={favorite ? `Remove ${c.user.name} from favorites` : `Add ${c.user.name} to favorites`} onClick={() => toggleFavorite(c.user._id)}>{favorite ? <MdStar /> : <MdOutlineStar />}</button>
        </div>;
      })}
    </aside>
    <section>{other ? <><button className="link only-mobile back" onClick={() => nav('/messages')}>← Chats</button><ChatBox key={other._id} user={other} /></>
      : <div className="center muted chat-empty"><FaFacebookMessenger size={64} /><h3>{id ? (loadError || 'Opening conversation…') : 'Select a chat or start a new conversation'}</h3></div>}</section>
  </div>);
}
