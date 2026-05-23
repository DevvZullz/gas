// Point to our Vercel Serverless API
const API_URL = '/api/members';

// Application State
let members = [];

// Cache DOM Elements
const memberForm = document.getElementById('member-form');
const tableBody = document.getElementById('members-table-body');
const searchInput = document.getElementById('search-input');

// Counters
const totalCountEl = document.getElementById('total-count');
const activeCountEl = document.getElementById('active-count');
const deptCountEl = document.getElementById('dept-count');

// Initialize Dashboard Application
async function initApp() {
    // Register Event Listeners
    memberForm.addEventListener('submit', handleAddMember);
    searchInput.addEventListener('input', handleSearch);

    // Fetch permanent data from database on load
    await fetchMembersFromDatabase();
}

// Fetch data from the live Vercel KV Database
async function fetchMembersFromDatabase() {
    try {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">Loading secure records...</td></tr>`;
        const response = await fetch(API_URL);
        if (response.ok) {
            members = await response.json();
            renderDashboard();
        } else {
            throw new Error('Failed to download state');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 32px;">Database connection failed. Check your Vercel KV setup.</td></tr>`;
    }
}

// Save data permanently to the Vercel KV Database
async function saveToDatabase() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(members)
        });
        if (!response.ok) throw new Error('Data sync rejected');
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Warning: Connection lost. Changes might not save permanently.');
    }
}

// Synchronize Application State and UI
function renderDashboard(dataToRender = members) {
    updateCounters();
    renderTable(dataToRender);
}

function updateCounters() {
    totalCountEl.textContent = members.length;
    activeCountEl.textContent = members.filter(m => m.active).length;
    const uniqueDepts = [...new Set(members.map(m => m.department))];
    deptCountEl.textContent = uniqueDepts.length;
}

function renderTable(targetData) {
    tableBody.innerHTML = '';
    
    if (targetData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No members found matching parameters.</td></tr>`;
        return;
    }

    targetData.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="member-identity">
                    <p>${escapeHTML(member.name)}</p>
                    <span>NIS: ${escapeHTML(member.nis)}</span>
                </div>
            </td>
            <td>${escapeHTML(member.classDepartment)}</td>
            <td><strong>${escapeHTML(member.role)}</strong></td>
            <td>${escapeHTML(member.department)}</td>
            <td>
                <span class="badge ${member.active ? 'badge-active' : 'badge-inactive'}" onclick="toggleStatus('${member.id}')">
                    ${member.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon btn-delete" onclick="deleteMember('${member.id}')" title="Delete Member">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Add New Member Handler
async function handleAddMember(e) {
    e.preventDefault();

    const newMember = {
        id: Date.now().toString(),
        name: document.getElementById('student-name').value.trim(),
        nis: document.getElementById('student-nis').value.trim(),
        classDepartment: document.getElementById('student-class').value.trim(),
        role: document.getElementById('student-role').value,
        department: document.getElementById('student-dept').value,
        active: true
    };

    members.push(newMember);
    renderDashboard();
    memberForm.reset();
    
    // Send to database
    await saveToDatabase();
}

// Toggle Operational Active Status
window.toggleStatus = async function(id) {
    members = members.map(member => {
        if (member.id === id) {
            return { ...member, active: !member.active };
        }
        return member;
    });
    renderDashboard();
    await saveToDatabase();
};

// Delete Target Data Object
window.deleteMember = async function(id) {
    if (confirm('Are you completely sure you want to remove this member record?')) {
        members = members.filter(member => member.id !== id);
        renderDashboard();
        await saveToDatabase();
    }
};

function handleSearch(e) {
    const term = e.target.value.toLowerCase().trim();
    const filtered = members.filter(member => 
        member.name.toLowerCase().includes(term) ||
        member.nis.toLowerCase().includes(term) ||
        member.classDepartment.toLowerCase().includes(term) ||
        member.role.toLowerCase().includes(term) ||
        member.department.toLowerCase().includes(term)
    );
    renderTable(filtered);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

document.addEventListener('DOMContentLoaded', initApp);
