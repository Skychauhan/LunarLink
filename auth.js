// ============================================
// WIFI CODES - AUTHENTICATION HANDLER
// Login validation and session management
// ============================================

const Auth = {
    
    // ========================================
    // LOGIN VALIDATION
    // ========================================
    
    validateLogin(password) {
        // Convert input to lowercase for comparison
        const input = password.toLowerCase().trim();
        
        // Check if it's root password
        const rootPassword = getRootPassword();
        if (password === rootPassword) {
            return { valid: true, type: 'root' };
        }
        
        // Check if it's today's date password
        const todayPassword = getTodayPassword().toLowerCase();
        if (input === todayPassword) {
            return { valid: true, type: 'user' };
        }
        
        // Invalid password
        return { valid: false, type: null };
    },
    
    // ========================================
    // SESSION MANAGEMENT
    // ========================================
    
    createSession(userType) {
        const session = {
            type: userType,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + AppConfig.auth.sessionTimeout).toISOString()
        };
        
        try {
            sessionStorage.setItem(AppConfig.storageKeys.session, JSON.stringify(session));
            return true;
        } catch (error) {
            console.error("Error creating session:", error);
            return false;
        }
    },
    
    getSession() {
        try {
            const session = sessionStorage.getItem(AppConfig.storageKeys.session);
            if (!session) return null;
            
            const parsed = JSON.parse(session);
            
            // Check if session expired
            const now = new Date();
            const expiresAt = new Date(parsed.expiresAt);
            
            if (now > expiresAt) {
                this.logout();
                return null;
            }
            
            return parsed;
        } catch (error) {
            console.error("Error reading session:", error);
            return null;
        }
    },
    
    isAuthenticated() {
        return this.getSession() !== null;
    },
    
    isAdmin() {
        const session = this.getSession();
        return session && session.type === 'root';
    },
    
    isUser() {
        const session = this.getSession();
        return session && session.type === 'user';
    },
    
    logout() {
        sessionStorage.removeItem(AppConfig.storageKeys.session);
        window.location.href = 'index.html';
    },
    
    // ========================================
    // PAGE ACCESS CONTROL
    // ========================================
    
    requireAuth(allowedTypes = ['user', 'root']) {
        const session = this.getSession();
        
        if (!session) {
            // Not authenticated
            window.location.href = 'index.html';
            return false;
        }
        
        if (!allowedTypes.includes(session.type)) {
            // Wrong user type
            if (session.type === 'root') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'user.html';
            }
            return false;
        }
        
        return true;
    },
    
    requireAdmin() {
        return this.requireAuth(['root']);
    },
    
    // ========================================
    // REDIRECT HELPERS
    // ========================================
    
    redirectToDashboard(userType) {
        if (userType === 'root') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'user.html';
        }
    }
};

// ========================================
// LOGIN PAGE HANDLER
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // Only run on login page
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    // Check if already logged in
    if (Auth.isAuthenticated()) {
        const session = Auth.getSession();
        Auth.redirectToDashboard(session.type);
        return;
    }
    
    // Get form elements
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    
    // Hide error on input
    passwordInput.addEventListener('input', () => {
        errorMessage.classList.add('hidden');
    });
    
    // Handle form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get password value
        const password = passwordInput.value;
        
        // Validate
        if (!password) {
            showError('Please enter a password');
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        
        // Simulate slight delay for better UX
        setTimeout(() => {
            const result = Auth.validateLogin(password);
            
            if (result.valid) {
                // Success - create session and redirect
                Auth.createSession(result.type);
                
                // Show success briefly before redirect
                btnText.textContent = 'Success!';
                btnText.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                
                setTimeout(() => {
                    Auth.redirectToDashboard(result.type);
                }, 300);
                
            } else {
                // Failed - show error
                showError('Invalid password. Please try again.');
                
                // Reset button
                submitBtn.disabled = false;
                btnText.textContent = 'Login';
                btnText.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                
                // Clear input
                passwordInput.value = '';
                passwordInput.focus();
            }
        }, 500);
    });
    
    // Helper function to show errors
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
    }
    
    // Focus password input on load
    passwordInput.focus();
});

// ========================================
// LOGOUT BUTTON HANDLER (For other pages)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtns = document.querySelectorAll('[data-logout]');
    
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (confirm('Are you sure you want to logout?')) {
                Auth.logout();
            }
        });
    });
});