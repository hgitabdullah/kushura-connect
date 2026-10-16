import { useState } from 'react';
import { MdPersonOutline, MdLockOutline, MdDeleteOutline, MdDarkMode, MdOutlineVisibility, MdNotificationsNone, MdDownload, MdShield, MdCheckCircle, MdSettingsSuggest } from 'react-icons/md';
import api from '../api';
import { useApp } from '../ctx';
import { errMsg } from '../utils';
import { Modal } from '../components/ui';

const defaults = { profileVisibility: 'everyone', discoverable: true, allowFriendRequests: true, notificationPreferences: { friendRequests: true, postActivity: true, communityActivity: true } };
const initialPreferences = me => ({ ...defaults, ...me, notificationPreferences: { ...defaults.notificationPreferences, ...me.notificationPreferences } });
const sections = [
  ['account', MdPersonOutline, 'Account', 'Profile details and email'],
  ['privacy', MdOutlineVisibility, 'Privacy', 'Choose how people find you'],
  ['notifications', MdNotificationsNone, 'Notifications', 'Choose what you hear about'],
  ['security', MdLockOutline, 'Security', 'Password and sign-in'],
  ['appearance', MdDarkMode, 'Appearance', 'Theme and display'],
  ['data', MdSettingsSuggest, 'Your data', 'Export or delete your account'],
];

export default function Settings() {
  const { me, reload, logout, dark, setDark } = useApp();
  const [tab, setTab] = useState('account');
  const [reactionSounds, setReactionSounds] = useState(() => localStorage.getItem('kc-reaction-sounds') !== 'off');
  const [prefs, setPrefs] = useState(() => initialPreferences(me));
  const [account, setAccount] = useState({ name: me.name, email: me.email, currentPassword: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [notice, setNotice] = useState(null); const [saving, setSaving] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false); const [deletePassword, setDeletePassword] = useState(''); const [deleteConfirm, setDeleteConfirm] = useState('');

  const saveAccount = async e => {
    e.preventDefault(); setNotice(null); setSaving('account');
    try {
      await api.put('/users/me/account', { name: account.name.trim(), email: account.email.trim(), currentPassword: account.currentPassword });
      setAccount(x => ({ ...x, currentPassword: '' })); setNotice({ type: 'success', text: 'Your account details have been updated.' }); await reload();
    } catch (e) { setNotice({ type: 'error', text: errMsg(e) }); }
    finally { setSaving(''); }
  };
  const savePassword = async e => {
    e.preventDefault(); setNotice(null);
    if (password.newPassword !== password.confirm) return setNotice({ type: 'error', text: 'The new passwords do not match.' });
    if (password.newPassword.length < 8) return setNotice({ type: 'error', text: 'Use at least 8 characters for your new password.' });
    setSaving('password');
    try {
      await api.put('/users/me/account', { currentPassword: password.currentPassword, newPassword: password.newPassword });
      setPassword({ currentPassword: '', newPassword: '', confirm: '' }); setNotice({ type: 'success', text: 'Your password has been changed.' });
    } catch (e) { setNotice({ type: 'error', text: errMsg(e) }); }
    finally { setSaving(''); }
  };
  const savePreference = async (key, value) => {
    const previous = prefs;
    const next = key.startsWith('notificationPreferences.')
      ? { ...prefs, notificationPreferences: { ...prefs.notificationPreferences, [key.split('.')[1]]: value } }
      : { ...prefs, [key]: value };
    const patch = key.startsWith('notificationPreferences.') ? { notificationPreferences: next.notificationPreferences } : { [key]: value };
    setPrefs(next); setNotice(null); setSaving(key);
    try {
      const { data } = await api.put('/users/me/preferences', patch);
      setPrefs(current => ({ ...current, ...data, notificationPreferences: { ...current.notificationPreferences, ...data.notificationPreferences } }));
      setNotice({ type: 'success', text: 'Preference saved.' }); await reload();
    } catch (e) { setPrefs(previous); setNotice({ type: 'error', text: errMsg(e) }); }
    finally { setSaving(''); }
  };
  const exportData = async () => {
    setNotice(null); setSaving('export');
    try {
      const { data } = await api.get('/users/me/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'kushuraconnect-account-data.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice({ type: 'success', text: 'Your data export has been downloaded.' });
    } catch (e) { setNotice({ type: 'error', text: errMsg(e) }); }
    finally { setSaving(''); }
  };
  const deleteAccount = async e => {
    e.preventDefault(); setNotice(null); setSaving('delete');
    try { await api.delete('/users/me', { data: { password: deletePassword } }); logout(); }
    catch (e) { setNotice({ type: 'error', text: errMsg(e) }); setSaving(''); }
  };

  return <div className="settings-page">
    <header className="settings-hero"><span className="settings-hero-icon"><MdSettingsSuggest /></span><div><h1>Settings</h1><p>Make KushuraConnect work the way you want.</p></div></header>
    <div className="settings-layout">
      <aside className="settings-nav card"><div className="settings-nav-title">YOUR PREFERENCES</div>{sections.map(([id, Icon, label, sub]) => <button key={id} className={'settings-nav-item ' + (tab === id ? 'active' : '')} onClick={() => { setTab(id); setNotice(null); }}><Icon /><span><b>{label}</b><small>{sub}</small></span></button>)}
        <div className="settings-account-mini"><div className="settings-avatar">{me.name?.[0]?.toUpperCase()}</div><span><b>{me.name}</b><small>{me.email}</small></span></div>
      </aside>
      <main className="settings-content">
        {notice && <div className={'settings-notice ' + notice.type} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.type === 'success' ? <MdCheckCircle /> : <MdShield />}{notice.text}</div>}
        {tab === 'account' && <section className="settings-panel card"><PanelHeading eyebrow="YOUR PROFILE" title="Account details" text="Keep your name and email address up to date." />
          <form className="settings-form" onSubmit={saveAccount}><label className="settings-field"><span>Display name</span><input autoComplete="name" maxLength={60} value={account.name} onChange={e => setAccount({ ...account, name: e.target.value })} required /></label>
            <label className="settings-field"><span>Email address</span><input type="email" autoComplete="email" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} required /></label>
            <label className="settings-field"><span>Confirm with your password</span><input type="password" autoComplete="current-password" value={account.currentPassword} onChange={e => setAccount({ ...account, currentPassword: e.target.value })} required /><small>We ask for your current password before changing account details.</small></label>
            <div className="settings-actions"><button className="primary" disabled={saving === 'account'}>{saving === 'account' ? 'Saving…' : 'Save account details'}</button></div>
          </form>
          <div className="settings-info-row"><span><b>Member since</b><small>Your KushuraConnect account was created on this date.</small></span><time>{new Date(me.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</time></div>
        </section>}

        {tab === 'privacy' && <section className="settings-panel card"><PanelHeading eyebrow="WHO CAN SEE YOU" title="Privacy and discovery" text="Control how your profile appears to other people." />
          <div className="settings-choice"><label htmlFor="profile-visibility"><span><b>Profile visibility</b><small>Choose who can open your profile and browse its details.</small></span><select id="profile-visibility" value={prefs.profileVisibility} disabled={!!saving} onChange={e => savePreference('profileVisibility', e.target.value)}><option value="everyone">Everyone</option><option value="friends">Friends only</option></select></label></div>
          <PreferenceRow title="Show me in search and suggestions" description="Let people find your profile in member search and friend suggestions." checked={prefs.discoverable} busy={saving === 'discoverable'} onChange={v => savePreference('discoverable', v)} />
          <PreferenceRow title="Accept friend requests" description="Allow other members to send you a friend request." checked={prefs.allowFriendRequests} busy={saving === 'allowFriendRequests'} onChange={v => savePreference('allowFriendRequests', v)} />
          <div className="settings-callout"><MdShield /><span>Public posts can still appear in feeds and search even when your profile is set to friends only. Choose the audience for each post when you share it.</span></div>
        </section>}

        {tab === 'notifications' && <section className="settings-panel card"><PanelHeading eyebrow="STAY IN THE LOOP" title="Notification preferences" text="Choose which activity can send you an in-app notification." />
          <PreferenceRow title="Friend activity" description="Friend requests and accepted requests." checked={prefs.notificationPreferences.friendRequests} busy={saving === 'notificationPreferences.friendRequests'} onChange={v => savePreference('notificationPreferences.friendRequests', v)} />
          <PreferenceRow title="Post activity" description="Reactions, comments, replies and shares on your posts." checked={prefs.notificationPreferences.postActivity} busy={saving === 'notificationPreferences.postActivity'} onChange={v => savePreference('notificationPreferences.postActivity', v)} />
          <PreferenceRow title="Groups and pages" description="Group joins, admin changes, group posts and page follows." checked={prefs.notificationPreferences.communityActivity} busy={saving === 'notificationPreferences.communityActivity'} onChange={v => savePreference('notificationPreferences.communityActivity', v)} />
          <div className="settings-callout"><MdNotificationsNone /><span>Messages remain available in Messenger. These choices only control in-app activity notifications.</span></div>
        </section>}

        {tab === 'security' && <section className="settings-panel card"><PanelHeading eyebrow="PROTECT YOUR ACCOUNT" title="Change password" text="Choose a password you do not use on other sites." />
          <form className="settings-form" onSubmit={savePassword}><label className="settings-field"><span>Current password</span><input type="password" autoComplete="current-password" value={password.currentPassword} onChange={e => setPassword({ ...password, currentPassword: e.target.value })} required /></label>
            <label className="settings-field"><span>New password</span><input type="password" autoComplete="new-password" minLength={8} value={password.newPassword} onChange={e => setPassword({ ...password, newPassword: e.target.value })} required /><small>Use at least 8 characters.</small></label>
            <label className="settings-field"><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength={8} value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} required /></label>
            <div className="settings-actions"><button className="primary" disabled={saving === 'password'}>{saving === 'password' ? 'Updating…' : 'Update password'}</button></div>
          </form><div className="settings-callout"><MdLockOutline /><span>You’ll need your current password to make this change.</span></div>
        </section>}

        {tab === 'appearance' && <section className="settings-panel card"><PanelHeading eyebrow="MAKE IT YOURS" title="Appearance" text="Pick a comfortable display for this device." />
          <div className="theme-options"><ThemeOption title="Light" description="Bright and airy" active={!dark} onClick={() => setDark(false)} sample="light" /><ThemeOption title="Dark" description="Easy on the eyes" active={dark} onClick={() => setDark(true)} sample="dark" /></div>
          <PreferenceRow title="Reaction sounds" description="Play a short, soft tone when you react to a post. Sounds are only played after your tap or click." checked={reactionSounds} busy={false} onChange={value => { setReactionSounds(value); localStorage.setItem('kc-reaction-sounds', value ? 'on' : 'off'); }} />
          <div className="settings-callout"><MdDarkMode /><span>Your appearance choice is saved in this browser and does not affect your account on other devices.</span></div>
        </section>}

        {tab === 'data' && <section className="settings-panel card"><PanelHeading eyebrow="YOUR INFORMATION" title="Your data and account" text="Take a copy of your information or permanently remove your account." />
          <div className="data-action"><span className="data-action-icon"><MdDownload /></span><span className="data-action-copy"><b>Download your information</b><small>Export your profile, posts, stories, messages, listings and community data as a JSON file.</small></span><button disabled={saving === 'export'} onClick={exportData}>{saving === 'export' ? 'Preparing…' : 'Download data'}</button></div>
          <div className="danger-zone"><div><h3>Delete account</h3><p>This permanently removes your profile and associated content. This action cannot be undone.</p></div><button className="danger" onClick={() => { setDeleteOpen(true); setNotice(null); }}>Delete account</button></div>
        </section>}
      </main>
    </div>
    {deleteOpen && <Modal title="Permanently delete your account?" onClose={() => setDeleteOpen(false)}><form className="settings-form" onSubmit={deleteAccount}>
      <p className="muted">Your profile, posts, messages, stories, listings and associated content will be deleted. There is no way to undo this.</p>
      <label className="settings-field"><span>Type DELETE to confirm</span><input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} required /></label>
      <label className="settings-field"><span>Your password</span><input type="password" autoComplete="current-password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} required /></label>
      {notice?.type === 'error' && <div className="settings-notice error">{notice.text}</div>}
      <button className="danger block" disabled={deleteConfirm !== 'DELETE' || !deletePassword || saving === 'delete'}>{saving === 'delete' ? 'Deleting…' : 'Delete my account permanently'}</button>
    </form></Modal>}
  </div>;
}

function PanelHeading({ eyebrow, title, text }) { return <header className="settings-panel-heading"><span>{eyebrow}</span><h2>{title}</h2><p>{text}</p></header>; }
function PreferenceRow({ title, description, checked, busy, onChange }) { return <label className="settings-preference"><span><b>{title}</b><small>{description}</small></span><input className="switch" type="checkbox" checked={!!checked} disabled={busy} onChange={e => onChange(e.target.checked)} /><span className="saving-label">{busy ? 'Saving…' : ''}</span></label>; }
function ThemeOption({ title, description, active, onClick, sample }) { return <button className={'theme-option ' + (active ? 'active' : '')} onClick={onClick}><span className={'theme-preview ' + sample}><i /><i /><i /></span><span className="theme-option-copy"><b>{title}</b><small>{description}</small></span><span className="theme-radio">{active && <i />}</span></button>; }
