import { useState } from 'react';
import { FaUserPlus, FaUserCheck, FaUserTimes, FaUserClock } from 'react-icons/fa';
import api from '../api';
import { useApp } from '../ctx';
import { errMsg } from '../utils';
// status: none | sent | received | friends | self
export default function FriendButton({ id, status: init, onChange, small }) {
  const { reload } = useApp(); const [status, setStatus] = useState(init); const [menu, setMenu] = useState(false);
  const act = async (m, url, next) => { try { await api[m](url); setStatus(next); onChange?.(next); reload(); } catch (e) { alert(errMsg(e)); } setMenu(false); };
  const cls = small ? ' sm' : '';
  if (status === 'self') return null;
  if (status === 'none') return <button className={'primary' + cls} onClick={() => act('post', `/users/${id}/request`, 'sent')}><FaUserPlus /> Add friend</button>;
  if (status === 'sent') return <button className={cls.trim()} onClick={() => act('delete', `/users/${id}/request`, 'none')}><FaUserClock /> Cancel request</button>;
  if (status === 'received') return <span className="row"><button className={'primary' + cls} onClick={() => act('post', `/users/${id}/accept`, 'friends')}>Confirm</button><button className={cls.trim()} onClick={() => act('post', `/users/${id}/decline`, 'none')}>Delete</button></span>;
  return <span className="menu-wrap"><button className={cls.trim()} onClick={() => setMenu(!menu)}><FaUserCheck /> Friends</button>
    {menu && <div className="dropdown card post-menu" onMouseLeave={() => setMenu(false)}><button className="menu-item" onClick={() => confirm('Unfriend?') && act('delete', `/users/${id}/friend`, 'none')}><FaUserTimes /> Unfriend</button></div>}</span>;
}
