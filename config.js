// ============================================
// WIFI CODES - CONFIGURATION FILE
// ============================================

const AppConfig = {
    // App Information
    appName: "Lunar Link",
    version: "1.0.0",
    
    // Security Configuration
    // DO NOT store actual password here in production
    // This is obfuscated but not truly secure
    auth: {
        // Root password encoded (decode on login)
        rootKey: btoa("Tond#1100"), // Base64 encoded
        sessionTimeout: 3600000, // 1 hour in milliseconds
    },
    
    // Speed Tiers
    speedTiers: [
        { value: "16mbps", label: "16 Mbps", color: "#3b82f6" },
        { value: "20mbps", label: "20 Mbps", color: "#8b5cf6" },
        { value: "50mbps", label: "50 Mbps", color: "#ec4899" }
    ],
    
    // Alert Thresholds
    alerts: {
        lowCodeThreshold: 5, // Show warning when codes ≤ 5
        criticalThreshold: 2  // Show critical alert when codes ≤ 2
    },
    
    // Date Format Settings
    dateFormat: {
        passwordFormat: "ddmmmyyyy", // e.g., 16feb2026
        displayFormat: "DD-MM-YYYY",
        months: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    },
    
    // Storage Keys (for localStorage)
    storageKeys: {
        codes: "wifiCodes",
        history: "wifiHistory",
        batches: "wifiBatches",
        stats: "wifiStats",
        theme: "appTheme",
        session: "userSession"
    },
    
    // UI Settings
    ui: {
        animationDuration: 300, // milliseconds
        maxRetries: 3, // Max "NO" clicks before forcing selection
        modalZIndex: 1000
    }
};

// Helper function to get decoded root password
function getRootPassword() {
    try {
        return atob(AppConfig.auth.rootKey);
    } catch (error) {
        console.error("Configuration error");
        return null;
    }
}

// Helper function to generate today's date password
function getTodayPassword() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = AppConfig.dateFormat.months[today.getMonth()];
    const year = today.getFullYear();
    
    return `${day}${month}${year}`; // e.g., 16feb2026
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppConfig, getRootPassword, getTodayPassword };
}