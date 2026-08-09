document.addEventListener('DOMContentLoaded', async () => {
    const courseContainer = document.getElementById('course-container');
    const navActions = document.getElementById('nav-actions');
    const mobNavActions = document.getElementById('mob-nav-actions');
    const logoLink = document.getElementById('logo-link');

    let token = localStorage.getItem('eduvora_token');
    let user = null;

    try {
        user = JSON.parse(localStorage.getItem('eduvora_user') || 'null');
    } catch (e) {
        user = null;
    }

    // VERIFY SESSION WITH BACKEND API TO PREVENT STALE LOGINS
    if (token) {
        try {
            const profileRes = await fetch('/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (profileRes.ok) {
                const freshUser = await profileRes.json();
                user = freshUser;
                localStorage.setItem('eduvora_user', JSON.stringify(freshUser));
                
                // Session valid: Render user dashboard links
                renderAuthenticatedNav(user, navActions, mobNavActions, logoLink);
            } else {
                // Invalid or expired token: Clear stale session
                clearStaleSession(navActions, mobNavActions, logoLink);
            }
        } catch (err) {
            // Server offline or network issue: Fallback to guest mode
            clearStaleSession(navActions, mobNavActions, logoLink);
        }
    } else {
        clearStaleSession(navActions, mobNavActions, logoLink);
    }

    // Fetch and render course catalog
    await loadCoursesCatalog(courseContainer);
});

function renderAuthenticatedNav(user, navActions, mobNavActions, logoLink) {
    if (logoLink) logoLink.href = 'dashboard.html';

    const targetDashboard = user.role === 'admin' ? 'admin/dashboard.html' : 'dashboard.html';

    if (navActions) {
        navActions.innerHTML = `
            <span class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                Welcome, <strong class="text-emerald-600 dark:text-emerald-400">${escapeHtml(user.name)}</strong>
            </span>
            <a href="${targetDashboard}" class="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-md">
                Dashboard &rarr;
            </a>
        `;
    }

    if (mobNavActions) {
        mobNavActions.innerHTML = `
            <a href="${targetDashboard}" class="col-span-2 p-3 rounded-xl bg-emerald-600 text-white font-bold text-center">
                Go to Dashboard &rarr;
            </a>
        `;
    }
}

function clearStaleSession(navActions, mobNavActions, logoLink) {
    localStorage.removeItem('eduvora_token');
    localStorage.removeItem('eduvora_user');

    if (logoLink) logoLink.href = 'index.html';

    if (navActions) {
        navActions.innerHTML = `
            <button onclick="openAuth('login')" class="text-sm font-black px-5 py-2.5 rounded-xl border-2 border-navy/10 dark:border-steel/10 hover:border-accent transition-all">Login</button>
            <button onclick="openAuth('register')" class="text-sm font-black text-white bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 rounded-xl shadow-md transition-all">Get Started</button>
        `;
    }

    if (mobNavActions) {
        mobNavActions.innerHTML = `
            <button onclick="openAuth('login'); closeMob();" class="p-3 rounded-xl border-2 border-navy/10 dark:border-steel/10 font-bold text-center">Login</button>
            <button onclick="openAuth('register'); closeMob();" class="p-3 rounded-xl bg-emerald-600 text-white font-bold text-center">Register</button>
        `;
    }
}

async function loadCoursesCatalog(courseContainer) {
    if (!courseContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const courses = await response.json();

        if (!Array.isArray(courses) || courses.length === 0) {
            courseContainer.innerHTML = `
                <div class="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p class="text-slate-500 dark:text-slate-400 font-medium">No active courses published yet.</p>
                </div>`;
            return;
        }

        courseContainer.innerHTML = courses.map(course => `
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-lg transition flex flex-col justify-between group relative overflow-hidden">
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <span class="px-3 py-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
                            ${escapeHtml(course.category || 'General')}
                        </span>
                        <span class="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">Free Access</span>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2">
                        ${escapeHtml(course.title)}
                    </h3>
                    <p class="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-6">
                        ${escapeHtml(course.description)}
                    </p>
                </div>
                <button onclick="handleViewCourse('${escapeHtml(String(course.id))}')" 
                        class="w-full py-3 px-4 bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md">
                    View Course Details
                    <span>&rarr;</span>
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading courses catalog:', error);
        courseContainer.innerHTML = `
            <div class="col-span-full text-center py-8 text-rose-600 font-medium">
                Failed to load courses. Please check your server connection.
            </div>`;
    }
}

function handleViewCourse(courseId) {
    if (!courseId) return;
    window.location.href = `course.html?id=${encodeURIComponent(courseId)}`;
}

function escapeHtml(text) {
    return text ? String(text).replace(/[&<>"']/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[match])) : '';
}