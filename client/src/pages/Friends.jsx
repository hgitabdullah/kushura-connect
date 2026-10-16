import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiUsers } from 'react-icons/hi';
import { FaUserPlus, FaUserFriends, FaUserClock, FaUsers } from 'react-icons/fa';
import api from '../api';
import { useApp } from '../ctx';
import { Avatar, Empty, Skeletons } from '../components/ui';
import FriendButton from '../components/FriendButton';
export default function Friends() {
  const { me } = useApp(); const [tab, setTab] = useState('home'); const [sugg, setSugg] = useState(null);
  useEffect(() => { api.get('/users/suggestions').then(r => setSugg(r.data)); }, []);
  const Card = ({ u, status, sub }) => <div className="card person-card"><Link to={`/profile/${u._id}`}>{u.avatar ? <img src={u.avatar} alt="" /> : <div className="ph-img"><Avatar user={u} size={80} /></div>}</Link>
    <div className="pc-body"><Link to={`/profile/${u._id}`}><b>{u.name}</b></Link><div className="muted small">{sub || '\u00a0'}</div><FriendButton id={u._id} status={status} small /></div></div>;
  const grid = (list, status, sub, empty) => list === null ? <div className="pgrid"><Skeletons n={4} type="card" /></div> : list.length ? <div className="pgrid">{list.map(u => <Card key={u._id} u={u} status={status} sub={sub?.(u)} />)}</div> : <Empty title={empty} />;
  const T = [['home', HiUsers, 'Home'], ['requests', FaUserPlus, `Friend requests${me.requests.length ? ` (${me.requests.length})` : ''}`], ['suggestions', FaUserFriends, 'Suggestions'], ['sent', FaUserClock, 'Sent requests'], ['all', FaUsers, 'All friends']];
  const mutual = u => u.mutual ? `${u.mutual} mutual friend${u.mutual > 1 ? 's' : ''}` : 'Suggested for you';
  return (<div className="with-side">
    <aside className="left-sb card"><h2>Friends</h2>{T.map(([k, I, l]) => <button key={k} className={'sb-item ' + (tab === k ? 'active' : '')} onClick={() => setTab(k)}><span className="sb-ic"><I /></span>{l}</button>)}</aside>
    <div className="main-col">
      {(tab === 'home' || tab === 'requests') && <><h3 className="sec-title">Friend requests</h3>{grid(me.requests, 'received', null, 'No new requests')}</>}
      {(tab === 'home' || tab === 'suggestions') && <><h3 className="sec-title">People you may know</h3>{grid(sugg, 'none', mutual, 'No suggestions right now')}</>}
      {tab === 'sent' && <><h3 className="sec-title">Sent requests</h3>{grid(me.sent || [], 'sent', null, 'No pending sent requests')}</>}
      {tab === 'all' && <><h3 className="sec-title">All friends ({me.friends.length})</h3>{grid(me.friends, 'friends', null, 'No friends yet')}</>}
    </div></div>);
}
