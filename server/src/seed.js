import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Post from './models/Post.js';
import Story from './models/Story.js';
import Group from './models/Group.js';
import Page from './models/Page.js';
import Listing from './models/Listing.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';
const pic = (s, w = 900, h = 600) => `https://picsum.photos/seed/${s}/${w}/${h}`;
const ago = h => new Date(Date.now() - h * 36e5);
export async function seed({ force = false } = {}) {
  if (!force && await User.exists({ email: 'demo@socialbook.com' })) return;
  console.log('Seeding demo data...');
  const pw = await bcrypt.hash('demo123', 10);
  const people = [
    ['Alex Morgan', 'demo@socialbook.com', 12, 'Frontend developer @ KushuraConnect', 'Dhaka, Bangladesh', 'BSc CSE, BUET', 'Single'],
    ['Sara Ahmed', 'sara@socialbook.com', 5, 'UX Designer at Pixel Studio', 'Chittagong', 'North South University', 'Married'],
    ['Rahim Khan', 'rahim@socialbook.com', 13, 'Backend engineer', 'Dhaka', 'Dhaka University', 'In a relationship'],
    ['Emily Chen', 'emily@socialbook.com', 9, 'Photographer', 'Singapore', 'NUS', 'Single'],
    ['David Miller', 'david@socialbook.com', 15, 'Product Manager at Cloudly', 'London, UK', 'Oxford', 'Married'],
    ['Nadia Islam', 'nadia@socialbook.com', 20, 'Data scientist', 'Sylhet', 'SUST', 'Single'],
    ['Lucas Silva', 'lucas@socialbook.com', 33, 'Travel blogger', 'Lisbon, Portugal', 'Univ. of Lisbon', 'Single'],
    ['Priya Sharma', 'priya@socialbook.com', 44, 'Chef & food writer', 'Mumbai, India', 'IHM Mumbai', 'Engaged'],
  ];
  const u = [];
  for (const [i, [name, email, img, work, location, education, relationship]] of people.entries())
    u.push(await User.create({ name, email, password: pw, avatar: `https://i.pravatar.cc/300?img=${img}`, cover: pic('cover' + i, 1600, 500), work, location, education, relationship,
      hometown: location.split(',')[0], bio: ['Coffee, code and good company ☕', 'Designing delightful things ✨', 'APIs all day 🚀', 'Chasing light 📷', 'Building products people love', 'Numbers tell stories 📊', 'Wanderlust 🌍', 'Cooking is love made visible 🍛'][i] }));
  const [demo, sara, rahim, emily, david, nadia, lucas, priya] = u;
  const fr = [[demo, sara], [demo, rahim], [demo, emily], [demo, david], [demo, nadia], [sara, rahim], [sara, emily], [rahim, nadia], [emily, lucas], [david, priya], [nadia, priya], [lucas, priya], [sara, lucas]];
  for (const [a, b] of fr) { a.friends.push(b._id); b.friends.push(a._id); }
  demo.requests.push(priya._id); // pending request to demo
  await Promise.all(u.map(x => x.save()));
  const R = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
  const react = (ids, bias = 0) => ids.map((x, i) => ({ user: x._id, type: R[(i + bias) % 3 === 0 ? 1 : (i + bias) % 5 === 0 ? 2 : 0] }));
  const P = [
    [sara, 'Just wrapped up a new design system for our app. Clean, accessible, and dark-mode ready! 🎨', [pic('design1'), pic('design2')], 'public', 3],
    [rahim, 'Hot take: write the tests first. Your future self will thank you. 🧪', [], 'public', 5],
    [emily, 'Golden hour at Marina Bay 🌅', [pic('marina'), pic('city2'), pic('city3')], 'public', 8],
    [david, 'We just shipped v2.0! Huge thanks to the team for months of hard work. 🚀', [pic('launch')], 'friends', 12],
    [nadia, 'Finished my first Kaggle competition — top 10%! 📈', [], 'friends', 20],
    [demo, 'Learning React has been such a fun journey. Next stop: building my own social network! 💙', [pic('react')], 'public', 26],
    [lucas, 'Lisbon streets never get old 🇵🇹', [pic('lisbon1'), pic('lisbon2'), pic('lisbon3'), pic('lisbon4')], 'public', 30],
    [priya, 'Homemade biryani for Sunday lunch. Recipe in comments! 🍛', [pic('biryani')], 'public', 40],
    [demo, 'Anyone up for a weekend hiking trip? ⛰️', [], 'friends', 50],
    [sara, 'Coffee + Figma = perfect morning ☕', [], 'friends', 60],
  ];
  const posts = [];
  for (const [i, [a, text, images, privacy, h]] of P.entries()) {
    const others = u.filter(x => x !== a);
    posts.push(await Post.create({ author: a._id, text, images, privacy, createdAt: ago(h), reactions: react(others.slice(0, 2 + (i % 6)), i),
      comments: [{ author: others[0]._id, text: ['Love this! 😍', 'So true!', 'Amazing 🔥', 'Congrats!!', 'Wow, well done!'][i % 5], likes: [others[1]._id],
        replies: [{ author: a._id, text: 'Thank you! 🙏', likes: [others[0]._id] }] }, { author: others[2]._id, text: ['Great work', 'Agreed 💯', 'Beautiful shot', 'Can\u2019t wait to try it'][i % 4] }] }));
  }
  posts.push(await Post.create({ author: emily._id, text: 'Some calm for your feed 🌸', video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', privacy: 'public', createdAt: ago(4), reactions: react([demo, sara, lucas]) }));
  posts.push(await Post.create({ author: lucas._id, text: 'Classic animation night 🐰', video: 'https://www.w3schools.com/html/mov_bbb.mp4', privacy: 'public', createdAt: ago(15), reactions: react([demo, priya]) }));
  posts.push(await Post.create({ author: rahim._id, text: 'This is gorgeous 👇', sharedFrom: posts[2]._id, privacy: 'public', createdAt: ago(7) }));
  posts[2].shares = 1; await posts[2].save();
  demo.saved.push(posts[2]._id, posts[7]._id); await demo.save();
  const groups = await Group.create([
    { name: 'React Developers Bangladesh', description: 'Share tips, jobs and projects about React & the MERN stack.', cover: pic('reactgroup', 1600, 500), owner: demo._id, admins: [demo._id, rahim._id], members: [demo._id, rahim._id, sara._id, nadia._id] },
    { name: 'Travel Photography', description: 'Show us your best travel shots 📸', cover: pic('travelgroup', 1600, 500), owner: emily._id, admins: [emily._id], members: [emily._id, lucas._id, sara._id] },
    { name: 'Home Cooks Club', description: 'Recipes, tips and kitchen wins.', cover: pic('cook', 1600, 500), owner: priya._id, admins: [priya._id], members: [priya._id, nadia._id, david._id], privacy: 'private' },
  ]);
  await Post.create([{ author: rahim._id, group: groups[0]._id, privacy: 'public', text: 'Who\u2019s using React 19 Server Components in production yet?', createdAt: ago(3), reactions: react([demo, sara]) },
    { author: demo._id, group: groups[0]._id, privacy: 'public', text: 'Sharing my KushuraConnect progress — feedback welcome!', images: [pic('mern')], createdAt: ago(9) },
    { author: lucas._id, group: groups[1]._id, privacy: 'public', text: 'Sintra at sunrise', images: [pic('sintra')], createdAt: ago(18) }]);
  const pages = await Page.create([
    { name: 'KushuraConnect', category: 'Community', description: 'Updates and stories from the KushuraConnect community.', avatar: pic('kushuraconnect', 300, 300), cover: pic('kc-cover', 1600, 500), owner: demo._id, followers: [demo._id, sara._id, rahim._id] },
    { name: 'Daily Food Pics', category: 'Food & Beverage', description: 'Mouth-watering food every day.', avatar: pic('food', 300, 300), cover: pic('foodcover', 1600, 500), owner: priya._id, followers: [priya._id, demo._id, nadia._id] },
    { name: 'Wander Earth', category: 'Travel', description: 'Explore the world with us.', avatar: pic('earth', 300, 300), cover: pic('earthcover', 1600, 500), owner: lucas._id, followers: [lucas._id, emily._id] },
  ]);
  await Post.create([{ author: demo._id, page: pages[0]._id, privacy: 'public', text: 'Welcome to KushuraConnect! We\u2019ll post updates here. 🎉', createdAt: ago(6) },
    { author: priya._id, page: pages[1]._id, privacy: 'public', text: 'Today\u2019s special: mango lassi 🥭', images: [pic('lassi')], createdAt: ago(10), reactions: react([demo, nadia]) }]);
  await Story.create([sara, emily, rahim, lucas, nadia, demo].map((x, i) => ({ author: x._id, image: i % 3 === 2 ? undefined : pic('story' + i, 540, 960), text: i % 3 === 2 ? ['Ship it! 🚀', 'Weekend vibes ✌️'][i % 2] : undefined, bg: ['#1877f2', '#e41e3f', '#42b72a'][i % 3], createdAt: ago(i + 1), viewers: i === 5 ? [sara._id, rahim._id] : [] })));
  await Listing.create([
    { seller: sara._id, title: 'MacBook Pro 14" M3', price: 1450, category: 'Electronics', condition: 'Used - Like new', location: 'Chittagong', description: '16GB RAM, 512GB SSD. Barely used, with box.', images: [pic('macbook'), pic('macbook2')] },
    { seller: rahim._id, title: 'Mountain bike', price: 320, category: 'Sports', condition: 'Used - Good', location: 'Dhaka', description: '21-speed, recently serviced.', images: [pic('bike')] },
    { seller: emily._id, title: 'Canon 50mm f/1.8 lens', price: 110, category: 'Electronics', condition: 'Used - Good', location: 'Singapore', images: [pic('lens')] },
    { seller: priya._id, title: 'Cast iron skillet set', price: 45, category: 'Home & Kitchen', condition: 'New', location: 'Mumbai', images: [pic('skillet')] },
    { seller: david._id, title: 'Standing desk', price: 260, category: 'Furniture', condition: 'Used - Like new', location: 'London', images: [pic('desk')] },
    { seller: lucas._id, title: 'Travel backpack 40L', price: 75, category: 'Clothing & Accessories', condition: 'New', location: 'Lisbon', images: [pic('backpack')] },
  ]);
  await Message.create([{ from: sara._id, to: demo._id, text: 'Hey Alex! Are you coming to the meetup?', createdAt: ago(2), read: true },
    { from: demo._id, to: sara._id, text: 'Yes! See you there 🙌', createdAt: ago(1.9), read: true },
    { from: rahim._id, to: demo._id, text: 'Check the PR when you get a chance', createdAt: ago(0.5) }]);
  await Notification.create([{ user: demo._id, from: priya._id, type: 'request', link: `/profile/${priya._id}` },
    { user: demo._id, from: sara._id, type: 'react', text: 'love', post: posts[5]._id, link: `/post/${posts[5]._id}` },
    { user: demo._id, from: rahim._id, type: 'comment', post: posts[5]._id, link: `/post/${posts[5]._id}` }]);
  console.log('Seeded: demo@socialbook.com / demo123');
}
