import PostList from '../components/PostList';
export default function Saved() { return <div className="narrow"><h2 className="page-title">Saved items</h2><PostList url="/users/me/saved" emptyTitle="No saved items" emptyText="Save posts from the ••• menu to find them here later." /></div>; }
