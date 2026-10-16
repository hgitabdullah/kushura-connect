import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MdStorefront, MdAdd, MdSell, MdLocationOn } from 'react-icons/md';
import { IoSearch } from 'react-icons/io5';
import { FaFacebookMessenger } from 'react-icons/fa';
import api from '../api';
import { useApp } from '../ctx';
import { Avatar, Modal, Empty, Skeletons, Spinner } from '../components/ui';
import { uploadFiles, errMsg, timeAgo } from '../utils';
const CATS = ['Electronics', 'Vehicles', 'Home & Kitchen', 'Furniture', 'Clothing & Accessories', 'Sports', 'Toys & Games', 'Other'];
const money = n => '$' + Number(n).toLocaleString();
export function Marketplace() {
  const [list, setList] = useState(null); const [q, setQ] = useState(''); const [cat, setCat] = useState(''); const [mine, setMine] = useState(false); const [create, setCreate] = useState(false);
  useEffect(() => { setList(null); const t = setTimeout(() => api.get('/market', { params: { q, category: cat || undefined, mine: mine || undefined } }).then(r => setList(r.data)), 250); return () => clearTimeout(t); }, [q, cat, mine]);
  return (<div className="with-side">
    <aside className="left-sb card"><h2>Marketplace</h2><div className="search block-s"><IoSearch /><input placeholder="Search Marketplace" value={q} onChange={e => setQ(e.target.value)} /></div>
      <button className={'sb-item ' + (!mine && !cat ? 'active' : '')} onClick={() => { setMine(false); setCat(''); }}><span className="sb-ic"><MdStorefront /></span>Browse all</button>
      <button className={'sb-item ' + (mine ? 'active' : '')} onClick={() => setMine(true)}><span className="sb-ic"><MdSell /></span>Your listings</button>
      <button className="primary-soft block" onClick={() => setCreate(true)}><MdAdd /> Create new listing</button><hr /><h4 className="muted sb-h">Categories</h4>
      {CATS.map(c => <button key={c} className={'sb-item ' + (cat === c ? 'active' : '')} onClick={() => setCat(cat === c ? '' : c)}>{c}</button>)}</aside>
    <div className="main-col"><h3 className="sec-title">{mine ? 'Your listings' : cat || "Today's picks"}</h3>
      {list === null ? <div className="pgrid"><Skeletons n={4} type="card" /></div> : !list.length ? <Empty icon={<MdStorefront />} title="No listings found" text="Try a different search or create a listing." /> :
        <div className="pgrid">{list.map(l => <Link key={l._id} to={`/marketplace/${l._id}`} className="listing"><div className="listing-img">{l.images?.[0] ? <img src={l.images[0]} alt="" /> : <MdStorefront />}{l.sold && <span className="sold">Sold</span>}</div>
          <b>{money(l.price)}</b><div>{l.title}</div><div className="muted small">{l.location}</div></Link>)}</div>}</div>
    {create && <CreateListing onClose={() => setCreate(false)} onDone={l => { setCreate(false); setList(x => [l, ...(x || [])]); }} />}
  </div>);
}
function CreateListing({ onClose, onDone }) {
  const [f, setF] = useState({ title: '', price: '', category: 'Electronics', condition: 'New', location: '', description: '' }); const [files, setFiles] = useState([]); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => { e.preventDefault(); setBusy(true); try { const images = files.length ? (await uploadFiles(files)).map(x => x.url) : []; onDone((await api.post('/market', { ...f, images })).data); } catch (x) { setErr(errMsg(x)); setBusy(false); } };
  return <Modal title="Item for sale" onClose={onClose}><form className="stack" onSubmit={submit}>
    <label className="btn">📷 {files.length ? `${files.length} photo(s) selected` : 'Add photos'}<input hidden type="file" multiple accept="image/*" onChange={e => setFiles([...e.target.files].slice(0, 10))} /></label>
    {files.length > 0 && <div className="preview-grid">{files.map((x, i) => <div key={i} className="preview"><img src={URL.createObjectURL(x)} alt="" /></div>)}</div>}
    <input required placeholder="Title" value={f.title} onChange={set('title')} /><input required type="number" min="0" placeholder="Price ($)" value={f.price} onChange={set('price')} />
    <select value={f.category} onChange={set('category')}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
    <select value={f.condition} onChange={set('condition')}>{['New', 'Used - Like new', 'Used - Good', 'Used - Fair'].map(c => <option key={c}>{c}</option>)}</select>
    <input placeholder="Location" value={f.location} onChange={set('location')} /><textarea placeholder="Description" value={f.description} onChange={set('description')} />
    {err && <div className="err">{err}</div>}<button className="primary block" disabled={busy}>{busy ? <Spinner /> : 'Publish'}</button></form></Modal>;
}
export function ListingDetail() {
  const { id } = useParams(); const { me } = useApp(); const nav = useNavigate(); const [l, setL] = useState(null); const [img, setImg] = useState(0); const [msg, setMsg] = useState(''); const [sent, setSent] = useState(false);
  useEffect(() => { api.get(`/market/${id}`).then(r => { setL(r.data); setMsg(`Hi, is "${r.data.title}" still available?`); }).catch(() => setL(false)); }, [id]);
  if (l === false) return <div className="narrow"><Empty title="Listing not found" /></div>;
  if (!l) return <div className="boot"><Spinner /></div>;
  const mine = l.seller?._id === me._id;
  const send = async () => { try { await api.post(`/messages/${l.seller._id}`, { text: msg, image: l.images?.[0] }); setSent(true); } catch (e) { alert(errMsg(e)); } };
  return (<div className="listing-detail card">
    <div className="ld-media">{l.images?.length ? <img src={l.images[img]} alt="" /> : <MdStorefront size={96} />}
      {l.images?.length > 1 && <div className="ld-thumbs">{l.images.map((s, i) => <img key={i} src={s} className={i === img ? 'on' : ''} onClick={() => setImg(i)} alt="" />)}</div>}</div>
    <div className="ld-info"><h1>{l.title}</h1><h2>{money(l.price)}{l.sold && <span className="sold-tag"> · Sold</span>}</h2><div className="muted small">Listed {timeAgo(l.createdAt)} {l.location && <><MdLocationOn /> {l.location}</>}</div>
      <hr /><h3>Details</h3><div className="about-row"><b>Condition</b><span>{l.condition}</span></div><div className="about-row"><b>Category</b><span>{l.category}</span></div><p>{l.description}</p><hr />
      <h3>Seller information</h3><Link to={`/profile/${l.seller._id}`} className="row"><Avatar user={l.seller} size={48} /><b>{l.seller.name}</b></Link>
      {mine ? <div className="row" style={{ marginTop: 16 }}><button onClick={async () => setL({ ...l, ...(await api.put(`/market/${id}`, { sold: !l.sold })).data })}>{l.sold ? 'Mark as available' : 'Mark as sold'}</button>
        <button onClick={async () => { if (confirm('Delete listing?')) { await api.delete(`/market/${id}`); nav('/marketplace'); } }}>Delete</button></div>
        : <div className="card msg-seller"><b><FaFacebookMessenger /> Send seller a message</b>{sent ? <p>Message sent! <Link to={`/messages/${l.seller._id}`}>Open chat</Link></p> : <><input value={msg} onChange={e => setMsg(e.target.value)} /><button className="primary block" onClick={send}>Send</button></>}</div>}
    </div></div>);
}
