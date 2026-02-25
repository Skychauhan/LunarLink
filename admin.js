// ============================================
// WIFI CODES - ADMIN DASHBOARD
// CSV upload, statistics, and alerts
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    
    // Check authentication (admin only)
    if (!Auth.requireAdmin()) {
        return;
    }
    
    // Initialize dashboard
    init();
});

// ========================================
// INITIALIZATION
// ========================================

async function init() {
    // Load statistics
    await updateStatistics();
    
    // Load available codes count
    await updateAvailableCodes();
    
    // Check for low code alerts
    await checkLowCodeAlerts();
    
    // Load recent batches
    await updateRecentBatches();
    
    // Setup event listeners
    setupEventListeners();
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // File input change
    const csvFile = document.getElementById('csvFile');
    if (csvFile) {
        csvFile.addEventListener('change', handleFilePreview);
    }
    
    // Upload form submit
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    
    // Clear all data button
    const btnClearAll = document.getElementById('btnClearAll');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', handleClearAll);
    }
}

// ========================================
// STATISTICS UPDATE
// ========================================

async function updateStatistics() {
    const stats = await Storage.getStats();
    const codes = await Storage.getCodes();
    
    // Total codes available
    const totalCodes = codes.filter(c => c.status === 'unused').length;
    const el = document.getElementById('statTotalCodes');
    if (el) el.textContent = totalCodes;
    
    // Codes used
    const el2 = document.getElementById('statCodesUsed');
    if (el2) el2.textContent = stats.codesUsed || 0;
    
    // Batches uploaded
    const batches = await Storage.getBatches();
    const el3 = document.getElementById('statBatches');
    if (el3) el3.textContent = batches.length;
    
    // Success rate
    const totalClicks = stats.yesClicks + stats.noClicks;
    const successRate = totalClicks > 0 
        ? Math.round((stats.yesClicks / totalClicks) * 100) 
        : 0;
    const el4 = document.getElementById('statSuccessRate');
    if (el4) el4.textContent = successRate + '%';
}

// ========================================
// AVAILABLE CODES UPDATE
// ========================================

async function updateAvailableCodes() {
    const codes16 = await Storage.getUnusedCodesBySpeed('16mbps');
    const codes20 = await Storage.getUnusedCodesBySpeed('20mbps');
    const codes50 = await Storage.getUnusedCodesBySpeed('50mbps');
    
    const count16 = document.getElementById('count16mbps');
    const count20 = document.getElementById('count20mbps');
    const count50 = document.getElementById('count50mbps');
    
    if (count16) count16.textContent = codes16.length;
    if (count20) count20.textContent = codes20.length;
    if (count50) count50.textContent = codes50.length;
}

// ========================================
// LOW CODE ALERTS
// ========================================

async function checkLowCodeAlerts() {
    const alerts = await Storage.getLowCodeAlerts();
    const alertContainer = document.getElementById('alertsContainer');
    
    if (!alertContainer) return;
    
    // Clear existing alerts
    alertContainer.innerHTML = '';
    
    if (alerts.length === 0) return;
    
    // Create alert for each low code warning
    alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = alert.level === 'critical' 
            ? 'alert alert-error mb-3' 
            : 'alert alert-warning mb-3';
        
        const icon = alert.level === 'critical' 
            ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <circle cx="12" cy="12" r="10"/>
                 <line x1="15" y1="9" x2="9" y2="15"/>
                 <line x1="9" y1="9" x2="15" y2="15"/>
               </svg>`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                 <line x1="12" y1="9" x2="12" y2="13"/>
                 <line x1="12" y1="17" x2="12.01" y2="17"/>
               </svg>`;
        
        const message = alert.level === 'critical'
            ? `<strong>CRITICAL:</strong> Only ${alert.count} ${alert.speed} codes remaining!`
            : `<strong>Warning:</strong> ${alert.speed} codes are running low (${alert.count} remaining)`;
        
        alertDiv.innerHTML = `${icon}<span>${message}</span>`;
        alertContainer.appendChild(alertDiv);
    });
}

// ========================================
// RECENT BATCHES TABLE
// ========================================

async function updateRecentBatches() {
    const batches = await Storage.getBatches();
    const tableBody = document.getElementById('batchesTableBody');
    
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (batches.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-tertiary);">
                    No batches uploaded yet
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    const sortedBatches = [...batches].sort((a, b) => {
        return new Date(b.uploadedOn) - new Date(a.uploadedOn);
    });
    
    // Show last 5 batches
    sortedBatches.slice(0, 5).forEach(batch => {
        const row = document.createElement('tr');
        
        // Get speed label and color
        const speedTier = AppConfig.speedTiers.find(t => t.value === batch.speed);
        const speedLabel = speedTier ? speedTier.label : batch.speed;
        const speedColor = speedTier ? speedTier.color : 'var(--text-primary)';
        
        // Format date
        const date = new Date(batch.uploadedOn);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) + ', ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        row.innerHTML = `
            <td style="font-weight: 600; color: var(--text-primary);">${batch.batchName}</td>
            <td>
                <span class="badge" style="background-color: ${speedColor}20; color: ${speedColor}; border: 1px solid ${speedColor}40;">
                    ${speedLabel}
                </span>
            </td>
            <td style="color: var(--text-secondary);">${batch.totalCodes} codes</td>
            <td style="color: var(--text-tertiary);">${formattedDate}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// ========================================
// FILE PREVIEW
// ========================================

function handleFilePreview(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const uploadMessage = document.getElementById('uploadMessage');
    
    parseFile(file).then(codes => {
        if (codes.length > 0) {
            uploadMessage.className = 'alert alert-info';
            uploadMessage.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>✅ Found <strong>${codes.length}</strong> valid code(s) in file</span>
            `;
            uploadMessage.classList.remove('hidden');
        } else {
            uploadMessage.className = 'alert alert-error';
            uploadMessage.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>⚠️ No valid codes found. Check your file format.</span>
            `;
            uploadMessage.classList.remove('hidden');
        }
    });
}

// ========================================
// UNIVERSAL FILE PARSER
// Handles: .csv, .txt, .xlsx, .xls
// ========================================

function parseFile(file) {
    return new Promise((resolve) => {
        const fileName = file.name.toLowerCase();
        
        // Excel files (.xlsx or .xls)
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    resolve(extractCodesFromRows(rows));
                } catch (err) {
                    console.error('Excel parse error:', err);
                    resolve([]);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            // CSV or TXT
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve(parseCSV(e.target.result));
            };
            reader.readAsText(file);
        }
    });
}

// ========================================
// EXTRACT CODES FROM EXCEL ROWS
// ========================================

function extractCodesFromRows(rows) {
    const codes = [];
    
    rows.forEach(row => {
        if (!row || row.length === 0) return;
        const cells = row.map(cell => String(cell || '').trim()).filter(c => c.length > 0);
        if (cells.length === 0) return;
        
        // Skip header rows
        const first = cells[0].toLowerCase();
        if (['code', 'codes', 'wifi', 'status', 'unused'].includes(first) && cells.length === 1) return;
        
        // "unused" in col A, code in col B (two separate columns)
        if (cells.length >= 2 && cells[0].toLowerCase() === 'unused') {
            codes.push(cells[1]);
        // "unused   code" in single cell
        } else if (cells.length === 1 && cells[0].toLowerCase().includes('unused')) {
            const parts = cells[0].split(/[\t\s]+/);
            const code = parts.find(p => p.toLowerCase() !== 'unused' && p.length > 0);
            if (code) codes.push(code);
        // Plain code only
        } else {
            codes.push(cells[0]);
        }
    });
    
    return [...new Set(codes.filter(c => c.length > 0 && c.toLowerCase() !== 'unused'))];
}

// ========================================
// CSV / TXT PARSING
// ========================================

function parseCSV(content) {
    const lines = content.split(/\r?\n/);
    
    const codes = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !line.toLowerCase().startsWith('code'))
        .map(line => {
            // "unused    ssf09fg" (tab or spaces)
            if (line.toLowerCase().includes('unused')) {
                const parts = line.split(/[\t\s]+/);
                return parts.length > 1 ? parts[1].trim() : parts[0].trim();
            }
            // CSV: "ssf09fg,unused,..."
            if (line.includes(',')) {
                const p = line.split(',');
                return p.length > 1 ? p[1].trim() : p[0].trim();
            }
            return line.trim();
        })
        .filter(code => code.length > 0)
        .filter(code => code.toLowerCase() !== 'unused');
    
    return [...new Set(codes)];
}

// ========================================
// UPLOAD HANDLER
// ========================================

async function handleUpload(e) {
    e.preventDefault();
    
    // Get form values
    const batchName = document.getElementById('batchName').value.trim();
    const speed = document.getElementById('speedSelect').value;
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    // Validate
    if (!batchName || !speed || !file) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    // Check if batch name already exists
    const batches = await Storage.getBatches();
    const exists = batches.some(b => 
        b.batchName.toLowerCase() === batchName.toLowerCase()
    );
    
    if (exists) {
        if (!confirm(`A batch named "${batchName}" already exists. Do you want to continue?`)) {
            return;
        }
    }
    
    // Disable form
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = document.getElementById('uploadBtnText');
    submitBtn.disabled = true;
    btnText.textContent = 'Uploading...';
    
    try {
        // Parse file (handles CSV, TXT, XLSX, XLS)
        const codes = await parseFile(file);
        
        if (codes.length === 0) {
            showMessage('No valid codes found in file. Check format and try again.', 'error');
            submitBtn.disabled = false;
            btnText.textContent = 'Upload Batch';
            return;
        }
        
        // Add codes to Supabase
        const count = await Storage.addCodes(codes, batchName, speed);
        
        // Show success
        showMessage(`✅ Successfully uploaded ${count} codes to batch "${batchName}"`, 'success');
        
        // Reset form
        e.target.reset();
        document.getElementById('uploadMessage').classList.add('hidden');
        
        // Update dashboard
        await updateStatistics();
        await updateAvailableCodes();
        await checkLowCodeAlerts();
        await updateRecentBatches();
        
    } catch (error) {
        console.error('Upload error:', error);
        showMessage('Error uploading batch: ' + error.message, 'error');
    } finally {
        // Re-enable form
        submitBtn.disabled = false;
        btnText.textContent = 'Upload Batch';
    }
}

// ========================================
// CLEAR ALL DATA
// ========================================

async function handleClearAll() {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL codes, history, batches, and statistics. This action cannot be undone!\n\nAre you absolutely sure?')) {
        return;
    }
    
    // Double confirmation
    if (!confirm('This is your final warning. All data will be lost forever. Continue?')) {
        return;
    }
    
    // Clear all data via Supabase
    const cleared = await Storage.clearAll();
    
    if (cleared) {
        showMessage('All data has been cleared successfully', 'success');
        setTimeout(() => { window.location.reload(); }, 2000);
    } else {
        showMessage('Error clearing data', 'error');
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

function showMessage(message, type) {
    const uploadMessage = document.getElementById('uploadMessage');
    if (!uploadMessage) return;
    
    uploadMessage.classList.remove('hidden');
    uploadMessage.className = type === 'success' 
        ? 'alert alert-success' 
        : 'alert alert-error';
    
    const icon = type === 'success'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
             <polyline points="22 4 12 14.01 9 11.01"/>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="10"/>
             <line x1="15" y1="9" x2="9" y2="15"/>
             <line x1="9" y1="9" x2="15" y2="15"/>
           </svg>`;
    
    uploadMessage.innerHTML = `${icon}<span>${message}</span>`;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        uploadMessage.classList.add('hidden');
    }, 5000);
}
