import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Story from '../models/Story.js';
import Group from '../models/Group.js';
import Page from '../models/Page.js';
import Listing from '../models/Listing.js';

// Remove a user and the content they own, then remove their references from
// shared content and other users' relationship lists.
export async function deleteUserData(id) {
  const [groups, pages, authored] = await Promise.all([
    Group.find({ owner: id }).select('_id'),
    Page.find({ owner: id }).select('_id'),
    Post.find({ author: id }).select('_id'),
  ]);
  const groupIds = groups.map(x => x._id), pageIds = pages.map(x => x._id);
  const postIds = authored.map(x => x._id);

  await Post.deleteMany({ $or: [{ author: id }, { group: { $in: groupIds } }, { page: { $in: pageIds } }] });
  await Promise.all([
    Group.deleteMany({ _id: { $in: groupIds } }),
    Page.deleteMany({ _id: { $in: pageIds } }),
    Group.updateMany({}, { $pull: { members: id, admins: id } }),
    Page.updateMany({}, { $pull: { followers: id } }),
    Message.deleteMany({ $or: [{ from: id }, { to: id }] }),
    Notification.deleteMany({ $or: [{ user: id }, { from: id }, { post: { $in: postIds } }] }),
    Story.deleteMany({ author: id }),
    Story.updateMany({}, { $pull: { viewers: id } }),
    Listing.deleteMany({ seller: id }),
    User.updateMany({}, { $pull: { friends: id, requests: id, saved: { $in: postIds } } }),
    Post.updateMany({}, { $pull: { likes: id, reactions: { user: id }, comments: { author: id } } }),
    Post.updateMany({}, { $pull: { 'comments.$[].likes': id, 'comments.$[].replies': { author: id } } }),
    Post.updateMany({}, { $pull: { 'comments.$[].replies.$[].likes': id } }),
  ]);
  await User.deleteOne({ _id: id });
}
