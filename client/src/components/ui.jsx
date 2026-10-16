import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { IoClose } from 'react-icons/io5';
import { useApp } from '../ctx';
export function Avatar({ user, size = 40, online, link }) {
  const img = user?.avatar ? <img className="avatar" src={user.avatar} alt="" style={{ width: size, height: size }} />
    : <div className="avatar ph" style={{ width: size, height: size, fontSize: size / 2.4 }}>{user?.name?.[0]?.toUpperCase() || '?'}</div>;
  const el = <span className="av-wrap">{img}{online && <span className="dot" style={{ width: Math.max(10, size / 4), height: Math.max(10, size / 4) }} />}</span>;
  return link && user?._id ? <Link to={`/profile/${user._id}`}>{el}</Link> : el;
}
export function useOnline(id) { const { online } = useApp(); return online.includes(id); }
export function Modal({ title, onClose, children, wide }) {
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return createPortal(<div className="modal-bg" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className={'modal card' + (wide ? ' wide' : '')}>
      <header><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><IoClose /></button></header>
      <div className="modal-body">{children}</div></div></div>, document.body);
}
export function Empty({ icon, title, text, children }) {
  return <div className="empty card">{icon && <div className="empty-icon">{icon}</div>}<h3>{title}</h3>{text && <p className="muted">{text}</p>}{children}</div>;
}
export function PostSkeleton() {
  return <div className="card post skel-post"><div className="row"><div className="skel circle" /><div style={{ flex: 1 }}><div className="skel line w40" /><div className="skel line w20" /></div></div>
    <div className="skel line w90" /><div className="skel line w70" /><div className="skel block" /></div>;
}
export function Skeletons({ n = 3, type = 'post' }) {
  return <>{Array.from({ length: n }, (_, i) => type === 'post' ? <PostSkeleton key={i} /> : <div key={i} className="card skel-card"><div className="skel block" /><div className="skel line w70" /><div className="skel line w40" /></div>)}</>;
}
export function Spinner() { return <div className="spinner" />; }
export function Gallery({ images, onOpen }) {
  if (!images?.length) return null;
  const n = images.length, shown = images.slice(0, 4);
  return <div className={'gallery g' + Math.min(n, 4)}>{shown.map((src, i) => <div key={i} className="g-item" onClick={() => onOpen?.(i)}>
    <img src={src} alt="" loading="lazy" />{i === 3 && n > 4 && <div className="g-more">+{n - 4}</div>}</div>)}</div>;
}
export function Lightbox({ images, start = 0, onClose }) {
  const [i, setI] = useState(start);
  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') setI(x => (x + 1) % images.length); if (e.key === 'ArrowLeft') setI(x => (x - 1 + images.length) % images.length); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [images.length, onClose, setI]);
  return createPortal(<div className="lightbox" onClick={onClose}><img src={images[i]} alt="" onClick={e => { e.stopPropagation(); setI((i + 1) % images.length); }} />
    <button className="icon-btn lb-close"><IoClose /></button>{images.length > 1 && <div className="lb-count">{i + 1} / {images.length}</div>}</div>, document.body);
}
export function Toast({ children }) { return createPortal(<div className="toast card">{children}</div>, document.body); }
