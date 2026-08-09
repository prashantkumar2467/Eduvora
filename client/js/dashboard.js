document.addEventListener('DOMContentLoaded', async () => {
    initTheme();

    const token = localStorage.getItem('eduvora_token');
    const storedUser = JSON.parse(localStorage.getItem('eduvora_user') || 'null');

    // Authentication Guard
    if (!token || !storedUser) {
        window.location.href = 'index.html';
        return;
    }

    renderUserInfo(storedUser);

    // Logout Handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('eduvora_token');
            localStorage.removeItem('eduvora_user');
            window.location.href = 'index.html';
        });
    }

    // Load Live Profile from Backend
    await fetchUserProfile(token);

    // Load Courses (if container exists on current page)
    if (document.getElementById('dashboard-courses')) {
        await loadCourses(token);
    }

    // Profile Edit Handler (if form exists on current page)
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateProfile(token);
        });
    }
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

/* USER PROFILE API LOGIC */
async function fetchUserProfile(token) {
    try {
        const response = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            localStorage.setItem('eduvora_user', JSON.stringify(user));
            renderUserInfo(user);
        }
    } catch (err) {
        console.warn('Using cached user profile.');
    }
}

function renderUserInfo(user) {
    if (!user) return;

    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

    const greeting = document.getElementById('user-greeting');
    const welcome = document.getElementById('welcome-header');
    const avatarInitials = document.getElementById('user-avatar-initials');

    if (greeting) greeting.textContent = user.name;
    if (welcome) welcome.textContent = `Welcome back, ${escapeHtml(user.name)}! 👋`;
    if (avatarInitials) avatarInitials.textContent = initial;

    const pName = document.getElementById('profile-name');
    const pEmail = document.getElementById('profile-email');
    const pInitials = document.getElementById('profile-initials');
    const pRoleBadge = document.getElementById('profile-role-badge');
    const pBioDisplay = document.getElementById('profile-bio-display');

    const iName = document.getElementById('input-name');
    const iEmail = document.getElementById('input-email');
    const iBio = document.getElementById('input-bio');

    if (pName) pName.textContent = user.name;
    if (pEmail) pEmail.textContent = user.email;
    if (pInitials) pInitials.textContent = initial;
    if (pRoleBadge) pRoleBadge.textContent = user.role === 'admin' ? 'Administrator' : 'Student Account';
    if (pBioDisplay) pBioDisplay.textContent = user.bio || user.study_goals || 'No biography updated yet.';

    if (iName) iName.value = user.name || '';
    if (iEmail) iEmail.value = user.email || '';
    if (iBio) iBio.value = user.bio || user.study_goals || '';
}

async function updateProfile(token) {
    const name = document.getElementById('input-name').value;
    const email = document.getElementById('input-email').value;
    const bio = document.getElementById('input-bio').value;
    const saveBtn = document.getElementById('save-profile-btn');
    const msgBox = document.getElementById('profile-update-msg');

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, email, bio })
        });

        const data = await response.json();

        if (response.ok) {
            const updatedUser = data.user || { name, email, bio };
            localStorage.setItem('eduvora_user', JSON.stringify(updatedUser));
            renderUserInfo(updatedUser);

            if (msgBox) {
                msgBox.className = 'mb-4 p-3 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 text-emerald-700 dark:text-emerald-400';
                msgBox.textContent = 'Profile updated successfully!';
                msgBox.classList.remove('hidden');
            }
        } else if (msgBox) {
            msgBox.className = 'mb-4 p-3 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950 border border-rose-200 text-rose-700 dark:text-rose-400';
            msgBox.textContent = data.message || 'Failed to update profile.';
            msgBox.classList.remove('hidden');
        }
    } catch (err) {
        if (msgBox) {
            msgBox.className = 'mb-4 p-3 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950 border border-rose-200 text-rose-700 dark:text-rose-400';
            msgBox.textContent = 'Server error updating profile.';
            msgBox.classList.remove('hidden');
        }
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
        if (msgBox) setTimeout(() => msgBox.classList.add('hidden'), 4000);
    }
}

/* COURSES LOGIC */
async function loadCourses(token) {
    const container = document.getElementById('dashboard-courses');
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (!courses || courses.length === 0) {
            container.innerHTML = `
                <div class="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                    No active courses available right now.
                </div>`;
            const statCourses = document.getElementById('stat-courses-count');
            if (statCourses) statCourses.textContent = '0';
            return;
        }

        const statCourses = document.getElementById('stat-courses-count');
        if (statCourses) statCourses.textContent = courses.length;

        container.innerHTML = courses.map(course => `
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <span class="px-3 py-1 text-xs font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-400 rounded-full border border-sky-100 dark:border-sky-800">
                            ${escapeHtml(course.category || 'General')}
                        </span>
                        <span class="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                            Available
                        </span>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors mb-2">
                        ${escapeHtml(course.title)}
                    </h3>
                    <p class="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-6">
                        ${escapeHtml(course.description)}
                    </p>
                </div>
                <a href="course.html?id=${course.id}" 
                   class="w-full text-center py-3 px-4 bg-slate-900 dark:bg-sky-600 hover:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold text-sm rounded-xl transition shadow block">
                   Start Learning &rarr;
                </a>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error fetching courses:', error);
        if (container) {
            container.innerHTML = `<div class="col-span-full p-6 text-center text-rose-600 font-medium">Failed to load courses from server.</div>`;
        }
    }
}

function filterCourses() {
    const input = document.getElementById('course-search-input');
    if (!input) return;

    const query = input.value.toLowerCase();
    const cards = document.querySelectorAll('#dashboard-courses > div');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? 'flex' : 'none';
    });
}

function escapeHtml(text) {
    return text ? text.replace(/[&<>"']/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[match])) : '';
}