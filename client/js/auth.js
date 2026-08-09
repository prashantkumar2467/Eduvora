document.addEventListener('DOMContentLoaded', () => {

    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden');
            element.style.display = 'block';
        }
    }

    function hideError(element) {
        if (element) {
            element.classList.add('hidden');
            element.style.display = 'none';
        }
    }

    // Shared Login Logic
    async function handleLogin(email, password, errorElement) {
        hideError(errorElement);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store Auth Token and User Details
                localStorage.setItem('eduvora_token', data.token);
                localStorage.setItem('eduvora_user', JSON.stringify(data.user));

                alert('Login successful!');

                // Check Role: Route to Admin Dashboard or Student Dashboard
                if (data.user && data.user.role === 'admin') {
                    window.location.href = '/admin/dashboard.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            } else {
                showError(errorElement, data.message || 'Invalid email or password.');
            }
        } catch (error) {
            console.error('Login Error:', error);
            showError(errorElement, 'Server connection error. Please try again.');
        }
    }

    // Shared Register Logic
    async function handleRegister(name, email, password, errorElement) {
        hideError(errorElement);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Please log in.');

                if (typeof window.acGoLogin === 'function') {
                    window.acGoLogin();
                } else {
                    window.location.href = 'login.html';
                }
            } else {
                showError(errorElement, data.message || 'Registration failed.');
            }
        } catch (error) {
            console.error('Registration Error:', error);
            showError(errorElement, 'Server connection error.');
        }
    }

    // Global Event Delegation for Submissions
    document.addEventListener('submit', (e) => {
        const formId = e.target.id;

        if (formId === 'modal-login-form' || formId === 'login-form') {
            e.preventDefault();
            const emailInput = document.getElementById('modal-login-email') || document.getElementById('email');
            const passInput = document.getElementById('modal-login-password') || document.getElementById('password');
            const errBox = document.getElementById('modal-login-error') || document.getElementById('error-message');
            
            if (emailInput && passInput) {
                handleLogin(emailInput.value, passInput.value, errBox);
            }
        }

        if (formId === 'modal-register-form' || formId === 'register-form') {
            e.preventDefault();
            const nameInput = document.getElementById('modal-reg-name') || document.getElementById('name');
            const emailInput = document.getElementById('modal-reg-email') || document.getElementById('email');
            const passInput = document.getElementById('modal-reg-password') || document.getElementById('password');
            const errBox = document.getElementById('modal-register-error') || document.getElementById('error-message');

            if (nameInput && emailInput && passInput) {
                handleRegister(nameInput.value, emailInput.value, passInput.value, errBox);
            }
        }
    });
});