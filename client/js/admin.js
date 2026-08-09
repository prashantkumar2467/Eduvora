let currentWizardStep = 1;
let moduleCount = 0;
let editingCourseId = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    const token = localStorage.getItem('eduvora_token');
    const user = JSON.parse(localStorage.getItem('eduvora_user') || 'null');

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Admin credentials required.');
        window.location.href = '../index.html';
        return;
    }

    const adminNameEl = document.getElementById('admin-name');
    if (adminNameEl) adminNameEl.textContent = `Admin: ${user.name}`;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('eduvora_token');
            localStorage.removeItem('eduvora_user');
            window.location.href = '../index.html';
        });
    }

    loadAdminStats();
    loadCourses();
    loadUsers();
});

/* THEME LOGIC */
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

/* WIZARD MODAL LOGIC */
function openCreateWizard() {
    editingCourseId = null;
    document.getElementById('wizard-modal-title').textContent = "Launch New Course";
    document.getElementById('step3-heading').textContent = "Ready to Publish!";
    document.getElementById('wizard-form').reset();
    document.getElementById('syllabus-container').innerHTML = '';
    moduleCount = 0;
    
    addModule();
    currentWizardStep = 1;
    updateWizardUI();
    document.getElementById('courseWizardModal').classList.remove('hidden');
}

async function openEditWizard(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) throw new Error("Failed to fetch course details.");
        
        const course = await response.json();
        editingCourseId = courseId;

        document.getElementById('wizard-modal-title').textContent = `Edit Course #${courseId}: ${course.title}`;
        document.getElementById('step3-heading').textContent = "Save Changes";
        document.getElementById('course-title').value = course.title || '';
        document.getElementById('course-category').value = course.category || '';
        document.getElementById('course-description').value = course.description || '';

        const container = document.getElementById('syllabus-container');
        container.innerHTML = '';
        moduleCount = 0;

        let modulesToRender = course.modules || course.topics || course.syllabus || [];
        
        if (Array.isArray(modulesToRender) && modulesToRender.length > 0) {
            modulesToRender.forEach(mod => {
                moduleCount++;
                const modDiv = createModuleElement(moduleCount, mod.title || mod.moduleName || `Module ${moduleCount}`);
                const topicsContainer = modDiv.querySelector('.topics-container');

                const topics = mod.topics || [mod];
                topics.forEach(top => {
                    addTopicToContainer(topicsContainer, top.title || top.topic_title || '', top.content || top.body || '', top.code || top.code_snippet || '');
                });

                container.appendChild(modDiv);
            });
        } else {
            addModule();
        }

        currentWizardStep = 1;
        updateWizardUI();
        document.getElementById('courseWizardModal').classList.remove('hidden');
    } catch (err) {
        alert("Unable to load course for editing.");
    }
}

function closeCreateWizard() {
    document.getElementById('courseWizardModal').classList.add('hidden');
    document.getElementById('modal-course-error').classList.add('hidden');
}

function changeStep(direction) {
    if (direction === 1 && currentWizardStep === 1) {
        const title = document.getElementById('course-title').value.trim();
        const cat = document.getElementById('course-category').value.trim();
        if (!title || !cat) {
            showError("Please fill out both Course Title and Category.");
            return;
        }
        document.getElementById('modal-course-error').classList.add('hidden');
    }

    currentWizardStep += direction;
    updateWizardUI();
}

function updateWizardUI() {
    document.getElementById('step-1-content').classList.add('hidden');
    document.getElementById('step-2-content').classList.add('hidden');
    document.getElementById('step-3-content').classList.add('hidden');

    document.getElementById(`step-${currentWizardStep}-content`).classList.remove('hidden');

    for (let i = 1; i <= 3; i++) {
        const tab = document.getElementById(`tab-step-${i}`);
        if (i === currentWizardStep) {
            tab.className = "flex-1 py-3 text-center text-xs font-bold border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 transition-colors";
        } else if (i < currentWizardStep) {
            tab.className = "flex-1 py-3 text-center text-xs font-bold border-b-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition-colors";
        } else {
            tab.className = "flex-1 py-3 text-center text-xs font-bold border-b-2 border-transparent text-slate-400 transition-colors";
        }
    }

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

/* W3SCHOOLS SYLLABUS BUILDER */
function addModule() {
    moduleCount++;
    const container = document.getElementById('syllabus-container');
    const moduleDiv = createModuleElement(moduleCount, '');
    container.appendChild(moduleDiv);
    
    addTopicToContainer(moduleDiv.querySelector('.topics-container'), '', '', '');
}

function createModuleElement(index, titleVal) {
    const moduleDiv = document.createElement('div');
    moduleDiv.className = "p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl module-block shadow-sm";
    moduleDiv.id = `module-${index}`;
    
    moduleDiv.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <input type="text" value="${escapeHtml(titleVal)}" placeholder="Module Name (e.g., Module 1: Core Fundamentals)" class="module-title font-bold text-sm w-3/4 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white" required>
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-xs text-rose-500 font-bold hover:underline">Remove Module</button>
        </div>
        <div class="topics-container space-y-4 pl-3 border-l-2 border-slate-200 dark:border-slate-800 ml-2"></div>
        <button type="button" onclick="addTopicFromBtn(this)" class="mt-4 ml-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
            <span>+</span> Add W3Schools Lesson Topic
        </button>
    `;
    return moduleDiv;
}

function addTopicFromBtn(btnElement) {
    const topicsContainer = btnElement.previousElementSibling;
    addTopicToContainer(topicsContainer, '', '', '');
}

function addTopicToContainer(container, titleVal, contentVal, codeVal) {
    const topicDiv = document.createElement('div');
    topicDiv.className = "topic-block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl relative group shadow-sm space-y-3";
    
    topicDiv.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="absolute top-3 right-3 text-rose-400 hover:text-rose-600 opacity-80 transition text-xs font-bold">&times; Delete Topic</button>
        <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Lesson Topic Title</label>
            <input type="text" value="${escapeHtml(titleVal)}" placeholder="Topic Title (e.g., 1.1 Intro to Variables & Scope)" class="topic-title w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-emerald-500 text-slate-900 dark:text-white" required>
        </div>
        <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Detailed Explanation / Theory</label>
            <textarea placeholder="Write step-by-step notes, explanatory text, and theory..." rows="2" class="topic-content w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-300 font-medium">${escapeHtml(contentVal)}</textarea>
        </div>
        <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Code Example Snippet (Optional)</label>
            <textarea placeholder="// Example code snippet..." rows="2" class="topic-code w-full px-3 py-2 text-xs font-mono-code bg-[#070d19] text-emerald-300 border border-slate-800 rounded-lg outline-none focus:border-emerald-500">${escapeHtml(codeVal)}</textarea>
        </div>
    `;
    
    container.appendChild(topicDiv);
}

/* SAVE / PUBLISH COURSE */
async function submitCourse() {
    const token = localStorage.getItem('eduvora_token');
    const title = document.getElementById('course-title').value.trim();
    const category = document.getElementById('course-category').value.trim();
    const description = document.getElementById('course-description').value.trim();

    const moduleBlocks = document.querySelectorAll('.module-block');
    let modules = [];

    moduleBlocks.forEach(mBlock => {
        const mTitle = mBlock.querySelector('.module-title').value.trim();
        const tBlocks = mBlock.querySelectorAll('.topic-block');
        let topics = [];

        tBlocks.forEach(tBlock => {
            topics.push({
                title: tBlock.querySelector('.topic-title').value.trim(),
                content: tBlock.querySelector('.topic-content').value.trim(),
                code: tBlock.querySelector('.topic-code').value.trim()
            });
        });

        if (mTitle) {
            modules.push({ title: mTitle, topics });
        }
    });

    const payload = { title, category, description, modules };
    
    // Auto-detect URL target
    let primaryUrl = editingCourseId ? `/api/courses/${editingCourseId}` : '/api/courses';
    let secondaryUrl = editingCourseId ? `/api/admin/courses/${editingCourseId}` : '/api/admin/courses';
    let method = editingCourseId ? 'PUT' : 'POST';

    try {
        let response = await fetch(primaryUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        // Fallback check
        if (response.status === 404) {
            response = await fetch(secondaryUrl, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
        }

        const data = await response.json();

        if (response.ok) {
            alert(editingCourseId ? '✅ Course updated successfully!' : '🚀 Course published live!');
            closeCreateWizard();
            await loadCourses();
            await loadAdminStats();
        } else {
            showError(data.message || 'Failed to save course.');
        }
    } catch (error) {
        showError('Server connection error while saving course.');
    }
}

/* DATA LOADERS */
async function loadAdminStats() {
    const token = localStorage.getItem('eduvora_token');
    try {
        const response = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const stats = await response.json();
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
            list.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">No courses published yet.</td></tr>`;
            return;
        }

        list.innerHTML = courses.map(course => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">${escapeHtml(course.title)}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
                        ${escapeHtml(course.category || 'General')}
                    </span>
                </td>
                <td class="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate text-xs">${escapeHtml(course.description)}</td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <a href="../course.html?id=${course.id}" target="_blank" class="text-xs font-bold px-3 py-1.5 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 rounded-lg transition">
                            👁️ View
                        </a>
                        <button onclick="openEditWizard('${course.id}')" class="text-xs font-bold px-3 py-1.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 rounded-lg transition">
                            ✏️ Edit
                        </button>
                        <button onclick="deleteCourse('${course.id}')" class="text-xs font-bold px-3 py-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 rounded-lg transition">
                            🗑️ Delete
                        </button>
                    </div>
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
            list.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">No registered users found.</td></tr>`;
            return;
        }

        list.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">${escapeHtml(u.name)}</td>
                <td class="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">${escapeHtml(u.email)}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${u.role === 'admin' ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200 dark:border-amber-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
                        ${u.role}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    ${u.role !== 'admin' ? `<button onclick="deleteUser('${u.id}')" class="text-xs font-bold px-3 py-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition">Delete</button>` : `<span class="text-[10px] uppercase font-bold text-slate-400">Protected</span>`}
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
        let response = await fetch(`/api/courses/${courseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 404) {
            response = await fetch(`/api/admin/courses/${courseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }

        if (response.ok) {
            await loadCourses();
            await loadAdminStats();
        } else {
            alert('Failed to delete course');
        }
    } catch (err) {
        alert('Server error deleting course');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    const token = localStorage.getItem('eduvora_token');
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            await loadUsers();
            await loadAdminStats();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete user');
        }
    } catch (err) {
        alert('Server error deleting user');
    }
}

function escapeHtml(text) {
    return text ? String(text).replace(/[&<>"']/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[match])) : '';
}