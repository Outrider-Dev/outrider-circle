// Simple local chat app (no server) - channels stored in local state
const channels = {
  general: { name: 'general', messages: [] },
  intel: { name: 'threat-level-updates', messages: [] },
  gear: { name: 'gear-and-tools', messages: [] },
  'intel-drops': { name: 'intel-drops', messages: [] }
};
let currentChannel = 'general';
let username = null;

const channelListEl = document.getElementById('channelList');
const messagesEl = document.getElementById('messages');
const presenceEl = document.getElementById('presenceList');
const currentChannelEl = document.getElementById('currentChannel');

const usernameInput = document.getElementById('username');
const joinBtn = document.getElementById('joinBtn');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

function loadChannels(){
  channelListEl.innerHTML = '';
  Object.keys(channels).forEach(c => {
    const li = document.createElement('li');
    li.textContent = `# ${c}`;
    li.dataset.channel = c;
    li.onclick = () => switchChannel(c, li);
    if(c === currentChannel) li.classList.add('active');
    channelListEl.appendChild(li);
  });
}
function switchChannel(name, el){
  currentChannel = name;
  document.querySelectorAll('.channels li').forEach(i=>i.classList.remove('active'));
  if(el) el.classList.add('active');
  currentChannelEl.textContent = `#${name}`;
  renderMessages(channels[name].messages);
}
function renderMessages(messages){
  messagesEl.innerHTML = '';
  messages.forEach(m => {
    const div = document.createElement('div');
    div.className = 'message';
    if(m.system){ div.textContent = m.text; div.style.fontStyle = 'italic'; }
    else {
      div.innerHTML = `<div class="meta">${m.username} • ${new Date(m.time).toLocaleTimeString()}</div><div class="body">${escapeHtml(m.text)}</div>`;
    }
    messagesEl.appendChild(div);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

joinBtn.onclick = () => {
  const name = usernameInput.value.trim();
  if(!name) return alert('Enter a display name');
  username = name;
  document.querySelector('.join').style.display = 'none';
  presenceEl.innerHTML = `<li>${username}</li>`;
  renderMessages(channels[currentChannel].messages);
};

sendBtn.onclick = () => {
  const text = msgInput.value.trim();
  if(!text || !username) return;
  const msg = { username, text, time: Date.now() };
  channels[currentChannel].messages.push(msg);
  renderMessages(channels[currentChannel].messages);
  msgInput.value = '';
};