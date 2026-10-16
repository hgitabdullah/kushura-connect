import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MdFlag, MdAdd, MdCheck } from 'react-icons/md';
import { AiOutlineLike } from 'react-icons/ai';
import api from '../api';
import { Avatar, Empty, Skeletons, Spinner } from '../components/ui';
import Composer from '../components/Composer';
import PostList from '../components/PostList';
import { CreateModal } from './Groups';
export function Pages() {
  const nav = useNavigate(); const [all, setAll] = useState(null); const [create, setCreate] = useState(false);
  useEffect(() => { api.get('/pages').then(r => setAll(r.data)); }, []);
  const follow = async p => { const { data } = await api.post(`/pages/${p._id}/follow`); setAll(all.map(x => x._id === p._id ? data : x)); };
  const mine = all?.filter(p => p.isOwner) || [];
  return (<div className="with-side">
    <aside className="left-sb card"><h2>Pages</h2><button className="primary-soft block" onClick={() => setCreate(true)}><MdAdd /> Create new Page</button><hr />
      <h4 className="muted sb-h">Pages you manage</h4>{mine.length ? mine.map(p => <Link key={p._id} to={`/pages/${p._id}`} className="sb-item"><Avatar user={p} size={36} />{p.name}</Link>) : <p className="muted small sb-h">None yet</p>}</aside>
    <div className="main-col"><h3 className="sec-title">Discover Pages</h3>
      {all === null ? <div className="pgrid"><Skeletons n={3} type="card" /></div> : !all.length ? <Empty icon={<MdFlag />} title="No pages yet" /> :
        <div className="pgrid wide">{all.map(p => <div key={p._id} className="card group-card"><Link to={`/pages/${p._id}`}><img src={p.cover} alt="" /></Link>
          <div className="pc-body"><div className="row"><Avatar user={p} size={40} /><div><Link to={`/pages/${p._id}`}><b>{p.name}</b></Link><div className="muted small">{p.category} · {p.followerCount} followers</div></div></div>
            {!p.isOwner && <button className={'block ' + (p.isFollowing ? '' : 'primary-soft')} onClick={() => follow(p)}>{p.isFollowing ? <><MdCheck /> Following</> : <><AiOutlineLike /> Follow</>}</button>}</div></div>)}</div>}
    </div>{create && <CreateModal kind="page" onClose={() => setCreate(false)} onDone={p => nav(`/pages/${p._id}`)} />}</div>);
}
export function PageDetail() {
  const { id } = useParams(); const nav = useNavigate(); const [p, setP] = useState(null); const [added, setAdded] = useState(null);
  useEffect(() => { setP(null); api.get(`/pages/${id}`).then(r => setP(r.data)).catch(() => setP(false)); }, [id]);
  if (p === false) return <div className="narrow"><Empty title="Page not found" /></div>;
  if (!p) return <div className="boot"><Spinner /></div>;
  const follow = async () => setP({ ...p, ...(await api.post(`/pages/${id}/follow`)).data, owner: p.owner });
  return (<div className="profile">
    <div className="profile-top"><div className="profile-top-inner"><div className="cover" style={{ backgroundImage: `url(${p.cover})` }} />
      <div className="profile-head"><div className="pav"><Avatar user={p} size={168} /></div><div className="grow"><h1>{p.name}</h1><div className="muted">{p.category} · <b>{p.followerCount}</b> followers</div></div>
        <div className="row">{p.isOwner ? <button onClick={async () => { if (confirm('Delete this page?')) { await api.delete(`/pages/${id}`); nav('/pages'); } }}>Delete page</button>
          : <button className={p.isFollowing ? '' : 'primary'} onClick={follow}>{p.isFollowing ? <><MdCheck /> Following</> : <><AiOutlineLike /> Follow</>}</button>}</div></div></div></div>
    <div className="profile-body"><div className="profile-cols"><div className="profile-side"><div className="card"><h3>Intro</h3><p>{p.description}</p><div className="about-row"><MdFlag /><span>Page · {p.category}</span></div><div className="muted small">Managed by {p.owner?.name}</div></div></div>
      <div className="feed">{p.isOwner && <Composer page={p._id} onPost={setAdded} placeholder={`Post as ${p.name}...`} />}<PostList url={`/pages/${id}/posts`} added={added} emptyTitle="No posts yet" /></div></div></div></div>);
}
