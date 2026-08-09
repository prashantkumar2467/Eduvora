document.addEventListener('DOMContentLoaded', async () => {
    const courseContainer = document.getElementById('course-container');
    const navActions = document.getElementById('nav-actions');
    const logoLink = document.getElementById('logo-link');

    // 1. Safe LocalStorage Parsing
    let token = localStorage.getItem('eduvora_token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('eduvora_user') || 'null');
    } catch (e) {
        console.error('Invalid user data in localStorage:', e);
        localStorage.removeItem('eduvora_user');
    }

    // 2. Dynamic Navigation Routing
    if (token && user) {
        if (logoLink) logoLink.href = 'dashboard.html';
        if (navActions) {
            navActions.innerHTML = `
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Welcome, <strong class="text-slate-900 dark:text-white">${escapeHtml(user.name)}</strong></span>
                <a href="dashboard.html" class="px-4 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition shadow">
                    Go to Dashboard
                </a>
            `;
        }
    } else {
        if (logoLink) logoLink.href = 'index.html';
    }

    // 3. Fetch Courses with Robust Error Handling
    try {
        const response = await fetch('/api/courses');
        
        // Fix: Check HTTP status code
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const courses = await response.json();

        if (!courseContainer) return; // Prevent null pointer exception

        if (!Array.isArray(courses) || courses.length === 0) {
            courseContainer.innerHTML = `
                <div class="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p class="text-slate-500 dark:text-slate-400 font-medium">No active courses published yet.</p>
                </div>`;
            return;
        }

        // Fix: Wrapped '${course.id}' in single quotes to support alphanumeric IDs
        courseContainer.innerHTML = courses.map(course => `
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group relative overflow-hidden">
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <span class="px-3 py-1 text-xs font-bold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-full border border-sky-100 dark:border-sky-800">
                            ${escapeHtml(course.category || 'General')}
                        </span>
                        <span class="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">Available</span>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors mb-2">
                        ${escapeHtml(course.title)}
                    </h3>
                    <p class="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-6">
                        ${escapeHtml(course.description)}
                    </p>
                </div>
                <button onclick="handleViewCourse('${escapeHtml(String(course.id))}')" 
                        class="w-full py-3 px-4 bg-slate-900 dark:bg-sky-600 hover:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2">
                    View Course Details
                    <span>&rarr;</span>
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error fetching courses:', error);
        if (courseContainer) {
            courseContainer.innerHTML = `
                <div class="col-span-full text-center py-8 text-rose-600 font-medium">
                    Failed to load courses. Please check your server connection.
                </div>`;
        }
    }
});

function handleViewCourse(courseId) {
    if (!courseId) return;
    window.location.href = `course.html?id=${encodeURIComponent(courseId)}`;
}

function escapeHtml(text) {
    return text ? String(text).replace(/[&<>"']/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[match])) : '';
}