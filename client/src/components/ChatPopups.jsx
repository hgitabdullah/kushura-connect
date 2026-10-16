import { useState } from 'react';
import ChatBox from './ChatBox';
import { Avatar } from './ui';
export default function ChatPopups({ chats, close }) {
  const [min, setMin] = useState([]);
  return (<div className="chat-popups">
    <div className="mini-heads">{chats.filter(c => min.includes(c._id)).map(c => <button key={c._id} onClick={() => setMin(m => m.filter(x => x !== c._id))} title={c.name}><Avatar user={c} size={48} /></button>)}</div>
    {chats.filter(c => !min.includes(c._id)).map(c => <div key={c._id} className="popup card"><ChatBox user={c} compact onClose={() => close(c._id)} onMinimize={() => setMin(m => [...m, c._id])} /></div>)}
  </div>);
}
