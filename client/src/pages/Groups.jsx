import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { HiUserGroup } from 'react-icons/hi';
import { MdAdd, MdPublic, MdLock, MdExplore, MdAdminPanelSettings } from 'react-icons/md';
import api from '../api';
import { useApp } from '../ctx';
import { Avatar, Modal, Empty, Skeletons, Spinner } from '../components/ui';
import Composer from '../components/Composer';
import PostList from '../components/PostList';
import { uploadFiles, errMsg } from '../utils';
export function CreateModal({ kind, onClose, onDone }) {
  const [f, setF] = useState({ name: '', description: '', privacy: 'public', category: '' }); const [file, setFile] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async e => { e.preventDefault(); setBusy(true);
    try { const url = file ? (await uploadFiles([file]))[0].url : `https://picsum.photos/seed/${encodeURIComponent(f.name)}/1600/500`;
      const body = kind === 'group' ? { ...f, cover: url } : { ...f, cover: url, avatar: file ? url : `https://picsum.photos/seed/${encodeURIComponent(f.name)}a/300/300` };
      onDone((await api.post(kind === 'group' ? '/groups' : '/pages', body)).data); } catch (x) { setErr(errMsg(x)); setBusy(false); } };
  return <Modal title={kind === 'group' ? 'Create group' : 'Create a Page'} onClose={onClose}><form className="stack" onSubmit={submit}>
    <input required placeholder={kind === 'group' ? 'Group name' : 'Page name'} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
    {kind === 'page' && <input placeholder="Category (e.g. Business, Travel)" value={f.category} onChange={e => setF({ ...f, category: e.target.value })} />}
    <textarea placeholder="Description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
    {kind === 'group' && <select value={f.privacy} onChange={e => setF({ ...f, privacy: e.target.value })}><option value="public">🌎 Public – anyone can see posts</option><option value="private">🔒 Private – only members see posts</option></select>}
    <label className="btn">🖼️ {file ? file.name : 'Upload cover photo (optional)'}<input hidden type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} /></label>
    {err && <div className="err">{err}</div>}<button className="primary block" disabled={busy}>{busy ? <Spinner /> : 'Create'}</button></form></Modal>;
}
export function Groups() {
  const nav = useNavigate(); const [all, setAll] = useState(null); const [tab, setTab] = useState('discover'); const [create, setCreate] = useState(false);
  useEffect(() => { api.get('/groups').then(r => setAll(r.data)); }, []);
  const join = async g => { const { data } = await api.post(`/groups/${g._id}/join`); setAll(all.map(x => x._id === g._id ? { ...x, ...data, members: undefined } : x)); };
  const mine = all?.filter(g => g.isMember) || []; const list = tab === 'mine' ? mine : all?.filter(g => !g.isMember);
  return (<div className="with-side">
    <aside className="left-sb card"><h2>Groups</h2>
      <button className={'sb-item ' + (tab === 'discover' ? 'active' : '')} onClick={() => setTab('discover')}><span className="sb-ic"><MdExplore /></span>Discover</button>
      <button className={'sb-item ' + (tab === 'mine' ? 'active' : '')} onClick={() => setTab('mine')}><span className="sb-ic"><HiUserGroup /></span>Your groups</button>
      <button className="primary-soft block" onClick={() => setCreate(true)}><MdAdd /> Create new group</button><hr />
      <h4 className="muted sb-h">Groups you've joined</h4>{mine.map(g => <Link key={g._id} to={`/groups/${g._id}`} className="sb-item"><img className="sq" src={g.cover} alt="" />{g.name}</Link>)}</aside>
    <div className="main-col"><h3 className="sec-title">{tab === 'mine' ? 'Your groups' : 'Suggested for you'}</h3>
      {list === undefined ? <div className="pgrid"><Skeletons n={3} type="card" /></div> : list.length === 0 ? <Empty icon={<HiUserGroup />} title={tab === 'mine' ? "You haven't joined any groups" : "You've joined every group!"} /> :
        <div className="pgrid wide">{list.map(g => <div key={g._id} className="card group-card"><Link to={`/groups/${g._id}`}><img src={g.cover} alt="" /></Link>
          <div className="pc-body"><Link to={`/groups/${g._id}`}><b>{g.name}</b></Link><div className="muted small">{g.privacy === 'private' ? 'Private' : 'Public'} group · {g.memberCount} members</div>
            {g.isMember ? <Link to={`/groups/${g._id}`}><button className="block">View group</button></Link> : <button className="primary-soft block" onClick={() => join(g)}>Join group</button>}</div></div>)}</div>}
    </div>
    {create && <CreateModal kind="group" onClose={() => setCreate(false)} onDone={g => nav(`/groups/${g._id}`)} />}
  </div>);
}
export function GroupDetail() {
  const { id } = useParams(); const { me } = useApp(); const nav = useNavigate(); const [g, setG] = useState(null); const [tab, setTab] = useState('discussion'); const [added, setAdded] = useState(null);
  useEffect(() => { setG(null); api.get(`/groups/${id}`).then(r => setG(r.data)).catch(() => setG(false)); }, [id]);
  if (g === false) return <div className="narrow"><Empty title="Group not found" /></div>;
  if (!g) return <div className="boot"><Spinner /></div>;
  const act = async (m, url) => { try { const { data } = await api[m](url); setG(data.members?.[0]?.name ? data : (await api.get(`/groups/${id}`)).data); } catch (e) { alert(errMsg(e)); } };
  const canSee = g.privacy === 'public' || g.isMember; const isAdmin = u => g.admins.some(a => a._id === u._id);
  return (<div className="profile">
    <div className="profile-top"><div className="profile-top-inner"><div className="cover group-cover" style={{ backgroundImage: `url(${g.cover})` }} />
      <div className="group-head"><h1>{g.name}</h1><div className="muted">{g.privacy === 'private' ? <MdLock /> : <MdPublic />} {g.privacy === 'private' ? 'Private' : 'Public'} group · <b>{g.memberCount}</b> members</div>
        <div className="row between wrap"><div className="mini-avs">{g.members.slice(0, 10).map(m => <Avatar key={m._id} user={m} size={32} />)}</div>
          <div className="row">{g.isMember ? (g.owner?._id === me._id ? <button onClick={async () => { if (confirm('Delete this group and all its posts?')) { await api.delete(`/groups/${id}`); nav('/groups'); } }}>Delete group</button> : <button onClick={() => act('post', `/groups/${id}/leave`)}>Leave group</button>)
            : <button className="primary" onClick={() => act('post', `/groups/${id}/join`)}>+ Join group</button>}</div></div></div>
      <div className="tabs">{['discussion', 'members', 'about'].map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div></div></div>
    <div className="profile-body">
      {tab === 'discussion' && <div className="profile-cols"><div className="feed">{g.isMember && <Composer group={g._id} onPost={setAdded} placeholder="Write something..." />}
        {canSee ? <PostList url={`/groups/${id}/posts`} added={added} emptyTitle="No posts yet" emptyText={g.isMember ? 'Be the first to post in this group.' : 'Join the group to start posting.'} /> : <Empty icon={<MdLock />} title="This group is private" text="Join this group to view or participate in discussions." />}</div>
        <div className="profile-side"><div className="card"><h3>About</h3><p>{g.description || 'No description.'}</p><div className="about-row">{g.privacy === 'private' ? <MdLock /> : <MdPublic />}<span>{g.privacy === 'private' ? 'Only members can see posts.' : "Anyone can see who's in the group and what they post."}</span></div></div></div></div>}
      {tab === 'members' && <div className="card narrow-col"><h3>Members · {g.memberCount}</h3>
        <h4 className="muted">Admins</h4>{g.admins.map(a => <div key={a._id} className="result-row"><Avatar user={a} size={48} link /><div className="grow"><b>{a.name}</b><div className="muted small">{g.owner?._id === a._id ? 'Owner' : 'Admin'}</div></div></div>)}<hr />
        {g.members.map(m => <div key={m._id} className="result-row"><Avatar user={m} size={48} link /><div className="grow"><Link to={`/profile/${m._id}`}><b>{m.name}</b></Link>{isAdmin(m) && <div className="muted small"><MdAdminPanelSettings /> Admin</div>}</div>
          {g.isAdmin && m._id !== g.owner?._id && m._id !== me._id && <div className="row"><button className="sm" onClick={() => act('post', `/groups/${id}/admins/${m._id}`)}>{isAdmin(m) ? 'Remove admin' : 'Make admin'}</button><button className="sm" onClick={() => confirm(`Remove ${m.name}?`) && act('delete', `/groups/${id}/members/${m._id}`)}>Remove</button></div>}</div>)}</div>}
      {tab === 'about' && <div className="card narrow-col"><h3>About this group</h3><p>{g.description}</p><p className="muted">Created {new Date(g.createdAt).toLocaleDateString()} by {g.owner?.name}</p></div>}
    </div></div>);
}
