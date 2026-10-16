import { useState } from 'react';
import { MdOndemandVideo } from 'react-icons/md';
import PostList from '../components/PostList';
import Composer from '../components/Composer';
export default function Watch() {
  const [added, setAdded] = useState(null);
  return <div className="watch"><aside className="left-sb card watch-side"><h2>Video</h2><div className="sb-item active"><span className="sb-ic"><MdOndemandVideo /></span>Home</div><p className="muted small sb-h">Videos from friends, pages and the community.</p></aside>
    <div className="feed wide-feed"><Composer onPost={p => p.video && setAdded(p)} placeholder="Share a video..." /><PostList url="/posts/videos" added={added} emptyTitle="No videos yet" emptyText="Post a video to get things started." /></div></div>;
}
