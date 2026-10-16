import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IoSend, IoImage, IoHappyOutline, IoClose, IoRemove, IoColorPaletteOutline } from 'react-icons/io5';
import { AiFillLike } from 'react-icons/ai';
import api from '../api';
import { getSocket } from '../socket';
import { useApp } from '../ctx';
import { Avatar } from './ui';
import { EMOJIS, uploadFiles, errMsg, timeAgo } from '../utils';

const themes = { classic: ['#176b58', '#e7f4ee'], ocean: ['#2877b8', '#e9f3fc'], sunset: ['#c45f43', '#fff0e9'], lavender: ['#7859b5', '#f2edfb'], rose: ['#bd4c70', '#fcecf2'], midnight: ['#8c9cff', '#222840'] };

export default function ChatBox({ user, compact, onClose, onMinimize }) {
  const { me, online } = useApp(); const id = user._id;
  const themeKey = `kc-chat-theme:${me._id}:${id}`; const draftKey = `kc-chat-draft:${me._id}:${id}`;
  const [theme, setTheme] = useState(() => localStorage.getItem(themeKey) || 'classic'); const [showThemes, setShowThemes] = useState(false);
  const [msgs, setMsgs] = useState(null); const [text, setText] = useState(() => localStorage.getItem(draftKey) || ''); const [typing, setTyping] = useState(false);
  const [loadError, setLoadError] = useState(''); const [chatError, setChatError] = useState('');
  const [emoji, setEmoji] = useState(false); const [busy, setBusy] = useState(false); const end = useRef(); const tRef = useRef();
  const loadMessages = useCallback(async () => {
    setLoadError(''); setMsgs(null);
    try { const { data } = await api.get(`/messages/${id}`); setMsgs(data); }
    catch (e) { setLoadError(e.response?.data?.error || 'Could not load messages. Check your connection and retry.'); }
  }, [id]);
  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { localStorage.setItem(draftKey, text); }, [draftKey, text]);
  useEffect(() => { const s = getSocket();
    const onMsg = m => { if (m.from === id) { setMsgs(x => [...(x || []), m]); s.emit('seen', id); setTyping(false); } };
    const onTyping = f => { if (f === id) { setTyping(true); clearTimeout(tRef.current); tRef.current = setTimeout(() => setTyping(false), 1800); } };
    const onSeen = ({ by }) => { if (by === id) setMsgs(x => x?.map(m => m.from === me._id ? { ...m, read: true } : m)); };
    s.on('message', onMsg); s.on('typing', onTyping); s.on('seen', onSeen);
    return () => { s.off('message', onMsg); s.off('typing', onTyping); s.off('seen', onSeen); clearTimeout(tRef.current); };
  }, [id, me._id]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, typing]);
  const send = async body => {
    if (busy) return false;
    setBusy(true); setChatError('');
    try { const { data } = await api.post(`/messages/${id}`, body); setMsgs(x => [...(x || []), data]); return true; }
    catch (e) { setChatError(errMsg(e)); return false; }
    finally { setBusy(false); }
  };
  const submit = async e => { e.preventDefault(); const body = text.trim() ? { text: text.trim() } : { text: '👍' }; if (await send(body)) { setText(''); localStorage.removeItem(draftKey); setEmoji(false); } };
  const img = async e => {
    const filesToUpload = e.target.files; if (!filesToUpload.length) return;
    setChatError('');
    try { const files = await uploadFiles(filesToUpload); for (const file of files) if (!(await send({ image: file.url }))) break; }
    catch (error) { setChatError(errMsg(error)); }
    finally { e.target.value = ''; }
  };
  const lastMine = msgs ? [...msgs].reverse().find(m => m.from === me._id) : null;

  return (<div className={'chatbox ' + (compact ? 'compact' : '') + ` chat-theme-${theme}`} style={{ '--chat-accent': themes[theme]?.[0] || themes.classic[0], '--chat-tint': themes[theme]?.[1] || themes.classic[1] }}>
    <header><Link to={`/profile/${id}`} className="row"><Avatar user={user} size={compact ? 32 : 40} online={online.includes(id)} /><div><b>{user.name}</b><div className="muted small">{online.includes(id) ? 'Active now' : 'Offline'}</div></div></Link>
      <div className="row chat-tools"><div className="chat-theme-menu"><button className="icon-btn" title="Conversation theme" aria-label="Conversation theme" onClick={() => setShowThemes(v => !v)}><IoColorPaletteOutline /></button>
        {showThemes && <div className="chat-theme-pop card" role="group" aria-label="Choose conversation theme">{Object.entries(themes).map(([name, colors]) => <button key={name} className={theme === name ? 'active' : ''} title={`${name} theme`} aria-label={`${name} theme`} onClick={() => { setTheme(name); localStorage.setItem(themeKey, name); setShowThemes(false); }}><i style={{ background: colors[0] }} />{name}</button>)}</div>}</div>
        {compact && <><button className="icon-btn" onClick={onMinimize} aria-label="Minimize chat"><IoRemove /></button><button className="icon-btn" onClick={onClose} aria-label="Close chat"><IoClose /></button></>}</div></header>
    <div className="msgs">
      {msgs === null ? <div className="chat-load-state center muted pad">{loadError ? <><span>{loadError}</span><button className="link" onClick={loadMessages}>Try again</button></> : 'Loading messages…'}</div> : msgs.length === 0 ? <div className="chat-intro"><Avatar user={user} size={72} /><h3>{user.name}</h3><p className="muted small">Say hi to start the conversation 👋</p></div> : null}
      {msgs?.map((m, i) => {
        const mine = m.from === me._id; const prev = msgs[i - 1]; const gap = !prev || new Date(m.createdAt) - new Date(prev.createdAt) > 36e5;
        return <div key={m._id}>{gap && <div className="msg-time muted small">{new Date(m.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>}
          <div className={'msg-row ' + (mine ? 'mine' : '')}>{!mine && <Avatar user={user} size={28} />}<div className="msg-col" title={timeAgo(m.createdAt)}>
            {m.image && <img className="msg-img" src={m.image} alt="Shared attachment" onClick={() => window.open(m.image, '_blank', 'noopener,noreferrer')} />}
            {m.text && <div className={'msg ' + (/^\p{Extended_Pictographic}{1,3}$/u.test(m.text) ? 'big-emoji' : '')}>{m.text}</div>}
          </div></div>
          {lastMine?._id === m._id && <div className="seen small muted">{m.read ? <><Avatar user={user} size={14} /> Seen</> : 'Sent'}</div>}</div>;
      })}
      {typing && <div className="msg-row"><Avatar user={user} size={28} /><div className="msg typing"><span /><span /><span /></div></div>}
      <div ref={end} />
    </div>
    {chatError && <div className="chat-error" role="alert"><span>{chatError}</span><button type="button" onClick={() => setChatError('')}>Dismiss</button></div>}
    <form onSubmit={submit} className="chat-input">
      <label className="icon-btn blue" title="Send photo" aria-label="Send photo"><IoImage /><input type="file" hidden accept="image/*" multiple onChange={img} /></label>
      <div className="chat-field"><input value={text} onChange={e => { setText(e.target.value); getSocket().emit('typing', id); }} placeholder="Write a message…" aria-label="Write a message" />
        <button type="button" className="icon-btn blue" aria-label="Add emoji" onClick={() => setEmoji(!emoji)}><IoHappyOutline /></button>
        {emoji && <div className="emoji-pop card">{EMOJIS.map(e => <button type="button" key={e} onClick={() => setText(t => t + e)}>{e}</button>)}</div>}</div>
      <button className="icon-btn blue" title={text.trim() ? 'Send message' : 'Send a like'} aria-label={text.trim() ? 'Send message' : 'Send a like'} disabled={busy}>{text.trim() ? <IoSend /> : <AiFillLike />}</button>
    </form>
  </div>);
}
