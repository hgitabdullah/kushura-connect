import api from './api';
export const REACTIONS = {
  like: { emoji: '👍', label: 'Like', color: '#1877f2' }, love: { emoji: '❤️', label: 'Love', color: '#f33e58' },
  haha: { emoji: '😆', label: 'Haha', color: '#f7b125' }, wow: { emoji: '😮', label: 'Wow', color: '#f7b125' },
  sad: { emoji: '😢', label: 'Sad', color: '#f7b125' }, angry: { emoji: '😡', label: 'Angry', color: '#e9710f' },
};
export const EMOJIS = '😀 😂 😍 🥰 😎 🤩 😢 😡 👍 👏 🙏 🔥 🎉 ❤️ 💯 ✨ 😮 🤔 😴 🥳 🍕 ☕ 🌍 🚀'.split(' ');
export function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'Just now'; if (s < 3600) return Math.floor(s / 60) + 'm'; if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 604800) return Math.floor(s / 86400) + 'd';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: new Date(d).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}
export async function uploadFiles(files) {
  const fd = new FormData(); [...files].forEach(f => fd.append('files', f));
  const { data } = await api.post('/upload', fd); return data.files;
}
export const errMsg = e => e?.response?.data?.error || e?.message || 'Something went wrong';
export const PRIVACY = { public: 'Public', friends: 'Friends', only_me: 'Only me' };
