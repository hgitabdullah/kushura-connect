import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BsThreeDots } from 'react-icons/bs';
import { AiOutlineLike } from 'react-icons/ai';
import { FaRegComment, FaShare, FaCaretRight } from 'react-icons/fa';
import { MdBookmarkBorder, MdBookmark, MdEdit, MdDelete, MdLink } from 'react-icons/md';
import api from '../api';
import { useApp } from '../ctx';
import { Avatar, Gallery, Lightbox, Modal } from './ui';
import { PrivIcon } from './Composer';
import { REACTIONS, timeAgo, errMsg, PRIVACY } from '../utils';
import { playReactionSound } from '../reactionSound';
const imgsOf = p => [...(p.images || []), ...(p.image ? [p.image] : [])];
function reactionsOf(p) { const r = [...(p.reactions || [])]; (p.likes || []).forEach(u => { if (!r.some(x => (x.user?._id || x.user) === (u._id || u))) r.push({ user: u, type: 'like' }); }); return r; }
export function Text({ text, limit = 300 }) {
  const [more, setMore] = useState(false); if (!text) return null;
  return <p className={'post-text ' + (text.length < 90 ? 'big' : '')}>{more || text.length <= limit ? text : text.slice(0, limit) + '… '}{!more && text.length > limit && <button className="link" onClick={() => setMore(true)}>See more</button>}</p>;
}
function Media({ p }) {
  const [lb, setLb] = useState(null); const imgs = imgsOf(p);
  return <>{p.video && <video className="post-video" src={p.video} controls preload="metadata" />}<Gallery images={imgs} onOpen={setLb} />
    {lb !== null && <Lightbox images={imgs} start={lb} onClose={() => setLb(null)} />}</>;
}
function Head({ p, children }) {
  const where = p.group ? <> <FaCaretRight className="muted" /> <Link to={`/groups/${p.group._id}`}><b>{p.group.name}</b></Link></> : null;
  const who = p.page ? <Link to={`/pages/${p.page._id}`}><b>{p.page.name}</b></Link> : <Link to={`/profile/${p.author?._id}`}><b>{p.author?.name}</b></Link>;
  return <div className="post-head"><Avatar user={p.page ? { ...p.page } : p.author} size={40} link={!p.page} />
    <div className="grow"><div>{who}{p.feeling && <span> is feeling {p.feeling}</span>}{p.sharedFrom && !p.text && <span className="muted"> shared a post</span>}{where}</div>
      <div className="muted small row-inline"><Link to={`/post/${p._id}`} className="muted">{timeAgo(p.createdAt)}</Link> · <PrivIcon p={p.group || p.page ? 'public' : p.privacy} /></div></div>{children}</div>;
}
export default function PostCard({ post, onChange, onDelete, openComments }) {
  const { me } = useApp(); const p = post;
  const [showC, setShowC] = useState(!!openComments); const [menu, setMenu] = useState(false); const [edit, setEdit] = useState(false); const [share, setShare] = useState(false);
  const [picker, setPicker] = useState(false); const [saved, setSaved] = useState(me.saved?.includes(p._id)); const [whoR, setWhoR] = useState(false); const [reactionFx, setReactionFx] = useState(null); const timer = useRef(); const input = useRef();
  const reacts = reactionsOf(p); const mineR = reacts.find(r => (r.user?._id || r.user) === me._id);
  const top = Object.entries(reacts.reduce((a, r) => ({ ...a, [r.type]: (a[r.type] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const nComments = (p.comments || []).reduce((n, c) => n + 1 + (c.replies?.length || 0), 0);
  const react = async type => { setPicker(false); setReactionFx({ type, id: Date.now() }); playReactionSound(type); try { onChange((await api.post(`/posts/${p._id}/react`, { type })).data); } catch (e) { alert(errMsg(e)); } };
  const del = async () => { if (!confirm('Move this post to trash? This can\u2019t be undone.')) return; await api.delete(`/posts/${p._id}`); onDelete?.(p._id); };
  const save = async () => { const { data } = await api.post(`/posts/${p._id}/save`); setSaved(data.saved); setMenu(false); };
  const mine = p.author?._id === me._id; const R = mineR && REACTIONS[mineR.type];
  const hover = v => { clearTimeout(timer.current); timer.current = setTimeout(() => setPicker(v), v ? 500 : 300); };
  return (<div className="card post">
    <Head p={p}><div className="menu-wrap"><button className="icon-btn" onClick={() => setMenu(!menu)}><BsThreeDots /></button>
      {menu && <div className="dropdown card post-menu" onMouseLeave={() => setMenu(false)}>
        <button className="menu-item" onClick={save}>{saved ? <MdBookmark /> : <MdBookmarkBorder />}{saved ? 'Unsave post' : 'Save post'}</button>
        <button className="menu-item" onClick={() => { navigator.clipboard?.writeText(location.origin + '/post/' + p._id); setMenu(false); }}><MdLink />Copy link</button>
        {mine && <button className="menu-item" onClick={() => { setEdit(true); setMenu(false); }}><MdEdit />Edit post</button>}
        {mine && <button className="menu-item" onClick={del}><MdDelete />Move to trash</button>}
      </div>}</div></Head>
    <Text text={p.text} /><Media p={p} />
    {p.sharedFrom && <div className="shared card">{p.sharedFrom.author ? <><Media p={p.sharedFrom} /><div className="pad-s"><Head p={p.sharedFrom} /><Text text={p.sharedFrom.text} limit={200} /></div></>
      : <div className="pad muted">This content isn't available right now.</div>}</div>}
    {(reacts.length > 0 || nComments > 0 || p.shares > 0) && <div className="post-stats">
      <button className="link-muted row-inline" onClick={() => reacts.length && setWhoR(true)}>{top.map(([t]) => <span key={t} className="r-ic">{REACTIONS[t].emoji}</span>)}{reacts.length > 0 && <span>{mineR ? (reacts.length > 1 ? `You and ${reacts.length - 1} other${reacts.length > 2 ? 's' : ''}` : 'You') : reacts.length}</span>}</button>
      <span className="grow" />{nComments > 0 && <button className="link-muted" onClick={() => setShowC(!showC)}>{nComments} comment{nComments > 1 && 's'}</button>}{p.shares > 0 && <span className="muted"> {p.shares} share{p.shares > 1 && 's'}</span>}</div>}
    <div className="post-actions">
      <div className="react-wrap" onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
        {reactionFx && <span key={reactionFx.id} className="reaction-burst" aria-hidden="true">{REACTIONS[reactionFx.type]?.emoji || '👍'}</span>}
        {picker && <div className="picker card">{Object.entries(REACTIONS).map(([k, v]) => <button key={k} title={v.label} onClick={() => react(k)}><span>{v.emoji}</span></button>)}</div>}
        <button onClick={() => react(mineR?.type || 'like')} style={R ? { color: R.color } : {}}>{R ? <span className="r-emoji">{R.emoji}</span> : <AiOutlineLike />}<span>{R ? R.label : 'Like'}</span></button></div>
      <button onClick={() => { setShowC(true); setTimeout(() => input.current?.focus(), 50); }}><FaRegComment /><span>Comment</span></button>
      <button onClick={() => setShare(true)}><FaShare /><span>Share</span></button>
    </div>
    {showC && <Comments p={p} onChange={onChange} inputRef={input} />}
    {edit && <EditPost p={p} onClose={() => setEdit(false)} onSave={n => { onChange(n); setEdit(false); }} />}
    {share && <SharePost p={p} onClose={() => setShare(false)} onShared={() => { setShare(false); onChange({ ...p, shares: (p.shares || 0) + 1 }); }} />}
    {whoR && <Modal title="Reactions" onClose={() => setWhoR(false)}>{reacts.map((r, i) => <div key={i} className="row person"><span className="av-r"><Avatar user={r.user} size={40} /><span>{REACTIONS[r.type].emoji}</span></span><Link to={`/profile/${r.user?._id}`}>{r.user?.name || 'Someone'}</Link></div>)}</Modal>}
  </div>);
}
function EditPost({ p, onClose, onSave }) {
  const [text, setText] = useState(p.text || ''); const [privacy, setPrivacy] = useState(p.privacy); const [imgs, setImgs] = useState(imgsOf(p)); const [err, setErr] = useState('');
  const save = async () => { try { onSave((await api.put(`/posts/${p._id}`, { text, privacy, images: imgs })).data); } catch (e) { setErr(errMsg(e)); } };
  return <Modal title="Edit post" onClose={onClose}>
    {!p.group && !p.page && <select className="priv-select" value={privacy} onChange={e => setPrivacy(e.target.value)}>{Object.entries(PRIVACY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}
    <textarea className="composer-text" value={text} onChange={e => setText(e.target.value)} />
    {imgs.length > 0 && <div className="preview-grid">{imgs.map((src, i) => <div key={i} className="preview"><img src={src} alt="" /><button className="icon-btn x" onClick={() => setImgs(imgs.filter((_, j) => j !== i))}>×</button></div>)}</div>}
    {err && <div className="err">{err}</div>}<button className="primary block" onClick={save}>Save</button></Modal>;
}
function SharePost({ p, onClose, onShared }) {
  const { me } = useApp(); const [text, setText] = useState(''); const [privacy, setPrivacy] = useState('friends'); const [err, setErr] = useState('');
  const go = async () => { try { await api.post(`/posts/${p._id}/share`, { text, privacy }); onShared(); } catch (e) { setErr(errMsg(e)); } };
  const orig = p.sharedFrom || p;
  return <Modal title="Share" onClose={onClose}><div className="row"><Avatar user={me} /><div><b>{me.name}</b><div><select className="priv-select" value={privacy} onChange={e => setPrivacy(e.target.value)}>{Object.entries(PRIVACY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div></div></div>
    <textarea placeholder="Say something about this..." value={text} onChange={e => setText(e.target.value)} />
    <div className="shared card pad-s"><b>{orig.page?.name || orig.author?.name}</b><p className="muted small">{orig.text?.slice(0, 140)}</p></div>
    {err && <div className="err">{err}</div>}<button className="primary block" onClick={go}>Share now</button></Modal>;
}
function Comments({ p, onChange, inputRef }) {
  const { me } = useApp(); const [text, setText] = useState(''); const [all, setAll] = useState(false);
  const list = p.comments || []; const shown = all ? list : list.slice(-3);
  const add = async e => { e.preventDefault(); if (!text.trim()) return; try { onChange((await api.post(`/posts/${p._id}/comment`, { text })).data); setText(''); } catch (x) { alert(errMsg(x)); } };
  return (<div className="comments">
    {list.length > 3 && !all && <button className="link-muted" onClick={() => setAll(true)}>View {list.length - 3} more comments</button>}
    {shown.map(c => <Comment key={c._id} c={c} p={p} onChange={onChange} />)}
    <form onSubmit={add} className="comment-form"><Avatar user={me} size={32} /><input ref={inputRef} value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment..." /></form>
  </div>);
}
function Comment({ c, p, onChange, parent }) {
  const { me } = useApp(); const [reply, setReply] = useState(false); const [rtext, setRtext] = useState(''); const [edit, setEdit] = useState(false); const [etext, setEtext] = useState(c.text);
  const base = parent ? `/posts/${p._id}/comments/${parent._id}/replies/${c._id}` : `/posts/${p._id}/comments/${c._id}`;
  const run = async (m, url, body) => { try { onChange((await api[m](url, body)).data); return true; } catch (e) { alert(errMsg(e)); } };
  const liked = c.likes?.some(l => (l._id || l) === me._id);
  const sendReply = async e => { e.preventDefault(); if (!rtext.trim()) return; if (await run('post', `/posts/${p._id}/comments/${(parent || c)._id}/reply`, { text: (parent ? `@${c.author?.name} ` : '') + rtext })) { setRtext(''); setReply(false); } };
  const saveEdit = async e => { e.preventDefault(); if (await run('put', base, { text: etext })) setEdit(false); };
  const canDel = c.author?._id === me._id || p.author?._id === me._id;
  return (<div className={'comment ' + (parent ? 'reply' : '')}><Avatar user={c.author} size={parent ? 24 : 32} link />
    <div className="grow">
      {edit ? <form onSubmit={saveEdit} className="comment-form"><input autoFocus value={etext} onChange={e => setEtext(e.target.value)} onKeyDown={e => e.key === 'Escape' && setEdit(false)} /></form>
        : <div className="bubble-wrap"><div className="bubble"><Link to={`/profile/${c.author?._id}`}><b>{c.author?.name}</b></Link><div>{c.text}</div></div>
          {c.likes?.length > 0 && <span className="c-likes">👍 {c.likes.length}</span>}</div>}
      <div className="c-actions small"><button className={liked ? 'blue' : ''} onClick={() => run('post', base + '/like')}>Like</button>
        <button onClick={() => setReply(!reply)}>Reply</button>
        {c.author?._id === me._id && <button onClick={() => setEdit(true)}>Edit</button>}
        {canDel && <button onClick={() => confirm('Delete this comment?') && run('delete', base)}>Delete</button>}
        <span className="muted">{timeAgo(c.createdAt)}{c.updatedAt && c.updatedAt !== c.createdAt && ' · Edited'}</span></div>
      {!parent && c.replies?.map(r => <Comment key={r._id} c={r} p={p} parent={c} onChange={onChange} />)}
      {reply && <form onSubmit={sendReply} className="comment-form reply"><Avatar user={me} size={24} /><input autoFocus value={rtext} onChange={e => setRtext(e.target.value)} placeholder={`Reply to ${c.author?.name}...`} /></form>}
    </div></div>);
}
