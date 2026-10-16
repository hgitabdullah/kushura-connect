import { useState } from 'react';
import { useApp } from '../ctx';
import { LeftSidebar, Contacts } from '../components/Sidebars';
import Stories from '../components/Stories';
import Composer from '../components/Composer';
import PostList from '../components/PostList';
export default function Home() {
  const { me } = useApp();
  const [added, setAdded] = useState(null);
  return (<div className="home">
    <LeftSidebar />
    <div className="feed"><header className="home-welcome"><div><span>YOUR COMMUNITY</span><h1>Welcome back, {me.name?.split(' ')[0]}</h1><p>See what your people are sharing today.</p></div><span className="home-welcome-mark" aria-hidden="true">✦</span></header><Stories /><Composer onPost={setAdded} />
      <PostList url="/posts/feed" added={added} paged emptyTitle="Your feed is empty" emptyText="Add friends, join groups or follow pages to see posts here." /></div>
    <Contacts />
  </div>);
}
