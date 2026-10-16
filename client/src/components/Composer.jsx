import { useState } from 'react';
import { IoImages, IoHappy, IoVideocam, IoClose, IoEarth, IoPeople, IoLockClosed } from 'react-icons/io5';
import api from '../api';
import { useApp } from '../ctx';
import { Avatar, Modal, Spinner } from './ui';
import { EMOJIS, uploadFiles, errMsg } from '../utils';
const FEELINGS = ['😊 happy', '🥰 loved', '😎 cool', '🤩 excited', '😴 tired', '😢 sad', '🙏 thankful', '🎉 celebrating'];
export const PrivIcon = ({ p }) => p === 'public' ? <IoEarth /> : p === 'only_me' ? <IoLockClosed /> : <IoPeople />;
export default function Composer({ onPost, group, page, placeholder }) {
  const { me } = useApp(); const [open, setOpen] = useState(false);
  return (<div className="card composer">
    <div className="row"><Avatar user={me} size={40} link /><button className="fake-input" onClick={() => setOpen(true)}>{placeholder || `What's on your mind, ${me.name.split(' ')[0]}?`}</button></div>
    <hr />
    <div className="composer-actions">
      <button onClick={() => setOpen('video')}><IoVideocam color="#f3425f" /> <span>Video</span></button>
      <button onClick={() => setOpen('photo')}><IoImages color="#45bd62" /> <span>Photo/video</span></button>
      <button onClick={() => setOpen('feeling')}><IoHappy color="#f7b928" /> <span>Feeling</span></button>
    </div>
    {open && <ComposerModal start={open} onClose={() => setOpen(false)} onPost={p => { onPost(p); setOpen(false); }} group={group} page={page} />}
  </div>);
}
function ComposerModal({ start, onClose, onPost, group, page }) {
  const { me } = useApp();
  const [text, setText] = useState(''); const [files, setFiles] = useState([]); const [privacy, setPrivacy] = useState('friends');
  const [feeling, setFeeling] = useState(''); const [showFeel, setShowFeel] = useState(start === 'feeling'); const [emoji, setEmoji] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const add = e => { const f = [...e.target.files].map(file => ({ file, url: URL.createObjectURL(file), type: file.type.split('/')[0] })); setFiles(x => [...x, ...f].slice(0, 10)); e.target.value = ''; };
  const submit = async () => { setBusy(true); setErr('');
    try { const up = files.length ? await uploadFiles(files.map(f => f.file)) : [];
      const { data } = await api.post('/posts', { text, privacy, feeling, group, page, images: up.filter(x => x.type === 'image').map(x => x.url), video: up.find(x => x.type === 'video')?.url });
      onPost(data); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  return (<Modal title="Create post" onClose={onClose}>
    <div className="row"><Avatar user={me} size={40} /><div><b>{me.name}</b>{feeling && <span> is feeling {feeling}</span>}
      {!group && !page && <div><select className="priv-select" value={privacy} onChange={e => setPrivacy(e.target.value)}>
        <option value="public">🌎 Public</option><option value="friends">👥 Friends</option><option value="only_me">🔒 Only me</option></select></div>}</div></div>
    <textarea className="composer-text" autoFocus placeholder={`What's on your mind, ${me.name.split(' ')[0]}?`} value={text} onChange={e => setText(e.target.value)} style={{ fontSize: text.length < 80 && !files.length ? 24 : 15 }} />
    {files.length > 0 && <div className="preview-grid">{files.map((f, i) => <div key={i} className="preview">{f.type === 'video' ? <video src={f.url} /> : <img src={f.url} alt="" />}
      <button className="icon-btn x" onClick={() => setFiles(files.filter((_, j) => j !== i))}><IoClose /></button></div>)}</div>}
    {showFeel && <div className="feelings">{FEELINGS.map(f => <button key={f} className={feeling === f ? 'on' : ''} onClick={() => setFeeling(feeling === f ? '' : f)}>{f}</button>)}</div>}
    {emoji && <div className="emoji-row">{EMOJIS.map(e => <button key={e} onClick={() => setText(t => t + e)}>{e}</button>)}</div>}
    <div className="add-to card"><span>Add to your post</span><div className="row">
      <label className="icon-btn" title="Photo/video" style={{ color: '#45bd62' }}><IoImages /><input type="file" hidden multiple accept="image/*,video/*" onChange={add} ref={el => { if (el && (start === 'photo' || start === 'video') && !el.dataset.done) { el.dataset.done = 1; el.click(); } }} /></label>
      <button className="icon-btn" style={{ color: '#f7b928' }} onClick={() => setShowFeel(!showFeel)} title="Feeling"><IoHappy /></button>
      <button className="icon-btn" onClick={() => setEmoji(!emoji)} title="Emoji">😀</button></div></div>
    {err && <div className="err">{err}</div>}
    <button className="primary block" disabled={busy || (!text.trim() && !files.length)} onClick={submit}>{busy ? <Spinner /> : 'Post'}</button>
  </Modal>);
}
