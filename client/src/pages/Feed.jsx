import { useEffect, useState } from 'react';
import api from '../api';
import Composer from '../components/Composer';
import PostCard from '../components/PostCard';
export default function Feed({ me }) {
  const [posts, setPosts] = useState([]);
  useEffect(() => { api.get('/posts/feed').then(r => setPosts(r.data)); }, []);
  return (<div className="feed">
    <Composer me={me} onPost={p => setPosts([p, ...posts])} />
    {posts.length === 0 && <div className="card muted">No posts yet. Add friends or write your first post.</div>}
    {posts.map(p => <PostCard key={p._id} post={p} me={me} onChange={n => setPosts(posts.map(x => x._id === n._id ? n : x))} onDelete={id => setPosts(posts.filter(x => x._id !== id))} />)}
  </div>);
}
