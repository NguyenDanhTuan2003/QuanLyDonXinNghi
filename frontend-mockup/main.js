/* eslint-disable */
// Mock Data
const leaveRequests = [
    { id: 1, name: 'Alice Jensen', avatar: 'https://i.pravatar.cc/150?img=47', start: '2026-10-26', end: '2026-10-28', reason: 'Family Vacation', status: 'approved' },
    { id: 2, name: 'Carlia Dassen', avatar: 'https://i.pravatar.cc/150?img=32', start: '2026-11-01', end: '2026-11-04', reason: 'Medical Leave', status: 'pending' },
    { id: 3, name: 'Haran Felsar', avatar: 'https://i.pravatar.cc/150?img=11', start: '2026-10-15', end: '2026-10-17', reason: 'Personal Appointment', status: 'approved' },
    { id: 4, name: 'Aman Master', avatar: 'https://i.pravatar.cc/150?img=12', start: '2026-09-28', end: '2026-09-30', reason: 'Moving House', status: 'cancelled' },
    { id: 5, name: 'Sathina Rersen', avatar: 'https://i.pravatar.cc/150?img=5', start: '2026-09-28', end: '2026-09-30', reason: 'Family Vacation', status: 'cancelled' }
];

// DOM Elements
const tableBody = document.getElementById('tableBody');
const btnCreateRequest = document.getElementById('btnCreateRequest');
const modalOverlay = document.getElementById('createModal');
const btnCancel = document.getElementById('btnCancel');
const leaveForm = document.getElementById('leaveForm');

// Render Table
const renderTable = () => {
    tableBody.innerHTML = '';
    leaveRequests.forEach(req => {
        const tr = document.createElement('tr');
        
        // Capitalize status for display
        const statusText = req.status.charAt(0).toUpperCase() + req.status.slice(1);
        
        tr.innerHTML = `
            <td>
                <div class="employee-cell">
                    <img src="${req.avatar}" alt="${req.name}">
                    ${req.name}
                </div>
            </td>
            <td>${req.start}</td>
            <td>${req.end}</td>
            <td>${req.reason}</td>
            <td>
                <span class="badge ${req.status}">${statusText}</span>
            </td>
        `;
        tableBody.appendChild(tr);
    });
};

// Modal Logic
const toggleModal = (show) => {
    if (show) {
        modalOverlay.classList.add('show');
    } else {
        modalOverlay.classList.remove('show');
    }
};

// Event Listeners
btnCreateRequest.addEventListener('click', () => toggleModal(true));
btnCancel.addEventListener('click', () => toggleModal(false));

// Form Submission (Mock async/await logic)
leaveForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Simulate API Call
    const btnSubmit = leaveForm.querySelector('.btn-submit');
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = 'Submitting...';
    btnSubmit.disabled = true;

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert('Leave Request Submitted Successfully!');
        toggleModal(false);
        leaveForm.reset();
    } catch (error) {
        alert('An error occurred');
    } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
    }
});

// Init
renderTable();
