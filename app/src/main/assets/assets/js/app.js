/**
 * Madrasah ERP Application Controller Core
 * Houses unified logic orchestration, interactive forms listeners,
 * notifications prompts, and detailed module interfaces.
 */

const App = {
    // Current state indicators
    activeLoginTab: "student",

    init: function() {
        // Seed initial data if needed
        SeedData.initialize();

        // Close mobile sidebar on tapping outside of it
        document.addEventListener("click", (e) => {
            const sidebar = document.getElementById("sidebar");
            const toggleBtn = document.querySelector(".menu-toggle");
            if (sidebar && sidebar.classList.contains("active")) {
                if (!sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
                    sidebar.classList.remove("active");
                }
            }
        });

        // Start routing
        Router.init();
    },

    // Show dynamic toast notifications
    showNotification: function(message, type = "success") {
        // Remove existing notification if present
        const oldNotify = document.querySelector(".notifier");
        if (oldNotify) oldNotify.remove();

        const toast = document.createElement("div");
        toast.className = `notifier notifier-${type} active`;
        toast.innerText = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove("active");
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    },

    // ==========================================
    // LOGIN CONTROLLER PROCEDURES
    // ==========================================
    switchLoginTab: function(role) {
        this.activeLoginTab = role;
        
        // Update tab styles
        document.querySelectorAll(".login-tab").forEach(tab => {
            if (tab.getAttribute("data-role") === role) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }
        });

        // Toggle institution select field since Super Admin doesn't need to select a school
        const schoolGroup = document.getElementById("login-school-group");
        if (role === "superadmin") {
            schoolGroup.style.display = "none";
        } else {
            schoolGroup.style.display = "block";
        }

        // Load dynamic inputs based on role selections
        const inputsContainer = document.getElementById("dynamic-login-inputs");
        if (role === "student") {
            inputsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Student Roll Number / আইডি</label>
                    <input type="text" class="form-control" id="login-roll" placeholder="e.g. 101" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Date of Birth / জন্মতারিখ</label>
                    <input type="date" class="form-control" id="login-dob" required>
                </div>
            `;
        } else if (role === "teacher" || role === "schooladmin") {
            inputsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">User Email Address / ইমেইল</label>
                    <input type="email" class="form-control" id="login-email" placeholder="e.g. cleric@school.edu" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Password Code / পাসওয়ার্ড</label>
                    <input type="password" class="form-control" id="login-password" placeholder="••••••••" required>
                </div>
            `;
        } else if (role === "superadmin") {
            inputsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Super Username</label>
                    <input type="text" class="form-control" id="login-super-username" placeholder="e.g. superadmin" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Security Password</label>
                    <input type="password" class="form-control" id="login-super-password" placeholder="••••••••" required>
                </div>
            `;
        }
    },

    handleLoginSubmit: function(event) {
        event.preventDefault();
        const role = this.activeLoginTab;
        let credentials = { schoolId: document.getElementById("login-school-id")?.value };

        if (role === "student") {
            credentials.rollNumber = document.getElementById("login-roll").value;
            credentials.dob = document.getElementById("login-dob").value;
        } else if (role === "teacher" || role === "schooladmin") {
            credentials.email = document.getElementById("login-email").value;
            credentials.password = document.getElementById("login-password").value;
        } else if (role === "superadmin") {
            credentials.username = document.getElementById("login-super-username").value;
            credentials.password = document.getElementById("login-super-password").value;
        }

        const res = Auth.login(role, credentials);
        if (res.success) {
            this.showNotification("Login Successful / সফল লগইন!");
            
            // Render correct workspace
            if (role === "superadmin") {
                Router.navigate("superadmin");
            } else {
                Router.navigate("dashboard");
            }
        } else {
            this.showNotification(res.message, "error");
        }
    },

    handleLogout: function() {
        Auth.logout();
        this.showNotification("Signed Out / লগআউট সম্পন্ন.");
        Router.navigate("login");
    },

    // ==========================================
    // SUPER ADMIN ROUTINES
    // ==========================================
    openAddSchoolModal: function() {
        document.getElementById("school-modal").classList.add("active");
    },

    closeAddSchoolModal: function() {
        document.getElementById("school-modal").classList.remove("active");
    },

    handleCreateSchoolSubmit: function(event) {
        event.preventDefault();
        const id = document.getElementById("school-id-input").value;
        const name = document.getElementById("school-name-input").value;
        const subdomainSlug = document.getElementById("school-subdomain-input").value;
        const logo = document.getElementById("school-logo-input").value;
        const email = document.getElementById("school-email-input").value;
        const password = document.getElementById("school-password-input").value;
        const planStart = document.getElementById("school-start-input").value;
        const planEnd = document.getElementById("school-end-input").value;

        const schools = Storage.getSchools();
        if (schools.find(s => s.id === id)) {
            return this.showNotification("School ID already exists!", "error");
        }

        const newSchool = {
            id,
            name,
            subdomain: `${subdomainSlug}.madrasaherp.com`,
            logo,
            themeColor: "#1b5e20",
            status: "Active",
            adminEmail: email,
            adminPassword: password,
            academicSession: "2026-2027",
            planStart,
            planEnd
        };

        schools.push(newSchool);
        Storage.saveSchools(schools);

        // Pre-initialize empty default schemas for this school to avoid null evaluations
        Storage.saveSchoolData(id, "students", []);
        Storage.saveSchoolData(id, "teachers", []);
        Storage.saveSchoolData(id, "results", []);
        Storage.saveSchoolData(id, "attendance", []);
        Storage.saveSchoolData(id, "fees", []);
        Storage.saveSchoolData(id, "notices", []);

        this.closeAddSchoolModal();
        this.showNotification("New School Created Successfully!");
        Router.render();
    },

    toggleSchoolStatus: function(id, status) {
        const schools = Storage.getSchools();
        const school = schools.find(s => s.id === id);
        if (school) {
            school.status = status;
            Storage.saveSchools(schools);
            this.showNotification(`School marked as ${status}!`);
            Router.render();
        }
    },

    deleteSchool: function(id) {
        if (confirm("Are you sure you want to soft-delete this school's records from this platform?")) {
            const schools = Storage.getSchools();
            const filtered = schools.filter(s => s.id !== id);
            Storage.saveSchools(filtered);
            this.showNotification("School removed.");
            Router.render();
        }
    },

    enterViewMode: function(schoolId) {
        localStorage.setItem("saas_view_only_mode", "true");
        localStorage.setItem("saas_view_only_school_id", schoolId);
        this.showNotification("Entered Monitoring View-Only Mode.");
        Router.navigate("dashboard");
    },

    exitViewMode: function() {
        localStorage.removeItem("saas_view_only_mode");
        localStorage.removeItem("saas_view_only_school_id");
        this.showNotification("Returned to Super Admin Console.");
        Router.navigate("superadmin");
    },

    toggleLanguage: function(lang) {
        Utils.setLanguage(lang);
        Router.render();
    },

    toggleSidebar: function() {
        const sidebar = document.getElementById("sidebar");
        sidebar.classList.toggle("active");
    },

    // ==========================================
    // MODULE 1: STUDENT MANAGEMENT (ADMISSION & PROMOTION)
    // ==========================================
    renderStudentsModule: function(schoolId) {
        const container = document.getElementById("content-area");
        const students = Storage.getSchoolData(schoolId, "students");
        const readonly = Auth.isViewOnlyMode();

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2>👤 ${Utils.t("student_management")}</h2>
                ${readonly ? '' : `<button class="btn btn-primary btn-sm" onclick="App.openAddStudentModal()">➕ ${Utils.t("add_student")}</button>`}
            </div>

            <!-- TABLE OF ADMITTED STUDENTS -->
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name / নাম</th>
                            <th>Roll</th>
                            <th>Class / শ্রেণি</th>
                            <th>Birth Date</th>
                            <th>Guardian Name</th>
                            <th>Phone / ফোন</th>
                            <th>Status</th>
                            ${readonly ? '' : `<th>${Utils.t("actions")}</th>`}
                        </tr>
                    </thead>
                    <tbody>
                        ${students.length === 0 ? `<tr><td colspan="9" class="text-muted">No students enrolled yet.</td></tr>` : 
                            students.map(s => `
                                <tr>
                                    <td><code style="font-weight:700; color:var(--primary-color);">${s.id}</code></td>
                                    <td><strong>${s.name}</strong></td>
                                    <td>${s.rollNumber}</td>
                                    <td><span class="badge badge-info">${s.class}</span></td>
                                    <td>${s.dob}</td>
                                    <td>${s.guardianName}</td>
                                    <td><code>${s.phone}</code></td>
                                    <td>
                                        <span class="badge ${s.status === 'Active' ? 'badge-success' : 'badge-warning'}">
                                            ${s.status}
                                        </span>
                                    </td>
                                    ${readonly ? '' : `
                                        <td>
                                            <div style="display:flex; gap:6px;">
                                                <button class="btn btn-secondary btn-sm" onclick="App.promoteStudent('${s.id}')" title="Promote to next class level">
                                                    🎯 Promote
                                                </button>
                                                <button class="btn btn-danger btn-sm" onclick="App.deleteStudent('${s.id}')">
                                                    🗑️ Expel
                                                </button>
                                            </div>
                                        </td>
                                    `}
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <!-- ADD STUDENT MODAL -->
            <div id="student-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">${Utils.t("add_student")}</h4>
                        <button class="modal-close" onclick="App.closeAddStudentModal()">×</button>
                    </div>
                    <form onsubmit="App.handleCreateStudent(event)">
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">Student ID (Unique - e.g. STU-001-105)</label>
                                <input type="text" class="form-control" id="stu-id-input" placeholder="e.g. STU-001-105" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Student Name / নাম</label>
                                <input type="text" class="form-control" id="stu-name-input" required>
                            </div>
                            <div class="flex-row-gap-md">
                                <div class="form-group" style="flex:1;">
                                    <label class="form-label">Roll Number / রোল নম্বর</label>
                                    <input type="text" class="form-control" id="stu-roll-input" required>
                                </div>
                                <div class="form-group" style="flex:1;">
                                    <label class="form-label">Class Level / শ্রেণি</label>
                                    <select class="form-control" id="stu-class-input">
                                        <option value="Class 1">Class 1</option>
                                        <option value="Class 2">Class 2</option>
                                        <option value="Class 3">Class 3</option>
                                        <option value="Hifz Section">Hifz Section</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date of Birth / জন্মতারিখ</label>
                                <input type="date" class="form-control" id="stu-dob-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Guardian Name / অভিভাবক</label>
                                <input type="text" class="form-control" id="stu-guard-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Mobile Contact / ফোন নম্বর</label>
                                <input type="text" class="form-control" id="stu-phone-input" required>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="App.closeAddStudentModal()">${Utils.t("cancel")}</button>
                            <button type="submit" class="btn btn-primary">${Utils.t("save")}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    openAddStudentModal: function() {
        document.getElementById("student-modal").classList.add("active");
    },
    closeAddStudentModal: function() {
        document.getElementById("student-modal").classList.remove("active");
    },
    handleCreateStudent: function(event) {
        event.preventDefault();
        const schoolId = Auth.getWorkingSchoolId();
        const id = document.getElementById("stu-id-input").value;
        const name = document.getElementById("stu-name-input").value;
        const rollNumber = document.getElementById("stu-roll-input").value;
        const classVal = document.getElementById("stu-class-input").value;
        const dob = document.getElementById("stu-dob-input").value;
        const guardianName = document.getElementById("stu-guard-input").value;
        const phone = document.getElementById("stu-phone-input").value;

        const students = Storage.getSchoolData(schoolId, "students");
        if (students.find(s => s.id === id)) {
            return this.showNotification("Student ID already exists!", "error");
        }

        const newStudent = {
            id, name, rollNumber, class: classVal, dob, guardianName, phone,
            admissionDate: new Date().toISOString().split('T')[0],
            status: "Active"
        };

        Storage.addModel(schoolId, "students", newStudent);
        this.closeAddStudentModal();
        this.showNotification("Student admitted successfully!");
        Router.render();
    },
    promoteStudent: function(id) {
        if (Auth.isViewOnlyMode()) return;
        const schoolId = Auth.getWorkingSchoolId();
        const students = Storage.getSchoolData(schoolId, "students");
        const student = students.find(s => s.id === id);
        
        if (student) {
            let nextClass = "Class 2";
            if (student.class === "Class 1") nextClass = "Class 2";
            else if (student.class === "Class 2") nextClass = "Class 3";
            else if (student.class === "Class 3") nextClass = "Graduate (উত্তীর্ণ)";
            else nextClass = "Class 1";

            student.class = nextClass;
            student.status = "Promoted";
            Storage.updateModel(schoolId, "students", id, student);
            this.showNotification(`${student.name} promoted to ${nextClass}!`);
            Router.render();
        }
    },
    deleteStudent: function(id) {
        if (Auth.isViewOnlyMode()) return;
        if (confirm("Expel this student? Action will remove all associated active records.")) {
            const schoolId = Auth.getWorkingSchoolId();
            Storage.deleteModel(schoolId, "students", id);
            this.showNotification("Student removed.");
            Router.render();
        }
    },

    // ==========================================
    // MODULE 2: TEACHER STAFF MANAGEMENT
    // ==========================================
    renderTeachersModule: function(schoolId, isTeacher = false) {
        const container = document.getElementById("content-area");
        const teachers = Storage.getSchoolData(schoolId, "teachers");
        const readonly = Auth.isViewOnlyMode() || isTeacher;

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2>👥 ${Utils.t("teacher_management")}</h2>
                ${readonly ? '' : `<button class="btn btn-primary btn-sm" onclick="App.openAddTeacherModal()">➕ ${Utils.t("add_teacher")}</button>`}
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Teacher ID</th>
                            <th>Name / শিক্ষক</th>
                            <th>Designated Class</th>
                            <th>Subject Assignment</th>
                            <th>Staff Contact / ইমেইল</th>
                            <th>Mobile</th>
                            ${readonly ? '' : `<th>${Utils.t("actions")}</th>`}
                        </tr>
                    </thead>
                    <tbody>
                        ${teachers.length === 0 ? `<tr><td colspan="7" class="text-muted">No teachers on staff payroll.</td></tr>` : 
                            teachers.map(t => `
                                <tr>
                                    <td><code>${t.id}</code></td>
                                    <td><strong>${t.name}</strong></td>
                                    <td><span class="badge badge-info">${t.designatedClass}</span></td>
                                    <td><strong>${t.designatedSubject}</strong></td>
                                    <td><code>${t.email}</code></td>
                                    <td>${t.phone}</td>
                                    ${readonly ? '' : `
                                        <td>
                                            <button class="btn btn-danger btn-sm" onclick="App.deleteTeacher('${t.id}')">
                                                🗑️ Dismiss
                                            </button>
                                        </td>
                                    `}
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <!-- ADD TEACHER MODAL -->
            <div id="teacher-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">${Utils.t("add_teacher")}</h4>
                        <button class="modal-close" onclick="App.closeAddTeacherModal()">×</button>
                    </div>
                    <form onsubmit="App.handleCreateTeacher(event)">
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">Teacher Staff ID (Unique)</label>
                                <input type="text" class="form-control" id="tch-id-input" placeholder="e.g. TCH-001-503" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Teacher Name / শিক্ষকের নাম</label>
                                <input type="text" class="form-control" id="tch-name-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Credential Email Access</label>
                                <input type="email" class="form-control" id="tch-email-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Initial Access Password</label>
                                <input type="password" class="form-control" id="tch-pass-input" value="teacher123" required>
                            </div>
                            <div class="flex-row-gap-md">
                                <div class="form-group" style="flex:1;">
                                    <label class="form-label">Subject Specialty</label>
                                    <input type="text" class="form-control" id="tch-subject-input" placeholder="e.g. Al-Hadith" required>
                                </div>
                                <div class="form-group" style="flex:1;">
                                    <label class="form-label">Designated Class</label>
                                    <select class="form-control" id="tch-class-input">
                                        <option value="Class 1">Class 1</option>
                                        <option value="Class 2">Class 2</option>
                                        <option value="Class 3">Class 3</option>
                                        <option value="Hifz Section">Hifz Section</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Mobile Contact</label>
                                <input type="text" class="form-control" id="tch-phone-input" required>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="App.closeAddTeacherModal()">${Utils.t("cancel")}</button>
                            <button type="submit" class="btn btn-primary">${Utils.t("save")}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    openAddTeacherModal: function() {
        document.getElementById("teacher-modal").classList.add("active");
    },
    closeAddTeacherModal: function() {
        document.getElementById("teacher-modal").classList.remove("active");
    },
    handleCreateTeacher: function(event) {
        event.preventDefault();
        const schoolId = Auth.getWorkingSchoolId();
        const id = document.getElementById("tch-id-input").value;
        const name = document.getElementById("tch-name-input").value;
        const email = document.getElementById("tch-email-input").value;
        const password = document.getElementById("tch-pass-input").value;
        const designatedSubject = document.getElementById("tch-subject-input").value;
        const designatedClass = document.getElementById("tch-class-input").value;
        const phone = document.getElementById("tch-phone-input").value;

        const teachers = Storage.getSchoolData(schoolId, "teachers");
        if (teachers.find(t => t.id === id || t.email.toLowerCase() === email.toLowerCase())) {
            return this.showNotification("Conflict error! Teacher ID or email duplicate.", "error");
        }

        const newTeacher = { id, name, email, password, designatedSubject, designatedClass, phone };
        Storage.addModel(schoolId, "teachers", newTeacher);
        this.closeAddTeacherModal();
        this.showNotification("Teacher enrolled onto payroll system!");
        Router.render();
    },
    deleteTeacher: function(id) {
        if (Auth.isViewOnlyMode()) return;
        if (confirm("Dismiss this teacher? Action cannot be undone.")) {
            const schoolId = Auth.getWorkingSchoolId();
            Storage.deleteModel(schoolId, "teachers", id);
            this.showNotification("Teacher dismissed.");
            Router.render();
        }
    },

    // ==========================================
    // MODULE 3: ATTENDANCE TRACKER (Checklist with Report exports)
    // ==========================================
    renderAttendanceModule: function(schoolId, isTeacher = false) {
        const container = document.getElementById("content-area");
        const students = Storage.getSchoolData(schoolId, "students");
        const currentActiveFilterClass = localStorage.getItem("saas_att_class") || "Class 1";
        const currentActiveFilterDate = localStorage.getItem("saas_att_date") || new Date().toISOString().split('T')[0];

        // Filter target class
        const targetStudents = students.filter(s => s.class === currentActiveFilterClass);
        const attendanceList = Storage.getSchoolData(schoolId, "attendance");
        const savedLog = attendanceList.find(log => log.date === currentActiveFilterDate && log.type === "Student") || { records: {} };

        container.innerHTML = `
            <h2>📅 ${Utils.t("attendance")} / ডিজিটাল হাজিরা</h2>
            <p class="text-muted" style="margin-bottom:20px;">Conduct and export daily class attendance records.</p>
            
            <div class="card" style="margin-bottom:25px; border-top-color: var(--accent-gold);">
                <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-end;">
                    <div class="form-group" style="margin-bottom:0; flex:1; min-width:180px;">
                        <label class="form-label">Choose Target Class</label>
                        <select class="form-control" id="att-class-select" onchange="App.saveAttendanceFilterState()">
                            <option value="Class 1" ${currentActiveFilterClass === 'Class 1' ? 'selected' : ''}>Class 1</option>
                            <option value="Class 2" ${currentActiveFilterClass === 'Class 2' ? 'selected' : ''}>Class 2</option>
                            <option value="Class 3" ${currentActiveFilterClass === 'Class 3' ? 'selected' : ''}>Class 3</option>
                            <option value="Hifz Section" ${currentActiveFilterClass === 'Hifz Section' ? 'selected' : ''}>Hifz Section</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0; flex:1; min-width:180px;">
                        <label class="form-label font-bold">Select Date / তারিখ</label>
                        <input type="date" class="form-control" id="att-date-select" value="${currentActiveFilterDate}" onchange="App.saveAttendanceFilterState()">
                    </div>
                </div>
            </div>

            <div class="table-container">
                <div style="padding: 15px 20px; display:flex; justify-content:space-between; align-items:center; background-color:#fafafa; border-bottom:1px solid #ddd;">
                    <strong style="color:var(--primary-color);">Class Registration Roll Presence (Students Count: ${targetStudents.length})</strong>
                    ${Auth.isViewOnlyMode() ? '' : `
                        <button class="btn btn-primary btn-sm" onclick="App.saveCurrentAttendanceLogs()">
                            💾 Save Current Attendance
                        </button>
                    `}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width:70px;">Roll</th>
                            <th>Student ID</th>
                            <th>Student Name / নাম</th>
                            <th style="width:200px; text-align:center;">Daily Attendance Checklist</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${targetStudents.length === 0 ? `<tr><td colspan="4" class="text-muted text-center" style="padding:30px;">No students enrolled in this class yet.</td></tr>` : 
                            targetStudents.map(s => {
                                const state = savedLog.records[s.id] || "Present";
                                return `
                                    <tr>
                                        <td><strong># ${s.rollNumber}</strong></td>
                                        <td><code>${s.id}</code></td>
                                        <td><strong>${s.name}</strong></td>
                                        <td style="text-align:center;">
                                            <div style="display:flex; justify-content:center; gap:12px;">
                                                <label style="cursor:pointer; font-weight:700; color:#16a34a; display:flex; align-items:center; gap:4px;">
                                                    <input type="radio" name="att_record_${s.id}" value="Present" ${state === 'Present' ? 'checked' : ''}> Present
                                                </label>
                                                <label style="cursor:pointer; font-weight:700; color:#dc2626; display:flex; align-items:center; gap:4px;">
                                                    <input type="radio" name="att_record_${s.id}" value="Absent" ${state === 'Absent' ? 'checked' : ''}> Absent
                                                </label>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')
                        }
                    </tbody>
                </table>
            </div>
        `;
    },

    saveAttendanceFilterState: function() {
        const clsValue = document.getElementById("att-class-select").value;
        const dteValue = document.getElementById("att-date-select").value;
        localStorage.setItem("saas_att_class", clsValue);
        localStorage.setItem("saas_att_date", dteValue);
        Router.render();
    },

    saveCurrentAttendanceLogs: function() {
        if (Auth.isViewOnlyMode()) return;
        const schoolId = Auth.getWorkingSchoolId();
        const currentClass = localStorage.getItem("saas_att_class") || "Class 1";
        const currentDate = localStorage.getItem("saas_att_date") || new Date().toISOString().split('T')[0];

        const students = Storage.getSchoolData(schoolId, "students").filter(s => s.class === currentClass);
        if (students.length === 0) return this.showNotification("No students to save logs for!", "error");

        const records = {};
        students.forEach(s => {
            const radioNode = document.querySelector(`input[name="att_record_${s.id}"]:checked`);
            records[s.id] = radioNode ? radioNode.value : "Present";
        });

        const attendanceList = Storage.getSchoolData(schoolId, "attendance");
        const logIndex = attendanceList.findIndex(log => log.date === currentDate && log.type === "Student");

        const newLog = {
            date: currentDate,
            type: "Student",
            records: records
        };

        if (logIndex !== -1) {
            attendanceList[logIndex] = newLog;
        } else {
            attendanceList.push(newLog);
        }

        Storage.saveSchoolData(schoolId, "attendance", attendanceList);
        this.showNotification("Class Daily Attendance Logs Saved!");
        Router.render();
    },

    // ==========================================
    // MODULE 4: FEE MANAGEMENT (COLLECTIONS & PRINT A4 RECEIPTS)
    // ==========================================
    renderFeesModule: function(schoolId) {
        const container = document.getElementById("content-area");
        const fees = Storage.getSchoolData(schoolId, "fees");
        const students = Storage.getSchoolData(schoolId, "students");
        const readonly = Auth.isViewOnlyMode();

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2>💰 ${Utils.t("fee_management")} / স্যাস সংগ্রহ বুক</h2>
                ${readonly ? '' : `<button class="btn btn-primary btn-sm" onclick="App.openAddFeeModal()">💰 ${Utils.t("collect_fee")}</button>`}
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Receipt ID</th>
                            <th>Student Registered</th>
                            <th>Class</th>
                            <th>Fee Particulars</th>
                            <th>Total Amount</th>
                            <th>Paid Amount</th>
                            <th>Due Bal</th>
                            <th>Payment Date</th>
                            <th>Billing Status</th>
                            <th style="width:180px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fees.length === 0 ? `<tr><td colspan="10" class="text-muted">No fee invoice collection recorded.</td></tr>` : 
                            fees.map(f => {
                                const stu = students.find(s => s.id === f.studentId) || { name: 'Unknown Student' };
                                return `
                                    <tr>
                                        <td><code>${f.id}</code></td>
                                        <td>
                                            <strong>${stu.name}</strong><br>
                                            <span style="font-size:11px; color:var(--text-muted);">${f.studentId}</span>
                                        </td>
                                        <td><span class="badge badge-info">${f.class}</span></td>
                                        <td><strong>${f.feeType}</strong></td>
                                        <td>${f.amountTotal} ৳</td>
                                        <td><span style="color:#16a34a; font-weight:700;">${f.amountPaid} ৳</span></td>
                                        <td><span style="color:#dc2626; font-weight:700;">${f.amountDue} ৳</span></td>
                                        <td>${f.paymentDate ? Utils.formatDate(f.paymentDate) : '-'}</td>
                                        <td>
                                            <span class="badge ${f.status === 'Paid' ? 'badge-success' : f.status === 'Partial' ? 'badge-warning' : 'badge-danger'}">
                                                ${f.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style="display:flex; gap:4px;">
                                                <button class="btn btn-secondary btn-sm" onclick="PDFExporter.printReceipt('${schoolId}', '${f.id}')">
                                                    🖨️ A4 Print
                                                </button>
                                                ${readonly ? '' : `
                                                    <button class="btn btn-danger btn-sm" onclick="App.deleteFeeRecord('${f.id}')" title="Delete record transaction">
                                                        🗑️
                                                    </button>
                                                `}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')
                        }
                    </tbody>
                </table>
            </div>

            <!-- COLLECT FEE MODAL -->
            <div id="fee-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Record Fee Payment</h4>
                        <button class="modal-close" onclick="App.closeAddFeeModal()">×</button>
                    </div>
                    <form onsubmit="App.handleCreateFeeRecord(event)">
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">Choose Enrolled Student / শিক্ষার্থী নির্বাচন</label>
                                <select class="form-control" id="fee-student-select" required>
                                    <option value="">-- Choose Student --</option>
                                    ${students.map(s => `<option value="${s.id}">${s.name} (Roll: ${s.rollNumber} - ${s.class})</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Financial Particular / ফি ধরণ</label>
                                <select class="form-control" id="fee-type-input">
                                    <option value="Monthly Tuition Fee">Monthly Tuition Fee</option>
                                    <option value="Admission Fee">Admission Fee</option>
                                    <option value="Exam Fee">Exam Fee</option>
                                    <option value="Syllabus & Books Fee">Syllabus & Books Fee</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Total Fee Billing Balance (৳)</label>
                                <input type="number" class="form-control" id="fee-total-input" oninput="App.autocalcFeeDues()" placeholder="e.g. 1500" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Amount Paid Deposited (৳)</label>
                                <input type="number" class="form-control" id="fee-paid-input" oninput="App.autocalcFeeDues()" placeholder="e.g. 1500" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Remaining Outstanding Dues (৳)</label>
                                <input type="number" class="form-control" id="fee-due-input" style="background-color:#f1f5f9;" readonly>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="App.closeAddFeeModal()">${Utils.t("cancel")}</button>
                            <button type="submit" class="btn btn-primary">Process Invoice</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    openAddFeeModal: function() {
        document.getElementById("fee-modal").classList.add("active");
    },
    closeAddFeeModal: function() {
        document.getElementById("fee-modal").classList.remove("active");
    },
    autocalcFeeDues: function() {
        const total = Number(document.getElementById("fee-total-input").value || 0);
        const paid = Number(document.getElementById("fee-paid-input").value || 0);
        const due = Math.max(0, total - paid);
        document.getElementById("fee-due-input").value = due;
    },
    handleCreateFeeRecord: function(event) {
        event.preventDefault();
        const schoolId = Auth.getWorkingSchoolId();
        const studentId = document.getElementById("fee-student-select").value;
        const feeType = document.getElementById("fee-type-input").value;
        const total = Number(document.getElementById("fee-total-input").value);
        const paid = Number(document.getElementById("fee-paid-input").value);
        const due = total - paid;

        const students = Storage.getSchoolData(schoolId, "students");
        const student = students.find(s => s.id === studentId);

        let status = "Paid";
        if (due > 0 && paid > 0) status = "Partial";
        else if (paid === 0) status = "Due";

        const newFee = {
            id: Utils.generateReceiptNumber(schoolId),
            studentId,
            class: student.class,
            academicSession: "2026-2027",
            feeType,
            amountTotal: total,
            amountPaid: paid,
            amountDue: due,
            status,
            paymentDate: paid > 0 ? new Date().toISOString().split('T')[0] : ""
        };

        Storage.addModel(schoolId, "fees", newFee);
        this.closeAddFeeModal();
        this.showNotification("Fee paid transaction invoice created successfully!");
        Router.render();
    },
    deleteFeeRecord: function(id) {
        if (Auth.isViewOnlyMode()) return;
        if (confirm("Cancel and delete this invoice record statement?")) {
            const schoolId = Auth.getWorkingSchoolId();
            Storage.deleteModel(schoolId, "fees", id);
            this.showNotification("Record statement removed.");
            Router.render();
        }
    },

    // ==========================================
    // MODULE 5: RESULT SYSTEM (GPA & A4 MARKSHEETS CALC)
    // ==========================================
    renderResultsModule: function(schoolId, isTeacher = false) {
        const container = document.getElementById("content-area");
        const results = Storage.getSchoolData(schoolId, "results");
        const students = Storage.getSchoolData(schoolId, "students");
        const readonly = Auth.isViewOnlyMode();

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2>📝 ${Utils.t("results_system")} / পরীক্ষার ফলাফল ব্যবস্থাপনা</h2>
                ${readonly ? '' : `<button class="btn btn-primary btn-sm" onclick="App.openAddResultModal()">➕ Input Exam Marks</button>`}
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Student Registered</th>
                            <th>Class Level</th>
                            <th>Assessment Exam Term</th>
                            <th>Subject Evaluation (Marks Chart)</th>
                            <th>Calculated GPA</th>
                            <th>Grade Results</th>
                            <th>Peer Merit Rank</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.length === 0 ? `<tr><td colspan="8" class="text-muted">No marks recorded.</td></tr>` : 
                            results.map(r => {
                                const stu = students.find(s => s.id === r.studentId) || { name: 'Unknown Student' };
                                const evaluation = Utils.calculateOverallGPA(r.subjectMarks);
                                
                                // Calc Merit rankings inside this class
                                const ranksMap = Utils.calculateMeritRanks(schoolId, r.class, r.examType, r.academicSession);
                                const meritRank = ranksMap[r.id] || "N/A";

                                return `
                                    <tr>
                                        <td>
                                            <strong>${stu.name}</strong><br>
                                            <span style="font-size:11px; color:var(--text-muted);">${r.studentId}</span>
                                        </td>
                                        <td><span class="badge badge-info">${r.class}</span></td>
                                        <td><strong>${r.examType}</strong> (${r.academicSession})</td>
                                        <td>
                                            <div style="font-size:12px; max-width:280px; display:flex; flex-direction:column; gap:2dp;">
                                                ${Object.keys(r.subjectMarks).map(sub => `
                                                    <div style="display:flex; justify-content:space-between;">
                                                        <span>${sub}:</span>
                                                        <strong>${r.subjectMarks[sub]}</strong>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </td>
                                        <td><strong style="color:var(--primary-color); font-size:15px;">${evaluation.gpa} / 5.0</strong></td>
                                        <td>
                                            <span class="badge ${evaluation.grade !== 'F' ? 'badge-success' : 'badge-danger'}">
                                                Grade: ${evaluation.grade}
                                            </span>
                                        </td>
                                        <td><strong style="color:#0284c7;">🎉 Rank: ${meritRank}</strong></td>
                                        <td>
                                            <div style="display:flex; gap:4px;">
                                                <button class="btn btn-secondary btn-sm" onclick="PDFExporter.printMarksheet('${schoolId}', '${r.id}')">
                                                    🎓 Report A4 PDF
                                                </button>
                                                ${readonly ? '' : `
                                                    <button class="btn btn-danger btn-sm" onclick="App.deleteResultRecord('${r.id}')">
                                                        🗑️
                                                    </button>
                                                `}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')
                        }
                    </tbody>
                </table>
            </div>

            <!-- RESULT SCORING ENTRY MODAL -->
            <div id="result-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Record Marks Evaluation</h4>
                        <button class="modal-close" onclick="App.closeAddResultModal()">×</button>
                    </div>
                    <form onsubmit="App.handleCreateResultRecord(event)">
                        <div class="modal-body" style="max-height: 480px; overflow-y:auto;">
                            <div class="form-group">
                                <label class="form-label">Select Registered Student</label>
                                <select class="form-control" id="res-student-select" onchange="App.handleResultStudentSelectChange()" required>
                                    <option value="">-- Choose Student --</option>
                                    ${students.map(s => `<option value="${s.id}">${s.name} (Roll: ${s.rollNumber} - ${s.class})</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Exam Evaluation Term</label>
                                <select class="form-control" id="res-exam-type">
                                    <option value="Midterm">Midterm</option>
                                    <option value="Final">Final Exam</option>
                                </select>
                            </div>
                            
                            <!-- Dynamic Subject Score Input Cards -->
                            <h4 style="color:var(--primary-color); border-bottom:1.5px solid var(--accent-gold); margin:20px 0 10px; padding-bottom:4px;">Subject Assessment Scoring</h4>
                            <div id="res-subject-fields">
                                <div class="form-group">
                                    <label class="form-label">Quran & Tajweed (0-100)</label>
                                    <input type="number" class="form-control res-sub-mark" data-subject="Quran & Tajweed" min="0" max="100" value="80" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Al-Hadith Study (0-100)</label>
                                    <input type="number" class="form-control res-sub-mark" data-subject="Hadith" min="0" max="100" value="80" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Islamic History (0-100)</label>
                                    <input type="number" class="form-control res-sub-mark" data-subject="Islamic History" min="0" max="100" value="80" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Arabic Grammar (0-100)</label>
                                    <input type="number" class="form-control res-sub-mark" data-subject="Arabic Grammar" min="0" max="100" value="80" required>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="App.closeAddResultModal()">${Utils.t("cancel")}</button>
                            <button type="submit" class="btn btn-primary">Compile Marksheet</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    openAddResultModal: function() {
        document.getElementById("result-modal").classList.add("active");
    },
    closeAddResultModal: function() {
        document.getElementById("result-modal").classList.remove("active");
    },
    handleResultStudentSelectChange: function() {
        const schoolId = Auth.getWorkingSchoolId();
        const select = document.getElementById("res-student-select");
        const studentId = select.value;
        const student = Storage.getSchoolData(schoolId, "students").find(s => s.id === studentId);
        
        const container = document.getElementById("res-subject-fields");
        
        // Dynamically tailor subjects based on class values
        if (student && student.class === "Hifz Section") {
            container.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Hifz-ul-Quran Memorization (0-100)</label>
                    <input type="number" class="form-control res-sub-mark" data-subject="Hifz-ul-Quran" min="0" max="100" value="95" required>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Quran & Tajweed (0-100)</label>
                    <input type="number" class="form-control res-sub-mark" data-subject="Quran & Tajweed" min="0" max="100" value="80" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Al-Hadith Study (0-100)</label>
                    <input type="number" class="form-control res-sub-mark" data-subject="Hadith" min="0" max="100" value="80" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Islamic History (0-100)</label>
                    <input type="number" class="form-control res-sub-mark" data-subject="Islamic History" min="0" max="100" value="80" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Arabic Grammar (0-100)</label>
                    <input type="number" class="form-control res-sub-mark" data-subject="Arabic Grammar" min="0" max="100" value="80" required>
                </div>
            `;
        }
    },
    handleCreateResultRecord: function(event) {
        event.preventDefault();
        const schoolId = Auth.getWorkingSchoolId();
        const studentId = document.getElementById("res-student-select").value;
        const examType = document.getElementById("res-exam-type").value;

        const students = Storage.getSchoolData(schoolId, "students");
        const student = students.find(s => s.id === studentId);

        const scoreFields = document.querySelectorAll(".res-sub-mark");
        const subjectMarksMap = {};
        
        scoreFields.forEach(field => {
            const subject = field.getAttribute("data-subject");
            subjectMarksMap[subject] = Number(field.value);
        });

        const results = Storage.getSchoolData(schoolId, "results");
        const id = `RES-${schoolId}-${studentId}-${examType}`;

        if (results.find(r => r.id === id)) {
            return this.showNotification("Conflict! Marksheet already exists for this Student, Class & Exam Type.", "error");
        }

        const newResult = {
            id,
            studentId,
            examType,
            academicSession: "2026-2027",
            class: student.class,
            subjectMarks: subjectMarksMap
        };

        Storage.addModel(schoolId, "results", newResult);
        this.closeAddResultModal();
        this.showNotification("Student marks records calculated!");
        Router.render();
    },
    deleteResultRecord: function(id) {
        if (Auth.isViewOnlyMode()) return;
        if (confirm("Remove this marksheet statement? Record will dissolve from merit rankings.")) {
            const schoolId = Auth.getWorkingSchoolId();
            Storage.deleteModel(schoolId, "results", id);
            this.showNotification("Marksheet deleted.");
            Router.render();
        }
    },

    // ==========================================
    // MODULE 6: ISLAMIC NOTICE BOARD
    // ==========================================
    renderNoticesModule: function(schoolId, isTeacher = false) {
        const container = document.getElementById("content-area");
        const notices = Storage.getSchoolData(schoolId, "notices");
        const readonly = Auth.isViewOnlyMode();

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2>🕌 ${Utils.t("notices")} / মাদরাসা নোটিশ বোর্ড</h2>
                ${readonly ? '' : `<button class="btn btn-primary btn-sm" onclick="App.openAddNoticeModal()">➕ Add Notice</button>`}
            </div>

            <div style="display:flex; flex-direction:column; gap:20px;">
                ${notices.length === 0 ? `<p class="text-muted card card-body text-center" style="padding: 40px;">No public announcement logged on this board.</p>` : 
                    notices.map(n => `
                        <div class="card" style="border-top-color: var(--accent-gold);">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="badge badge-info">Audience Scope: ${n.target}</span>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span class="text-muted" style="font-size:12px;">📅 Displayed: ${Utils.formatDate(n.date)}</span>
                                    ${readonly ? '' : `
                                        <button class="btn btn-danger btn-sm" style="padding:4px 8px; font-size:10px;" onclick="App.deleteNotice('${n.id}')">
                                            🗑️ Remove
                                        </button>
                                    `}
                                </div>
                            </div>
                            <h3 style="color:var(--primary-color); margin:10px 0 stroke:#000;">${n.title}</h3>
                            <p style="color:var(--text-dark); max-width: 90%; font-size: 14.5px;">${n.content}</p>
                        </div>
                    `).join('')
                }
            </div>

            <!-- PUBLIC NOTICE MODAL -->
            <div id="notice-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Broadcast Institutional Notice</h4>
                        <button class="modal-close" onclick="App.closeAddNoticeModal()">×</button>
                    </div>
                    <form onsubmit="App.handleCreateNotice(event)">
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">Alert Header Title / নোটিশ শিরোনাম</label>
                                <input type="text" class="form-control" id="not-title-input" placeholder="e.g. Eid-ul-Adha Vacation Announcement" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Audience Scope / লক্ষ্য শ্রেণি</label>
                                <select class="form-control" id="not-target-input">
                                    <option value="All">All Students & Teachers</option>
                                    <option value="Class 1">Class 1</option>
                                    <option value="Class 2">Class 2</option>
                                    <option value="Class 3">Class 3</option>
                                    <option value="Hifz Section">Hifz Section</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Notice Details Memo Contents / নোটিশের বিষয়বস্তু</label>
                                <textarea class="form-control" id="not-content-input" style="height:120px; font-size:14px; text-align: left;" required></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="App.closeAddNoticeModal()">${Utils.t("cancel")}</button>
                            <button type="submit" class="btn btn-primary">Broadcast Alert</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    openAddNoticeModal: function() {
        document.getElementById("notice-modal").classList.add("active");
    },
    closeAddNoticeModal: function() {
        document.getElementById("notice-modal").classList.remove("active");
    },
    handleCreateNotice: function(event) {
        event.preventDefault();
        const schoolId = Auth.getWorkingSchoolId();
        const title = document.getElementById("not-title-input").value;
        const target = document.getElementById("not-target-input").value;
        const content = document.getElementById("not-content-input").value;

        const newNotice = {
            id: `NOT-${Date.now()}`,
            title,
            target,
            content,
            date: new Date().toISOString().split('T')[0]
        };

        Storage.addModel(schoolId, "notices", newNotice);
        this.closeAddNoticeModal();
        this.showNotification("Notice broadcasted onto bulletins boards!");
        Router.render();
    },
    deleteNotice: function(id) {
        if (Auth.isViewOnlyMode()) return;
        if (confirm("Take down notice? Action will remove it from all student feeds.")) {
            const schoolId = Auth.getWorkingSchoolId();
            Storage.deleteModel(schoolId, "notices", id);
            this.showNotification("Notice pulled down.");
            Router.render();
        }
    },

    // ==========================================
    // MODULE 7: SETTINGS (LOGO, ACCENT COLOR, SESSIONS)
    // ==========================================
    renderSettingsModule: function(schoolId) {
        const container = document.getElementById("content-area");
        const schools = Storage.getSchools();
        const school = schools.find(s => s.id === schoolId);
        const readonly = Auth.isViewOnlyMode();

        container.innerHTML = `
            <h2>⚙️ ${Utils.t("settings")} / মাদরাসা কাস্টম সেটিংস</h2>
            <p class="text-muted" style="margin-bottom:24px;">Adjust institution logo, modify themes color profiles, and maintain academic sessions.</p>

            <div class="card" style="max-width:650px; border-top-color:var(--primary-color);">
                <form onsubmit="App.handleSaveSettings(event)">
                    <div class="form-group">
                        <label class="form-label">School Logo Badge Emoji</label>
                        <input type="text" class="form-control" id="set-logo" value="${school.logo || '🕌'}" ${readonly ? 'disabled' : ''} required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Branding Theme Color / থিম কালার</label>
                        <div style="display:flex; gap:12px; align-items:center;">
                            <input type="color" id="set-color" value="${school.themeColor || '#1b5e20'}" style="width:50px; height:45px; cursor:pointer;" ${readonly ? 'disabled' : ''}>
                            <code style="font-size:14px; color:var(--text-muted);">${school.themeColor || '#1b5e20'}</code>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Active Academic Session / শিক্ষাবর্ষ</label>
                        <input type="text" class="form-control" id="set-session" value="${school.academicSession || '2026-2027'}" ${readonly ? 'disabled' : ''} required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">SaaS Subdomain URL</label>
                        <input type="text" class="form-control" style="background-color:#f8fafc;" value="${school.subdomain}" disabled>
                    </div>

                    ${readonly ? '' : `
                        <button type="submit" class="btn btn-primary" style="margin-top:10px;">
                            💾 Save Settings Updates
                        </button>
                    `}
                </form>
            </div>
        `;
    },

    handleSaveSettings: function(event) {
        event.preventDefault();
        if (Auth.isViewOnlyMode()) return;
        const schoolId = Auth.getWorkingSchoolId();
        const logo = document.getElementById("set-logo").value;
        const themeColor = document.getElementById("set-color").value;
        const academicSession = document.getElementById("set-session").value;

        const schools = Storage.getSchools();
        const index = schools.findIndex(s => s.id === schoolId);
        if (index !== -1) {
            schools[index].logo = logo;
            schools[index].themeColor = themeColor;
            schools[index].academicSession = academicSession;
            Storage.saveSchools(schools);

            this.showNotification("School settings updated successfully!");
            location.reload(); // Hard reloads are valuable here to refresh CSS custom variables system-wide
        }
    }
};

// Start application initialization
window.addEventListener("DOMContentLoaded", () => {
    App.init();
});
