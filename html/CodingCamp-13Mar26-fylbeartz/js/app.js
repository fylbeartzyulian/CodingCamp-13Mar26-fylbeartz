// ============ STATE ============
let timerInterval = null;
let timeRemaining = 25 * 60;
let isRunning = false;

// ============ DOM ELEMENTS ============
const greetingEl = document.getElementById('greeting');
const datetimeEl = document.getElementById('datetime');
const digitalClockEl = document.getElementById('digitalClock');
const nameInput = document.getElementById('nameInput');
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const timerInput = document.getElementById('timerInput');
const setTimerBtn = document.getElementById('setTimerBtn');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const linkName = document.getElementById('linkName');
const linkUrl = document.getElementById('linkUrl');
const addLinkBtn = document.getElementById('addLinkBtn');
const linksList = document.getElementById('linksList');
const themeToggle = document.getElementById('themeToggle');

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    updateDigitalClock();
    setInterval(updateDateTime, 1000);
    setInterval(updateDigitalClock, 1000);
    loadName();
    loadTasks();
    loadLinks();
    loadTheme();
    
    // Event listeners
    nameInput.addEventListener('change', saveName);
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);
    resetBtn.addEventListener('click', resetTimer);
    setTimerBtn.addEventListener('click', setCustomTimer);
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
    addLinkBtn.addEventListener('click', addLink);
    linkUrl.addEventListener('keypress', (e) => e.key === 'Enter' && addLink());
    themeToggle.addEventListener('click', toggleTheme);
});

// ============ GREETING & DATE/TIME ============
function updateDateTime() {
    const now = new Date();
    const hour = now.getHours();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    datetimeEl.textContent = `${dateStr} • ${timeStr}`;
    
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
    else if (hour >= 18) greeting = 'Good evening';
    
    const name = localStorage.getItem('userName');
    greetingEl.textContent = name ? `${greeting}, ${name}` : greeting;
}

function updateDigitalClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    digitalClockEl.textContent = `${hours}:${minutes}:${seconds}`;
}

function saveName() {
    const name = nameInput.value.trim();
    if (name) {
        localStorage.setItem('userName', name);
        updateDateTime();
    }
}

function loadName() {
    const name = localStorage.getItem('userName');
    if (name) nameInput.value = name;
}

// ============ TIMER ============
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timeRemaining);
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.disabled = true;
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            stopTimer();
            showNotification('🎉 Focus time complete! Great work!');
        }
    }, 1000);
}

function stopTimer() {
    isRunning = false;
    startBtn.disabled = false;
    if (timerInterval) clearInterval(timerInterval);
}

function resetTimer() {
    stopTimer();
    timeRemaining = parseInt(timerInput.value) * 60;
    updateTimerDisplay();
}

function setCustomTimer() {
    const mins = parseInt(timerInput.value);
    if (mins > 0 && mins <= 60) {
        timeRemaining = mins * 60;
        updateTimerDisplay();
        stopTimer();
    }
}

// ============ TO-DO LIST ============
function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    
    const tasks = getTasks();
    const task = {
        id: Date.now(),
        text: text,
        completed: false
    };
    
    tasks.push(task);
    saveTasks(tasks);
    taskInput.value = '';
    renderTasks();
    showNotification('✅ Task added!');
}

function deleteTask(id) {
    let tasks = getTasks();
    tasks = tasks.filter(t => t.id !== id);
    saveTasks(tasks);
    renderTasks();
}

function toggleTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks(tasks);
        renderTasks();
    }
}

function editTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newText = prompt('Edit task:', task.text);
    if (newText && newText.trim()) {
        task.text = newText.trim();
        saveTasks(tasks);
        renderTasks();
    }
}

function renderTasks() {
    const tasks = getTasks();
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="btn btn-secondary btn-small">Edit</button>
                <button class="btn btn-danger btn-small">Delete</button>
            </div>
        `;
        
        li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
        li.querySelector('.task-actions .btn-secondary').addEventListener('click', () => editTask(task.id));
        li.querySelector('.task-actions .btn-danger').addEventListener('click', () => deleteTask(task.id));
        
        taskList.appendChild(li);
    });
}

function getTasks() {
    return JSON.parse(localStorage.getItem('tasks') || '[]');
}

function saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    renderTasks();
}

// ============ QUICK LINKS ============
function addLink() {
    const name = linkName.value.trim();
    const url = linkUrl.value.trim();
    
    if (!name || !url) return;
    
    const links = getLinks();
    const link = {
        id: Date.now(),
        name: name,
        url: url
    };
    
    links.push(link);
    saveLinks(links);
    linkName.value = '';
    linkUrl.value = '';
    renderLinks();
    showNotification('🔗 Link added!');
}

function deleteLink(id) {
    let links = getLinks();
    links = links.filter(l => l.id !== id);
    saveLinks(links);
    renderLinks();
}

function renderLinks() {
    const links = getLinks();
    linksList.innerHTML = '';
    
    links.forEach(link => {
        const div = document.createElement('div');
        div.className = 'link-item';
        div.innerHTML = `
            <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.name)}</a>
            <div class="link-item-actions">
                <button class="btn btn-danger btn-small">Delete</button>
            </div>
        `;
        
        div.querySelector('.btn-danger').addEventListener('click', () => deleteLink(link.id));
        linksList.appendChild(div);
    });
}

function getLinks() {
    return JSON.parse(localStorage.getItem('links') || '[]');
}

function saveLinks(links) {
    localStorage.setItem('links', JSON.stringify(links));
}

function loadLinks() {
    renderLinks();
}

// ============ THEME ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    themeToggle.textContent = isDark ? '☀️' : '🌙';
}

function loadTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
}

// ============ UTILITIES ============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
        color: #0a1428;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4);
        font-weight: 700;
        z-index: 2000;
        animation: slideIn 0.3s ease-out;
        border: 2px solid #00d4ff;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
