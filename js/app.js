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
    const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    datetimeEl.textContent = `${dateStr} • ${timeStr}`;
    
    let greeting = 'Good morning';
    let emoji = '🌅';
    
    if (hour >= 12 && hour < 18) {
        greeting = 'Good afternoon';
        emoji = '☀️';
    } else if (hour >= 18) {
        greeting = 'Good evening';
        emoji = '🌙';
    }
    
    const name = localStorage.getItem('userName');
    greetingEl.textContent = name ? `${greeting}, ${name}` : greeting;
    document.querySelector('.greeting-emoji').textContent = emoji;
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
        showNotification(`👋 Welcome, ${name}!`);
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
    
    // Update page title
    document.title = `${formatTime(timeRemaining)} - Productivity Dashboard`;
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.disabled = true;
    startBtn.style.opacity = '0.6';
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            stopTimer();
            playNotificationSound();
            showNotification('🎉 Focus time complete! Great work!');
        }
    }, 1000);
}

function stopTimer() {
    isRunning = false;
    startBtn.disabled = false;
    startBtn.style.opacity = '1';
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
        showNotification(`⏱️ Timer set to ${mins} minutes`);
    } else {
        showNotification('⚠️ Please enter a value between 1 and 60');
    }
}

function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// ============ TO-DO LIST ============
function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
        showNotification('⚠️ Please enter a task');
        return;
    }
    
    const tasks = getTasks();
    
    // Check for duplicates
    if (tasks.some(t => t.text.toLowerCase() === text.toLowerCase())) {
        showNotification('⚠️ This task already exists');
        return;
    }
    
    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
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
    showNotification('🗑️ Task deleted');
}

function toggleTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks(tasks);
        renderTasks();
        if (task.completed) {
            showNotification('✨ Great job! Task completed');
        }
    }
}

function editTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newText = prompt('Edit task:', task.text);
    if (newText && newText.trim()) {
        const trimmedText = newText.trim();
        
        // Check for duplicates
        if (tasks.some(t => t.id !== id && t.text.toLowerCase() === trimmedText.toLowerCase())) {
            showNotification('⚠️ This task already exists');
            return;
        }
        
        task.text = trimmedText;
        saveTasks(tasks);
        renderTasks();
        showNotification('✏️ Task updated');
    }
}

function renderTasks() {
    const tasks = getTasks();
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<li style="text-align: center; padding: 40px; color: var(--text-secondary); font-size: 1.1rem;">No tasks yet. Add one to get started! 🚀</li>';
        return;
    }
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="btn btn-secondary btn-small">✏️ Edit</button>
                <button class="btn btn-danger btn-small">🗑️ Delete</button>
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
    
    if (!name || !url) {
        showNotification('⚠️ Please fill in both fields');
        return;
    }
    
    // Validate URL
    if (!isValidUrl(url)) {
        showNotification('⚠️ Please enter a valid URL');
        return;
    }
    
    const links = getLinks();
    
    // Check for duplicates
    if (links.some(l => l.url.toLowerCase() === url.toLowerCase())) {
        showNotification('⚠️ This link already exists');
        return;
    }
    
    const link = {
        id: Date.now(),
        name: name,
        url: url,
        createdAt: new Date().toISOString()
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
    showNotification('🗑️ Link deleted');
}

function renderLinks() {
    const links = getLinks();
    linksList.innerHTML = '';
    
    if (links.length === 0) {
        linksList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary); font-size: 1.1rem;">No quick links yet. Add your favorites! 🌐</div>';
        return;
    }
    
    links.forEach(link => {
        const div = document.createElement('div');
        div.className = 'link-item';
        div.innerHTML = `
            <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(link.name)}">
                🔗 ${escapeHtml(link.name)}
            </a>
            <div class="link-item-actions">
                <button class="btn btn-danger btn-small">🗑️ Delete</button>
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

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// ============ THEME ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    showNotification(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
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
        padding: 16px 28px;
        border-radius: 14px;
        box-shadow: 0 8px 28px rgba(0, 212, 255, 0.5);
        font-weight: 700;
        z-index: 2000;
        animation: slideIn 0.3s ease-out;
        border: 2px solid #00d4ff;
        font-size: 1rem;
        max-width: 300px;
        word-wrap: break-word;
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
