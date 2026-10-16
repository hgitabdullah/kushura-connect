import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdEdit, MdWork, MdSchool, MdHome, MdLocationOn, MdFavorite, MdLink, MdCake, MdCameraAlt } from 'react-icons/md';
import { FaFacebookMessenger } from 'react-icons/fa';
import api from '../api';
import { useApp } from '../ctx';
import { Avatar, Modal, Empty, Lightbox, Spinner } from '../components/ui';
import Composer from '../components/Composer';
import PostList from '../components/PostList';
import FriendButton from '../components/FriendButton';
import { uploadFiles, errMsg } from '../utils';
const FIELDS = [['work', MdWork, 'Works at'], ['education', MdSchool, 'Studied at'], ['location', MdHome, 'Lives in'], ['hometown', MdLocationOn, 'From'], ['relationship', MdFavorite, ''], ['birthday', MdCake, 'Born'], ['website', MdLink, '']];
export default function Profile() {
  const { id } = useParams(); const { me, reload, openChat } = useApp();
  const [u, setU] = useState(null); const [tab, setTab] = useState('posts'); const [added, setAdded] = useState(null); const [edit, setEdit] = useState(false); const [photos, setPhotos] = useState([]); const [lb, setLb] = useState(null); const [busy, setBusy] = useState('');
  const load = () => api.get(`/users/${id}`).then(r => setU(r.data)).catch(() => setU(false));
  useEffect(() => { setU(null); setTab('posts'); load(); api.get(`/users/${id}/photos`).then(r => setPhotos(r.data)); }, [id]); // eslint-disable-line
  if (u === false) return <div className="narrow"><Empty icon="🙁" title="This page isn't available" text="The link may be broken or the profile removed." /></div>;
  if (!u) return <div className="boot"><Spinner /></div>;
  const mine = u.status === 'self';
  const file = k => async e => { const f = e.target.files[0]; if (!f) return; setBusy(k); try { const [x] = await uploadFiles([f]); setU({ ...u, ...(await api.put('/users/me', { [k]: x.url })).data }); reload(); } catch (er) { alert(errMsg(er)); } setBusy(''); };
  const about = FIELDS.filter(([k]) => u[k]);
  const Intro = <div className="card intro"><h3>Intro</h3>{u.bio && <p className="center">{u.bio}</p>}
    {about.map(([k, I, pre]) => <div key={k} className="about-row"><I className="muted" /><span>{pre} <b>{u[k]}</b></span></div>)}
    {mine && <button className="block" onClick={() => setEdit(true)}>Edit details</button>}</div>;
  const FriendsBox = ({ all }) => <div className="card"><div className="row between"><h3>Friends</h3>{!all && <button className="link" onClick={() => setTab('friends')}>See all friends</button>}</div>
    <div className="muted">{u.friends.length} friends{!mine && u.mutualCount > 0 && ` · ${u.mutualCount} mutual`}</div>
    {u.friends.length === 0 ? <p className="muted">No friends to show.</p> : <div className={'friend-grid ' + (all ? 'all' : '')}>{(all ? u.friends : u.friends.slice(0, 9)).map(f => <Link key={f._id} to={`/profile/${f._id}`}>{f.avatar ? <img src={f.avatar} alt="" /> : <Avatar user={f} size={100} />}<div>{f.name}</div></Link>)}</div>}</div>;
  const PhotosBox = ({ all }) => <div className="card"><div className="row between"><h3>Photos</h3>{!all && photos.length > 0 && <button className="link" onClick={() => setTab('photos')}>See all photos</button>}</div>
    {photos.length === 0 ? <p className="muted">No photos to show.</p> : <div className={'photo-grid ' + (all ? 'all' : '')}>{(all ? photos : photos.slice(0, 9)).map((p, i) => <img key={i} src={p.src} alt="" onClick={() => setLb(i)} />)}</div>}</div>;
  return (<div className="profile">
    <div className="profile-top"><div className="profile-top-inner">
      <div className="cover" style={u.cover ? { backgroundImage: `url(${u.cover})` } : {}}>{mine && <label className="btn cover-btn"><MdCameraAlt /> {busy === 'cover' ? 'Uploading…' : 'Edit cover photo'}<input type="file" hidden accept="image/*" onChange={file('cover')} /></label>}</div>
      <div className="profile-head">
        <div className="pav"><Avatar user={u} size={168} />{mine && <label className="circle-btn pav-btn" title="Update profile picture"><MdCameraAlt /><input type="file" hidden accept="image/*" onChange={file('avatar')} /></label>}</div>
        <div className="grow"><h1>{u.name}</h1><div className="muted"><b>{u.friends.length}</b> friends{!mine && u.mutualCount > 0 && ` · ${u.mutualCount} mutual`}</div>
          <div className="mini-avs">{u.friends.slice(0, 8).map(f => <Avatar key={f._id} user={f} size={32} />)}</div></div>
        <div className="row wrap">{mine ? <button onClick={() => setEdit(true)}><MdEdit /> Edit profile</button> : <>
          <FriendButton key={u._id + u.status} id={u._id} status={u.status} onChange={load} /><button className={u.status === 'friends' ? 'primary' : ''} onClick={() => openChat(u)}><FaFacebookMessenger /> Message</button></>}</div>
      </div>
      <div className="tabs">{['posts', 'about', 'friends', 'photos'].map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
    </div></div>
    <div className="profile-body">
      {tab === 'posts' && <div className="profile-cols"><div className="profile-side">{Intro}<PhotosBox /><FriendsBox /></div>
        <div className="feed">{mine && <Composer onPost={setAdded} />}<PostList url={`/posts/user/${id}`} added={added} paged emptyTitle="No posts available" /></div></div>}
      {tab === 'about' && <div className="card about"><h3>About</h3>{u.bio && <p>{u.bio}</p>}{about.length === 0 && <p className="muted">No details to show.</p>}
        {about.map(([k, I, pre]) => <div key={k} className="about-row big"><I className="muted" /><span>{pre} <b>{u[k]}</b></span></div>)}
        <div className="about-row big"><MdCake className="muted" /><span>Joined {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span></div>
        {mine && <button onClick={() => setEdit(true)}><MdEdit /> Edit details</button>}</div>}
      {tab === 'friends' && <FriendsBox all />}
      {tab === 'photos' && <PhotosBox all />}
    </div>
    {lb !== null && <Lightbox images={photos.map(p => p.src)} start={lb} onClose={() => setLb(null)} />}
    {edit && <EditProfile u={u} onClose={() => setEdit(false)} onSave={d => { setU({ ...u, ...d }); setEdit(false); reload(); }} />}
  </div>);
}
function EditProfile({ u, onClose, onSave }) {
  const [f, setF] = useState(Object.fromEntries(['name', 'bio', ...FIELDS.map(x => x[0])].map(k => [k, u[k] || '']))); const [err, setErr] = useState('');
  const save = async e => { e.preventDefault(); try { onSave((await api.put('/users/me', f)).data); } catch (x) { setErr(errMsg(x)); } };
  const inp = (k, label, ph) => <label className="field"><span>{label}</span><input value={f[k]} placeholder={ph} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>;
  return <Modal title="Edit profile" onClose={onClose}><form className="stack" onSubmit={save}>
    {inp('name', 'Name')}<label className="field"><span>Bio</span><textarea maxLength={300} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} placeholder="Describe who you are" /></label>
    {inp('work', 'Work', 'Company / role')}{inp('education', 'Education', 'School or university')}{inp('location', 'Current city')}{inp('hometown', 'Hometown')}
    <label className="field"><span>Relationship</span><select value={f.relationship} onChange={e => setF({ ...f, relationship: e.target.value })}>
      {['', 'Single', 'In a relationship', 'Engaged', 'Married', "It's complicated"].map(o => <option key={o} value={o}>{o || '—'}</option>)}</select></label>
    <label className="field"><span>Birthday</span><input type="date" value={f.birthday} onChange={e => setF({ ...f, birthday: e.target.value })} /></label>{inp('website', 'Website')}
    {err && <div className="err">{err}</div>}<button className="primary block">Save</button></form></Modal>;
}
