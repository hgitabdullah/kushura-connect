// Run with the API up: node test/api.test.js   (API_URL defaults to http://localhost:5000)
import { io } from 'socket.io-client';
const B = process.env.API_URL || 'http://localhost:5000';
let pass = 0, fail = 0;
async function call(method, path, body, token) {
  const r = await fetch(B + '/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) }, body: body && JSON.stringify(body) });
  return { status: r.status, data: await r.json().catch(() => null) };
}
async function t(name, fn) { try { await fn(); pass++; console.log('  \u2714', name); } catch (e) { fail++; console.log('  \u2718', name, '-', e.message); } }
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const rnd = Math.random().toString(36).slice(2, 8);
let A, Bt, aId, bId, post, group;
await t('register validation rejects short password', async () => { const r = await call('POST', '/auth/register', { name: 'x', email: `x${rnd}@t.io`, password: '1' }); ok(r.status === 400); });
await t('register user A', async () => { const r = await call('POST', '/auth/register', { name: 'Tester A', email: `a${rnd}@t.io`, password: 'secret1' }); ok(r.status === 201 && r.data.token); A = r.data.token; aId = r.data.user._id; });
await t('register user B', async () => { const r = await call('POST', '/auth/register', { name: 'Tester B', email: `b${rnd}@t.io`, password: 'secret1' }); ok(r.status === 201); Bt = r.data.token; bId = r.data.user._id; });
await t('demo login works', async () => { const r = await call('POST', '/auth/login', { email: 'demo@socialbook.com', password: 'demo123' }); ok(r.status === 200 && r.data.token); });
await t('wrong password rejected', async () => { ok((await call('POST', '/auth/login', { email: 'demo@socialbook.com', password: 'nope' })).status === 400); });
await t('auth required', async () => { ok((await call('GET', '/users/me')).status === 401); });
await t('friend request + accept', async () => { ok((await call('POST', `/users/${bId}/request`, {}, A)).status === 200); ok((await call('POST', `/users/${aId}/accept`, {}, Bt)).status === 200);
  const me = await call('GET', '/users/me', null, A); ok(me.data.friends.some(f => f._id === bId)); });
await t('suggestions returns list', async () => { const r = await call('GET', '/users/suggestions', null, A); ok(Array.isArray(r.data)); });
await t('create post with multiple images', async () => { const r = await call('POST', '/posts', { text: `hello ${rnd}`, images: ['https://picsum.photos/1', 'https://picsum.photos/2'], privacy: 'friends' }, A); ok(r.status === 201 && r.data.images.length === 2); post = r.data; });
await t('empty post rejected', async () => { ok((await call('POST', '/posts', { text: ' ' }, A)).status === 400); });
await t('react love + switch to haha', async () => { let r = await call('POST', `/posts/${post._id}/react`, { type: 'love' }, Bt); ok(r.data.reactions[0].type === 'love');
  r = await call('POST', `/posts/${post._id}/react`, { type: 'haha' }, Bt); ok(r.data.reactions.length === 1 && r.data.reactions[0].type === 'haha'); });
let cid;
await t('comment + nested reply + comment like', async () => { let r = await call('POST', `/posts/${post._id}/comment`, { text: 'nice' }, Bt); cid = r.data.comments[0]._id;
  r = await call('POST', `/posts/${post._id}/comments/${cid}/reply`, { text: 'thanks' }, A); ok(r.data.comments[0].replies[0].text === 'thanks');
  r = await call('POST', `/posts/${post._id}/comments/${cid}/like`, {}, A); ok(r.data.comments[0].likes.length === 1); });
await t('edit post + edit comment', async () => { let r = await call('PUT', `/posts/${post._id}`, { text: 'edited' }, A); ok(r.data.text === 'edited');
  r = await call('PUT', `/posts/${post._id}/comments/${cid}`, { text: 'very nice' }, Bt); ok(r.data.comments[0].text === 'very nice');
  ok((await call('PUT', `/posts/${post._id}`, { text: 'hack' }, Bt)).status === 403); });
await t('share + save post', async () => { let r = await call('POST', `/posts/${post._id}/share`, { text: 'look' }, Bt); ok(r.status === 201 && r.data.sharedFrom._id === post._id);
  r = await call('POST', `/posts/${post._id}/save`, {}, Bt); ok(r.data.saved); r = await call('GET', '/users/me/saved', null, Bt); ok(r.data.length === 1); });
await t('privacy: only_me hidden from friend', async () => { const p = await call('POST', '/posts', { text: 'secret', privacy: 'only_me' }, A); ok((await call('GET', `/posts/${p.data._id}`, null, Bt)).status === 404); });
await t('feed contains post', async () => { const r = await call('GET', '/posts/feed', null, Bt); ok(r.data.some(p => p._id === post._id)); });
await t('group create, join, post, admin', async () => { let r = await call('POST', '/groups', { name: `Group ${rnd}`, description: 'd' }, A); group = r.data; ok(group.isAdmin);
  r = await call('POST', `/groups/${group._id}/join`, {}, Bt); ok(r.data.isMember);
  r = await call('POST', '/posts', { text: 'in group', group: group._id }, Bt); ok(r.status === 201);
  r = await call('POST', `/groups/${group._id}/admins/${bId}`, {}, A); ok(r.data.admins.some(a => a._id === bId));
  r = await call('GET', `/groups/${group._id}/posts`, null, A); ok(r.data.length === 1); });
await t('page create, follow, post', async () => { let r = await call('POST', '/pages', { name: `Page ${rnd}`, category: 'Tech' }, A); const pg = r.data;
  r = await call('POST', `/pages/${pg._id}/follow`, {}, Bt); ok(r.data.isFollowing); r = await call('POST', '/posts', { text: 'page post', page: pg._id }, A); ok(r.status === 201); });
await t('story create + view', async () => { const r = await call('POST', '/stories', { text: 'my story' }, A); ok(r.status === 201);
  await call('POST', `/stories/${r.data._id}/view`, {}, Bt); const l = await call('GET', '/stories', null, A); const mine = l.data.find(g => g.user._id === aId); ok(mine.stories[0].viewers.length === 1); });
await t('global search', async () => { const r = await call('GET', `/search?q=${rnd}`, null, A); ok(r.data.groups.length === 1 && r.data.pages.length === 1); const r2 = await call('GET', '/search?q=Sara', null, A); ok(r2.data.people.length >= 1); });
await t('marketplace create + list', async () => { const r = await call('POST', '/market', { title: 'Bike', price: 50 }, A); ok(r.status === 201); ok((await call('GET', '/market', null, A)).data.length >= 1); });
await t('notifications generated', async () => { const r = await call('GET', '/notifications', null, A); const types = r.data.map(n => n.type); ok(['react', 'comment', 'share', 'group_join'].every(x => types.includes(x)), types.join()); });
await t('realtime message via socket + seen', async () => {
  const sock = io(B, { auth: { token: Bt }, transports: ['websocket'] });
  await new Promise((res, rej) => { sock.on('connect', res); sock.on('connect_error', rej); setTimeout(() => rej(new Error('connect timeout')), 5000); });
  const got = new Promise((res, rej) => { sock.on('message', res); setTimeout(() => rej(new Error('no message event')), 5000); });
  await call('POST', `/messages/${bId}`, { text: 'hi via socket', image: '/uploads/x.png' }, A);
  const m = await got; ok(m.text === 'hi via socket' && m.fromUser.name === 'Tester A');
  const conv = await call('GET', '/conversations', null, Bt); ok(conv.data[0].unread === 1);
  await call('GET', `/messages/${aId}`, null, Bt); ok((await call('GET', '/conversations', null, Bt)).data[0].unread === 0);
  sock.close(); });
await t('upload image via multer', async () => {
  const fd = new FormData(); fd.append('files', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')], { type: 'image/png' }), 'a.png');
  const r = await fetch(B + '/api/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + A }, body: fd }); const d = await r.json(); ok(d.urls?.[0]?.startsWith('/uploads/'));
  ok((await fetch(B + d.urls[0])).status === 200); });
await t('unfriend', async () => { await call('DELETE', `/users/${bId}/friend`, null, A); const me = await call('GET', '/users/me', null, A); ok(!me.data.friends.length); });
await t('change password + delete account', async () => { ok((await call('PUT', '/users/me/account', { currentPassword: 'secret1', newPassword: 'secret2' }, Bt)).status === 200);
  ok((await call('POST', '/auth/login', { email: `b${rnd}@t.io`, password: 'secret2' })).status === 200);
  ok((await call('DELETE', '/users/me', { password: 'secret2' }, Bt)).status === 200); });
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
