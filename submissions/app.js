// ==================== Browser Storage (localStorage) ====================

// Database management using localStorage
const db = {
    getGroups() {
        return JSON.parse(localStorage.getItem('groups')) || [];
    },
    setGroups(groups) {
        localStorage.setItem('groups', JSON.stringify(groups));
    },
    getMembers() {
        return JSON.parse(localStorage.getItem('members')) || [];
    },
    setMembers(members) {
        localStorage.setItem('members', JSON.stringify(members));
    },
    getTasks() {
        return JSON.parse(localStorage.getItem('tasks')) || [];
    },
    setTasks(tasks) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
};

// Global state
let selectedGroupId = null;
let selectedAnalyticsGroupId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupEventListeners();
    loadDashboard();
});

// ==================== Navigation ====================

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const tabName = e.target.getAttribute('data-tab');
            showTab(tabName);
        });
    });
}

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'groups') loadGroups();
    if (tabName === 'tasks') loadTasksTab();
    if (tabName === 'analytics') loadAnalyticsTab();
}

// ==================== Event Listeners ====================

function setupEventListeners() {
    // Groups
    document.getElementById('createGroupForm').addEventListener('submit', createGroup);

    // Tasks
    document.getElementById('taskGroupSelect').addEventListener('change', (e) => {
        selectedGroupId = e.target.value ? parseInt(e.target.value) : null;
        if (selectedGroupId) {
            loadTasksForGroup(selectedGroupId);
            loadMembersForTaskForm(selectedGroupId);
            document.getElementById('createTaskSection').style.display = 'block';
        } else {
            document.getElementById('createTaskSection').style.display = 'none';
        }
    });

    document.getElementById('createTaskForm').addEventListener('submit', createTask);

    // Analytics
    document.getElementById('analyticsGroupSelect').addEventListener('change', (e) => {
        selectedAnalyticsGroupId = e.target.value ? parseInt(e.target.value) : null;
        if (selectedAnalyticsGroupId) {
            loadAnalytics(selectedAnalyticsGroupId);
        }
    });

    // Members Modal
    const modal = document.getElementById('membersModal');
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    document.getElementById('addMemberForm').addEventListener('submit', addMember);
}

// ==================== Dashboard ====================

function loadDashboard() {
    const groups = db.getGroups();
    const members = db.getMembers();
    const tasks = db.getTasks();
    
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const totalPoints = members.reduce((sum, m) => sum + m.totalPoints, 0);
    
    document.getElementById('totalGroups').textContent = groups.length;
    document.getElementById('totalMembers').textContent = members.length;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('totalPoints').textContent = totalPoints;

    renderRecentGroups(groups);
}

function renderRecentGroups(groups) {
    const container = document.getElementById('recentGroups');
    if (groups.length === 0) {
        container.innerHTML = '<p class="empty">No groups yet</p>';
        return;
    }

    container.innerHTML = groups.slice(0, 5).map(group => `
        <div class="list-item">
            <div class="list-item-header">
                <div class="list-item-title">${group.name}</div>
                <div class="list-item-subtitle">${group.memberCount} members • ${group.taskCount} tasks</div>
            </div>
        </div>
    `).join('');
}

// ==================== Groups ====================

function createGroup(e) {
    e.preventDefault();
    
    const name = document.getElementById('groupName').value;
    const description = document.getElementById('groupDescription').value;

    if (!name.trim()) {
        alert('Group name is required');
        return;
    }

    const groups = db.getGroups();
    
    if (groups.find(g => g.name === name)) {
        alert('Group with this name already exists');
        return;
    }

    const group = {
        id: Date.now(),
        name,
        description: description || '',
        createdAt: new Date().toISOString(),
        memberCount: 0,
        taskCount: 0
    };

    groups.push(group);
    db.setGroups(groups);
    
    alert('Group created successfully!');
    document.getElementById('createGroupForm').reset();
    loadGroups();
    loadGroupSelects();
    loadDashboard();
}

function loadGroups() {
    const groups = db.getGroups();
    const container = document.getElementById('groupsList');

    if (groups.length === 0) {
        container.innerHTML = '<p class="empty">No groups yet. Create one to get started!</p>';
        return;
    }

    container.innerHTML = groups.map(group => `
        <div class="list-item">
            <div class="list-item-header">
                <div class="list-item-title">${group.name}</div>
                <div class="list-item-subtitle">${group.description || 'No description'}</div>
                <div class="list-item-subtitle">👥 ${group.memberCount} members • 📋 ${group.taskCount} tasks</div>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-primary btn-small" onclick="openMembersModal(${group.id}, '${group.name.replace(/'/g, "\\'")}')">Manage</button>
                <button class="btn btn-danger btn-small" onclick="deleteGroup(${group.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function deleteGroup(id) {
    if (!confirm('Are you sure you want to delete this group?')) return;

    let groups = db.getGroups();
    let members = db.getMembers();
    let tasks = db.getTasks();
    
    groups = groups.filter(g => g.id !== id);
    members = members.filter(m => m.groupId !== id);
    tasks = tasks.filter(t => t.groupId !== id);
    
    db.setGroups(groups);
    db.setMembers(members);
    db.setTasks(tasks);
    
    alert('Group deleted successfully!');
    loadGroups();
    loadDashboard();
    loadGroupSelects();
}

function loadGroupSelects() {
    const groups = db.getGroups();
    
    const taskSelect = document.getElementById('taskGroupSelect');
    const analyticsSelect = document.getElementById('analyticsGroupSelect');

    [taskSelect, analyticsSelect].forEach(select => {
        const current = select.value;
        select.innerHTML = '<option value="">Choose a group...</option>' + 
            groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
        select.value = current;
    });
}

// ==================== Members ====================

function openMembersModal(groupId, groupName) {
    document.getElementById('modalGroupName').textContent = groupName;
    document.getElementById('addMemberForm').groupId = groupId;
    document.getElementById('membersModal').style.display = 'block';
    loadMembersForModal(groupId);
}

function loadMembersForModal(groupId) {
    const members = db.getMembers().filter(m => m.groupId === groupId);
    const container = document.getElementById('membersList');

    if (members.length === 0) {
        container.innerHTML = '<p class="empty">No members yet</p>';
        return;
    }

    container.innerHTML = members.map(member => `
        <div class="list-item">
            <div class="list-item-header">
                <div class="list-item-title">${member.name}</div>
                <div class="list-item-subtitle">⭐ ${member.totalPoints} points • ✅ ${member.tasksCompleted} completed</div>
            </div>
            <button class="btn btn-danger btn-small" onclick="removeMember(${groupId}, ${member.id})">Remove</button>
        </div>
    `).join('');
}

function addMember(e) {
    e.preventDefault();
    const groupId = e.target.groupId;
    const name = document.getElementById('memberName').value;
    const email = document.getElementById('memberEmail').value;

    if (!name || !email) {
        alert('Name and email are required');
        return;
    }

    const members = db.getMembers();
    
    if (members.find(m => m.email === email)) {
        alert('Member with this email already exists');
        return;
    }

    const member = {
        id: Date.now(),
        name,
        email,
        groupId: parseInt(groupId),
        totalPoints: 0,
        tasksCompleted: 0,
        tasksPending: 0,
        joinedAt: new Date().toISOString()
    };

    members.push(member);
    
    // Update group member count
    let groups = db.getGroups();
    const group = groups.find(g => g.id === parseInt(groupId));
    if (group) {
        group.memberCount = db.getMembers().filter(m => m.groupId === group.id).length + 1;
    }
    
    db.setMembers(members);
    db.setGroups(groups);
    
    alert('Member added successfully!');
    document.getElementById('addMemberForm').reset();
    loadMembersForModal(groupId);
    loadMembersForTaskForm(groupId);
    loadDashboard();
}

function removeMember(groupId, memberId) {
    if (!confirm('Are you sure you want to remove this member?')) return;

    let members = db.getMembers();
    let tasks = db.getTasks();
    
    members = members.filter(m => m.id !== memberId);
    tasks = tasks.filter(t => t.assignedMemberId !== memberId);
    
    // Update group member count
    let groups = db.getGroups();
    const group = groups.find(g => g.id === parseInt(groupId));
    if (group) {
        group.memberCount = db.getMembers().filter(m => m.groupId === group.id).length - 1;
    }
    
    db.setMembers(members);
    db.setTasks(tasks);
    db.setGroups(groups);
    
    alert('Member removed successfully!');
    loadMembersForModal(groupId);
    loadDashboard();
}

function loadMembersForTaskForm(groupId) {
    const members = db.getMembers().filter(m => m.groupId === parseInt(groupId));
    const select = document.getElementById('taskMember');
    select.innerHTML = '<option value="">Assign to...</option>' + 
        members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

// ==================== Tasks ====================

function loadTasksTab() {
    loadGroupSelects();
    document.getElementById('createTaskSection').style.display = 'none';
}

function loadTasksForGroup(groupId) {
    const tasks = db.getTasks().filter(t => t.groupId === parseInt(groupId));
    const container = document.getElementById('tasksList');

    if (tasks.length === 0) {
        container.innerHTML = '<p class="empty">No tasks yet</p>';
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="list-item">
            <div class="list-item-header">
                <div class="list-item-title">${task.title}</div>
                <div class="list-item-subtitle">${task.description || ''}</div>
                <div class="list-item-subtitle">
                    📅 ${new Date(task.deadline).toLocaleDateString()} • 
                    ⭐ ${task.points} points • 
                    <span class="status-${task.status.toLowerCase()}">${task.status}</span>
                </div>
            </div>
            <div class="list-item-actions">
                ${task.status !== 'COMPLETED' ? `<button class="btn btn-success btn-small" onclick="completeTask(${groupId}, ${task.id})">Complete</button>` : ''}
                <button class="btn btn-danger btn-small" onclick="deleteTask(${groupId}, ${task.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function createTask(e) {
    e.preventDefault();
    const groupId = selectedGroupId;

    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const deadline = document.getElementById('taskDeadline').value;
    const priority = document.getElementById('taskPriority').value;
    const points = parseInt(document.getElementById('taskPoints').value);
    const assignedMemberId = parseInt(document.getElementById('taskMember').value);

    if (!assignedMemberId) {
        alert('Please assign a member to the task');
        return;
    }

    const members = db.getMembers();
    const member = members.find(m => m.id === assignedMemberId);
    if (!member || member.groupId !== groupId) {
        alert('Invalid member selection');
        return;
    }

    const tasks = db.getTasks();
    const task = {
        id: Date.now(),
        title,
        description: description || '',
        deadline,
        priority,
        points,
        status: 'PENDING',
        assignedMemberId: parseInt(assignedMemberId),
        groupId: parseInt(groupId),
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    tasks.push(task);
    
    // Update group task count
    let groups = db.getGroups();
    const group = groups.find(g => g.id === parseInt(groupId));
    if (group) {
        group.taskCount = db.getTasks().filter(t => t.groupId === group.id).length + 1;
    }
    
    // Update member pending tasks
    member.tasksPending++;
    
    db.setTasks(tasks);
    db.setMembers(members);
    db.setGroups(groups);
    
    alert('Task created successfully!');
    document.getElementById('createTaskForm').reset();
    loadTasksForGroup(groupId);
    loadDashboard();
}

function completeTask(groupId, taskId) {
    const tasks = db.getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (!task || task.status === 'COMPLETED') {
        alert('Task already completed');
        return;
    }

    task.status = 'COMPLETED';
    task.completedAt = new Date().toISOString();

    const members = db.getMembers();
    const member = members.find(m => m.id === task.assignedMemberId);
    
    if (member) {
        member.totalPoints += task.points;
        member.tasksCompleted++;
        if (member.tasksPending > 0) member.tasksPending--;
    }

    db.setTasks(tasks);
    db.setMembers(members);
    
    alert('Task completed successfully!');
    loadTasksForGroup(groupId);
    loadDashboard();
}

function deleteTask(groupId, taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    let tasks = db.getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        const members = db.getMembers();
        const member = members.find(m => m.id === task.assignedMemberId);
        if (member && member.tasksPending > 0) member.tasksPending--;
        
        db.setMembers(members);
    }
    
    tasks = tasks.filter(t => t.id !== taskId);
    
    // Update group task count
    let groups = db.getGroups();
    const group = groups.find(g => g.id === parseInt(groupId));
    if (group) {
        group.taskCount = Math.max(0, group.taskCount - 1);
    }
    
    db.setTasks(tasks);
    db.setGroups(groups);
    
    alert('Task deleted successfully!');
    loadTasksForGroup(groupId);
    loadDashboard();
}

// ==================== Analytics ====================

function loadAnalyticsTab() {
    loadGroupSelects();
    document.getElementById('analyticsContainer').style.display = 'none';
    document.getElementById('leaderboard').innerHTML = '<p class="empty">Select a group to view analytics</p>';
}

function loadAnalytics(groupId) {
    const members = db.getMembers().filter(m => m.groupId === parseInt(groupId));
    const tasks = db.getTasks().filter(t => t.groupId === parseInt(groupId));

    document.getElementById('analyticsContainer').style.display = 'grid';
    
    // Most productive member
    if (members.length > 0) {
        const topMember = members.reduce((prev, current) =>
            prev.totalPoints > current.totalPoints ? prev : current
        );
        document.getElementById('topPerformer').textContent = topMember.name;
        document.getElementById('topPerformerPoints').textContent = topMember.totalPoints;
    } else {
        document.getElementById('topPerformer').textContent = '-';
        document.getElementById('topPerformerPoints').textContent = '-';
    }
    
    // Productivity score
    if (members.length > 0) {
        const totalCompleted = members.reduce((sum, m) => sum + m.tasksCompleted, 0);
        const score = totalCompleted === 0 ? 0 : members.reduce((sum, m) => sum + m.totalPoints, 0) / totalCompleted;
        document.getElementById('productivityScore').textContent = score.toFixed(2);
    } else {
        document.getElementById('productivityScore').textContent = '-';
    }
    
    // Workload distribution
    if (members.length > 0) {
        const totalTasks = members.reduce((sum, m) => sum + m.tasksPending + m.tasksCompleted, 0);
        const average = totalTasks / members.length;
        document.getElementById('workloadDistribution').textContent = average.toFixed(2);
    } else {
        document.getElementById('workloadDistribution').textContent = '-';
    }
    
    // Overdue percentage
    if (tasks.length > 0) {
        const now = new Date().toISOString();
        const overdue = tasks.filter(t => t.status === 'PENDING' && t.deadline < now).length;
        const percentage = (overdue / tasks.length) * 100;
        document.getElementById('overduePercentage').textContent = percentage.toFixed(1) + '%';
    } else {
        document.getElementById('overduePercentage').textContent = '-';
    }
    
    // Leaderboard
    const leaderboard = members
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((m, index) => ({
            memberName: m.name,
            totalPoints: m.totalPoints,
            tasksCompleted: m.tasksCompleted,
            rank: index + 1
        }));
    
    renderLeaderboard(leaderboard);
}

function renderLeaderboard(leaderboard) {
    const container = document.getElementById('leaderboard');
    if (leaderboard.length === 0) {
        container.innerHTML = '<p class="empty">No members yet</p>';
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    container.innerHTML = leaderboard.map((member, index) => `
        <div class="leaderboard-item">
            <div class="rank-badge ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}">${medals[index] || (index + 1)}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${member.memberName}</div>
                <div class="leaderboard-stats">✅ ${member.tasksCompleted} completed</div>
            </div>
            <div class="leaderboard-points">⭐ ${member.totalPoints}</div>
        </div>
    `).join('');
}
