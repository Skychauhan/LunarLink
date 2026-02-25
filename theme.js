// ============================================
// WIFI CODES - THEME MANAGER
// Dark mode toggle and persistence
// ============================================

const ThemeManager = {
    
    // Theme constants
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },
    
    // Initialize theme on page load
    init() {
        // Get saved theme or default to light
        const savedTheme = this.getSavedTheme();
        this.applyTheme(savedTheme);
        
        // Create theme toggle button if it doesn't exist
        this.createToggleButton();
    },
    
    // Get theme from localStorage
    getSavedTheme() {
        try {
            const saved = localStorage.getItem(AppConfig.storageKeys.theme);
            return saved || this.THEMES.LIGHT;
        } catch (error) {
            console.error("Error loading theme:", error);
            return this.THEMES.LIGHT;
        }
    },
    
    // Save theme to localStorage
    saveTheme(theme) {
        try {
            localStorage.setItem(AppConfig.storageKeys.theme, theme);
        } catch (error) {
            console.error("Error saving theme:", error);
        }
    },
    
    // Apply theme to document
    applyTheme(theme) {
        const html = document.documentElement;
        
        if (theme === this.THEMES.DARK) {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
        
        this.saveTheme(theme);
        this.updateToggleButton(theme);
    },
    
    // Get current theme
    getCurrentTheme() {
        const html = document.documentElement;
        return html.hasAttribute('data-theme') ? this.THEMES.DARK : this.THEMES.LIGHT;
    },
    
    // Toggle between light and dark
    toggle() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === this.THEMES.LIGHT 
            ? this.THEMES.DARK 
            : this.THEMES.LIGHT;
        
        this.applyTheme(newTheme);
    },
    
    // Create theme toggle button
    createToggleButton() {
        // Check if button already exists
        if (document.getElementById('theme-toggle')) {
            this.updateToggleButton(this.getCurrentTheme());
            return;
        }
        
        // Create toggle container
        const toggleContainer = document.createElement('div');
        toggleContainer.id = 'theme-toggle';
        toggleContainer.className = 'theme-toggle';
        
        // Create button
        const button = document.createElement('button');
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Toggle dark mode');
        button.title = 'Toggle dark mode';
        
        // Add icons
        const sunIcon = `
            <svg class="theme-icon sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
        `;
        
        const moonIcon = `
            <svg class="theme-icon moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
        `;
        
        button.innerHTML = sunIcon + moonIcon;
        
        // Add click event
        button.addEventListener('click', () => {
            this.toggle();
        });
        
        toggleContainer.appendChild(button);
        document.body.appendChild(toggleContainer);
        
        // Update initial state
        this.updateToggleButton(this.getCurrentTheme());
    },
    
    // Update toggle button appearance
    updateToggleButton(theme) {
        const button = document.querySelector('.theme-toggle-btn');
        if (!button) return;
        
        const sunIcon = button.querySelector('.sun-icon');
        const moonIcon = button.querySelector('.moon-icon');
        
        if (theme === this.THEMES.DARK) {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }
};

// Initialize theme when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});
