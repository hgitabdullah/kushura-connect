import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import PostCard from '../components/PostCard';
import { Empty, Skeletons } from '../components/ui';
import { errMsg } from '../utils';
export default function PostPage() {
  const { id } = useParams(); const nav = useNavigate(); const [p, setP] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { setP(null); setErr(''); api.get(`/posts/${id}`).then(r => setP(r.data)).catch(e => setErr(errMsg(e))); }, [id]);
  return <div className="narrow">{err ? <Empty icon="🔒" title="This content isn't available" text={err}><Link to="/"><button className="primary">Go to News Feed</button></Link></Empty>
    : !p ? <Skeletons n={1} /> : <PostCard post={p} openComments onChange={setP} onDelete={() => nav('/')} />}</div>;
}
