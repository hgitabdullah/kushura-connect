import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoAdd, IoClose, IoChevronBack, IoChevronForward, IoEye, IoTrash } from 'react-icons/io5';
import api from '../api';
import { useApp } from '../ctx';
import { Avatar, Modal } from './ui';
import { timeAgo, uploadFiles, errMsg } from '../utils';
const BGS = ['#1877f2', '#e41e3f', '#42b72a', '#a033ff', '#f7b928', 'linear-gradient(135deg,#f093fb,#f5576c)', 'linear-gradient(135deg,#4facfe,#00f2fe)'];
export default function Stories() {
  const { me } = useApp(); const [list, setList] = useState(null); const [view, setView] = useState(null); const [create, setCreate] = useState(false); const row = useRef();
  const load = () => api.get('/stories').then(r => setList(r.data));
  useEffect(() => { load(); }, []);
  const scroll = d => row.current.scrollBy({ left: d * 300, behavior: 'smooth' });
  return (<div className="stories-wrap">
    <div className="stories" ref={row}>
      <div className="story create" onClick={() => setCreate(true)}><div className="story-img" style={{ backgroundImage: `url(${me.avatar})` }} />
        <div className="create-bottom"><span className="plus"><IoAdd /></span><b>Create story</b></div></div>
      {list === null && [1, 2, 3, 4].map(i => <div key={i} className="story skel" />)}
      {list?.map((g, i) => { const s = g.stories[g.stories.length - 1];
        return <div key={g.user._id} className="story" onClick={() => setView(i)} style={s.image ? {} : { background: s.bg }}>
          {s.image ? <div className="story-img" style={{ backgroundImage: `url(${s.image})` }} /> : <div className="story-text">{s.text}</div>}
          <span className={'story-av ' + (g.seen ? 'seen' : '')}><Avatar user={g.user} size={36} /></span><b className="story-name">{g.user._id === me._id ? 'Your story' : g.user.name}</b></div>; })}
    </div>
    {list?.length > 3 && <><button className="circle-btn scroll-l" onClick={() => scroll(-1)}><IoChevronBack /></button><button className="circle-btn scroll-r" onClick={() => scroll(1)}><IoChevronForward /></button></>}
    {view !== null && list?.[view] && <Viewer groups={list} start={view} onClose={() => { setView(null); load(); }} onDelete={load} />}
    {create && <CreateStory onClose={() => setCreate(false)} onDone={() => { setCreate(false); load(); }} />}
  </div>);
}
function Viewer({ groups, start, onClose, onDelete }) {
  const { me } = useApp(); const [g, setG] = useState(start); const [i, setI] = useState(0); const [p, setP] = useState(0); const [paused, setPaused] = useState(false); const [viewers, setViewers] = useState(false);
  const grp = groups[g]; const s = grp?.stories[i]; const mine = grp?.user._id === me._id;
  const next = () => { if (i < grp.stories.length - 1) setI(i + 1); else if (g < groups.length - 1) { setG(g + 1); setI(0); } else onClose(); };
  const prev = () => { if (i > 0) setI(i - 1); else if (g > 0) { setG(g - 1); setI(0); } };
  useEffect(() => { setP(0); if (s && !mine) api.post(`/stories/${s._id}/view`); }, [g, i]); // eslint-disable-line
  useEffect(() => { if (paused || viewers) return; const t = setInterval(() => setP(x => x + 2), 100); return () => clearInterval(t); }, [paused, viewers, g, i]);
  useEffect(() => { if (p >= 100) next(); }, [p]); // eslint-disable-line
  if (!s) return null;
  const del = async () => { await api.delete(`/stories/${s._id}`); onDelete(); onClose(); };
  return createPortal(<div className="story-viewer">
    <button className="icon-btn sv-close" onClick={onClose}><IoClose /></button>
    <button className="circle-btn sv-nav l" onClick={prev} disabled={g === 0 && i === 0}><IoChevronBack /></button>
    <div className="sv-card" style={s.image ? {} : { background: s.bg }} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}>
      <div className="sv-bars">{grp.stories.map((_, k) => <div key={k} className="sv-bar"><div style={{ width: k < i ? '100%' : k === i ? `${Math.min(p, 100)}%` : 0 }} /></div>)}</div>
      <div className="sv-head row"><Avatar user={grp.user} size={40} /><b>{grp.user.name}</b><span className="small">{timeAgo(s.createdAt)}</span>
        {mine && <button className="icon-btn" onClick={del} title="Delete story"><IoTrash /></button>}</div>
      {s.image ? <img src={s.image} alt="" /> : <div className="sv-text">{s.text}</div>}
      {s.image && s.text && <div className="sv-caption">{s.text}</div>}
      {mine && <button className="sv-viewers" onClick={() => setViewers(!viewers)}><IoEye /> {s.viewers?.length || 0} viewers</button>}
      {mine && viewers && <div className="viewer-list card">{s.viewers?.length ? s.viewers.map(v => <div key={v._id} className="row"><Avatar user={v} size={32} />{v.name}</div>) : <p className="muted">No viewers yet</p>}</div>}
    </div>
    <button className="circle-btn sv-nav r" onClick={next}><IoChevronForward /></button>
  </div>, document.body);
}
function CreateStory({ onClose, onDone }) {
  const [text, setText] = useState(''); const [bg, setBg] = useState(BGS[0]); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const submit = async () => { setBusy(true); try { const image = file ? (await uploadFiles([file]))[0].url : undefined; await api.post('/stories', { text, bg, image }); onDone(); } catch (e) { setErr(errMsg(e)); setBusy(false); } };
  return (<Modal title="Create story" onClose={onClose}>
    <div className="story-preview" style={file ? { backgroundImage: `url(${URL.createObjectURL(file)})` } : { background: bg }}><div>{text || (file ? '' : 'Start typing')}</div></div>
    <textarea placeholder="Start typing" value={text} onChange={e => setText(e.target.value)} maxLength={200} />
    {!file && <div className="row bg-pick">{BGS.map(b => <button key={b} className={b === bg ? 'on' : ''} style={{ background: b }} onClick={() => setBg(b)} />)}</div>}
    <div className="row"><label className="btn">📷 {file ? 'Change photo' : 'Add photo'}<input hidden type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} /></label>{file && <button onClick={() => setFile(null)}>Remove photo</button>}</div>
    {err && <div className="err">{err}</div>}
    <button className="primary block" disabled={busy || (!text.trim() && !file)} onClick={submit}>Share to story</button>
  </Modal>);
}
