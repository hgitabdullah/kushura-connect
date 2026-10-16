import { useEffect, useState } from 'react';
import { MdAdminPanelSettings, MdBlock, MdDeleteOutline, MdGroup, MdPersonAddAlt1, MdSearch, MdShield, MdVerifiedUser } from 'react-icons/md';
import api from '../api';
import { Avatar, Spinner } from '../components/ui';
import { errMsg } from '../utils';
import { useApp } from '../ctx';

const date = value => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
export default function AdminPanel() {
  const { me } = useApp();
  const [summary, setSummary] = useState(null); const [users, setUsers] = useState([]); const [q, setQ] = useState('');
  const [status, setStatus] = useState('all'); const [role, setRole] = useState('all'); const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1); const [total, setTotal] = useState(0); const [busy, setBusy] = useState('');
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [loading, setLoading] = useState(true);

  const loadSummary = () => api.get('/admin/summary').then(r => setSummary(r.data)).catch(e => setError(errMsg(e)));
  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { q, status: status === 'all' ? undefined : status, role: role === 'all' ? undefined : role, page, limit: 20 } });
      setUsers(data.users); setTotal(data.total); setPages(data.pages);
    } catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { const t = setTimeout(loadUsers, 220); return () => clearTimeout(t); }, [q, status, role, page]);

  const act = async (u, kind) => {
    if (kind === 'delete' && !confirm(`Permanently delete ${u.name} and remove their posts, messages, listings and profile? This cannot be undone.`)) return;
    if (kind === 'suspend' && !confirm(`Suspend ${u.name}? They will be signed out and blocked from using the app.`)) return;
    setBusy(u._id); setError(''); setNotice('');
    try {
      if (kind === 'delete') { await api.delete(`/admin/users/${u._id}`); setNotice(`${u.name}'s account and associated content were deleted.`); }
      if (kind === 'suspend') { await api.patch(`/admin/users/${u._id}/suspension`, { suspended: true, reason: 'Suspended by an administrator' }); setNotice(`${u.name}'s account was suspended.`); }
      if (kind === 'activate') { await api.patch(`/admin/users/${u._id}/suspension`, { suspended: false }); setNotice(`${u.name}'s account was reactivated.`); }
      if (kind === 'role') { const next = u.role === 'admin' ? 'user' : 'admin'; await api.patch(`/admin/users/${u._id}/role`, { role: next }); setNotice(`${u.name} is now ${next === 'admin' ? 'an admin' : 'a member'}.`); }
      await Promise.all([loadSummary(), loadUsers()]);
    } catch (e) { setError(errMsg(e)); }
    finally { setBusy(''); }
  };

  return <div className="admin-page">
    <header className="admin-hero"><div><div className="admin-eyebrow"><MdAdminPanelSettings /> PRIVATE ADMINISTRATION</div><h1>Control room</h1><p>Manage accounts and keep the KushuraConnect community healthy.</p></div><span className="admin-shield"><MdShield /></span></header>
    {error && <div className="admin-alert error" role="alert">{error}</div>}{notice && <div className="admin-alert success" role="status">{notice}</div>}
    <section className="admin-stats" aria-label="Community overview">
      <Stat icon={<MdGroup />} label="Total members" value={summary?.total} />
      <Stat icon={<MdPersonAddAlt1 />} label="Joined this week" value={summary?.newThisWeek} />
      <Stat icon={<MdBlock />} label="Suspended" value={summary?.suspended} />
      <Stat icon={<MdVerifiedUser />} label="Active admins" value={summary?.admins} />
    </section>
    <section className="admin-section">
      <div className="admin-section-head"><div><h2>Member directory</h2><p className="muted">Search accounts, review join dates, and manage access.</p></div><span className="admin-count">{total.toLocaleString()} members</span></div>
      <div className="admin-filters"><label className="admin-search"><MdSearch /><input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search by name or email" /></label>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by account status"><option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role"><option value="all">All roles</option><option value="user">Members</option><option value="admin">Admins</option></select></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Member</th><th>Joined</th><th>Role</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{loading ? <tr><td colSpan="5" className="admin-loading"><Spinner /></td></tr> : users.map(u => <tr key={u._id}>
          <td><div className="admin-person"><Avatar user={u} size={42} /><div><b>{u.name}</b><span>{u.email}</span></div></div></td><td>{date(u.createdAt)}</td>
          <td><span className={'admin-role ' + (u.role === 'admin' ? 'is-admin' : '')}>{u.role === 'admin' && <MdVerifiedUser />}{u.role === 'admin' ? 'Admin' : 'Member'}</span></td>
          <td><span className={'admin-status ' + (u.suspended ? 'is-suspended' : '')}><i />{u.suspended ? 'Suspended' : 'Active'}</span></td>
          <td><div className="admin-actions"><button disabled={!!busy || u._id === me._id} onClick={() => act(u, 'role')} title={u._id === me._id ? 'You cannot change your own role' : u.role === 'admin' ? 'Remove admin role' : 'Promote to admin'}>{busy === u._id ? <Spinner /> : <MdVerifiedUser />}</button>
            <button disabled={!!busy || u._id === me._id} onClick={() => act(u, u.suspended ? 'activate' : 'suspend')} title={u._id === me._id ? 'You cannot suspend yourself' : u.suspended ? 'Reactivate account' : 'Suspend account'}>{u.suspended ? <MdPersonAddAlt1 /> : <MdBlock />}</button>
            <button className="delete-action" disabled={!!busy || u._id === me._id} onClick={() => act(u, 'delete')} title={u._id === me._id ? 'You cannot delete yourself here' : 'Permanently delete account'}><MdDeleteOutline /></button></div></td>
        </tr>)}</tbody></table>
        {!loading && users.length === 0 && <div className="admin-no-results"><MdSearch /><b>No accounts found</b><span>Try changing your search or filters.</span></div>}
      </div>
      <footer className="admin-pagination"><span>Page {page} of {pages}</span><div><button disabled={page <= 1 || loading} onClick={() => setPage(x => x - 1)}>Previous</button><button disabled={page >= pages || loading} onClick={() => setPage(x => x + 1)}>Next</button></div></footer>
    </section>
    {summary?.recent?.length > 0 && <section className="admin-section recent-joins"><div className="admin-section-head"><div><h2>Recent signups</h2><p className="muted">The latest members to join KushuraConnect.</p></div></div><div className="recent-join-list">{summary.recent.map(u => <div className="recent-join" key={u._id}><Avatar user={u} size={38} /><div><b>{u.name}</b><span>{u.email}</span></div><time>{date(u.createdAt)}</time></div>)}</div></section>}
  </div>;
}
function Stat({ icon, label, value }) { return <article className="admin-stat"><span className="admin-stat-icon">{icon}</span><div><span>{label}</span><b>{value === undefined ? '—' : value.toLocaleString()}</b></div></article>; }
