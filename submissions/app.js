// LocalStorage Database
const db = {
    getGroups() { return JSON.parse(localStorage.getItem('groups')) || []; },
    setGroups(g) { localStorage.setItem('groups', JSON.stringify(g)); },
    getMembers() { return JSON.parse(localStorage.getItem('members')) || []; },
    setMembers(m) { localStorage.setItem('members', JSON.stringify(m)); },
    getTasks() { return JSON.parse(localStorage.getItem('tasks')) || []; },
    setTasks(t) { localStorage.setItem('tasks', JSON.stringify(t)); }
};

let selectedGroupId = null, selectedAnalyticsGroupId = null;

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupEventListeners();
    loadDashboard();
});

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            showTab(e.target.getAttribute('data-tab'));
        });
    });
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    if (tabName === 'groups') loadGroups();
    else if (tabName === 'tasks') loadTasksTab();
    else if (tabName === 'analytics') loadAnalyticsTab();
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('createGroupForm').addEventListener('submit', createGroup);
    document.getElementById('taskGroupSelect').addEventListener('change', (e) => {
        selectedGroupId = e.target.value ? parseInt(e.target.value) : null;
        document.getElementById('createTaskSection').style.display = selectedGroupId ? 'block' : 'none';
        if (selectedGroupId) {
            loadTasksForGroup(selectedGroupId);
            loadMembersForTaskForm(selectedGroupId);
        }
    });
    document.getElementById('createTaskForm').addEventListener('submit', createTask);
    document.getElementById('analyticsGroupSelect').addEventListener('change', (e) => {
        selectedAnalyticsGroupId = e.target.value ? parseInt(e.target.value) : null;
        if (selectedAnalyticsGroupId) loadAnalytics(selectedAnalyticsGroupId);
    });
    const modal = document.getElementById('membersModal');
    document.querySelector('.close').addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    document.getElementById('addMemberForm').addEventListener('submit', addMember);
}

// Dashboard
function loadDashboard() {
    const groups = db.getGroups(), members = db.getMembers(), tasks = db.getTasks();
    document.getElementById('totalGroups').textContent = groups.length;
    document.getElementById('totalMembers').textContent = members.length;
    document.getElementById('completedTasks').textContent = tasks.filter(t => t.status === 'COMPLETED').length;
    document.getElementById('totalPoints').textContent = members.reduce((s, m) => s + m.totalPoints, 0);
    const container = document.getElementById('recentGroups');
    container.innerHTML = groups.length === 0 ? '<p class="empty">No groups yet</p>' : 
        groups.slice(0, 5).map(g => `<div class="list-item"><div class="list-item-header"><div class="list-item-title">${g.name}</div><div class="list-item-subtitle">${g.memberCount} members • ${g.taskCount} tasks</div></div></div>`).join('');
}

// Groups
function createGroup(e) {
    e.preventDefault();
    const name = document.getElementById('groupName').value;
    if (!name.trim() || db.getGroups().find(g => g.name === name)) { alert(db.getGroups().find(g => g.name === name) ? 'Group exists' : 'Name required'); return; }
    db.getGroups().push({ id: Date.now(), name, description: document.getElementById('groupDescription').value || '', createdAt: new Date().toISOString(), memberCount: 0, taskCount: 0 });
    db.setGroups(db.getGroups());
    alert('✅ Group created!');
    document.getElementById('createGroupForm').reset();
    loadGroups();
    loadGroupSelects();
    loadDashboard();
}

function loadGroups() {
    const groups = db.getGroups();
    const container = document.getElementById('groupsList');
    container.innerHTML = groups.length === 0 ? '<p class="empty">No groups yet!</p>' : 
        groups.map(g => `<div class="list-item"><div class="list-item-header"><div class="list-item-title">${g.name}</div><div class="list-item-subtitle">${g.description || 'No description'}</div><div class="list-item-subtitle">👥 ${g.memberCount} • 📋 ${g.taskCount}</div></div><div class="list-item-actions"><button class="btn btn-primary btn-small" onclick="openMembersModal(${g.id}, '${g.name.replace(/'/g, "\\'")}')">Manage</button><button class="btn btn-danger btn-small" onclick="deleteGroup(${g.id})">Delete</button></div></div>`).join('');
}

function deleteGroup(id) {
    if (!confirm('Delete group?')) return;
    db.setGroups(db.getGroups().filter(g => g.id !== id));
    db.setMembers(db.getMembers().filter(m => m.groupId !== id));
    db.setTasks(db.getTasks().filter(t => t.groupId !== id));
    loadGroups();
    loadGroupSelects();
    loadDashboard();
}

function loadGroupSelects() {
    const groups = db.getGroups();
    ['taskGroupSelect', 'analyticsGroupSelect'].forEach(id => {
        const sel = document.getElementById(id), curr = sel.value;
        sel.innerHTML = '<option value="">Choose group...</option>' + groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
        sel.value = curr;
    });
}

// Members
function openMembersModal(groupId, groupName) {
    document.getElementById('modalGroupName').textContent = groupName;
    document.getElementById('addMemberForm').groupId = groupId;
    document.getElementById('membersModal').style.display = 'block';
    loadMembersForModal(groupId);
}

function loadMembersForModal(groupId) {
    const members = db.getMembers().filter(m => m.groupId === groupId);
    const container = document.getElementById('membersList');
    container.innerHTML = members.length === 0 ? '<p class="empty">No members</p>' : 
        members.map(m => `<div class="list-item"><div class="list-item-header"><div class="list-item-title">${m.name}</div><div class="list-item-subtitle">⭐ ${m.totalPoints} • ✅ ${m.tasksCompleted}</div></div><button class="btn btn-danger btn-small" onclick="removeMember(${groupId}, ${m.id})">Remove</button></div>`).join('');
}

function addMember(e) {
    e.preventDefault();
    const groupId = e.target.groupId, name = document.getElementById('memberName').value, email = document.getElementById('memberEmail').value;
    if (!name || !email || db.getMembers().find(m => m.email === email)) { alert('Invalid or exists'); return; }
    db.getMembers().push({ id: Date.now(), name, email, groupId: parseInt(groupId), totalPoints: 0, tasksCompleted: 0, tasksPending: 0, joinedAt: new Date().toISOString() });
    db.setMembers(db.getMembers());
    const groups = db.getGroups(), g = groups.find(g => g.id === parseInt(groupId));
    if (g) g.memberCount++;
    db.setGroups(groups);
    alert('✅ Member added!');
    document.getElementById('addMemberForm').reset();
    loadMembersForModal(groupId);
    loadDashboard();
}

function removeMember(groupId, memberId) {
    if (!confirm('Remove member?')) return;
    db.setMembers(db.getMembers().filter(m => m.id !== memberId));
    db.setTasks(db.getTasks().filter(t => t.assignedMemberId !== memberId));
    const groups = db.getGroups(), g = groups.find(g => g.id === parseInt(groupId));
    if (g) g.memberCount = Math.max(0, g.memberCount - 1);
    db.setGroups(groups);
    loadMembersForModal(groupId);
    loadDashboard();
}

function loadMembersForTaskForm(groupId) {
    const members = db.getMembers().filter(m => m.groupId === parseInt(groupId));
    document.getElementById('taskMember').innerHTML = '<option value="">Assign to...</option>' + members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

// Tasks
function loadTasksTab() {
    loadGroupSelects();
    document.getElementById('createTaskSection').style.display = 'none';
}

function loadTasksForGroup(groupId) {
    const tasks = db.getTasks().filter(t => t.groupId === parseInt(groupId));
    const container = document.getElementById('tasksList');
    container.innerHTML = tasks.length === 0 ? '<p class="empty">No tasks</p>' : 
        tasks.map(t => `<div class="list-item"><div class="list-item-header"><div class="list-item-title">${t.title}</div><div class="list-item-subtitle">${t.description || ''}</div><div class="list-item-subtitle">📅 ${new Date(t.deadline).toLocaleDateString()} • ⭐ ${t.points} • <span class="status-${t.status.toLowerCase()}">${t.status}</span></div></div><div class="list-item-actions">${t.status !== 'COMPLETED' ? `<button class="btn btn-success btn-small" onclick="completeTask(${groupId}, ${t.id})">Complete</button>` : ''}<button class="btn btn-danger btn-small" onclick="deleteTask(${groupId}, ${t.id})">Delete</button></div></div>`).join('');
}

function createTask(e) {
    e.preventDefault();
    const groupId = selectedGroupId, memberId = parseInt(document.getElementById('taskMember').value);
    if (!memberId) { alert('Assign member'); return; }
    const member = db.getMembers().find(m => m.id === memberId && m.groupId === groupId);
    if (!member) { alert('Invalid member'); return; }
    db.getTasks().push({ id: Date.now(), title: document.getElementById('taskTitle').value, description: document.getElementById('taskDescription').value || '', deadline: document.getElementById('taskDeadline').value, priority: document.getElementById('taskPriority').value, points: parseInt(document.getElementById('taskPoints').value), status: 'PENDING', assignedMemberId: memberId, groupId, createdAt: new Date().toISOString(), completedAt: null });
    db.setTasks(db.getTasks());
    member.tasksPending++;
    db.setMembers(db.getMembers());
    const g = db.getGroups().find(g => g.id === groupId);
    if (g) g.taskCount++;
    db.setGroups(db.getGroups());
    alert('✅ Task created!');
    document.getElementById('createTaskForm').reset();
    loadTasksForGroup(groupId);
    loadDashboard();
}

function completeTask(groupId, taskId) {
    const task = db.getTasks().find(t => t.id === taskId);
    if (!task || task.status === 'COMPLETED') { alert('Already done'); return; }
    task.status = 'COMPLETED';
    task.completedAt = new Date().toISOString();
    const member = db.getMembers().find(m => m.id === task.assignedMemberId);
    if (member) { member.totalPoints += task.points; member.tasksCompleted++; if (member.tasksPending > 0) member.tasksPending--; }
    db.setTasks(db.getTasks());
    db.setMembers(db.getMembers());
    loadTasksForGroup(groupId);
    loadDashboard();
}

function deleteTask(groupId, taskId) {
    if (!confirm('Delete task?')) return;
    const task = db.getTasks().find(t => t.id === taskId);
    const member = db.getMembers().find(m => m.id === task.assignedMemberId);
    if (member && member.tasksPending > 0) member.tasksPending--;
    db.setMembers(db.getMembers());
    db.setTasks(db.getTasks().filter(t => t.id !== taskId));
    const g = db.getGroups().find(g => g.id === groupId);
    if (g) g.taskCount = Math.max(0, g.taskCount - 1);
    db.setGroups(db.getGroups());
    loadTasksForGroup(groupId);
    loadDashboard();
}

// Analytics
function loadAnalyticsTab() {
    loadGroupSelects();
    document.getElementById('analyticsContainer').style.display = 'none';
    document.getElementById('leaderboard').innerHTML = '<p class="empty">Select group</p>';
}

function loadAnalytics(groupId) {
    const members = db.getMembers().filter(m => m.groupId === parseInt(groupId)), tasks = db.getTasks().filter(t => t.groupId === parseInt(groupId));
    document.getElementById('analyticsContainer').style.display = 'grid';
    const topMember = members.length > 0 ? members.reduce((p, c) => p.totalPoints > c.totalPoints ? p : c) : null;
    document.getElementById('topPerformer').textContent = topMember ? topMember.name : '-';
    document.getElementById('topPerformerPoints').textContent = topMember ? topMember.totalPoints : '-';
    const totalCompleted = members.reduce((s, m) => s + m.tasksCompleted, 0);
    document.getElementById('productivityScore').textContent = members.length > 0 ? (totalCompleted === 0 ? 0 : members.reduce((s, m) => s + m.totalPoints, 0) / totalCompleted).toFixed(2) : '-';
    const totalTasks = members.reduce((s, m) => s + m.tasksPending + m.tasksCompleted, 0);
    document.getElementById('workloadDistribution').textContent = members.length > 0 ? (totalTasks / members.length).toFixed(2) : '-';
    const overdue = tasks.filter(t => t.status === 'PENDING' && t.deadline < new Date().toISOString()).length;
    document.getElementById('overduePercentage').textContent = tasks.length > 0 ? ((overdue / tasks.length) * 100).toFixed(1) + '%' : '-';
    const medals = ['🥇', '🥈', '🥉'];
    document.getElementById('leaderboard').innerHTML = members.length === 0 ? '<p class="empty">No members</p>' : members.sort((a, b) => b.totalPoints - a.totalPoints).map((m, i) => `<div class="leaderboard-item"><div class="rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${medals[i] || (i + 1)}</div><div class="leaderboard-info"><div class="leaderboard-name">${m.name}</div><div class="leaderboard-stats">✅ ${m.tasksCompleted}</div></div><div class="leaderboard-points">⭐ ${m.totalPoints}</div></div>`).join('');
}
