// ---------- KEYBOARD SHORTCUTS ----------

// Helper function to find visible buttons
function findFirstVisible(selectors) {
    const elements = document.querySelectorAll(selectors);
    for (const el of elements) {
        if (el.offsetParent !== null) return el;
    }
    return null;
}

// ---------- MAIN ENTER KEY HANDLER ----------
document.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter' || e.shiftKey) return;

    const activeEl = document.activeElement;
    const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT'
    );

    // 1. UNLOCK OVERLAY (PIN Screen)
    const lockOverlay = document.getElementById('lockOverlay');
    if (lockOverlay && lockOverlay.classList.contains('show')) {
        e.preventDefault();
        // If the recovery key form is showing, submit that. Otherwise, submit PIN.
        if (document.getElementById('lockRecoveryRow').style.display !== 'none') {
            submitRecoveryKey();
        } else if (document.getElementById('lockNewPinRow').style.display !== 'none') {
            saveRecoveredPin();
        } else {
            unlockNavigation();
        }
        return;
    }

    // 2. PRODUCT MODAL
    const productModal = document.getElementById('productModal');
    if (productModal && productModal.classList.contains('show')) {
        e.preventDefault();
        saveProduct();
        return;
    }

    // 3. SECURITY SETTINGS MODAL
    const securityModal = document.getElementById('securityModal');
    if (securityModal && securityModal.classList.contains('show')) {
        e.preventDefault();
        saveSecuritySettings();
        return;
    }

    // 4. EXPENSES MODAL
    const expenseModal = document.getElementById('expenseModal');
    if (expenseModal && expenseModal.classList.contains('show')) {
        e.preventDefault();
        saveExpense();
        return;
    }
    
    // 5. REVOKE MODAL
    const revokeModal = document.getElementById('revokeModal');
    if (revokeModal && revokeModal.classList.contains('show')) {
        e.preventDefault();
        revokeSale();
        return;
    }

    // 6. ACCOUNT CREATION MODAL
    const accountModal = document.getElementById('accountModal');
    if (accountModal && accountModal.classList.contains('show')) {
        e.preventDefault();
        createAccount();
        return;
    }

    // 7. CHANGE PIN MODAL
    const pinModal = document.getElementById('pinModal');
    if (pinModal && pinModal.classList.contains('show')) {
        e.preventDefault();
        changePin();
        return;
    }

    // 8. POS SCREEN (No modal open, just typing/searching on POS)
    // If they aren't typing in a field, hitting Enter completes the sale.
    if (!isTyping && document.getElementById('page-pos').classList.contains('active')) {
        e.preventDefault();
        completeSale();
        return;
    }
});


// ---------- ESCAPE KEY HANDLER ----------
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal.show');
        if (openModals.length > 0) {
            e.preventDefault();
            const topModal = openModals[openModals.length - 1]; 
            
            if (topModal.id === 'calcModal') {
                closeCalculator();
            } else {
                topModal.classList.remove('show');
            }
            return;
        }
    }
});


// ---------- SHIFT+ENTER FOR SALE ----------
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.shiftKey) {
        const active = document.activeElement;
        const isField = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
        if (isField) return; 

        e.preventDefault();
        if (document.getElementById('page-pos').classList.contains('active')) {
            completeSale();
        }
    }
});


// ---------- CTRL+C TO OPEN CALCULATOR ----------
document.addEventListener('keydown', (e) => {
    const isCtrlC = (e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C');
    if (!isCtrlC) return;

    const active = document.activeElement;
    const inTextField = active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.isContentEditable
    );
    const hasSelection =
        inTextField && (
            (typeof active.selectionStart === 'number' &&
             active.selectionStart !== active.selectionEnd) ||
            window.getSelection().toString().length > 0
        );
    if (hasSelection) return;

    e.preventDefault();

    const modal = document.getElementById('calcModal');
    if (modal.classList.contains('show')) {
        closeCalculator();
    } else {
        openCalculator();
    }
});


// ---------- CLICK OUTSIDE TO CLOSE MODALS ----------
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        if (e.target.id === 'calcModal') {
            closeCalculator();
        } else {
            e.target.classList.remove('show');
        }
    }
});

// ---------- SHIFT+ENTER TO COMPLETE SALE ----------
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        completeSale();
    }
});