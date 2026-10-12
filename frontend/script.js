// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// State management
let currentBillId = null;
let allBills = [];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadBills();
});

// ==================== BILL MANAGEMENT ====================

/**
 * Toggle the create bill form visibility
 */
function toggleCreateBillForm() {
    const form = document.getElementById('createBillForm');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        document.getElementById('billNumber').focus();
    }
}

/**
 * Create a new bill
 */
async function createBill(event) {
    event.preventDefault();

    const billNumber = document.getElementById('billNumber').value.trim();
    const customerName = document.getElementById('customerName').value.trim();

    if (!billNumber || !customerName) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/bills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bill_number: billNumber,
                customer_name: customerName,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create bill');
        }

        showNotification('Bill created successfully!', 'success');
        document.getElementById('billNumber').value = '';
        document.getElementById('customerName').value = '';
        toggleCreateBillForm();
        loadBills();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

/**
 * Load all bills from the API
 */
async function loadBills() {
    try {
        const response = await fetch(`${API_BASE_URL}/bills`);

        if (!response.ok) {
            throw new Error('Failed to load bills');
        }

        allBills = await response.json();
        displayBills();
    } catch (error) {
        showNotification(error.message, 'error');
        document.getElementById('billsList').innerHTML =
            '<p class="error">Failed to load bills</p>';
    }
}

/**
 * Display bills in the UI
 */
function displayBills() {
    const billsContainer = document.getElementById('billsList');

    if (allBills.length === 0) {
        billsContainer.innerHTML =
            '<p class="loading">No bills yet. Create your first bill!</p>';
        return;
    }

    billsContainer.innerHTML = allBills
        .map(
            (bill) => `
        <div class="bill-card" onclick="viewBillDetails(${bill.id})">
            <h3>${bill.bill_number}</h3>
            <div class="bill-card-content">
                <p><span class="bill-label">Customer:</span> <span class="bill-value">${bill.customer_name}</span></p>
                <p><span class="bill-label">Date:</span> <span class="bill-value">${new Date(bill.created_at).toLocaleDateString()}</span></p>
            </div>
            <div class="bill-card-total">
                Total: $${parseFloat(bill.total_amount).toFixed(2)}
            </div>
            <div class="bill-card-actions">
                <button class="btn btn-secondary" onclick="event.stopPropagation(); viewBillDetails(${bill.id})">View</button>
                <button class="btn btn-danger" onclick="event.stopPropagation(); deleteBill(${bill.id})">Delete</button>
            </div>
        </div>
    `
        )
        .join('');
}

/**
 * View bill details
 */
async function viewBillDetails(billId) {
    try {
        const response = await fetch(`${API_BASE_URL}/bills/${billId}`);

        if (!response.ok) {
            throw new Error('Failed to load bill details');
        }

        const bill = await response.json();
        currentBillId = billId;

        // Display bill details section
        document.getElementById('billDetailsSection').style.display = 'block';
        document.getElementById('billTitle').textContent = `${bill.bill_number} - ${bill.customer_name}`;

        // Display items
        displayItems(bill.items || []);

        // Update summary
        updateBillSummary(bill);

        // Scroll to details section
        document.getElementById('billDetailsSection').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

/**
 * Close bill details view
 */
function closeBillDetails() {
    currentBillId = null;
    document.getElementById('billDetailsSection').style.display = 'none';
    document.getElementById('itemName').value = '';
    document.getElementById('itemQuantity').value = '';
    document.getElementById('itemPrice').value = '';
}

/**
 * Delete a bill
 */
async function deleteBill(billId) {
    if (!confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/bills/${billId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete bill');
        }

        showNotification('Bill deleted successfully!', 'success');
        loadBills();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

/**
 * Delete current bill
 */
function deleteCurrentBill() {
    deleteBill(currentBillId);
    closeBillDetails();
}

/**
 * Edit current bill
 */
function editCurrentBill() {
    const bill = allBills.find((b) => b.id === currentBillId);
    if (bill) {
        document.getElementById('editCustomerName').value = bill.customer_name;
        document.getElementById('editBillModal').classList.remove('hidden');
    }
}

/**
 * Close edit bill modal
 */
function closeEditBillModal() {
    document.getElementById('editBillModal').classList.add('hidden');
}

/**
 * Submit bill edit
 */
async function submitEditBill(event) {
    event.preventDefault();

    const customerName = document.getElementById('editCustomerName').value.trim();

    if (!customerName) {
        showNotification('Please enter a customer name', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/bills/${currentBillId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ customer_name: customerName }),
        });

        if (!response.ok) {
            throw new Error('Failed to update bill');
        }

        showNotification('Bill updated successfully!', 'success');
        closeEditBillModal();
        loadBills();
        viewBillDetails(currentBillId);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// ==================== ITEM MANAGEMENT ====================

/**
 * Add an item to the bill
 */
async function addItem(event) {
    event.preventDefault();

    if (!currentBillId) {
        showNotification('Please select a bill first', 'error');
        return;
    }

    const itemName = document.getElementById('itemName').value.trim();
    const quantity = parseFloat(document.getElementById('itemQuantity').value);
    const unitPrice = parseFloat(document.getElementById('itemPrice').value);

    if (!itemName || isNaN(quantity) || isNaN(unitPrice) || quantity <= 0 || unitPrice < 0) {
        showNotification('Please fill in all fields with valid values', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/bills/${currentBillId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                item_name: itemName,
                quantity: quantity,
                unit_price: unitPrice,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to add item');
        }

        showNotification('Item added successfully!', 'success');
        document.getElementById('itemName').value = '';
        document.getElementById('itemQuantity').value = '';
        document.getElementById('itemPrice').value = '';

        // Reload bill details
        viewBillDetails(currentBillId);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

/**
 * Display items in the bill
 */
function displayItems(items) {
    const itemsContainer = document.getElementById('itemsList');

    if (items.length === 0) {
        itemsContainer.innerHTML = '<p class="loading">No items added yet. Add your first item!</p>';
        return;
    }

    itemsContainer.innerHTML = items
        .map(
            (item) => `
        <div class="item-card">
            <div class="item-info">
                <div class="item-name">${item.item_name}</div>
                <div class="item-details">
                    <div class="item-detail">
                        <span class="item-detail-label">Quantity:</span> ${parseFloat(item.quantity).toFixed(2)}
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-label">Unit Price:</span> $${parseFloat(item.unit_price).toFixed(2)}
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-label">Subtotal:</span> $${parseFloat(item.subtotal).toFixed(2)}
                    </div>
                </div>
            </div>
            <div class="item-subtotal">$${parseFloat(item.subtotal).toFixed(2)}</div>
            <div class="item-actions">
                <button class="btn btn-warning" onclick="editItem(${item.id}, '${item.item_name}', ${item.quantity}, ${item.unit_price})">Edit</button>
                <button class="btn btn-danger" onclick="deleteItem(${item.id})">Delete</button>
            </div>
        </div>
    `
        )
        .join('');
}

/**
 * Edit an item
 */
function editItem(itemId, itemName, quantity, unitPrice) {
    const newQuantity = prompt('Enter new quantity:', quantity);
    if (newQuantity === null) return;

    const newUnitPrice = prompt('Enter new unit price:', unitPrice);
    if (newUnitPrice === null) return;

    updateItem(itemId, itemName, parseFloat(newQuantity), parseFloat(newUnitPrice));
}

/**
 * Update an item
 */
async function updateItem(itemId, itemName, quantity, unitPrice) {
    if (isNaN(quantity) || isNaN(unitPrice) || quantity <= 0 || unitPrice < 0) {
        showNotification('Please enter valid values', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                item_name: itemName,
                quantity: quantity,
                unit_price: unitPrice,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to update item');
        }

        showNotification('Item updated successfully!', 'success');
        viewBillDetails(currentBillId);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

/**
 * Delete an item
 */
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete item');
        }

        showNotification('Item deleted successfully!', 'success');
        viewBillDetails(currentBillId);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Update bill summary
 */
function updateBillSummary(bill) {
    const items = bill.items || [];
    const totalAmount = parseFloat(bill.total_amount).toFixed(2);

    document.getElementById('totalItems').textContent = items.length;
    document.getElementById('totalAmount').textContent = `$${totalAmount}`;
}

/**
 * Print bill
 */
function printBill() {
    window.print();
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${
            type === 'error'
                ? '#f44336'
                : type === 'success'
                  ? '#4CAF50'
                  : type === 'warning'
                    ? '#ff9800'
                    : '#2196F3'
        };
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-in-out;
    `;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
