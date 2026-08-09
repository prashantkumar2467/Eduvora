let currentWizardStep = 1;
let moduleCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    const token = localStorage.getItem('eduvora_token');
    const user = JSON.parse(localStorage.getItem('eduvora_user') || 'null');

    // Access control check[cite: 16]
    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Admin account required.');
        window.location.href = '../login.html';
        return;
    }

    document.getElementById('admin-name').textContent = `Admin: ${user.name}`;

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('eduvora_token');
        localStorage.removeItem('eduvora_user');
        window.location.href = '../index.html';
    });

    // Initial Data Fetching[cite: 16]
    loadAdminStats();
    loadCourses();
    loadUsers();
});

/* =========================================
   THEME LOGIC
========================================= */
function initTheme() {
    const isDark = localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    updateThemeUI(isDark);
}

function toggleTheme() {
    const isDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.theme = isDark ? "dark" : "light";
    updateThemeUI(isDark);
}

function updateThemeUI(isDark) {
    const icon = document.getElementById("themeToggleIcon");
    const text = document.getElementById("themeToggleText");
    if (icon && text) {
        icon.textContent = isDark ? "☀️" : "🌙";
        text.textContent = isDark ? "Bright" : "Dark";
    }
}

/* =========================================
   WIZARD LOGIC (Course -> Module -> Topic)
========================================= */
function openCreateWizard() {
    document.getElementById('courseWizardModal').classList.remove('hidden');
    document.getElementById('wizard-form').reset();
    document.getElementById('syllabus-container').innerHTML = '';
    moduleCount = 0;
    
    // Add default first module
    addModule();
    
    currentWizardStep = 1;
    updateWizardUI();
}

function closeCreateWizard() {
    document.getElementById('courseWizardModal').classList.add('hidden');
    document.getElementById('modal-course-error').classList.add('hidden');
}

function changeStep(direction) {
    // Basic validation before leaving step 1
    if (direction === 1 && currentWizardStep === 1) {
        const title = document.getElementById('course-title').value.trim();
        const cat = document.getElementById('course-category').value.trim();
        if (!title || !cat) {
            showError("Please fill out the Course Name and Category.");
            return;
        }
        document.getElementById('modal-course-error').classList.add('hidden');
    }

    currentWizardStep += direction;
    updateWizardUI();
}

function updateWizardUI() {
    // Hide all steps
    document.getElementById('step-1-content').classList.add('hidden');
    document.getElementById('step-2-content').classList.add('hidden');
    document.getElementById('step-3-content').classList.add('hidden');

    // Show current step
    document.getElementById(`step-${currentWizardStep}-content`).classList.remove('hidden');

    // Update Tabs
    for (let i = 1; i <= 3; i++) {
        const tab = document.getElementById(`tab-step-${i}`);
        if (i === currentWizardStep) {
            tab.className = "flex-1 py-3 text-center text-xs font-bold border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 transition-colors";
        } else if (i < currentWizardStep) {
            tab.className = "flex-1 py-3 text-center text-xs font-bold border-b-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition-colors";
        } else {
            tab.className = "flex-1 py-3 text-center text-xs font-bold border-b-2 border-transparent text-slate-400 transition-colors";
        }
    }

    // Update Footer Buttons
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnLaunch = document.getElementById('btn-launch');

    btnPrev.classList.toggle('invisible', currentWizardStep === 1);

    if (currentWizardStep === 3) {
        btnNext.classList.add('hidden');
        btnLaunch.classList.remove('hidden');
    } else {
        btnNext.classList.remove('hidden');
        btnLaunch.classList.add('hidden');
        btnNext.innerHTML = currentWizardStep === 1 ? 'Continue to Curriculum &rarr;' : 'Review & Finalize &rarr;';
    }
}

function showError(msg) {
    const errorBox = document.getElementById('modal-course-error');
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
}

/* =========================================
   DYNAMIC SYLLABUS BUILDER
========================================= */
function addModule() {
    moduleCount++;
    const container = document.getElementById('syllabus-container');
    
    const moduleDiv = document.createElement('div');
    moduleDiv.className = "p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl module-block";
    moduleDiv.id = `module-${moduleCount}`;
    
    moduleDiv.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <input type="text" placeholder="Module Name (e.g., Module 1: Foundations)" class="module-title font-bold text-sm w-3/4 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl outline-none focus:border-sky-500 text-slate-900 dark:text-white" required>
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-xs text-rose-500 font-bold hover:underline">Remove Module</button>
        </div>
        <div class="topics-container space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-800 ml-2 mt-4">
            <!-- Topics go here -->
        </div>
        <button type="button" onclick="addTopic(this)" class="mt-4 ml-6 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
            <span>+</span> Add Topic to Module
        </button>
    `;
    
    container.appendChild(moduleDiv);
    // Add first topic automatically
    addTopic(moduleDiv.querySelector('button[onclick="addTopic(this)"]'));
}

function addTopic(btnElement) {
    const topicsContainer = btnElement.previousElementSibling;
    const topicDiv = document.createElement('div');
    topicDiv.className = "topic-block bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl relative group";
    
    topicDiv.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="absolute top-3 right-3 text-rose-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition text-xs font-bold">&times; Remove</button>
        <input type="text" placeholder="Topic Title (e.g., 1.1 Intro to Variables)" class="topic-title w-full md:w-5/6 px-3 py-1.5 bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none mb-2 placeholder-slate-400" required>
        <textarea placeholder="Write topic content/theory here..." rows="2" class="topic-content w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500 text-slate-700 dark:text-slate-300"></textarea>
    `;
    
    topicsContainer.appendChild(topicDiv);
}

/* =========================================
   SUBMIT COURSE / API[cite: 16]
========================================= */
async function submitCourse() {
    const token = localStorage.getItem('eduvora_token');
    const title = document.getElementById('course-title').value;
    const category = document.getElementById('course-category').value;
    const description = document.getElementById('course-description').value;

    // Optional: Extract nested Syllabus JSON if backend supports it.
    // For now, we submit using the existing backend payload format[cite: 16].
    
    try {
        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, category, description })
        });

        const data = await response.json();

        if (response.ok) {
            alert('🚀 Course Launched Successfully!');
            closeCreateWizard();
            loadCourses();
            loadAdminStats();
        } else {
            showError(data.message || 'Failed to publish course.');
        }
    } catch (error) {
        showError('Server error creating course.');
    }
}

/* =========================================
   DATA LOADING & MANAGEMENT[cite: 16]
========================================= */
async function loadAdminStats() {
    const token = localStorage.getItem('eduvora_token');
    try {
        const response = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await response.json();
        if (response.ok) {
            document.getElementById('stat-total-users').textContent = stats.totalUsers || 0;
            document.getElementById('stat-total-courses').textContent = stats.totalCourses || 0;
        }
    } catch (err) {
        console.error('Error loading admin stats:', err);
    }
}

async function loadCourses() {
    const list = document.getElementById('admin-course-list');
    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (!courses || courses.length === 0) {
            list.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500 font-medium">No courses posted yet.</td></tr>`;
            return;
        }

        list.innerHTML = courses.map(course => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">${escapeHtml(course.title)}</td>
                <td class="px-6 py-4"><span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 rounded-full border border-sky-200 dark:border-sky-500/20">${escapeHtml(course.category || 'General')}</span></td>
                <td class="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate text-xs">${escapeHtml(course.description)}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="deleteCourse(${course.id})" class="text-[11px] font-bold px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition shadow-sm">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        list.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-rose-500 font-bold">Failed to load courses.</td></tr>`;
    }
}

async function loadUsers() {
    const token = localStorage.getItem('eduvora_token');
    const list = document.getElementById('admin-user-list');
    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();

        if (!users || users.length === 0) {
            list.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500 font-medium">No users found.</td></tr>`;
            return;
        }

        list.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">${escapeHtml(u.name)}</td>
                <td class="px-6 py-4 text-xs">${escapeHtml(u.email)}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${u.role === 'admin' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}">
                        ${u.role}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    ${u.role !== 'admin' ? `<button onclick="deleteUser(${u.id})" class="text-[11px] font-bold px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition shadow-sm">Delete</button>` : `<span class="text-[10px] uppercase font-bold text-slate-400">Protected</span>`}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        list.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-rose-500 font-bold">Failed to load users.</td></tr>`;
    }
}

async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course?')) return;
    const token = localStorage.getItem('eduvora_token');
    try {
        const response = await fetch(`/api/admin/courses/${courseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            loadCourses();
            loadAdminStats();
        } else {
            alert('Failed to delete course');
        }
    } catch (err) {
        alert('Server error deleting course');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const token = localStorage.getItem('eduvora_token');
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            loadUsers();
            loadAdminStats();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete user');
        }
    } catch (err) {
        alert('Server error deleting user');
    }
}

function escapeHtml(text) {
    return text ? text.replace(/[&<>"']/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[match])) : '';
}