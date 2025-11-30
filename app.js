/* app.js - Outrider Circle local-first UI with Supabase-ready hooks */

// ------------- CONFIG --------------
const ENABLE_SUPABASE = false; // flip later when you add real backend
const SUPABASE_URL = "";       // set in GitHub secrets or config when ready
const SUPABASE_KEY = "";       // set in GitHub secrets or config when ready

// If you enable supabase later, uncomment and install:
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ------------- STATE --------------
const CHANNELS = {
  general: { name: "general", messages: [] },
  "threat-level-updates": { name: "threat-level-updates", messages: [] },
  "gear-and-tools": { name: "gear-and-tools", messages: [] },
  "intel-drops": { name: "intel-drops", messages: [] }
};

let currentChannel = "general";
let username = null;
let presence = [];

// ------------- DOM ----------
// main areas
const splash = document.getElementById('splash');
const appEl = document.getElementById('app');
const channelListEl = document.getElementById('channelList');
const messagesEl = document.getElementById('messages');
const presenceEl = document.getElementById('presenceList');
const currentChannelEl = document.getElementById('currentChannel');

// auth UI
const openJoin = document.getElementById('openJoin');
const modal = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const joinView = document.getElementById('joinView');
const adminView = document.getElementById('adminView');
const joinSubmit = document.getElementById('joinSubmit');
const joinLocal = document.getElementById('joinLocal');
const displayNameInput = document.getElementById('displayName');
const inviteInput = document.getElementById('inviteCode');
const emailInput = document.getElementById('emailInput');

const signOutBtn = document.getElementById('signOutBtn');
const signedInBox = document.getElementById('signedIn');
const signedOutBox = document.getElementById('signedOut');
const whoName = document.getElementById('whoName');

// admin UI
const openAdmin = document.getElementById('openAdmin');
const genInvite = document.getElementById('genInvite');
const lastInvite = document.getElementById('lastInvite');
const pendingRequests = document.getElementById('pendingRequests');
const memberList = document.getElementById('memberList');

// chat composer
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

// ------------- UTIL --------------
function showSplash(ms=1400){
  splash.classList.remove('hidden');
  appEl.classList.add('hidden');
  setTimeout(()=>{ splash.classList.add('hidden'); appEl.classList.remove('hidden') }, ms);
}
function renderChannels(){
  channelListEl.innerHTML = '';
  Object.keys(CHANNELS).forEach(k=>{
    const li = document.createElement('li');
    li.textContent = `# ${k}`;
    li.dataset.channel = k;
    if(k===currentChannel) li.classList.add('active');
    li.onclick = ()=>{ switchChannel(k); };
    channelListEl.appendChild(li);
  });
}
function switchChannel(ch){
  currentChannel = ch;
  currentChannelEl.textContent = `#${ch}`;
  document.querySelectorAll('.channel-list li').forEach(n=>n.classList.remove('active'));
  const selected = document.querySelector(`li[data-channel="${ch}"]`);
  if(selected) selected.classList.add('active');
  renderMessages(CHANNELS[ch].messages);
}
function renderMessages(arr){
  messagesEl.innerHTML = '';
  arr.forEach(m=>{
    const div = document.createElement('div');
    div.className = 'message';
    if(m.system) { div.textContent = m.text; div.style.fontStyle='italic'; }
    else {
      div.innerHTML = `<div class="meta">${m.username} • ${new Date(m.time).toLocaleTimeString()}</div><div class="body">${escapeHtml(m.text)}</div>`;
    }
    messagesEl.appendChild(div);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function updatePresence(){
  presenceEl.innerHTML = '';
  presence.forEach(p=>{
    const li = document.createElement('li');
    li.textContent = p;
    presenceEl.appendChild(li);
  });
}
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ------------- AUTH HANDLERS --------------
openJoin.onclick = ()=>{ modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); joinView.classList.remove('hidden'); adminView.classList.add('hidden'); }
modalClose.onclick = ()=>{ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

joinLocal.onclick = ()=>{
  const name = (displayNameInput.value || 'Outrider-' + Math.floor(Math.random()*999)).trim();
  username = name;
  finishLoginLocal();
};

joinSubmit.onclick = ()=>{
  // local request path: record request in pending list for admin to accept
  const name = (displayNameInput.value || '').trim();
  const email = (emailInput.value || '').trim();
  const inv = (inviteInput.value || '').trim();
  if(!name && !email) return alert('Please provide a display name or email.');
  // If invite provided, auto accept locally for now
  if(inv){
    username = name || 'Outrider-' + Math.floor(Math.random()*999);
    finishLoginLocal();
    // optionally mark invite consumed in admin list (local)
    addMember({username, email, invite:inv});
    return;
  }
  // store a pending request (local storage for now)
  addPendingRequest({name,email,time:Date.now()});
  alert('Request submitted. Admin will review and invite you.');
  modal.classList.add('hidden');
};

function finishLoginLocal(){
  signedOutBox.classList.add('hidden');
  signedInBox.classList.remove('hidden');
  whoName.textContent = username;
  modal.classList.add('hidden');
  if(!presence.includes(username)) presence.push(username);
  updatePresence();
  renderChannels();
  switchChannel(currentChannel);
  renderMembers();
}

// sign out
signOutBtn.onclick = ()=>{
  if(username){
    presence = presence.filter(p=>p!==username);
  }
  username = null;
  signedOutBox.classList.remove('hidden');
  signedInBox.classList.add('hidden');
  whoName.textContent = '';
  updatePresence();
}

// ------------- ADMIN (local) --------------
function addPendingRequest(req){
  const id = 'r'+Math.floor(Math.random()*999999);
  const data = JSON.parse(localStorage.getItem('pending')||'{}');
  data[id] = req;
  localStorage.setItem('pending', JSON.stringify(data));
  renderPending();
}
function renderPending(){
  pendingRequests.innerHTML = '';
  const data = JSON.parse(localStorage.getItem('pending')||'{}');
  Object.keys(data).forEach(k=>{
    const li = document.createElement('li');
    const v = data[k];
    li.innerHTML = `${v.name||'(no name)'} — ${v.email||''} <button data-id="${k}" class="btn btn-outline small accept">Accept</button> <button data-id="${k}" class="btn btn-outline small remove">Remove</button>`;
    pendingRequests.appendChild(li);
  });
  // wire buttons
  document.querySelectorAll('.accept').forEach(b=>{
    b.onclick = (e)=>{ const id=b.dataset.id; acceptPending(id); };
  });
  document.querySelectorAll('.remove').forEach(b=>{
    b.onclick = (e)=>{ const id=b.dataset.id; removePending(id); };
  });
}
function acceptPending(id){
  const data = JSON.parse(localStorage.getItem('pending')||'{}');
  if(!data[id]) return;
  const u = data[id];
  // generate invite token (local single-use)
  const token = generateInvite();
  // create member record
  addMember({username:u.name, email:u.email, invite:token});
  delete data[id];
  localStorage.setItem('pending', JSON.stringify(data));
  renderPending();
  alert('Invite created: ' + token + ' — send it to the member.');
}
function removePending(id){
  const data = JSON.parse(localStorage.getItem('pending')||'{}');
  delete data[id];
  localStorage.setItem('pending', JSON.stringify(data));
  renderPending();
}
function generateInvite(){
  const token = 'INV-'+Math.random().toString(36).substr(2,8).toUpperCase();
  const invites = JSON.parse(localStorage.getItem('invites')||'{}');
  invites[token] = {created:Date.now(), used:false};
  localStorage.setItem('invites', JSON.stringify(invites));
  lastInvite.textContent = token;
  return token;
}
genInvite.onclick = ()=>{ const t = generateInvite(); alert('Invite: '+t); }

function addMember(m){
  const members = JSON.parse(localStorage.getItem('members')||'[]');
  members.push(m);
  localStorage.setItem('members', JSON.stringify(members));
  renderMembers();
}
function renderMembers(){
  memberList.innerHTML = '';
  const members = JSON.parse(localStorage.getItem('members')||'[]');
  members.forEach(m=>{
    const li = document.createElement('li');
    li.textContent = (m.username || '(no name)') + (m.email? ' • ' + m.email : '');
    memberList.appendChild(li);
  });
}

// open admin
openAdmin.onclick = ()=>{
  modal.classList.remove('hidden');
  adminView.classList.remove('hidden');
  joinView.classList.add('hidden');
  renderPending();
  renderMembers();
};

// ------------- CHAT (local) --------------
sendBtn.onclick = ()=>{
  const text = msgInput.value.trim();
  if(!text) return;
  const msg = { username: username || 'Anon', text, time: Date.now() };
  CHANNELS[currentChannel].messages.push(msg);
  renderMessages(CHANNELS[currentChannel].messages);
  msgInput.value = '';
};

// ------------- BOOT --------------
function boot(){
  // show splash and then app
  showSplash(900);
  renderChannels();
  switchChannel('general');

  // preseed starter content
  CHANNELS.general.messages.push({system:true, text:"Welcome to The Outrider Circle. This client is local-first — messages are currently stored only on-device."});
  CHANNELS['threat-level-updates'].messages.push({system:true, text:"Threat feed will appear here when enabled."});
  renderMessages(CHANNELS.general.messages);
  // load local invites/members
  renderPending();
  renderMembers();
}
boot();

/* ------------- SUPABASE NOTES -------------
When you're ready to flip to a real backend:

1) create a Supabase project (free).
2) add a table 'messages' with columns: id, channel, username, text, inserted_at
3) add a table 'channels' and 'members' and 'invites' (or use auth)
4) Install @supabase/supabase-js and replace local push/pull with real calls:
   const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
   // to insert message:
   await supabase.from('messages').insert({channel: currentChannel, username, text});
   // to subscribe:
   supabase.from('messages:channel=eq.'+currentChannel).on('INSERT', payload => { ... }).subscribe();

5) Use Supabase Realtime or Postgres replication for live events.
------------------------------------------- */
