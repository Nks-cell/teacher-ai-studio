const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb) return cachedDb;
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bright_future_academy';
    const client = await mongoose.connect(uri);
    cachedDb = client;
    
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
        await Admin.create({ email: process.env.ADMIN_EMAIL, passwordHash: process.env.ADMIN_PASSWORD_HASH });
    } else if (adminCount === 0) {
        const hash = await bcrypt.hash('admin123', 10);
        await Admin.create({ email: 'admin@example.com', passwordHash: hash });
    }
    return client;
}

app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

const AdminSchema = new mongoose.Schema({ email: String, passwordHash: String });
const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

const StudentSchema = new mongoose.Schema({ name: String, rollNumber: String, class: String, parentName: String, mobile: String, monthlyFee: Number, status: { type: String, default: 'Active' } }, { timestamps: true });
const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);

const FeeTransactionSchema = new mongoose.Schema({ studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, amount: Number, paymentMethod: String, description: String, paymentDate: { type: Date, default: Date.now } }, { timestamps: true });
const FeeTransaction = mongoose.models.FeeTransaction || mongoose.model('FeeTransaction', FeeTransactionSchema);

const TeacherSchema = new mongoose.Schema({ name: String, designation: String, qualification: String, experience: String, subjects: String, photoUrl: String, biography: String }, { timestamps: true });
const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);

const ClassSchema = new mongoose.Schema({ name: String, subjects: String, timings: String, monthlyFee: Number }, { timestamps: true });
const Class = mongoose.models.Class || mongoose.model('Class', ClassSchema);

const ResultSchema = new mongoose.Schema({ studentName: String, class: String, rollNumber: String, totalMarks: Number, percentage: Number, academicYear: String, status: String }, { timestamps: true });
const Result = mongoose.models.Result || mongoose.model('Result', ResultSchema);

const NoteSchema = new mongoose.Schema({ title: String, class: String, subject: String, teacher: String, documentUrl: String, date: String }, { timestamps: true });
const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

const EnquirySchema = new mongoose.Schema({ studentName: String, parentName: String, mobile: String, email: String, interestedClass: String, previousSchool: String, message: String, status: { type: String, default: 'Pending' }, remarks: String }, { timestamps: true });
const Enquiry = mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema);

const AnnouncementSchema = new mongoose.Schema({ title: String, content: String, important: Boolean, status: String }, { timestamps: true });
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

const authMiddleware = (req, res, next) => {
    const token = req.cookies.admin_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        req.admin = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.cookie('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json({ success: true });
});
app.post('/api/auth/logout', (req, res) => { res.clearCookie('admin_token'); res.json({ success: true }); });
app.get('/api/auth/me', authMiddleware, (req, res) => { res.json({ success: true }); });

app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
    const students = await Student.countDocuments();
    const teachers = await Teacher.countDocuments();
    const classes = await Class.countDocuments();
    const enquiries = await Enquiry.countDocuments({ status: 'Pending' });
    const chart = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], data: [15000, 22000, 18000, 25000, 30000, 28000] };
    res.json({ students, teachers, classes, enquiries, chart });
});

const createCrud = (path, Model) => {
    app.get(path, async (req, res) => {
        let query = {};
        if(!req.cookies.admin_token && Model === Enquiry) return res.status(401).json({error: 'Unauthorized'});
        if(!req.cookies.admin_token && Model === Result) query.status = 'Published';
        if(!req.cookies.admin_token && Model === Announcement) query.status = 'Published';
        const data = await Model.find(query).sort({ createdAt: -1 });
        res.json(data.map(d => { const obj = d.toObject(); if(obj.createdAt) obj.createdAtStr = obj.createdAt.toLocaleDateString(); return obj; }));
    });
    app.post(path, async (req, res) => {
        if(Model !== Enquiry && !req.cookies.admin_token) return res.status(401).json({error: 'Unauthorized'});
        res.json(await Model.create(req.body));
    });
    app.put(`${path}/:id`, authMiddleware, async (req, res) => { res.json(await Model.findByIdAndUpdate(req.params.id, req.body, { new: true })); });
    app.delete(`${path}/:id`, authMiddleware, async (req, res) => { await Model.findByIdAndDelete(req.params.id); res.json({ success: true }); });
};

createCrud('/api/students', Student); createCrud('/api/teachers', Teacher); createCrud('/api/classes', Class); createCrud('/api/results', Result); createCrud('/api/notes', Note); createCrud('/api/enquiries', Enquiry); createCrud('/api/announcements', Announcement);

app.get('/api/fees/:studentId', authMiddleware, async (req, res) => { res.json(await FeeTransaction.find({ studentId: req.params.studentId }).sort({ paymentDate: -1 })); });
app.post('/api/fees/payment', authMiddleware, async (req, res) => { res.json(await FeeTransaction.create(req.body)); });

const adminRouter = require('./admin.js');
app.use('/admin', adminRouter);

const publicHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bright Future Academy | Learn Today, Lead Tomorrow</title>
    <style>
        :root { --primary: #4f46e5; --secondary: #ec4899; --cyan: #06b6d4; --bg-dark: #0f172a; --glass-bg: rgba(255, 255, 255, 0.05); --glass-border: rgba(255, 255, 255, 0.1); --text-main: #f8fafc; --text-muted: #94a3b8; }
        body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a); color: var(--text-main); overflow-x: hidden; scroll-behavior: smooth; }
        .glass { background: var(--glass-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 16px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); }
        nav { position: fixed; top: 0; width: 100%; z-index: 1000; display: flex; justify-content: space-between; align-items: center; padding: 15px 40px; box-sizing: border-box; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--glass-border); }
        nav .logo { font-size: 1.5rem; font-weight: 800; background: linear-gradient(to right, var(--cyan), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        nav .links a { color: var(--text-main); text-decoration: none; margin-left: 20px; font-weight: 500; transition: color 0.3s; }
        nav .links a:hover { color: var(--cyan); }
        .hero { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px; position: relative; }
        .hero::before { content: ''; position: absolute; width: 400px; height: 400px; background: var(--primary); filter: blur(150px); border-radius: 50%; top: 20%; left: 10%; z-index: -1; opacity: 0.5; }
        .hero::after { content: ''; position: absolute; width: 300px; height: 300px; background: var(--secondary); filter: blur(150px); border-radius: 50%; bottom: 10%; right: 10%; z-index: -1; opacity: 0.5; }
        .hero h1 { font-size: 4rem; margin: 0; line-height: 1.2; }
        .hero p { font-size: 1.5rem; color: var(--text-muted); margin-top: 15px; }
        .btn { padding: 12px 30px; background: linear-gradient(45deg, var(--primary), var(--secondary)); color: white; border: none; border-radius: 30px; font-size: 1.1rem; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 20px; transition: transform 0.3s; }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(236, 72, 153, 0.3); }
        .section { padding: 80px 40px; max-width: 1200px; margin: 0 auto; }
        .section-title { text-align: center; font-size: 2.5rem; margin-bottom: 40px; background: linear-gradient(to right, var(--cyan), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .card { padding: 30px; border-radius: 20px; transition: transform 0.3s; }
        .card:hover { transform: translateY(-10px); }
        .card h3 { margin-top: 0; color: var(--cyan); }
        .tabs { display: flex; justify-content: center; gap: 20px; margin-bottom: 30px; }
        .tab { padding: 10px 30px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 30px; cursor: pointer; font-weight: bold; }
        .tab.active { background: var(--primary); }
        .scoreboard-grid { display: none; }
        .scoreboard-grid.active { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .topper-card { text-align: center; position: relative; overflow: hidden; }
        .topper-card::before { content: '🏆'; font-size: 3rem; display: block; margin-bottom: 10px; }
        .topper-card h3 { margin: 0; font-size: 1.5rem; color: white; }
        .topper-card .percent { font-size: 2.5rem; font-weight: 900; color: var(--secondary); margin: 10px 0; }
        .enquiry-form { max-width: 600px; margin: 0 auto; padding: 40px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; color: var(--text-muted); }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 15px; border-radius: 10px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white; font-size: 1rem; box-sizing: border-box; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--cyan); }
        footer { background: rgba(0,0,0,0.5); padding: 40px; text-align: center; border-top: 1px solid var(--glass-border); margin-top: 50px; }
    </style>
</head>
<body>
    <nav>
        <div class="logo">Bright Future Academy</div>
        <div class="links">
            <a href="#home">Home</a><a href="#results">Results</a><a href="#courses">Courses</a><a href="#teachers">Teachers</a><a href="#notes">Notes</a><a href="#admission">Admission</a>
        </div>
    </nav>

    <div class="hero" id="home">
        <h1>Learn Today, <br>Lead Tomorrow</h1>
        <p>Empowering minds with world-class education and guidance.</p>
        <div>
            <a href="#admission" class="btn">Apply for Admission</a>
            <a href="#courses" class="btn" style="background: transparent; border: 2px solid var(--cyan); margin-left: 15px;">Explore Courses</a>
        </div>
    </div>

    <div class="section" id="results">
        <h2 class="section-title">Our Shining Stars</h2>
        <div class="tabs">
            <div class="tab active" onclick="showResults('class10')">Class 10 Toppers</div>
            <div class="tab" onclick="showResults('class12')">Class 12 Toppers</div>
        </div>
        <div id="class10-results" class="scoreboard-grid active"></div>
        <div id="class12-results" class="scoreboard-grid"></div>
    </div>

    <div class="section" id="courses">
        <h2 class="section-title">Featured Courses</h2>
        <div class="grid" id="courses-grid"></div>
    </div>

    <div class="section" id="teachers">
        <h2 class="section-title">Expert Faculty</h2>
        <div class="grid" id="teachers-grid"></div>
    </div>
    
    <div class="section" id="notes">
        <h2 class="section-title">Daily Class Notes</h2>
        <div class="grid" id="notes-grid"></div>
    </div>

    <div class="section" id="admission">
        <h2 class="section-title">Admission Enquiry</h2>
        <div class="glass enquiry-form">
            <form id="public-enquiry-form">
                <div class="form-group"><label>Student Name</label><input type="text" id="eq-name" required></div>
                <div class="form-group"><label>Parent Name</label><input type="text" id="eq-parent" required></div>
                <div class="form-group"><label>Mobile Number</label><input type="text" id="eq-mobile" required></div>
                <div class="form-group"><label>Email</label><input type="email" id="eq-email"></div>
                <div class="form-group"><label>Interested Class</label><input type="text" id="eq-class" required></div>
                <div class="form-group"><label>Message</label><textarea id="eq-msg" rows="4"></textarea></div>
                <button type="submit" class="btn" style="width: 100%;">Submit Enquiry</button>
            </form>
            <div id="eq-success" style="display:none; color: #10b981; margin-top: 20px; text-align: center; font-weight: bold;">Enquiry submitted successfully! We will contact you soon.</div>
        </div>
    </div>

    <footer>
        <h2>Bright Future Academy</h2>
        <p>Main Road, Bhilai, Chhattisgarh, India | Phone: +91 98765 43210 | Email: brightfutureacademy@example.com</p>
        <p>&copy; 2026 Bright Future Academy. All rights reserved.</p>
    </footer>

    <script>
        async function loadPublicData() {
            try {
                const resResults = await fetch('/api/results');
                const results = await resResults.json();
                const renderRes = (cls) => results.filter(r => r.class === cls).slice(0,5).map(r => \`<div class="glass card topper-card"><h3>\${r.studentName}</h3><p>Roll: \${r.rollNumber}</p><div class="percent">\${r.percentage}%</div><p>\${r.academicYear}</p></div>\`).join('');
                document.getElementById('class10-results').innerHTML = renderRes('10') || '<p>No results published yet.</p>';
                document.getElementById('class12-results').innerHTML = renderRes('12') || '<p>No results published yet.</p>';

                const resClasses = await fetch('/api/classes');
                document.getElementById('courses-grid').innerHTML = (await resClasses.json()).map(c => \`<div class="glass card"><h3>\${c.name}</h3><p><strong>Subjects:</strong> \${c.subjects}</p><p><strong>Timings:</strong> \${c.timings}</p></div>\`).join('');

                const resTeachers = await fetch('/api/teachers');
                document.getElementById('teachers-grid').innerHTML = (await resTeachers.json()).map(t => \`<div class="glass card"><h3>\${t.name}</h3><p style="color: var(--secondary);">\${t.designation}</p><p><strong>Exp:</strong> \${t.experience}</p><p><strong>Subjects:</strong> \${t.subjects}</p></div>\`).join('');

                const resNotes = await fetch('/api/notes');
                document.getElementById('notes-grid').innerHTML = (await resNotes.json()).slice(0,6).map(n => \`<div class="glass card"><h3>\${n.title}</h3><p>\${n.class} | \${n.subject}</p><p style="font-size: 0.9rem; color: var(--text-muted);">\${n.date}</p><a href="\${n.documentUrl}" target="_blank" class="btn" style="padding: 8px 15px; font-size: 0.9rem; margin-top: 10px;">Download PDF</a></div>\`).join('');
            } catch(e) { console.error(e); }
        }
        loadPublicData();

        function showResults(id) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            document.querySelectorAll('.scoreboard-grid').forEach(g => g.classList.remove('active'));
            document.getElementById(id + '-results').classList.add('active');
        }

        document.getElementById('public-enquiry-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = { studentName: document.getElementById('eq-name').value, parentName: document.getElementById('eq-parent').value, mobile: document.getElementById('eq-mobile').value, email: document.getElementById('eq-email').value, interestedClass: document.getElementById('eq-class').value, message: document.getElementById('eq-msg').value };
            const res = await fetch('/api/enquiries', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            if(res.ok) { document.getElementById('public-enquiry-form').reset(); document.getElementById('public-enquiry-form').style.display = 'none'; document.getElementById('eq-success').style.display = 'block'; }
        });
    </script>
</body>
</html>`;

app.get('/', (req, res) => { res.send(publicHTML); });

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    connectToDatabase().then(() => { app.listen(PORT, () => console.log('Server running on port ' + PORT)); });
}
module.exports = app;
