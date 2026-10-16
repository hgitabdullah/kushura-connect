import { useEffect, useState } from 'react';
import { IoNewspaperOutline } from 'react-icons/io5';
import api from '../api';
import PostCard from './PostCard';
import { Empty, Skeletons } from './ui';
// Loads posts from `url`, supports prepend via `added`, infinite "load more".
export default function PostList({ url, added, emptyTitle = 'No posts yet', emptyText, paged }) {
  const [posts, setPosts] = useState(null); const [more, setMore] = useState(!!paged); const [loading, setLoading] = useState(false);
  useEffect(() => { setPosts(null); api.get(url, { params: { limit: 15 } }).then(r => { setPosts(r.data); setMore(!!paged && r.data.length === 15); }).catch(() => setPosts([])); }, [url, paged]);
  useEffect(() => { if (added) setPosts(p => [added, ...(p || []).filter(x => x._id !== added._id)]); }, [added]);
  const loadMore = async () => { setLoading(true); const r = await api.get(url, { params: { limit: 15, skip: posts.length } }); setPosts([...posts, ...r.data]); setMore(r.data.length === 15); setLoading(false); };
  if (posts === null) return <Skeletons n={3} />;
  if (!posts.length) return <Empty icon={<IoNewspaperOutline />} title={emptyTitle} text={emptyText} />;
  return <>{posts.map(p => <PostCard key={p._id} post={p} onChange={n => setPosts(ps => ps.map(x => x._id === n._id ? n : x))} onDelete={id => setPosts(ps => ps.filter(x => x._id !== id))} />)}
    {more && <button className="block load-more" disabled={loading} onClick={loadMore}>{loading ? 'Loading…' : 'Load more posts'}</button>}</>;
}
