import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IoSearch } from 'react-icons/io5';
import { HiUsers, HiUserGroup } from 'react-icons/hi';
import { MdFlag, MdArticle, MdApps } from 'react-icons/md';
import api from '../api';
import { Avatar, Empty, Skeletons } from '../components/ui';
import PostCard from '../components/PostCard';
export default function Search() {
  const [sp, setSp] = useSearchParams(); const q = sp.get('q') || ''; const [r, setR] = useState(null); const [tab, setTab] = useState('all'); const [input, setInput] = useState(q);
  useEffect(() => { setInput(q); if (!q) return setR({ people: [], posts: [], groups: [], pages: [] }); setR(null); api.get('/search', { params: { q } }).then(x => setR(x.data)); }, [q]);
  const T = [['all', MdApps, 'All'], ['people', HiUsers, 'People'], ['posts', MdArticle, 'Posts'], ['groups', HiUserGroup, 'Groups'], ['pages', MdFlag, 'Pages']];
  const show = k => tab === 'all' || tab === k;
  const total = r ? r.people.length + r.posts.length + r.groups.length + r.pages.length : 0;
  const Row = ({ to, img, title, sub }) => <Link to={to} className="result-row">{img}<div><b>{title}</b><div className="muted small">{sub}</div></div></Link>;
  return (<div className="with-side">
    <aside className="left-sb card"><h2>Search results</h2><form className="search block-s" onSubmit={e => { e.preventDefault(); setSp({ q: input }); }}><IoSearch /><input placeholder="Search" value={input} onChange={e => setInput(e.target.value)} /></form>
      <h4 className="muted sb-h">Filters</h4>{T.map(([k, I, l]) => <button key={k} className={'sb-item ' + (tab === k ? 'active' : '')} onClick={() => setTab(k)}><span className="sb-ic"><I /></span>{l}</button>)}</aside>
    <div className="main-col narrow-col">
      {!q ? <Empty icon={<IoSearch />} title="Search KushuraConnect" text="Find people, posts, groups and pages." /> : r === null ? <Skeletons n={2} /> : total === 0 ? <Empty icon={<IoSearch />} title="We didn't find any results" text={`Make sure everything is spelled correctly or try different keywords than "${q}".`} /> : <>
        {show('people') && r.people.length > 0 && <div className="card"><h3>People</h3>{r.people.map(p => <Row key={p._id} to={`/profile/${p._id}`} img={<Avatar user={p} size={60} />} title={p.name} sub={[p.isFriend && 'Friend', p.mutual && `${p.mutual} mutual friends`, p.work, p.location].filter(Boolean).join(' · ')} />)}</div>}
        {show('groups') && r.groups.length > 0 && <div className="card"><h3>Groups</h3>{r.groups.map(g => <Row key={g._id} to={`/groups/${g._id}`} img={<img className="sq lg" src={g.cover} alt="" />} title={g.name} sub={`${g.privacy === 'private' ? 'Private' : 'Public'} · ${g.memberCount} members${g.isMember ? ' · Joined' : ''}`} />)}</div>}
        {show('pages') && r.pages.length > 0 && <div className="card"><h3>Pages</h3>{r.pages.map(p => <Row key={p._id} to={`/pages/${p._id}`} img={<Avatar user={p} size={60} />} title={p.name} sub={`${p.category || 'Page'} · ${p.followerCount} followers${p.isFollowing ? ' · Following' : ''}`} />)}</div>}
        {show('posts') && r.posts.length > 0 && <><h3 className="sec-title">Posts</h3>{r.posts.map(p => <PostCard key={p._id} post={p} onChange={n => setR({ ...r, posts: r.posts.map(x => x._id === n._id ? n : x) })} onDelete={id => setR({ ...r, posts: r.posts.filter(x => x._id !== id) })} />)}</>}
        {tab !== 'all' && r[tab].length === 0 && <Empty title={`No ${tab} found`} />}
      </>}
    </div></div>);
}
