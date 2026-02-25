// ============================================
// WIFI CODES - USER DASHBOARD
// Code selection and validation logic
// ============================================

let currentCode = null;
let currentSpeed = null;
let retryCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    
    // Check authentication
    if (!Auth.requireAuth(['user', 'root'])) {
        return;
    }
    
    // Initialize page
    init();
});

// ========================================
// INITIALIZATION
// ========================================

async function init() {
    // Update available code counts
    await updateAvailableCounts();
    
    // Setup event listeners
    setupEventListeners();
}

// ========================================
// UPDATE AVAILABLE COUNTS
// ========================================

async function updateAvailableCounts() {
    for (const tier of AppConfig.speedTiers) {
        const codes = await Storage.getUnusedCodesBySpeed(tier.value);
        const countElement = document.querySelector(`[data-available="${tier.value}"] .available-count`);
        
        if (countElement) {
            countElement.textContent = codes.length;
            
            // Add warning if low
            const availableDiv = document.querySelector(`[data-available="${tier.value}"]`);
            if (codes.length <= AppConfig.alerts.lowCodeThreshold) {
                availableDiv.style.color = 'var(--warning)';
            } else {
                availableDiv.style.color = 'var(--text-tertiary)';
            }
            
            // Disable button if no codes
            const button = document.querySelector(`[data-get-code="${tier.value}"]`);
            if (codes.length === 0) {
                button.disabled = true;
                button.textContent = 'No Codes Available';
            }
        }
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Get code buttons
    const codeButtons = document.querySelectorAll('[data-get-code]');
    codeButtons.forEach(btn => {
        btn.addEventListener('click', handleGetCode);
    });
    
    // Modal buttons
    const btnYes = document.getElementById('btnYes');
    const btnNo = document.getElementById('btnNo');
    const btnCloseModal = document.getElementById('btnCloseModal');
    
    if (btnYes) btnYes.addEventListener('click', handleYes);
    if (btnNo) btnNo.addEventListener('click', handleNo);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    
    // History button (show restricted message) - ONLY when clicked
    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) {
        historyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showRestrictedModal();
        });
    }
    
    // Close restricted modal button
    const btnCloseRestricted = document.getElementById('btnCloseRestricted');
    if (btnCloseRestricted) {
        btnCloseRestricted.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeRestrictedModal();
        });
    }
    
    // Close code modal on overlay click
    const codeModal = document.getElementById('codeModal');
    if (codeModal) {
        const codeModalOverlay = codeModal.querySelector('.modal-overlay');
        if (codeModalOverlay) {
            codeModalOverlay.addEventListener('click', (e) => {
                if (e.target === codeModalOverlay) {
                    closeModal();
                }
            });
        }
    }
    
    // Close restricted modal on overlay click
    const restrictedModal = document.getElementById('restrictedModal');
    if (restrictedModal) {
        const restrictedModalOverlay = restrictedModal.querySelector('.modal-overlay');
        if (restrictedModalOverlay) {
            restrictedModalOverlay.addEventListener('click', (e) => {
                if (e.target === restrictedModalOverlay) {
                    closeRestrictedModal();
                }
            });
        }
    }
}

// ========================================
// GET CODE HANDLER
// ========================================

async function handleGetCode(e) {
    const speed = e.currentTarget.getAttribute('data-get-code');
    
    // Reset retry count
    retryCount = 0;
    
    // Fetch and show code
    await showCodeForSpeed(speed);
}

async function showCodeForSpeed(speed) {
    currentSpeed = speed;
    
    // Get random code
    const codeObj = await Storage.getRandomCode(speed);
    
    if (!codeObj) {
        showNoCodesAlert(speed);
        return;
    }
    
    currentCode = codeObj;
    
    // Show modal with code
    displayCodeModal(codeObj.code, speed);
}

// ========================================
// DISPLAY CODE MODAL
// ========================================

function displayCodeModal(code, speed) {
    const modal = document.getElementById('codeModal');
    const codeDisplay = document.getElementById('codeDisplay');
    const speedBadge = document.getElementById('modalSpeedBadge');
    
    // Set speed badge
    const speedTier = AppConfig.speedTiers.find(t => t.value === speed);
    if (speedBadge && speedTier) {
        speedBadge.textContent = speedTier.label;
        speedBadge.style.background = `linear-gradient(135deg, ${speedTier.color}, ${speedTier.color}dd)`;
    }
    
    // Display code with animation
    if (codeDisplay) {
        codeDisplay.textContent = code;
        // Re-trigger animation
        codeDisplay.style.animation = 'none';
        setTimeout(() => {
            codeDisplay.style.animation = 'zoomIn 0.3s ease-out';
        }, 10);
    }
    
    // Show modal
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// ========================================
// YES BUTTON - CODE WORKED
// ========================================

async function handleYes() {
    if (!currentCode || !currentSpeed) return;
    
    // Mark code as used
    const success = await Storage.markCodeAsUsed(currentCode.code, currentSpeed);
    
    if (success) {
        // Show success message
        showSuccessMessage();
        
        // Update available counts
        await updateAvailableCounts();
        
        // Close modal after delay
        setTimeout(() => {
            closeModal();
            currentCode = null;
            currentSpeed = null;
            retryCount = 0;
        }, 1500);
    } else {
        alert('Error saving code. Please try again.');
    }
}

function showSuccessMessage() {
    const codeDisplay = document.getElementById('codeDisplay');
    const modalQuestion = document.querySelector('.modal-question');
    const modalActions = document.querySelector('.modal-actions');
    
    if (codeDisplay) {
        codeDisplay.innerHTML = `
            <div style="color: var(--success);">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block;">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <div style="margin-top: 1rem; font-size: 1.25rem;">Success!</div>
            </div>
        `;
    }
    
    if (modalQuestion) modalQuestion.style.display = 'none';
    if (modalActions) modalActions.style.display = 'none';
}

// ========================================
// NO BUTTON - CODE DIDN'T WORK
// ========================================

async function handleNo() {
    if (!currentCode || !currentSpeed) return;
    
    // Remove the failed code
    await Storage.removeCode(currentCode.code, currentSpeed);
    
    // Increment retry count
    retryCount++;
    
    // Check if reached max retries
    if (retryCount >= AppConfig.ui.maxRetries) {
        showMaxRetriesMessage();
        return;
    }
    
    // Get new code immediately
    const newCodeObj = await Storage.getRandomCode(currentSpeed);
    
    if (!newCodeObj) {
        showNoMoreCodesMessage();
        return;
    }
    
    // Update current code
    currentCode = newCodeObj;
    
    // Display new code with animation
    const codeDisplay = document.getElementById('codeDisplay');
    if (codeDisplay) {
        // Fade out
        codeDisplay.style.opacity = '0';
        
        setTimeout(() => {
            codeDisplay.textContent = newCodeObj.code;
            codeDisplay.style.animation = 'none';
            
            // Fade in
            setTimeout(() => {
                codeDisplay.style.opacity = '1';
                codeDisplay.style.animation = 'zoomIn 0.3s ease-out';
            }, 50);
        }, 200);
    }
    
    // Update available counts
    updateAvailableCounts();
}

// ========================================
// ALERT MESSAGES
// ========================================

function showNoCodesAlert(speed) {
    const speedTier = AppConfig.speedTiers.find(t => t.value === speed);
    const speedLabel = speedTier ? speedTier.label : speed;
    
    alert(`No ${speedLabel} codes available. Please contact the administrator.`);
}

function showNoMoreCodesMessage() {
    const codeDisplay = document.getElementById('codeDisplay');
    const modalQuestion = document.querySelector('.modal-question');
    const modalActions = document.querySelector('.modal-actions');
    
    if (codeDisplay) {
        codeDisplay.innerHTML = `
            <div style="color: var(--error); font-size: 1rem;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block;">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <div style="margin-top: 1rem;">No more codes available</div>
                <div style="font-size: 0.875rem; margin-top: 0.5rem;">Please contact administrator</div>
            </div>
        `;
    }
    
    if (modalQuestion) modalQuestion.style.display = 'none';
    if (modalActions) modalActions.style.display = 'none';
    
    // Auto close after 3 seconds
    setTimeout(() => {
        closeModal();
        updateAvailableCounts();
    }, 3000);
}

function showMaxRetriesMessage() {
    const codeDisplay = document.getElementById('codeDisplay');
    const modalQuestion = document.querySelector('.modal-question');
    const modalActions = document.querySelector('.modal-actions');
    
    if (codeDisplay) {
        codeDisplay.innerHTML = `
            <div style="color: var(--warning); font-size: 1rem;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block;">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div style="margin-top: 1rem;">Maximum retries reached</div>
                <div style="font-size: 0.875rem; margin-top: 0.5rem;">Please contact administrator</div>
            </div>
        `;
    }
    
    if (modalQuestion) modalQuestion.style.display = 'none';
    if (modalActions) modalActions.style.display = 'none';
    
    // Auto close after 3 seconds
    setTimeout(() => {
        closeModal();
        updateAvailableCounts();
    }, 3000);
}

// ========================================
// MODAL CONTROLS
// ========================================

function closeModal() {
    const modal = document.getElementById('codeModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Reset modal content
    setTimeout(() => {
        const codeDisplay = document.getElementById('codeDisplay');
        const modalQuestion = document.querySelector('.modal-question');
        const modalActions = document.querySelector('.modal-actions');
        
        if (codeDisplay) codeDisplay.textContent = 'LOADING...';
        if (modalQuestion) modalQuestion.style.display = 'block';
        if (modalActions) modalActions.style.display = 'grid';
        
        currentCode = null;
        currentSpeed = null;
        retryCount = 0;
    }, 300);
}

// ========================================
// RESTRICTED ACCESS MODAL
// ========================================

function showRestrictedModal() {
    const modal = document.getElementById('restrictedModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeRestrictedModal() {
    const modal = document.getElementById('restrictedModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}
