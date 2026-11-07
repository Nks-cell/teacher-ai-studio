const express = require('express');
const router = express.Router();

const adminHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Bright Future Academy</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --primary: #4f46e5;
            --secondary: #ec4899;
            --bg-dark: #0f172a;
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }
        body {
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
        }
        .glass {
            background: var(--glass-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        #login-view { display: flex; justify-content: center; align-items: center; width: 100%; height: 100vh; }
        .login-card { padding: 2rem; width: 350px; text-align: center; }
        .login-card input { width: 100%; padding: 10px; margin: 10px 0; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.1); color: white; box-sizing: border-box; }
        .login-card button { width: 100%; padding: 10px; border-radius: 8px; border: none; background: var(--primary); color: white; cursor: pointer; font-weight: bold; }
        #dashboard-view { display: none; width: 100%; }
        .sidebar { width: 250px; padding: 20px; border-right: 1px solid var(--glass-border); height: 100vh; position: fixed; overflow-y: auto; box-sizing: border-box; }
        .sidebar h2 { margin-top: 0; color: var(--secondary); }
        .sidebar ul { list-style: none; padding: 0; }
        .sidebar li { margin-bottom: 15px; }
        .sidebar a { color: var(--text-main); text-decoration: none; font-weight: 500; cursor: pointer; display: block; padding: 8px; border-radius: 8px; transition: background 0.3s; }
        .sidebar a:hover, .sidebar a.active { background: rgba(255,255,255,0.1); color: var(--secondary); }
        .main-content { margin-left: 250px; padding: 30px; flex-grow: 1; box-sizing: border-box; max-width: calc(100% - 250px); }
        .section { display: none; }
        .section.active { display: block; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: var(--glass-bg); backdrop-filter: blur(12px); border-radius: 12px; overflow: hidden; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--glass-border); }
        th { background: rgba(255,255,255,0.05); font-weight: 600; color: var(--secondary); }
        tr:hover { background: rgba(255,255,255,0.05); }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { padding: 25px; text-align: center; }
        .stat-card h3 { margin: 0; font-size: 2.5rem; color: var(--secondary); }
        .stat-card p { margin: 10px 0 0; color: var(--text-muted); font-size: 1.1rem; }
        .btn { padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: opacity 0.3s; }
        .btn:hover { opacity: 0.9; }
        .btn-danger { background: #ef4444; }
        .btn-sm { padding: 6px 12px; font-size: 0.9rem; }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; justify-content: center; align-items: center; }
        .modal-content { background: var(--bg-dark); padding: 30px; border-radius: 16px; width: 500px; max-width: 90%; max-height: 90vh; overflow-y: auto; border: 1px solid var(--glass-border); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h3 { margin: 0; color: var(--secondary); }
        .close-btn { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 8px; color: var(--text-muted); }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white; box-sizing: border-box; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); }
        .chart-container { background: var(--glass-bg); padding: 20px; border-radius: 16px; border: 1px solid var(--glass-border); margin-bottom: 30px; }
        .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div id="login-view">
        <div class="glass login-card">
            <h2 style="color: var(--secondary); margin-bottom: 20px;">Admin Login</h2>
            <form id="login-form">
                <input type="email" id="email" placeholder="Admin Email" required>
                <input type="password" id="password" placeholder="Password" required>
                <button type="submit" style="margin-top: 20px;">Login to Dashboard</button>
            </form>
            <p id="login-error" style="color: #ef4444; display: none; margin-top: 15px;"></p>
        </div>
    </div>

    <div id="dashboard-view">
        <div class="glass sidebar">
            <h2>Bright Future</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: -10px; margin-bottom: 30px;">Admin Panel</p>
            <ul id="nav-links">
                <li><a onclick="showSection('overview')" class="active">Overview</a></li>
                <li><a onclick="showSection('students')">Students</a></li>
                <li><a onclick="showSection('fees')">Fees</a></li>
                <li><a onclick="showSection('teachers')">Teachers</a></li>
                <li><a onclick="showSection('classes')">Classes</a></li>
                <li><a onclick="showSection('results')">Results</a></li>
                <li><a onclick="showSection('notes')">Daily Notes</a></li>
                <li><a onclick="showSection('enquiries')">Enquiries</a></li>
                <li><a onclick="showSection('announcements')">Announcements</a></li>
                <li style="margin-top: 30px;"><a onclick="logout()" style="color: #ef4444;">Logout</a></li>
            </ul>
        </div>
        
        <div class="main-content">
            <div id="overview" class="section active">
                <div class="header-actions"><h2>Dashboard Overview</h2></div>
                <div class="card-grid" id="stats-grid">
                    <div class="glass stat-card"><h3>...</h3><p>Total Students</p></div>
                    <div class="glass stat-card"><h3>...</h3><p>Total Teachers</p></div>
                    <div class="glass stat-card"><h3>...</h3><p>Total Classes</p></div>
                    <div class="glass stat-card"><h3>...</h3><p>Pending Enquiries</p></div>
                </div>
                <div class="chart-container"><canvas id="feeChart" height="100"></canvas></div>
            </div>
            
            <div id="students" class="section">
                <div class="header-actions"><h2>Student Management</h2><button class="btn" onclick="openModal('student-modal')">+ Add Student</button></div>
                <table id="students-table"><thead><tr><th>Name</th><th>Class</th><th>Roll No</th><th>Mobile</th><th>Status</th><th>Actions</th></tr></thead><tbody></tbody></table>
            </div>

            <div id="fees" class="section">
                <div class="header-actions"><h2>Fees Management</h2></div>
                <div class="form-group" style="max-width: 300px;"><input type="text" id="fee-search" placeholder="Search student by name..." onkeyup="searchFeeStudents()"></div>
                <table id="fees-table"><thead><tr><th>Student</th><th>Class</th><th>Monthly Fee</th><th>Actions</th></tr></thead><tbody></tbody></table>
            </div>

            <div id="teachers" class="section">
                <div class="header-actions"><h2>Teacher Management</h2><button class="btn" onclick="openModal('teacher-modal')">+ Add Teacher</button></div>
                <table id="teachers-table"><thead><tr><th>Name</th><th>Designation</th><th>Subjects</th><th>Experience</th><th>Actions</th></tr></thead><tbody></tbody></table>
            </div>

            <div id="classes" class="section">
                <div class="header-actions"><h2>Class Management</h2><button class="btn" onclick="openModal('class-modal')">+ Add Class</button></div>
                <table id="classes-table"><thead><tr><th>Class Name</th><th>Subjects</th><th>Batch Timings</th><th>Actions</th></tr></thead><tbody></tbody></table>
            </div>

            <div id="results" class="section">
                <div class="header-actions"><h2>Result Management</h2><button class="btn" onclick="openModal('result-modal')">+ Add Result</button></div>
                <table id="results-table"><thead><tr><th>Student Name</th><th>Class</th><th>Roll No</th><th>Percentage</th><th>Status</th><th>Actions</th></tr></thead><tbody></tbody></table>
            </div>

            <div id="notes" class="section">
                <div class="header-actions"><h2>Daily Notes</h2><button class="btn" onclick="openModal('note-modal')">+ Add Note</button></div>
                <table id="notes-table"><thead><tr><th>Title</th><th>Class</th><th>Subject</th><th>Date</th><th>Actions</th></tr></thead><tbody></tbody></table>
            </div>

            <div id="enquiries" class="section">
                <div class="header-actions"><h2>Admission Enquiries</h2></div>
                <table id="enquiries-table"><thead><tr><th>Date</th><th>Student Name</th><th>Class Interested</th><th>Mobile</th><th>Status</th><th>Actions</th></tr></thead><tbody></tbody></table>
            </div>

            <div id="announcements" class="section">
                <div class="header-actions"><h2>Announcements</h2><button class="btn" onclick="openModal('announcement-modal')">+ Add Announcement</button></div>
                <table id="announcements-table"><thead><tr><th>Title</th><th>Date</th><th>Important</th><th>Status</th><th>Actions</th></tr></thead><tbody></tbody></table>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <div id="student-modal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="student-modal-title">Add Student</h3><button class="close-btn" onclick="closeModal('student-modal')">&times;</button></div><form id="student-form"><input type="hidden" id="student-id"><div class="form-group"><label>Name</label><input type="text" id="student-name" required></div><div class="form-group"><label>Class</label><input type="text" id="student-class" required></div><div class="form-group"><label>Roll Number</label><input type="text" id="student-roll"></div><div class="form-group"><label>Parent Name</label><input type="text" id="student-parent"></div><div class="form-group"><label>Mobile</label><input type="text" id="student-mobile" required></div><div class="form-group"><label>Monthly Fee (₹)</label><input type="number" id="student-fee" required></div><button type="submit" class="btn">Save Student</button></form></div></div>
    
    <div id="fee-modal" class="modal"><div class="modal-content"><div class="modal-header"><h3>Record Payment</h3><button class="close-btn" onclick="closeModal('fee-modal')">&times;</button></div><form id="fee-form"><input type="hidden" id="fee-student-id"><div class="form-group"><label>Amount (₹)</label><input type="number" id="fee-amount" required></div><div class="form-group"><label>Payment Method</label><select id="fee-method"><option>Cash</option><option>Online</option><option>Cheque</option></select></div><div class="form-group"><label>Month/Description</label><input type="text" id="fee-desc" required></div><button type="submit" class="btn">Record Payment</button></form><h4 style="margin-top: 20px;">Payment History</h4><table id="fee-history-table" style="font-size: 0.9rem;"><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Desc</th></tr></thead><tbody></tbody></table></div></div>
    
    <div id="teacher-modal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="teacher-modal-title">Add Teacher</h3><button class="close-btn" onclick="closeModal('teacher-modal')">&times;</button></div><form id="teacher-form"><input type="hidden" id="teacher-id"><div class="form-group"><label>Name</label><input type="text" id="teacher-name" required></div><div class="form-group"><label>Designation</label><input type="text" id="teacher-designation" required></div><div class="form-group"><label>Qualification</label><input type="text" id="teacher-qualification"></div><div class="form-group"><label>Experience (Years)</label><input type="text" id="teacher-experience"></div><div class="form-group"><label>Subjects</label><input type="text" id="teacher-subjects"></div><div class="form-group"><label>Photo URL</label><input type="text" id="teacher-photo"></div><div class="form-group"><label>Biography</label><textarea id="teacher-bio" rows="3"></textarea></div><button type="submit" class="btn">Save Teacher</button></form></div></div>
    
    <div id="class-modal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="class-modal-title">Add Class</h3><button class="close-btn" onclick="closeModal('class-modal')">&times;</button></div><form id="class-form"><input type="hidden" id="class-id"><div class="form-group"><label>Class Name</label><input type="text" id="class-name" required></div><div class="form-group"><label>Subjects (comma separated)</label><input type="text" id="class-subjects"></div><div class="form-group"><label>Batch Timings</label><input type="text" id="class-timings"></div><div class="form-group"><label>Monthly Fee</label><input type="number" id="class-fee"></div><button type="submit" class="btn">Save Class</button></form></div></div>
    
    <div id="result-modal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="result-modal-title">Add Result</h3><button class="close-btn" onclick="closeModal('result-modal')">&times;</button></div><form id="result-form"><input type="hidden" id="result-id"><div class="form-group"><label>Student Name</label><input type="text" id="result-name" required></div><div class="form-group"><label>Class (10 or 12)</label><select id="result-class"><option>10</option><option>12</option></select></div><div class="form-group"><label>Roll Number</label><input type="text" id="result-roll" required></div><div class="form-group"><label>Total Marks</label><input type="number" id="result-marks" required></div><div class="form-group"><label>Percentage</label><input type="number" step="0.01" id="result-percent" required></div><div class="form-group"><label>Academic Year</label><input type="text" id="result-year" required></div><div class="form-group"><label>Status</label><select id="result-status"><option>Published</option><option>Draft</option></select></div><button type="submit" class="btn">Save Result</button></form></div></div>
    
    <div id="note-modal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="note-modal-title">Add Note</h3><button class="close-btn" onclick="closeModal('note-modal')">&times;</button></div><form id="note-form"><input type="hidden" id="note-id"><div class="form-group"><label>Title</label><input type="text" id="note-title" required></div><div class="form-group"><label>Class</label><input type="text" id="note-class" required></div><div class="form-group"><label>Subject</label><input type="text" id="note-subject" required></div><div class="form-group"><label>Teacher</label><input type="text" id="note-teacher"></div><div class="form-group"><label>Document URL (PDF)</label><input type="url" id="note-url" required></div><button type="submit" class="btn">Save Note</button></form></div></div>
    
    <div id="announcement-modal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="announcement-modal-title">Add Announcement</h3><button class="close-btn" onclick="closeModal('announcement-modal')">&times;</button></div><form id="announcement-form"><input type="hidden" id="announcement-id"><div class="form-group"><label>Title</label><input type="text" id="announcement-title" required></div><div class="form-group"><label>Content</label><textarea id="announcement-content" rows="4" required></textarea></div><div class="form-group"><label>Important</label><select id="announcement-important"><option value="false">No</option><option value="true">Yes</option></select></div><button type="submit" class="btn">Save Announcement</button></form></div></div>
    
    <div id="enquiry-modal" class="modal"><div class="modal-content"><div class="modal-header"><h3>Enquiry Details</h3><button class="close-btn" onclick="closeModal('enquiry-modal')">&times;</button></div><div id="enquiry-details" style="margin-bottom: 20px;"></div><form id="enquiry-form"><input type="hidden" id="enquiry-id"><div class="form-group"><label>Status</label><select id="enquiry-status"><option>Pending</option><option>Approved</option><option>Rejected</option></select></div><div class="form-group"><label>Internal Remarks</label><textarea id="enquiry-remarks" rows="3"></textarea></div><button type="submit" class="btn">Update Enquiry</button></form></div></div>

    <script>
        const api = async (url, options = {}) => {
            const res = await fetch(url, options);
            if(res.status === 401) {
                document.getElementById('login-view').style.display = 'flex';
                document.getElementById('dashboard-view').style.display = 'none';
                throw new Error('Unauthorized');
            }
            return res;
        };

        async function checkAuth() {
            try {
                const res = await api('/api/auth/me');
                if (res.ok) {
                    document.getElementById('login-view').style.display = 'none';
                    document.getElementById('dashboard-view').style.display = 'flex';
                    showSection('overview');
                }
            } catch(e) {}
        }
        checkAuth();

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            if (res.ok) checkAuth();
            else { document.getElementById('login-error').innerText = 'Invalid credentials'; document.getElementById('login-error').style.display = 'block'; }
        });

        async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); window.location.reload(); }

        function showSection(id) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            document.querySelectorAll('#nav-links a').forEach(a => a.classList.remove('active'));
            event && event.target && event.target.classList.add('active');
            if (id === 'overview') loadDashboard(); else if (id === 'students') loadStudents(); else if (id === 'fees') loadFees(); else if (id === 'teachers') loadTeachers(); else if (id === 'classes') loadClasses(); else if (id === 'results') loadResults(); else if (id === 'notes') loadNotes(); else if (id === 'enquiries') loadEnquiries(); else if (id === 'announcements') loadAnnouncements();
        }

        function openModal(id) { document.getElementById(id).style.display = 'flex'; }
        function closeModal(id) { document.getElementById(id).style.display = 'none'; }

        let feeChartInstance = null;
        async function loadDashboard() {
            const res = await api('/api/dashboard/stats');
            if (res.ok) {
                const data = await res.json();
                document.getElementById('stats-grid').innerHTML = \`<div class="glass stat-card"><h3>\${data.students}</h3><p>Total Students</p></div><div class="glass stat-card"><h3>\${data.teachers}</h3><p>Total Teachers</p></div><div class="glass stat-card"><h3>\${data.classes}</h3><p>Total Classes</p></div><div class="glass stat-card"><h3>\${data.enquiries}</h3><p>Pending Enquiries</p></div>\`;
                const ctx = document.getElementById('feeChart').getContext('2d');
                if(feeChartInstance) feeChartInstance.destroy();
                feeChartInstance = new Chart(ctx, { type: 'line', data: { labels: data.chart.labels, datasets: [{ label: 'Fee Collection (₹)', data: data.chart.data, borderColor: '#ec4899', backgroundColor: 'rgba(236, 72, 153, 0.2)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } }, scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } } } });
            }
        }

        function generateTable(id, data, columns, actions) {
            document.querySelector(\`#\${id} tbody\`).innerHTML = data.map(item => \`<tr>\${columns.map(col => \`<td>\${item[col] || ''}</td>\`).join('')}<td>\${actions(item)}</td></tr>\`).join('');
        }

        let allStudents = [];
        async function loadStudents() {
            const res = await api('/api/students');
            if (res.ok) {
                allStudents = await res.json();
                generateTable('students-table', allStudents, ['name', 'class', 'rollNumber', 'mobile', 'status'], (s) => \`<button class="btn btn-sm" onclick="editStudent('\${s._id}')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteStudent('\${s._id}')">Delete</button>\`);
            }
        }
        document.getElementById('student-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('student-id').value;
            const data = { name: document.getElementById('student-name').value, class: document.getElementById('student-class').value, rollNumber: document.getElementById('student-roll').value, parentName: document.getElementById('student-parent').value, mobile: document.getElementById('student-mobile').value, monthlyFee: document.getElementById('student-fee').value };
            await api(id ? \`/api/students/\${id}\` : '/api/students', { method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            closeModal('student-modal'); loadStudents();
        });
        function editStudent(id) {
            const s = allStudents.find(x => x._id === id);
            document.getElementById('student-id').value = s._id; document.getElementById('student-name').value = s.name; document.getElementById('student-class').value = s.class; document.getElementById('student-roll').value = s.rollNumber; document.getElementById('student-parent').value = s.parentName; document.getElementById('student-mobile').value = s.mobile; document.getElementById('student-fee').value = s.monthlyFee;
            document.getElementById('student-modal-title').innerText = 'Edit Student'; openModal('student-modal');
        }
        async function deleteStudent(id) { if(confirm('Delete student?')) { await api(\`/api/students/\${id}\`, { method: 'DELETE' }); loadStudents(); } }

        async function loadFees() { if(!allStudents.length) await loadStudents(); renderFees(allStudents); }
        function searchFeeStudents() {
            const q = document.getElementById('fee-search').value.toLowerCase();
            renderFees(allStudents.filter(s => s.name.toLowerCase().includes(q) || (s.rollNumber && s.rollNumber.toLowerCase().includes(q))));
        }
        function renderFees(students) { generateTable('fees-table', students, ['name', 'class', 'monthlyFee'], (s) => \`<button class="btn btn-sm" onclick="openFeeModal('\${s._id}')">Record Payment</button>\`); }
        async function openFeeModal(id) {
            document.getElementById('fee-student-id').value = id; document.getElementById('fee-amount').value = ''; document.getElementById('fee-desc').value = ''; openModal('fee-modal');
            const res = await api(\`/api/fees/\${id}\`);
            if(res.ok) {
                const history = await res.json();
                document.querySelector('#fee-history-table tbody').innerHTML = history.map(h => \`<tr><td>\${new Date(h.paymentDate).toLocaleDateString()}</td><td>₹\${h.amount}</td><td>\${h.paymentMethod}</td><td>\${h.description}</td></tr>\`).join('');
            }
        }
        document.getElementById('fee-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = { studentId: document.getElementById('fee-student-id').value, amount: document.getElementById('fee-amount').value, paymentMethod: document.getElementById('fee-method').value, description: document.getElementById('fee-desc').value };
            await api('/api/fees/payment', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            openFeeModal(data.studentId);
        });

        let allTeachers = [];
        async function loadTeachers() {
            const res = await api('/api/teachers');
            if (res.ok) {
                allTeachers = await res.json();
                generateTable('teachers-table', allTeachers, ['name', 'designation', 'subjects', 'experience'], (t) => \`<button class="btn btn-sm" onclick="editTeacher('\${t._id}')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteTeacher('\${t._id}')">Delete</button>\`);
            }
        }
        document.getElementById('teacher-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('teacher-id').value;
            const data = { name: document.getElementById('teacher-name').value, designation: document.getElementById('teacher-designation').value, qualification: document.getElementById('teacher-qualification').value, experience: document.getElementById('teacher-experience').value, subjects: document.getElementById('teacher-subjects').value, photoUrl: document.getElementById('teacher-photo').value, biography: document.getElementById('teacher-bio').value };
            await api(id ? \`/api/teachers/\${id}\` : '/api/teachers', { method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            closeModal('teacher-modal'); loadTeachers();
        });
        function editTeacher(id) {
            const t = allTeachers.find(x => x._id === id);
            document.getElementById('teacher-id').value = t._id; document.getElementById('teacher-name').value = t.name; document.getElementById('teacher-designation').value = t.designation; document.getElementById('teacher-qualification').value = t.qualification; document.getElementById('teacher-experience').value = t.experience; document.getElementById('teacher-subjects').value = t.subjects; document.getElementById('teacher-photo').value = t.photoUrl; document.getElementById('teacher-bio').value = t.biography;
            document.getElementById('teacher-modal-title').innerText = 'Edit Teacher'; openModal('teacher-modal');
        }
        async function deleteTeacher(id) { if(confirm('Delete teacher?')) { await api(\`/api/teachers/\${id}\`, { method: 'DELETE' }); loadTeachers(); } }

        let allClasses = [];
        async function loadClasses() {
            const res = await api('/api/classes');
            if (res.ok) {
                allClasses = await res.json();
                generateTable('classes-table', allClasses, ['name', 'subjects', 'timings'], (c) => \`<button class="btn btn-sm" onclick="editClass('\${c._id}')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteClass('\${c._id}')">Delete</button>\`);
            }
        }
        document.getElementById('class-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('class-id').value;
            const data = { name: document.getElementById('class-name').value, subjects: document.getElementById('class-subjects').value, timings: document.getElementById('class-timings').value, monthlyFee: document.getElementById('class-fee').value };
            await api(id ? \`/api/classes/\${id}\` : '/api/classes', { method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            closeModal('class-modal'); loadClasses();
        });
        function editClass(id) {
            const c = allClasses.find(x => x._id === id);
            document.getElementById('class-id').value = c._id; document.getElementById('class-name').value = c.name; document.getElementById('class-subjects').value = c.subjects; document.getElementById('class-timings').value = c.timings; document.getElementById('class-fee').value = c.monthlyFee;
            document.getElementById('class-modal-title').innerText = 'Edit Class'; openModal('class-modal');
        }
        async function deleteClass(id) { if(confirm('Delete class?')) { await api(\`/api/classes/\${id}\`, { method: 'DELETE' }); loadClasses(); } }

        let allResults = [];
        async function loadResults() {
            const res = await api('/api/results');
            if (res.ok) {
                allResults = await res.json();
                generateTable('results-table', allResults, ['studentName', 'class', 'rollNumber', 'percentage', 'status'], (r) => \`<button class="btn btn-sm" onclick="editResult('\${r._id}')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteResult('\${r._id}')">Delete</button>\`);
            }
        }
        document.getElementById('result-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('result-id').value;
            const data = { studentName: document.getElementById('result-name').value, class: document.getElementById('result-class').value, rollNumber: document.getElementById('result-roll').value, totalMarks: document.getElementById('result-marks').value, percentage: document.getElementById('result-percent').value, academicYear: document.getElementById('result-year').value, status: document.getElementById('result-status').value };
            await api(id ? \`/api/results/\${id}\` : '/api/results', { method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            closeModal('result-modal'); loadResults();
        });
        function editResult(id) {
            const r = allResults.find(x => x._id === id);
            document.getElementById('result-id').value = r._id; document.getElementById('result-name').value = r.studentName; document.getElementById('result-class').value = r.class; document.getElementById('result-roll').value = r.rollNumber; document.getElementById('result-marks').value = r.totalMarks; document.getElementById('result-percent').value = r.percentage; document.getElementById('result-year').value = r.academicYear; document.getElementById('result-status').value = r.status;
            document.getElementById('result-modal-title').innerText = 'Edit Result'; openModal('result-modal');
        }
        async function deleteResult(id) { if(confirm('Delete result?')) { await api(\`/api/results/\${id}\`, { method: 'DELETE' }); loadResults(); } }

        let allNotes = [];
        async function loadNotes() {
            const res = await api('/api/notes');
            if (res.ok) {
                allNotes = await res.json();
                generateTable('notes-table', allNotes, ['title', 'class', 'subject', 'date'], (n) => \`<button class="btn btn-sm" onclick="editNote('\${n._id}')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteNote('\${n._id}')">Delete</button>\`);
            }
        }
        document.getElementById('note-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('note-id').value;
            const data = { title: document.getElementById('note-title').value, class: document.getElementById('note-class').value, subject: document.getElementById('note-subject').value, teacher: document.getElementById('note-teacher').value, documentUrl: document.getElementById('note-url').value, date: new Date().toISOString().split('T')[0] };
            await api(id ? \`/api/notes/\${id}\` : '/api/notes', { method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            closeModal('note-modal'); loadNotes();
        });
        function editNote(id) {
            const n = allNotes.find(x => x._id === id);
            document.getElementById('note-id').value = n._id; document.getElementById('note-title').value = n.title; document.getElementById('note-class').value = n.class; document.getElementById('note-subject').value = n.subject; document.getElementById('note-teacher').value = n.teacher; document.getElementById('note-url').value = n.documentUrl;
            document.getElementById('note-modal-title').innerText = 'Edit Note'; openModal('note-modal');
        }
        async function deleteNote(id) { if(confirm('Delete note?')) { await api(\`/api/notes/\${id}\`, { method: 'DELETE' }); loadNotes(); } }

        let allEnquiries = [];
        async function loadEnquiries() {
            const res = await api('/api/enquiries');
            if (res.ok) {
                allEnquiries = await res.json();
                generateTable('enquiries-table', allEnquiries, ['createdAtStr', 'studentName', 'interestedClass', 'mobile', 'status'], (e) => \`<button class="btn btn-sm" onclick="openEnquiry('\${e._id}')">View/Update</button> <button class="btn btn-sm btn-danger" onclick="deleteEnquiry('\${e._id}')">Delete</button>\`);
            }
        }
        function openEnquiry(id) {
            const e = allEnquiries.find(x => x._id === id);
            document.getElementById('enquiry-id').value = e._id; document.getElementById('enquiry-status').value = e.status; document.getElementById('enquiry-remarks').value = e.remarks || '';
            document.getElementById('enquiry-details').innerHTML = \`<p><strong>Parent:</strong> \${e.parentName}</p><p><strong>Email:</strong> \${e.email}</p><p><strong>Message:</strong> \${e.message}</p>\`;
            openModal('enquiry-modal');
        }
        document.getElementById('enquiry-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('enquiry-id').value;
            const data = { status: document.getElementById('enquiry-status').value, remarks: document.getElementById('enquiry-remarks').value };
            await api(\`/api/enquiries/\${id}\`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            closeModal('enquiry-modal'); loadEnquiries();
        });
        async function deleteEnquiry(id) { if(confirm('Delete enquiry?')) { await api(\`/api/enquiries/\${id}\`, { method: 'DELETE' }); loadEnquiries(); } }

        let allAnnouncements = [];
        async function loadAnnouncements() {
            const res = await api('/api/announcements');
            if (res.ok) {
                allAnnouncements = await res.json();
                generateTable('announcements-table', allAnnouncements, ['title', 'createdAtStr', 'important', 'status'], (a) => \`<button class="btn btn-sm" onclick="editAnnouncement('\${a._id}')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteAnnouncement('\${a._id}')">Delete</button>\`);
            }
        }
        document.getElementById('announcement-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('announcement-id').value;
            const data = { title: document.getElementById('announcement-title').value, content: document.getElementById('announcement-content').value, important: document.getElementById('announcement-important').value === 'true', status: 'Published' };
            await api(id ? \`/api/announcements/\${id}\` : '/api/announcements', { method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            closeModal('announcement-modal'); loadAnnouncements();
        });
        function editAnnouncement(id) {
            const a = allAnnouncements.find(x => x._id === id);
            document.getElementById('announcement-id').value = a._id; document.getElementById('announcement-title').value = a.title; document.getElementById('announcement-content').value = a.content; document.getElementById('announcement-important').value = a.important ? 'true' : 'false';
            document.getElementById('announcement-modal-title').innerText = 'Edit Announcement'; openModal('announcement-modal');
        }
        async function deleteAnnouncement(id) { if(confirm('Delete announcement?')) { await api(\`/api/announcements/\${id}\`, { method: 'DELETE' }); loadAnnouncements(); } }
    </script>
</body>
</html>`;

router.get('/', (req, res) => {
    res.send(adminHTML);
});

module.exports = router;
