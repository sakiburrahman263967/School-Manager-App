/**
 * Madrasah ERP SPA Routing Engine
 * Loads views, builds HTML templates dynamically, and injects them
 * into the main DOM content area.
 */

const Router = {
    currentRoute: "dashboard",

    init: function() {
        // Handle global click interception for spa navigation
        document.addEventListener("click", (e) => {
            const link = e.target.closest(".spa-route");
            if (link) {
                e.preventDefault();
                const route = link.getAttribute("data-route");
                this.navigate(route);
            }
        });

        // Initial render
        this.render();
    },

    navigate: function(route) {
        this.currentRoute = route;
        this.render();
    },

    // Main render method
    render: function() {
        const user = Auth.getActiveUser();
        const contentContainer = document.getElementById("content-area");
        
        // Ensure app shell is displayed correctly based on auth status
        const appShell = document.getElementById("app-shell");
        
        if (!user) {
            // Unauthenticated
            appShell.style.display = "block";
            this.renderLogin();
            return;
        }

        // Authenticated
        appShell.style.display = "flex";
        this.renderSidebarAndHeader(user);

        // Redirect based on privilege guards
        if (user.role === "superadmin" && !Auth.isViewOnlyMode()) {
            if (this.currentRoute === "dashboard" || this.currentRoute === "superadmin") {
                this.renderSuperAdmin();
            } else {
                // Super admin monitoring a specific tenant school
                this.renderSchoolAdmin();
            }
        } else if (user.role === "schooladmin" || (user.role === "superadmin" && Auth.isViewOnlyMode())) {
            this.renderSchoolAdmin();
        } else if (user.role === "teacher") {
            this.renderTeacher();
        } else if (user.role === "student") {
            this.renderStudent();
        }
        
        // Hide modals on navigation
        const modal = document.querySelector(".modal");
        if (modal) modal.classList.remove("active");

        // Close sidebar on navigation (on mobile viewports)
        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.remove("active");
    },

    // ==========================================
    // 1. RENDER LOGIN SCREEN
    // ==========================================
    renderLogin: function() {
        const schools = Storage.getSchools();
        const activeSchools = schools.filter(s => s.status === "Active");
        const lang = Utils.getLanguage();

        const container = document.getElementById("app-shell");
        container.innerHTML = `
            <div id="login-container">
                <div class="islamic-pattern"></div>
                <div class="login-card" style="position: relative; z-index: 10;">
                    <div style="position: absolute; top: 15px; right: 15px;">
                        <select class="lang-selector" onchange="App.toggleLanguage(this.value)">
                            <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
                            <option value="bn" ${lang === 'bn' ? 'selected' : ''}>বাংলা</option>
                        </select>
                    </div>

                    <div class="login-header">
                        <div class="login-logo">🕌</div>
                        <h2 class="login-title">${Utils.t("app_title")}</h2>
                        <p class="login-subtitle">Multi-Tenant School Management Platform</p>
                    </div>

                    <div class="login-tabs">
                        <div class="login-tab active" data-role="student" onclick="App.switchLoginTab('student')">${Utils.t("student_parent_portal")}</div>
                        <div class="login-tab" data-role="teacher" onclick="App.switchLoginTab('teacher')">Teacher</div>
                        <div class="login-tab" data-role="schooladmin" onclick="App.switchLoginTab('schooladmin')">Admin</div>
                        <div class="login-tab" data-role="superadmin" onclick="App.switchLoginTab('superadmin')">SaaS Owner</div>
                    </div>

                    <!-- LOGIN FORM -->
                    <form id="login-form" onsubmit="App.handleLoginSubmit(event)">
                        <input type="hidden" id="login-role" value="student">

                        <!-- Institution Select (Hidden for Super Admin) -->
                        <div class="form-group" id="login-school-group">
                            <label class="form-label">${Utils.t("schools")} / মাদরাসা</label>
                            <select class="form-control" id="login-school-id">
                                <option value="">-- Choose Institution --</option>
                                ${activeSchools.map(s => `<option value="${s.id}">${s.logo} ${s.name} (${s.subdomain})</option>`).join('')}
                            </select>
                        </div>

                        <!-- Dynamic Inputs -->
                        <div id="dynamic-login-inputs">
                            <!-- Default: Student Login (Roll + DOB) -->
                            <div class="form-group">
                                <label class="form-label">Student Roll Number / আইডি</label>
                                <input type="text" class="form-control" id="login-roll" placeholder="e.g. 101" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date of Birth / জন্মতারিখ</label>
                                <input type="date" class="form-control" id="login-dob" required>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%; height: 48px; margin-top: 10px;">
                            Sign In / প্রবেশ করুন
                        </button>
                    </form>
                </div>
            </div>
        `;
    },

    // ==========================================
    // RENDER HEADER & SIDEBAR CORE SHELL
    // ==========================================
    renderSidebarAndHeader: function(user) {
        const lang = Utils.getLanguage();
        const workingSchoolId = Auth.getWorkingSchoolId();
        const schools = Storage.getSchools();
        const school = workingSchoolId ? schools.find(s => s.id === workingSchoolId) : null;
        
        let headerTitle = Utils.t("app_title");
        let schoolLogo = "🕌";
        if (school) {
            headerTitle = school.name;
            schoolLogo = school.logo || "🕌";
        } else if (user.role === "superadmin") {
            headerTitle = "SaaS System Admin Office";
            schoolLogo = "👑";
        }

        // Generate Sidebar markup
        let sidebarLinks = [];
        
        if (user.role === "superadmin" && !Auth.isViewOnlyMode()) {
            sidebarLinks = [
                { route: "superadmin", label: Utils.t("schools"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 21V10a2 2 0 012-2h10a2 2 0 012 2v11M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M2 10a2 2 0 012-2h16a2 2 0 012 2v0a2 2 0 01-2 2H4a2 2 0 01-2-2z"/></svg>` }
            ];
        } else if (user.role === "schooladmin" || Auth.isViewOnlyMode()) {
            sidebarLinks = [
                { route: "dashboard", label: Utils.t("dashboard"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>` },
                { route: "students", label: Utils.t("student_management"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110-8 4 4 0 010 8zm14 14v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>` },
                { route: "teachers", label: Utils.t("teacher_management"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14v7M4.33 11.17V18a2 2 0 002 2h11.34a2 2 0 002-2v-6.83"/></svg>` },
                { route: "attendance", label: Utils.t("attendance"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>` },
                { route: "fees", label: Utils.t("fee_management"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>` },
                { route: "results", label: Utils.t("results_system"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>` },
                { route: "notices", label: Utils.t("notices"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>` },
                { route: "settings", label: Utils.t("settings"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>` }
            ];
        } else if (user.role === "teacher") {
            sidebarLinks = [
                { route: "dashboard", label: Utils.t("dashboard"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>` },
                { route: "attendance", label: Utils.t("attendance"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>` },
                { route: "results", label: "Marks Entry", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>` },
                { route: "notices", label: Utils.t("notices"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>` }
            ];
        } else if (user.role === "student") {
            sidebarLinks = [
                { route: "dashboard", label: Utils.t("dashboard"), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>` },
                { route: "attendance", label: "Attendance Report", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>` },
                { route: "fees", label: "Paid Receipts", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>` },
                { route: "results", label: "Download Marksheet", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>` }
            ];
        }

        // Apply custom colors if specified in tenant settings
        const currentPrimaryColor = (school && school.themeColor) ? school.themeColor : "#1b5e20";
        document.documentElement.style.setProperty('--primary-color', currentPrimaryColor);
        document.documentElement.style.setProperty('--primary-dark', this.adjustColorBrightness(currentPrimaryColor, -15));

        const bodyHTML = `
            <!-- Sidebar -->
            <div id="sidebar">
                <div class="brand">
                    <div class="brand-logo">${schoolLogo}</div>
                    <div class="brand-name">${headerTitle}</div>
                    <div class="brand-tagline">Islamic Clean ERP System</div>
                </div>
                <ul class="sidebar-menu">
                    ${sidebarLinks.map(link => `
                        <li class="sidebar-menu-item">
                            <a href="#" class="sidebar-link spa-route ${this.currentRoute === link.route ? 'active' : ''}" data-route="${link.route}">
                                ${link.icon}
                                <span>${link.label}</span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
                <div id="sidebar-footer">
                    <div>User: ${user.name}</div>
                    <div style="font-size: 10px; margin-top: 4px; color: var(--accent-gold);">Role: ${user.role.toUpperCase()}</div>
                </div>
            </div>

            <!-- Page Container Wrapper -->
            <div id="main-layout">
                <header>
                    <div class="header-left">
                        <button class="menu-toggle" onclick="App.toggleSidebar()">☰</button>
                        <div class="header-title-container">
                            <span class="header-school-name">
                                ${headerTitle} 
                                ${Auth.isViewOnlyMode() ? `<span class="header-view-mode-badge">${Utils.t("view_mode")}</span>` : ''}
                            </span>
                        </div>
                    </div>
                    <div class="header-right">
                        <!-- Dual Language Swapper -->
                        <select class="lang-selector" onchange="App.toggleLanguage(this.value)">
                            <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
                            <option value="bn" ${lang === 'bn' ? 'selected' : ''}>বাংলা</option>
                        </select>

                        ${Auth.isViewOnlyMode() ? `
                            <button class="btn btn-secondary btn-sm" onclick="App.exitViewMode()">
                                🔙 ${Utils.t("back_to_super")}
                            </button>
                        ` : `
                            <button class="btn btn-danger btn-sm" onclick="App.handleLogout()">
                                🚪 ${Utils.t("logout")}
                            </button>
                        `}
                    </div>
                </header>
                <div id="content-area">
                    <!-- Target element where children scripts build actual content views -->
                </div>
            </div>
        `;
        
        const shell = document.getElementById("app-shell");
        if (shell.innerHTML.indexOf('id="main-layout"') === -1) {
            shell.innerHTML = bodyHTML;
        } else {
            // Only update dynamic sidebar states rather than rebuilding heavy dom tree completely which flickers
            const sidebar = document.getElementById("sidebar");
            const header = document.querySelector("header");
            if (sidebar) {
                // Keep sidebar options fresh
                const updatedSidebar = document.createElement("div");
                updatedSidebar.innerHTML = bodyHTML;
                sidebar.innerHTML = updatedSidebar.querySelector("#sidebar").innerHTML;
                header.innerHTML = updatedSidebar.querySelector("header").innerHTML;
            }
        }
    },

    // Helper to dim hexadecimal hexes for darker branding values
    adjustColorBrightness: function(hex, percent) {
        let R = parseInt(hex.substring(1,3),16);
        let G = parseInt(hex.substring(3,5),16);
        let B = parseInt(hex.substring(5,7),16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R<255)?R:255;
        G = (G<255)?G:255;
        B = (B<255)?B:255;

        R = (R<0)?0:R;
        G = (G<0)?0:G;
        B = (B<0)?0:B;

        let rHex = R.toString(16).padStart(2,'0');
        let gHex = G.toString(16).padStart(2,'0');
        let bHex = B.toString(16).padStart(2,'0');

        return `#${rHex}${gHex}${bHex}`;
    },

    // ==========================================
    // 2. RENDER SUPER ADMIN DASHBOARD
    // ==========================================
    renderSuperAdmin: function() {
        const stats = Storage.getGlobalStats();
        const schools = Storage.getSchools();
        const contentContainer = document.getElementById("content-area");

        contentContainer.innerHTML = `
            <h2>👑 Platform Super Admin Console</h2>
            <p class="text-muted" style="margin-bottom: 25px;">Create, activate, suspend schools, track global register stats, and monitor systems.</p>

            <!-- Grid statistics -->
            <div class="grid-container">
                <div class="card">
                    <div class="card-title">${Utils.t("total_schools")}</div>
                    <div class="card-value">${stats.totalSchools}</div>
                    <div class="card-subtitle">Registered Tenancies</div>
                </div>
                <div class="card" style="border-top-color: #22c55e;">
                    <div class="card-title">${Utils.t("active_schools")}</div>
                    <div class="card-value" style="color: #22c55e;">${stats.activeCount}</div>
                    <div class="card-subtitle">Active subscriptions</div>
                </div>
                <div class="card" style="border-top-color: #ef4444;">
                    <div class="card-title">${Utils.t("suspended_schools")}</div>
                    <div class="card-value" style="color: #ef4444;">${stats.suspendedCount}</div>
                    <div class="card-subtitle">Requires renewal billing</div>
                </div>
                <div class="card" style="border-top-color: var(--accent-gold);">
                    <div class="card-title">${Utils.t("revenue")}</div>
                    <div class="card-value" style="color: var(--accent-gold);">${stats.totalRevenue ? stats.totalRevenue.toLocaleString() + ' ৳' : '0 ৳'}</div>
                    <div class="card-subtitle">Aggregated collected fees</div>
                </div>
            </div>

            <!-- Global list -->
            <div class="table-container" style="margin-top: 30px;">
                <div style="padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(197, 160, 89, 0.3);">
                    <h3 style="color: var(--primary-color); font-weight: 700;">🏫 ${Utils.t("schools")}</h3>
                    <button class="btn btn-primary btn-sm" onclick="App.openAddSchoolModal()">➕ ${Utils.t("add_school")}</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>${Utils.t("school_id")}</th>
                            <th>School Name / মাদরাসা</th>
                            <th>${Utils.t("subdomain")}</th>
                            <th>Admin Credentials</th>
                            <th>Plan Timeline</th>
                            <th>${Utils.t("status")}</th>
                            <th style="width: 280px;">${Utils.t("actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schools.map(s => `
                            <tr>
                                <td><strong style="color: var(--accent-gold);">${s.id}</strong></td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 20px;">${s.logo || '🕌'}</span>
                                        <strong>${s.name}</strong>
                                    </div>
                                </td>
                                <td><code>${s.subdomain}</code></td>
                                <td style="font-size: 13px;">
                                    <div>📧 ${s.adminEmail}</div>
                                    <div class="text-muted">🔑 ${s.adminPassword || 'admin123'}</div>
                                </td>
                                <td style="font-size: 12px;">
                                    <div>📅 Starts: ${s.planStart || '-'}</div>
                                    <div class="text-muted">📅 Ends: ${s.planEnd || '-'}</div>
                                </td>
                                <td>
                                    <span class="badge ${s.status === 'Active' ? 'badge-success' : 'badge-danger'}">
                                        ${s.status === 'Active' ? 'Active' : 'Suspended'}
                                    </span>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 6px;">
                                        <button class="btn btn-secondary btn-sm" onclick="App.enterViewMode('${s.id}')" title="Monitor school records in display mode">
                                            👁️ Monitor
                                        </button>
                                        ${s.status === 'Active' ? `
                                            <button class="btn btn-danger btn-sm" onclick="App.toggleSchoolStatus('${s.id}', 'Suspended')">
                                                ⏸️ Suspend
                                            </button>
                                        ` : `
                                            <button class="btn btn-primary btn-sm" style="background-color: #22c55e;" onclick="App.toggleSchoolStatus('${s.id}', 'Active')">
                                                ▶️ Activate
                                            </button>
                                        `}
                                        <button class="btn btn-danger btn-sm" style="padding: 6px 10px;" onclick="App.deleteSchool('${s.id}')" title="Incur soft-delete removal">
                                            🗑️ Remove
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- MODAL FOR ADDING SCHOOL -->
            <div id="school-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">${Utils.t("add_school")}</h4>
                        <button class="modal-close" onclick="App.closeAddSchoolModal()">×</button>
                    </div>
                    <form onsubmit="App.handleCreateSchoolSubmit(event)">
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">School ID (Numeric - e.g. 004)</label>
                                <input type="text" class="form-control" id="school-id-input" placeholder="e.g. 004" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">School Name / শিক্ষা প্রতিষ্ঠানের নাম</label>
                                <input type="text" class="form-control" id="school-name-input" placeholder="e.g. Baitul Mukarram Academy" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Subdomain Access Slug</label>
                                <input type="text" class="form-control" id="school-subdomain-input" placeholder="e.g. mukarram" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">School Logo Badge Emoji</label>
                                <input type="text" class="form-control" id="school-logo-input" value="🕌" placeholder="🕌 or 📖" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Admin Email Credentials</label>
                                <input type="email" class="form-control" id="school-email-input" placeholder="e.g. headmaster@school.com" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Admin Password Access</label>
                                <input type="password" class="form-control" id="school-password-input" value="admin123" required>
                            </div>
                            <div class="flex-row-gap-md">
                                <div class="form-group" style="flex:1;">
                                    <label class="form-label">Plan Start Date</label>
                                    <input type="date" class="form-control" id="school-start-input" required>
                                </div>
                                <div class="form-group" style="flex:1;">
                                    <label class="form-label">Plan End Date</label>
                                    <input type="date" class="form-control" id="school-end-input" required>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="App.closeAddSchoolModal()">${Utils.t("cancel")}</button>
                            <button type="submit" class="btn btn-primary">${Utils.t("save")}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Auto-fill dates in inputs
        document.getElementById("school-start-input").value = new Date().toISOString().split('T')[0];
        const end = new Date();
        end.setFullYear(end.getFullYear() + 1);
        document.getElementById("school-end-input").value = end.toISOString().split('T')[0];
    },

    // ==========================================
    // 3. RENDER SCHOOL ADMIN DASHBOARD (MASTER COMPONENT)
    // ==========================================
    renderSchoolAdmin: function() {
        const schoolId = Auth.getWorkingSchoolId();
        const school = Storage.getSchools().find(s => s.id === schoolId);
        const subRoute = this.currentRoute;
        const contentContainer = document.getElementById("content-area");

        if (subRoute === "dashboard") {
            // Aggregated stats of this tenant
            const students = Storage.getSchoolData(schoolId, "students");
            const teachers = Storage.getSchoolData(schoolId, "teachers");
            const notices = Storage.getSchoolData(schoolId, "notices");
            const fees = Storage.getSchoolData(schoolId, "fees");
            
            // Calc collected details
            let totalCollectedAndPaid = 0;
            let totalOutstandingDues = 0;
            fees.forEach(f => {
                totalCollectedAndPaid += Number(f.amountPaid || 0);
                totalOutstandingDues += Number(f.amountDue || 0);
            });

            contentContainer.innerHTML = `
                <div style="background-color: var(--primary-color); color: #ffffff; padding: 30px; border-radius: 12px; margin-bottom: 30px; position: relative;">
                    <div class="islamic-pattern"></div>
                    <div style="position: relative; z-index: 10;">
                        <h1>আস-সালামু আলাইকুম / Peace be upon you!</h1>
                        <p style="opacity: 0.9; margin-top: 5px;">Welcome to <strong>${school.name}</strong> Institutional Center.</p>
                        <div class="ornament-line"></div>
                        <div style="display: flex; gap: 20px; font-size: 14px; flex-wrap: wrap;">
                            <span>📅 <strong>${Utils.t("academic_session")}:</strong> ${school.academicSession || '2026-2027'}</span>
                            <span>🌐 <strong>URL:</strong> ${school.subdomain}</span>
                        </div>
                    </div>
                </div>

                <div class="grid-container">
                    <div class="card">
                        <div class="card-title">${Utils.t("total_students")}</div>
                        <div class="card-value">${students.length}</div>
                        <div class="card-subtitle">Active Registrations</div>
                    </div>
                    <div class="card">
                        <div class="card-title">${Utils.t("total_teachers")}</div>
                        <div class="card-value">${teachers.length}</div>
                        <div class="card-subtitle">Staff Faculty Strength</div>
                    </div>
                    <div class="card" style="border-top-color: #22c55e;">
                        <div class="card-title">Collected Fees / সংগৃহীত ফি</div>
                        <div class="card-value" style="color: #22c55e;">${totalCollectedAndPaid.toLocaleString()} ৳</div>
                        <div class="card-subtitle">Actual collected funds</div>
                    </div>
                    <div class="card" style="border-top-color: #ef4444;">
                        <div class="card-title">Due Fees / বকেয়া ফি</div>
                        <div class="card-value" style="color: #ef4444;">${totalOutstandingDues.toLocaleString()} ৳</div>
                        <div class="card-subtitle">Pending collections</div>
                    </div>
                </div>

                <div class="flex-row-gap-md">
                    <!-- School Notices board -->
                    <div class="card" style="flex: 2; border-top-color: var(--accent-gold);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="color: var(--primary-color); font-weight: 700;">🕌 ${Utils.t("notices")}</h3>
                        </div>
                        ${notices.length === 0 ? `<p class="text-muted">No notices on board yet.</p>` : `
                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                ${notices.slice(0, 3).map(n => `
                                    <div style="background-color: var(--bg-light); border-left: 4px solid var(--accent-gold); padding: 15px; border-radius: 6px;">
                                        <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">
                                            <span>🎯 Target: <strong>${n.target}</strong></span>
                                            <span>📅 ${Utils.formatDate(n.date)}</span>
                                        </div>
                                        <h4 style="color: var(--primary-color); font-weight: 700; margin-bottom: 5px;">${n.title}</h4>
                                        <p style="font-size: 14px; color: var(--text-dark);">${n.content}</p>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                    <!-- Quick Actions -->
                    <div class="card" style="flex: 1; border-top-color: var(--primary-color);">
                        <h3 style="color: var(--primary-color); font-weight: 700; margin-bottom: 15px;">⚡ Quick Actions</h3>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button class="btn btn-secondary spa-route" data-route="students" style="justify-content: flex-start;">👤 Enroll New Student</button>
                            <button class="btn btn-secondary spa-route" data-route="fees" style="justify-content: flex-start;">💰 Record Fee Collection</button>
                            <button class="btn btn-secondary spa-route" data-route="results" style="justify-content: flex-start;">📝 Enter Exam Marks</button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Module Render Matchings
        else if (subRoute === "students") {
            App.renderStudentsModule(schoolId);
        } else if (subRoute === "teachers") {
            App.renderTeachersModule(schoolId);
        } else if (subRoute === "attendance") {
            App.renderAttendanceModule(schoolId);
        } else if (subRoute === "fees") {
            App.renderFeesModule(schoolId);
        } else if (subRoute === "results") {
            App.renderResultsModule(schoolId);
        } else if (subRoute === "notices") {
            App.renderNoticesModule(schoolId);
        } else if (subRoute === "settings") {
            App.renderSettingsModule(schoolId);
        }
    },

    // ==========================================
    // 4. RENDER TEACHER PORTAL
    // ==========================================
    renderTeacher: function() {
        const user = Auth.getActiveUser();
        const schoolId = user.schoolId;
        const subRoute = this.currentRoute;
        const contentContainer = document.getElementById("content-area");

        if (subRoute === "dashboard") {
            const students = Storage.getSchoolData(schoolId, "students").filter(s => s.class === user.class);
            const notices = Storage.getSchoolData(schoolId, "notices");

            contentContainer.innerHTML = `
                <div style="background-color: var(--primary-color); color: #ffffff; padding: 30px; border-radius: 12px; margin-bottom: 30px; position: relative;">
                    <div class="islamic-pattern"></div>
                    <div style="position: relative; z-index: 10;">
                        <h1>শিক্ষক প্যানেল / Welcome, ${user.name}!</h1>
                        <p style="opacity: 0.9; margin-top: 5px;">Instructor of <strong>${user.class}</strong> | Subject Specialist: <strong>${user.subject}</strong></p>
                        <div class="ornament-line"></div>
                        <div style="display: flex; gap: 20px; font-size: 14px; flex-wrap: wrap;">
                            <span>🏢 <strong>Institution:</strong> ${user.schoolName}</span>
                            <span>📧 <strong>Email:</strong> ${user.email}</span>
                        </div>
                    </div>
                </div>

                <div class="grid-container">
                    <div class="card" style="border-top-color: var(--accent-gold);">
                        <div class="card-title">Assigned Students Class Coverage</div>
                        <div class="card-value">${students.length} Student(s)</div>
                        <div class="card-subtitle">Enrolled in ${user.class}</div>
                    </div>
                    <div class="card" style="border-top-color: var(--primary-color);">
                        <div class="card-title">My Classroom Subject</div>
                        <div class="card-value" style="font-size: 24px; padding-top: 8px;">${user.subject}</div>
                        <div class="card-subtitle">Lesson assignment</div>
                    </div>
                </div>

                <div class="card" style="border-top-color: var(--accent-gold);">
                    <h3 style="color: var(--primary-color); font-weight: 700; margin-bottom: 15px;">🕌 Institutional Notice Alerts</h3>
                    ${notices.length === 0 ? `<p class="text-muted">No notices on board yet.</p>` : `
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            ${notices.filter(n => n.target === 'All' || n.target === user.class).map(n => `
                                <div style="background-color: var(--bg-light); border-left: 4px solid var(--accent-gold); padding: 15px; border-radius: 6px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">
                                        <span>🌍 Audience: ${n.target}</span>
                                        <span>📅 ${Utils.formatDate(n.date)}</span>
                                    </div>
                                    <h4 style="color: var(--primary-color);">${n.title}</h4>
                                    <p style="font-size: 13.5px; opacity: 0.9; margin-top: 4px;">${n.content}</p>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        }

        else if (subRoute === "attendance") {
            App.renderAttendanceModule(schoolId, true); // Teacher layout mode
        } else if (subRoute === "results") {
            App.renderResultsModule(schoolId, true); // Teacher layout mode
        } else if (subRoute === "notices") {
            App.renderNoticesModule(schoolId, true); // Read-only modes
        }
    },

    // ==========================================
    // 5. RENDER STUDENT / PARENT PORTAL
    // ==========================================
    renderStudent: function() {
        const user = Auth.getActiveUser();
        const schoolId = user.schoolId;
        const subRoute = this.currentRoute;
        const contentContainer = document.getElementById("content-area");

        if (subRoute === "dashboard") {
            const notices = Storage.getSchoolData(schoolId, "notices").filter(n => n.target === 'All' || n.target === user.class);
            const fees = Storage.getSchoolData(schoolId, "fees").filter(f => f.studentId === user.id);
            const attendance = Storage.getSchoolData(schoolId, "attendance");

            // Compute student summary metrics
            let paidTotal = 0;
            let dueTotal = 0;
            fees.forEach(f => {
                paidTotal += Number(f.amountPaid || 0);
                dueTotal += Number(f.amountDue || 0);
            });

            // Calc attendance stats
            let presentCount = 0;
            let totalDaysEvaluated = 0;
            attendance.forEach(log => {
                if (log.records && log.records[user.id]) {
                    totalDaysEvaluated++;
                    if (log.records[user.id] === "Present") presentCount++;
                }
            });
            const attendanceRate = totalDaysEvaluated > 0 ? ((presentCount / totalDaysEvaluated) * 100).toFixed(0) : "100";

            contentContainer.innerHTML = `
                <div style="background-color: var(--primary-color); color: #ffffff; padding: 30px; border-radius: 12px; margin-bottom: 30px; position: relative;">
                    <div class="islamic-pattern"></div>
                    <div style="position: relative; z-index: 10;">
                        <h1>শিক্ষার্থী প্রবেশ / Welcome, ${user.name}!</h1>
                        <p style="opacity: 0.9; margin-top: 5px;">Roll Number: <strong>${user.rollNumber}</strong> | Class: <strong>${user.class}</strong></p>
                        <div class="ornament-line"></div>
                        <div style="display: flex; gap: 20px; font-size: 14px; flex-wrap: wrap;">
                            <span>🏢 <strong>Institution ID:</strong> ${user.schoolId}</span>
                            <span>🎂 <strong>DOB:</strong> ${Utils.formatDate(user.dob)}</span>
                        </div>
                    </div>
                </div>

                <div class="grid-container">
                    <div class="card" style="border-top-color: var(--accent-gold);">
                        <div class="card-title">Presence Attendance Track</div>
                        <div class="card-value">${attendanceRate}%</div>
                        <div class="card-subtitle">Present days: ${presentCount}/${totalDaysEvaluated}</div>
                    </div>
                    <div class="card" style="border-top-color: #22c55e;">
                        <div class="card-title">Paid Ledger Funds</div>
                        <div class="card-value" style="color: #22c55e;">${paidTotal.toLocaleString()} ৳</div>
                        <div class="card-subtitle">Completed fees</div>
                    </div>
                    <div class="card" style="border-top-color: #ef4444;">
                        <div class="card-title">Your Current Billing Dues</div>
                        <div class="card-value" style="color: #ef4444;">${dueTotal.toLocaleString()} ৳</div>
                        <div class="card-subtitle">Awaiting settlement</div>
                    </div>
                </div>

                <div class="flex-row-gap-md">
                    <!-- General details -->
                    <div class="card" style="flex:1; border-top-color: var(--primary-color);">
                        <h3 style="color: var(--primary-color); font-weight: 700; margin-bottom: 12px;">👤 Student Profile Data</h3>
                        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
                            <div>👤 <strong>Full Name:</strong> ${user.name}</div>
                            <div>📝 <strong>Registration Roll:</strong> ${user.rollNumber}</div>
                            <div>📚 <strong>Class Level:</strong> ${user.class}</div>
                            <div>🎂 <strong>Date of Birth:</strong> ${Utils.formatDate(user.dob)}</div>
                        </div>
                    </div>
                    <!-- Urgent Notices -->
                    <div class="card" style="flex:1.5; border-top-color: var(--accent-gold);">
                        <h3 style="color: var(--primary-color); font-weight: 700; margin-bottom: 12px;">🕌 Notice Announcements</h3>
                        ${notices.length === 0 ? `<p class="text-muted">No notices on board.</p>` : `
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${notices.slice(0, 2).map(n => `
                                    <div style="background-color: var(--bg-light); border-left: 3px solid var(--accent-gold); padding: 12px; border-radius: 6px;">
                                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
                                            <span>📅 ${n.date}</span>
                                        </div>
                                        <h4 style="color: var(--primary-color);">${n.title}</h4>
                                        <p style="font-size: 13px; margin-top: 4px;">${n.content}</p>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        else if (subRoute === "attendance") {
            // View-Only attendance calendar of the logged in student
            const attendance = Storage.getSchoolData(schoolId, "attendance");
            contentContainer.innerHTML = `
                <h2>📅 My Attendance Card</h2>
                <p class="text-muted" style="margin-bottom: 24px;">Monthly logs showing presence reports.</p>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date / তারিখ</th>
                                <th>Presence Status / উপস্থিতি</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attendance.map(log => `
                                <tr>
                                    <td><strong>${Utils.formatDate(log.date)}</strong></td>
                                    <td>
                                        <span class="badge ${log.records[user.id] === 'Present' ? 'badge-success' : 'badge-danger'}">
                                            ${log.records[user.id] || 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        else if (subRoute === "fees") {
            // View invoices and trigger print layouts
            const fees = Storage.getSchoolData(schoolId, "fees").filter(f => f.studentId === user.id);
            contentContainer.innerHTML = `
                <h2>💰 My Billing & Payment Statements</h2>
                <p class="text-muted" style="margin-bottom: 24px;">Manage payment receipts and track outstanding institution dues.</p>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Receipt ID</th>
                                <th>Fee Particulars</th>
                                <th>Billing (৳)</th>
                                <th>Paid (৳)</th>
                                <th>Due Balance (৳)</th>
                                <th>Collection Date</th>
                                <th>Payment Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fees.length === 0 ? `<tr><td colspan="8" class="text-muted">No entries saved.</td></tr>` : 
                                fees.map(f => `
                                    <tr>
                                        <td><code>${f.id}</code></td>
                                        <td><strong>${f.feeType}</strong></td>
                                        <td>${f.amountTotal} ৳</td>
                                        <td><span style="color: #16a34a; font-weight:700;">${f.amountPaid} ৳</span></td>
                                        <td><span style="color: #dc2626; font-weight:700;">${f.amountDue} ৳</span></td>
                                        <td>${f.paymentDate ? Utils.formatDate(f.paymentDate) : '-'}</td>
                                        <td>
                                            <span class="badge ${f.status === 'Paid' ? 'badge-success' : f.status === 'Partial' ? 'badge-warning' : 'badge-danger'}">
                                                ${f.status}
                                            </span>
                                        </td>
                                        <td>
                                            ${f.amountPaid > 0 ? `
                                                <button class="btn btn-secondary btn-sm" onclick="PDFExporter.printReceipt('${schoolId}', '${f.id}')">
                                                    🖨️ A4 Receipt
                                                </button>
                                            ` : '-'}
                                        </td>
                                    </tr>
                                `).join('')
                            }
                        </tbody>
                    </table>
                </div>
            `;
        }

        else if (subRoute === "results") {
            // View reports and print A4 marksheets
            const results = Storage.getSchoolData(schoolId, "results").filter(r => r.studentId === user.id);
            contentContainer.innerHTML = `
                <h2>📝 Comprehensive Academic Reports</h2>
                <p class="text-muted" style="margin-bottom: 24px;">Click A4 Marksheet to fetch actual printable transcripts with GPA and Merit Ranks.</p>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Exam Name</th>
                                <th>Academic Session</th>
                                <th>Total Calculated GPA</th>
                                <th>Grade Outcomes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.length === 0 ? `<tr><td colspan="5" class="text-muted">No marks recorded yet.</td></tr>` : 
                                results.map(r => {
                                    const evaluation = Utils.calculateOverallGPA(r.subjectMarks);
                                    return `
                                        <tr>
                                            <td><strong>${r.examType}</strong></td>
                                            <td>${r.academicSession}</td>
                                            <td><strong style="color: var(--primary-color); font-size:16px;">${evaluation.gpa} / 5.0</strong></td>
                                            <td>
                                                <span class="badge ${evaluation.grade !== 'F' ? 'badge-success' : 'badge-danger'}">
                                                    Grade: ${evaluation.grade}
                                                </span>
                                            </td>
                                            <td>
                                                <button class="btn btn-secondary btn-sm" onclick="PDFExporter.printMarksheet('${schoolId}', '${r.id}')">
                                                    🎓 A4 Marksheet
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            `;
        }
    }
};
