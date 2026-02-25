// ============================================
// WIFI CODES - HISTORY PAGE
// Search, filter, and display used codes
// ============================================

let allHistory = [];
let filteredHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    
    // Check admin authentication
    if (!Auth.requireAdmin()) {
        return;
    }
    
    // Initialize history page
    init();
});

// ========================================
// INITIALIZATION
// ========================================

async function init() {
    // Load history
    await loadHistory();
    
    // Update summary stats
    updateSummaryStats();
    
    // Display history table
    displayHistory(allHistory);
    
    // Setup event listeners
    setupEventListeners();
}

// ========================================
// LOAD HISTORY
// ========================================

async function loadHistory() {
    allHistory = await Storage.getHistory();
    filteredHistory = [...allHistory];
    
    // Sort by date (newest first)
    allHistory.sort((a, b) => {
        return new Date(b.usedOn) - new Date(a.usedOn);
    });
    
    filteredHistory = [...allHistory];
}

// ========================================
// SUMMARY STATISTICS
// ========================================

function updateSummaryStats() {
    const history = allHistory;
    
    // Total used codes
    document.getElementById('totalHistory').textContent = history.length;
    
    // Count by speed
    const count16 = history.filter(h => h.speed === '16mbps').length;
    const count20 = history.filter(h => h.speed === '20mbps').length;
    const count50 = history.filter(h => h.speed === '50mbps').length;
    
    document.getElementById('total16').textContent = count16;
    document.getElementById('total20').textContent = count20;
    document.getElementById('total50').textContent = count50;
}

// ========================================
// DISPLAY HISTORY TABLE
// ========================================

function displayHistory(historyData) {
    const tableBody = document.getElementById('historyTableBody');
    const emptyState = document.getElementById('emptyState');
    const noHistoryState = document.getElementById('noHistoryState');
    const table = document.getElementById('historyTable');
    
    // Update counts
    document.getElementById('shownCount').textContent = historyData.length;
    document.getElementById('totalCount').textContent = allHistory.length;
    
    // Check if no history at all
    if (allHistory.length === 0) {
        table.classList.add('hidden');
        emptyState.classList.add('hidden');
        noHistoryState.classList.remove('hidden');
        return;
    }
    
    // Check if filtered result is empty
    if (historyData.length === 0) {
        table.classList.add('hidden');
        emptyState.classList.remove('hidden');
        noHistoryState.classList.add('hidden');
        return;
    }
    
    // Show table
    table.classList.remove('hidden');
    emptyState.classList.add('hidden');
    noHistoryState.classList.add('hidden');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Populate table
    historyData.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Get speed label and color
        const speedTier = AppConfig.speedTiers.find(t => t.value === item.speed);
        const speedLabel = speedTier ? speedTier.label : item.speed;
        const speedColor = speedTier ? speedTier.color : 'var(--text-primary)';
        
        // Format date
        const formattedDate = formatDate(item.usedOn);
        
        row.innerHTML = `
            <td style="font-weight: 600; color: var(--text-tertiary);">${index + 1}</td>
            <td style="font-family: 'Courier New', monospace; font-weight: 600; color: var(--text-primary);">
                ${escapeHtml(item.code)}
            </td>
            <td style="color: var(--text-secondary);">
                ${escapeHtml(item.batch)}
            </td>
            <td>
                <span class="badge" style="background-color: ${speedColor}20; color: ${speedColor}; border: 1px solid ${speedColor}40;">
                    ${speedLabel}
                </span>
            </td>
            <td style="color: var(--text-secondary);">
                ${formattedDate}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// ========================================
// SEARCH & FILTER
// ========================================

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const speedFilter = document.getElementById('speedFilter');
    const clearBtn = document.getElementById('clearFilters');
    
    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    // Speed filter
    if (speedFilter) {
        speedFilter.addEventListener('change', applyFilters);
    }
    
    // Clear filters
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const speedFilter = document.getElementById('speedFilter').value;
    
    // Start with all history
    filteredHistory = [...allHistory];
    
    // Apply search filter
    if (searchTerm) {
        filteredHistory = filteredHistory.filter(item => {
            return item.code.toLowerCase().includes(searchTerm) ||
                   item.batch.toLowerCase().includes(searchTerm) ||
                   item.speed.toLowerCase().includes(searchTerm);
        });
    }
    
    // Apply speed filter
    if (speedFilter) {
        filteredHistory = filteredHistory.filter(item => {
            return item.speed === speedFilter;
        });
    }
    
    // Display filtered results
    displayHistory(filteredHistory);
}

function clearFilters() {
    // Clear inputs
    document.getElementById('searchInput').value = '';
    document.getElementById('speedFilter').value = '';
    
    // Reset filtered history
    filteredHistory = [...allHistory];
    
    // Redisplay
    displayHistory(filteredHistory);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatDate(isoString) {
    try {
        const date = new Date(isoString);
        
        // Format: 16 Feb 2026, 14:30
        const day = date.getDate();
        const month = date.toLocaleString('en', { month: 'short' });
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day} ${month} ${year}, ${hours}:${minutes}`;
    } catch (error) {
        return 'Invalid Date';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// EXPORT FUNCTIONALITY (Optional)
// ========================================

// You can add export to CSV feature later if needed
function exportToCSV() {
    if (allHistory.length === 0) {
        alert('No history to export');
        return;
    }
    
    // CSV headers
    let csv = 'Code,Batch Name,Speed,Used On\n';
    
    // Add rows
    allHistory.forEach(item => {
        const date = formatDate(item.usedOn);
        csv += `"${item.code}","${item.batch}","${item.speed}","${date}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wifi-codes-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}