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
            document.body.className = "theme-superadmin"; // Clean login backdrop theme
            appShell.style.display = "block";
            this.renderLogin();
            return;
        }

        // Authenticated
        document.body.className = "theme-" + user.role;
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
        } else if (user.role === "officeadmin") {
            this.renderOfficeAdmin();
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
                        <div class="login-tab" data-role="officeadmin" onclick="App.switchLoginTab('officeadmin')">Office Staff</div>
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
        } else if (user.role === "officeadmin") {
            sidebarLinks = [
                { route: "dashboard", label: "Operations Desk", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM4 21a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z"/></svg>` }
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

    // ================================    renderSuperAdmin: function() {
        const stats = Storage.getGlobalStats();
        const schools = Storage.getSchools();
        const contentContainer = document.getElementById("content-area");

        contentContainer.innerHTML = `
            <!-- Corporate Premium Header Desk -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 26px 30px; border-radius: 14px; margin-bottom: 30px; position: relative; box-shadow: var(--shadow-md);">
                <div style="position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                            <span style="font-size: 24px;">🏢</span>
                            <h1 style="font-size: 24px; font-weight: 800; tracking: -0.5px;">Super Admin Dashboard</h1>
                        </div>
                        <p style="opacity: 0.9; font-size: 14px;">Enterprise Core Monitor & Global Tenant Subscriptions Overview</p>
                    </div>
                </div>
            </div>

            <!-- 4 Core Stat Cards -->
            <div class="grid-container">
                <div class="card" style="border-top-color: #3b82f6;">
                    <div class="card-title">Total Schools</div>
                    <div class="card-value" style="color: #3b82f6;">65</div>
                    <div class="card-subtitle" style="color: #22c55e; font-weight: 700;">📈 +8 this month</div>
                </div>
                <div class="card" style="border-top-color: #10b981;">
                    <div class="card-title">Active Subscriptions</div>
                    <div class="card-value" style="color: #10b981;">48</div>
                    <div class="card-subtitle"><span style="color: #10b981; font-weight: 700;">73.8%</span> Active Rate</div>
                </div>
                <div class="card" style="border-top-color: #f59e0b;">
                    <div class="card-title">Monthly Revenue</div>
                    <div class="card-value" style="color: #f59e0b;">$67,000</div>
                    <div class="card-subtitle" style="color: #22c55e; font-weight: 700;">📈 +12% increase</div>
                </div>
                <div class="card" style="border-top-color: var(--primary-dark);">
                    <div class="card-title">Total Users</div>
                    <div class="card-value" style="color: var(--primary-dark);">12,450</div>
                    <div class="card-subtitle">Aggregated students & staff</div>
                </div>
            </div>

            <!-- Two Side-By-Side Rich Charts -->
            <div class="chart-flex-row">
                <div class="chart-card-wrapper">
                    <h3 style="font-weight: 700; color: #1e293b;">Revenue Trend</h3>
                    <div class="chart-title-sub">6 Months Progression (Nov - Apr)</div>
                    <div class="svg-chart-container">
                        <svg viewBox="0 0 400 200" style="width: 100%; height: 180px;" xmlns="http://www.w3.org/2000/svg">
                            <!-- Gridlines -->
                            <line x1="10" y1="30" x2="390" y2="30" stroke="#f1f5f9" stroke-width="1.5" />
                            <line x1="10" y1="70" x2="390" y2="70" stroke="#f1f5f9" stroke-width="1.5" />
                            <line x1="10" y1="110" x2="390" y2="110" stroke="#f1f5f9" stroke-width="1.5" />
                            <line x1="10" y1="150" x2="390" y2="150" stroke="#f1f5f9" stroke-width="1.5" />
                            <line x1="10" y1="180" x2="390" y2="180" stroke="#cbd5e1" stroke-width="2" />
                            
                            <!-- Area Gradient -->
                            <defs>
                                <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25" />
                                    <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
                                </linearGradient>
                            </defs>
                            
                            <!-- Drawing Polygon path representation -->
                            <path d="M 20 180 L 20 140 L 80 125 L 140 135 L 200 95 L 260 110 L 320 60 L 380 40 L 380 180 Z" fill="url(#area-grad)" />
                            
                            <!-- Trend Line plotting -->
                            <path d="M 20 140 L 80 125 L 140 135 L 200 95 L 260 110 L 320 60 L 380 40" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" />
                            
                            <!-- Plot nodes -->
                            <circle cx="20" cy="140" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1.5" />
                            <circle cx="80" cy="125" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1.5" />
                            <circle cx="140" cy="135" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1.5" />
                            <circle cx="200" cy="95" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1.5" />
                            <circle cx="260" cy="110" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1.5" />
                            <circle cx="320" cy="60" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1.5" />
                            <circle cx="380" cy="40" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1.5" />
                        </svg>
                        <div class="svg-chart-labels-offset">
                            <span>Nov ($45k)</span>
                            <span>Dec ($48k)</span>
                            <span>Jan ($50k)</span>
                            <span>Feb ($58k)</span>
                            <span>Mar ($61k)</span>
                            <span>Apr ($67k)</span>
                        </div>
                    </div>
                </div>

                <div class="chart-card-wrapper">
                    <h3 style="font-weight: 700; color: #1e293b;">School Status Distribution</h3>
                    <div class="chart-title-sub">Registered Tenancy Segment Breakdown</div>
                    <div class="chart-bar-container">
                        <div class="chart-y-gridline" style="bottom: 25%"></div>
                        <div class="chart-y-gridline" style="bottom: 50%"></div>
                        <div class="chart-y-gridline" style="bottom: 75%"></div>
                        
                        <div class="chart-bar-item">
                            <div class="chart-bar-pillar primary" style="height: 150px;">
                                <div class="chart-bar-value">48</div>
                            </div>
                            <div class="chart-bar-label">Active</div>
                        </div>
                        
                        <div class="chart-bar-item">
                            <div class="chart-bar-pillar accent" style="height: 80px; background-color: #64748b;">
                                <div class="chart-bar-value">12</div>
                            </div>
                            <div class="chart-bar-label">Trial</div>
                        </div>
                        
                        <div class="chart-bar-item">
                            <div class="chart-bar-pillar gray" style="height: 50px; background-color: #ef4444;">
                                <div class="chart-bar-value">5</div>
                            </div>
                            <div class="chart-bar-label">Expired</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Support Ticket Management Table -->
            <div class="table-container" style="margin-bottom: 30px;">
                <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
                    <h3 style="font-weight: 700; color: #1e293b;">🎫 Support Ticket Management</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>School Name</th>
                            <th>Issue Description</th>
                            <th>Priority</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>#TK-2092</code></td>
                            <td><strong>Al-Bayan Academy</strong></td>
                            <td>Fee invoice gateway connectivity lag</td>
                            <td><span class="badge priority-high">High</span></td>
                            <td><span class="badge" style="background-color: #fee2e2; color: #991b1b;">Open</span></td>
                        </tr>
                        <tr>
                            <td><code>#TK-2088</code></td>
                            <td><strong>Greenwood International</strong></td>
                            <td>Academic notice board scheduling query</td>
                            <td><span class="badge priority-medium">Medium</span></td>
                            <td><span class="badge" style="background-color: #fef3c7; color: #d97706;">In Progress</span></td>
                        </tr>
                        <tr>
                            <td><code>#TK-2051</code></td>
                            <td><strong>Darul Uloom Model School</strong></td>
                            <td>Bulk enrollment Excel parsing warning</td>
                            <td><span class="badge priority-low">Low</span></td>
                            <td><span class="badge badge-success">Resolved</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Real Registered Schools Directory -->
            <div class="table-container" style="margin-bottom: 35px;">
                <div style="padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 10px;">
                    <h3 style="font-weight: 700; color: #1e293b;">🏫 Registered Tenancies Directory</h3>
                    <button class="btn btn-primary btn-sm" onclick="App.openAddSchoolModal()" style="background-color: #3b82f6;">➕ Add New Tenant</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>School ID</th>
                            <th>School Name</th>
                            <th>Subdomain Access</th>
                            <th>Admin Account Details</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schools.length === 0 ? `<tr><td colspan="6" class="text-muted">No tenancies registered yet.</td></tr>` : 
                            schools.map(s => `
                                <tr>
                                    <td><strong style="color: #3b82f6;">${s.id}</strong></td>
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
                                    <td>
                                        <span class="badge ${s.status === 'Active' ? 'badge-success' : 'badge-danger'}">
                                            ${s.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 6px;">
                                            <button class="btn btn-secondary btn-sm" onclick="App.enterViewMode('${s.id}')" title="Monitor school records">
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
                                        </div>
                                    </td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <!-- Bottom 4 Quick Action Buttons -->
            <div class="flex-row-gap-md" style="margin-top: 30px;">
                <button class="btn btn-primary" onclick="App.openAddSchoolModal()" style="flex:1; background-color: #3b82f6;">
                    👤 Add New School
                </button>
                <button class="btn btn-secondary" onclick="App.showNotification('Redirecting to Billing Gateways...')" style="flex:1;">
                    💳 Manage Billing
                </button>
                <button class="btn btn-secondary" onclick="App.showNotification('Preparing Global Audit Reports PDF...')" style="flex:1;">
                    📊 View Reports
                </button>
                <button class="btn btn-secondary" onclick="App.showNotification('Entering core cloud configurations')" style="flex:1;">
                    ⚙️ System Settings
                </button>
            </div>

            <!-- ADD SCHOOL MODAL COMPATIBILITY -->
            <div id="school-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Register New Tenant Institution</h4>
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
                            <button type="button" class="btn btn-secondary" onclick="App.closeAddSchoolModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary" style="background-color: #3b82f6;">Save Tenant</button>
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
                <!-- Teal Professional Header -->
                <div style="background-color: #14b8a6; color: #ffffff; padding: 22px 28px; border-radius: 14px; margin-bottom: 30px; position: relative; box-shadow: var(--shadow-sm); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <button class="btn btn-secondary btn-sm" onclick="Auth.logout()" style="background: rgba(255,255,255,0.2); border: none; color: #ffffff; padding: 6px 12px;">
                            ⬅️ Log Out
                        </button>
                        <div>
                            <h2 style="font-size: 20px; font-weight: 800;">${school.name}</h2>
                            <p style="opacity: 0.9; font-size: 13px;">School Admin Control Center | Session: ${school.academicSession || '2026-2027'}</p>
                        </div>
                    </div>
                    <div style="cursor: pointer; position: relative;" onclick="App.showNotification('You have 2 new notifications!')">
                        <span style="font-size: 22px;">🔔</span>
                        <span style="position: absolute; top: -5px; right: -5px; background: #ef4444; color: #fff; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700;">2</span>
                    </div>
                </div>

                <!-- 4 Stat Cards with Left-Colored Borders -->
                <div class="grid-container">
                    <div class="card" style="border: none; border-left: 5px solid #14b8a6; box-shadow: var(--shadow-sm);">
                        <div class="card-title">Total Students</div>
                        <div class="card-value" style="color: #0f766e;">1,248</div>
                        <div class="card-subtitle">Active registrations (${students.length} local records)</div>
                    </div>
                    <div class="card" style="border: none; border-left: 5px solid #0f766e; box-shadow: var(--shadow-sm);">
                        <div class="card-title">Total Teachers</div>
                        <div class="card-value" style="color: #095952;">87</div>
                        <div class="card-subtitle">Assigned class faculties (${teachers.length} records)</div>
                    </div>
                    <div class="card" style="border: none; border-left: 5px solid #a855f7; box-shadow: var(--shadow-sm);">
                        <div class="card-title">Staff Members</div>
                        <div class="card-value" style="color: #7e22ce;">45</div>
                        <div class="card-subtitle">Operations & support staff</div>
                    </div>
                    <div class="card" style="border: none; border-left: 5px solid #10b981; box-shadow: var(--shadow-sm);">
                        <div class="card-title">Fee Collection</div>
                        <div class="card-value" style="color: #10b981;">$90K</div>
                        <div class="card-subtitle"><span style="color: #10b981; font-weight: 700;">90%</span> collected ($10K pending)</div>
                    </div>
                </div>

                <!-- 5-Month Fee Analytics Bar Chart -->
                <div class="chart-card-wrapper" style="margin-bottom: 30px;">
                    <h3 style="font-weight: 700; color: #1e293b; margin-bottom: 5px;">Monthly Fee Collection Analytics</h3>
                    <div class="chart-title-sub">Collected vs Pending Over 5 Months (Jan - May)</div>
                    <div class="chart-bar-container" style="height: 180px;">
                        <div class="chart-y-gridline" style="bottom: 33%"></div>
                        <div class="chart-y-gridline" style="bottom: 66%"></div>
                        
                        <!-- Jan Column -->
                        <div class="chart-bar-item" style="max-width: 70px;">
                            <div style="display: flex; gap: 4px; align-items: flex-end; height: 120px; justify-content: center;">
                                <div class="chart-bar-pillar primary" style="height: 90px; width: 14px;" title="Collected: $15K"><div class="chart-bar-value" style="font-size: 9px; top: -16px;">15K</div></div>
                                <div class="chart-bar-pillar gray" style="height: 25px; width: 14px; background-color: #fca5a5;" title="Pending: $3K"><div class="chart-bar-value" style="font-size: 9px; top: -16px; color:#ef4444;">3K</div></div>
                            </div>
                            <div class="chart-bar-label">Jan</div>
                        </div>

                        <!-- Feb Column -->
                        <div class="chart-bar-item" style="max-width: 70px;">
                            <div style="display: flex; gap: 4px; align-items: flex-end; height: 120px; justify-content: center;">
                                <div class="chart-bar-pillar primary" style="height: 105px; width: 14px;" title="Collected: $18K"><div class="chart-bar-value" style="font-size: 9px; top: -16px;">18K</div></div>
                                <div class="chart-bar-pillar gray" style="height: 15px; width: 14px; background-color: #fca5a5;" title="Pending: $1.5K"><div class="chart-bar-value" style="font-size: 9px; top: -16px; color:#ef4444;">1.5K</div></div>
                            </div>
                            <div class="chart-bar-label">Feb</div>
                        </div>

                        <!-- Mar Column -->
                        <div class="chart-bar-item" style="max-width: 70px;">
                            <div style="display: flex; gap: 4px; align-items: flex-end; height: 120px; justify-content: center;">
                                <div class="chart-bar-pillar primary" style="height: 112px; width: 14px;" title="Collected: $20K"><div class="chart-bar-value" style="font-size: 9px; top: -16px;">20K</div></div>
                                <div class="chart-bar-pillar gray" style="height: 8px; width: 14px; background-color: #fca5a5;" title="Pending: $1K"><div class="chart-bar-value" style="font-size: 9px; top: -16px; color:#ef4444;">1K</div></div>
                            </div>
                            <div class="chart-bar-label">Mar</div>
                        </div>

                        <!-- Apr Column -->
                        <div class="chart-bar-item" style="max-width: 70px;">
                            <div style="display: flex; gap: 4px; align-items: flex-end; height: 120px; justify-content: center;">
                                <div class="chart-bar-pillar primary" style="height: 120px; width: 14px;" title="Collected: $22K"><div class="chart-bar-value" style="font-size: 9px; top: -16px;">22K</div></div>
                                <div class="chart-bar-pillar gray" style="height: 15px; width: 14px; background-color: #fca5a5;" title="Pending: $2K"><div class="chart-bar-value" style="font-size: 9px; top: -16px; color:#ef4444;">2K</div></div>
                            </div>
                            <div class="chart-bar-label">Apr</div>
                        </div>

                        <!-- May Column -->
                        <div class="chart-bar-item" style="max-width: 70px;">
                            <div style="display: flex; gap: 4px; align-items: flex-end; height: 120px; justify-content: center;">
                                <div class="chart-bar-pillar primary" style="height: 85px; width: 14px;" title="Collected: $15K"><div class="chart-bar-value" style="font-size: 9px; top: -16px;">15K</div></div>
                                <div class="chart-bar-pillar gray" style="height: 35px; width: 14px; background-color: #fca5a5;" title="Pending: $5K"><div class="chart-bar-value" style="font-size: 9px; top: -16px; color:#ef4444;">5K</div></div>
                            </div>
                            <div class="chart-bar-label">May</div>
                        </div>
                    </div>
                </div>

                <div class="chart-flex-row">
                    <!-- Notice Board Priority Coded Card -> Left Side -->
                    <div class="chart-card-wrapper" style="flex: 1.3;">
                        <h3 style="font-weight: 700; color: #1e293b; margin-bottom: 12px;">📢 Notice Board</h3>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div class="priority-border-notice high">
                                <span class="badge priority-high" style="margin-bottom: 6px;">High Priority</span>
                                <h4 style="color:#1e293b; font-size:14px; font-weight:700;">Final Term Examination Guidelines</h4>
                                <p style="font-size:12.5px; color:#64748b; margin-top:2px;">Routine schedules and details published for teachers and parent portals.</p>
                                <small style="display:block; margin-top:6px; color:#94a3b8;">📅 May 21 | Target: All Classes</small>
                            </div>
                            
                            <div class="priority-border-notice medium">
                                <span class="badge priority-medium" style="margin-bottom: 6px;">Medium Priority</span>
                                <h4 style="color:#1e293b; font-size:14px; font-weight:700;">Library Book Audit Notification</h4>
                                <p style="font-size:12.5px; color:#64748b; margin-top:2px;">Students are requested to return all outstanding textbooks before June 2.</p>
                                <small style="display:block; margin-top:6px; color:#94a3b8;">📅 May 18 | Target: General Students</small>
                            </div>

                            <div class="priority-border-notice low">
                                <span class="badge priority-low" style="margin-bottom: 6px;">Low Priority</span>
                                <h4 style="color:#1e293b; font-size:14px; font-weight:700;">Annual Eid Reunion Celebration</h4>
                                <p style="font-size:12.5px; color:#64748b; margin-top:2px;">Notice regarding schedule revisions for Eid holidays and prayer timings.</p>
                                <small style="display:block; margin-top:6px; color:#94a3b8;">📅 May 15 | Target: Parent Community</small>
                            </div>
                        </div>
                    </div>

                    <!-- Academic Calendar with block Dates -> Right Side -->
                    <div class="chart-card-wrapper" style="flex: 1;">
                        <h3 style="font-weight: 700; color: #1e293b; margin-bottom: 12px;">📅 Academic Calendar</h3>
                        <div class="academic-calendar-list">
                            <div class="calendar-item">
                                <div class="calendar-date-badge" style="background-color: #ef4444;">
                                    <span>28</span>
                                    <span>May</span>
                                </div>
                                <div class="calendar-info-body">
                                    <div class="calendar-info-title">Annual Exams Commence</div>
                                    <div class="calendar-info-desc">Grade 1 to 10 exam rosters commence today</div>
                                </div>
                            </div>
                            
                            <div class="calendar-item">
                                <div class="calendar-date-badge" style="background-color: #14b8a6;">
                                    <span>05</span>
                                    <span>Jun</span>
                                </div>
                                <div class="calendar-info-body">
                                    <div class="calendar-info-title">Science & Invention Fair</div>
                                    <div class="calendar-info-desc">Student project mock exhibitions inside the main hall</div>
                                </div>
                            </div>

                            <div class="calendar-item">
                                <div class="calendar-date-badge" style="background-color: #f59e0b;">
                                    <span>12</span>
                                    <span>Jun</span>
                                </div>
                                <div class="calendar-info-body">
                                    <div class="calendar-info-title">Annual Athletics Week</div>
                                    <div class="calendar-info-desc">Track and field competitions for boys and girls</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Salary Management Overview Section -->
                <div class="chart-card-wrapper" style="margin-bottom: 30px;">
                    <h3 style="font-weight: 700; color: #1e293b;">💼 Salary Management Overview</h3>
                    <div class="salary-metric-group">
                        <div class="salary-metric-box">
                            <div class="salary-metric-label">Total Salary Disbursed</div>
                            <div class="salary-metric-val" style="color: #10b981;">$145,000</div>
                        </div>
                        <div class="salary-metric-box" style="border-left-color: #f59e0b;">
                            <div class="salary-metric-label" style="color: #d97706;">Pending Approvals</div>
                            <div class="salary-metric-val" style="color: #d97706;">12 Payrolls</div>
                        </div>
                        <div class="salary-metric-box">
                            <div class="salary-metric-label">Next Payroll Date</div>
                            <div class="salary-metric-val" style="color: #3b82f6;">May 31, 2026</div>
                        </div>
                    </div>
                </div>

                <!-- Three Bottom Quick Action Buttons -->
                <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 25px;">
                    <button class="btn btn-primary" onclick="App.showNotification('All 12 pending staff leave applications have been approved!')" style="flex: 1; background-color: #14b8a6; gap: 8px;">
                        ✔️ Approve Leaves Staff
                    </button>
                    <button class="btn btn-secondary spa-route" data-route="notices" style="flex: 1; gap: 8px;">
                        🔔 Publish Public Notice
                    </button>
                    <button class="btn btn-secondary spa-route" data-route="fees" style="flex: 1; gap: 8px;">
                        💳 Manage Fee Finances
                    </button>
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
    // 3.5 RENDER OFFICE STAFF PORTAL
    // ==========================================
    renderOfficeAdmin: function() {
        const user = Auth.getActiveUser();
        const schoolId = user.schoolId;
        const subRoute = this.currentRoute;
        const contentContainer = document.getElementById("content-area");

        if (subRoute === "dashboard") {
            // Set default active tab logic if none is registered
            if (!this.activeOfficeTab) this.activeOfficeTab = "attendance";

            const renderSubTabContent = () => {
                const tab = this.activeOfficeTab;
                if (tab === "attendance") {
                    return `
                        <div class="priority-border-notice low" style="border-left-color: #a855f7;">
                            <h4 style="font-weight: 700; margin-bottom: 10px; color: #1e293b;">📋 Today's Staff & Student Attendance</h4>
                            <p style="font-size: 13px; color: #64748b; margin-bottom: 15px;">Check boxes to log present staff members and broadcast status.</p>
                            <div style="display: flex; flex-direction: column; gap: 10px; background: #fff; padding: 15px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                                    <span>👤 <strong>Sister Ayesha Amira</strong> (Admin Asst.)</span>
                                    <button class="btn btn-primary btn-sm" style="background:#a855f7; border:none;" onclick="this.textContent = '✔️ Present'; this.style.background='#10b981';">Log Present</button>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                                    <span>👤 <strong>Maulana Abdur Rahman</strong> (Clerk)</span>
                                    <button class="btn btn-primary btn-sm" style="background:#a855f7; border:none;" onclick="this.textContent = '✔️ Present'; this.style.background='#10b981'; font-size:11.5px;">Log Present</button>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>👤 <strong>Brother Tariq Jamil</strong> (Gatekeeper)</span>
                                    <button class="btn btn-primary btn-sm" style="background:#a855f7; border:none;" onclick="this.textContent = '✔️ Present'; this.style.background='#10b981';">Log Present</button>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-sm" style="background:#a855f7; border:none; margin-top:15px; width:100%; padding:10px; font-weight:700;" onclick="App.showNotification('Daily staff attendance sheet synchronized successfully!')">Submit Attendance Logs</button>
                        </div>
                    `;
                } else if (tab === "admissions") {
                    return `
                        <div class="priority-border-notice low" style="border-left-color: #ec4899;">
                            <h4 style="font-weight: 700; margin-bottom: 10px; color: #1e293b;">👤 New Admission Enrollment</h4>
                            <form onsubmit="event.preventDefault(); App.showNotification('Admissions ticket registered successfully!'); this.reset();" style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                                <div class="form-group">
                                    <label class="form-label" style="font-size: 12px;">Candidate Name</label>
                                    <input type="text" class="form-control" placeholder="e.g. Abdullah bin Harris" required />
                                </div>
                                <div class="flex-row-gap-md" style="margin-top:0;">
                                    <div class="form-group" style="flex:1;">
                                        <label class="form-label" style="font-size: 12px;">Grade Level</label>
                                        <select class="form-control" required>
                                            <option>Grade 6-A</option>
                                            <option>Grade 7-A</option>
                                            <option>Grade 8-A</option>
                                            <option>Grade 9-A</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex:1;">
                                        <label class="form-label" style="font-size: 12px;">Parent Contact Phone</label>
                                        <input type="tel" class="form-control" placeholder="017xxxxxxxx" required />
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary btn-sm" style="background:#ec4899; border:none; padding:10px; font-weight:700;">Register Candidate</button>
                            </form>
                        </div>
                    `;
                } else if (tab === "fee-entry") {
                    return `
                        <div class="priority-border-notice low" style="border-left-color: #3b82f6;">
                            <h4 style="font-weight: 700; margin-bottom: 10px; color: #1e293b;">💰 Standard Fee Entry Ledger</h4>
                            <form onsubmit="event.preventDefault(); App.showNotification('Payment registered & receipt compiled!'); this.reset();" style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                                <div class="form-group">
                                    <label class="form-label" style="font-size: 12px;">Candidate Student Roll ID</label>
                                    <input type="text" class="form-control" placeholder="e.g. STU-10292" required />
                                </div>
                                <div class="flex-row-gap-md" style="margin-top:0;">
                                    <div class="form-group" style="flex:1;">
                                        <label class="form-label" style="font-size: 12px;">Fee Category</label>
                                        <select class="form-control">
                                            <option>Monthly Tuition Fee</option>
                                            <option>Admission Registration Fee</option>
                                            <option>Book Purchase Fund</option>
                                            <option>Library Fine / Late charges</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex:1;">
                                        <label class="form-label" style="font-size: 12px;">Amount Collected (৳)</label>
                                        <input type="number" class="form-control" placeholder="e.g. 2500" required />
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary btn-sm" style="background:#3b82f6; border:none; padding:10px; font-weight:700;">Record Payment Entry</button>
                            </form>
                        </div>
                    `;
                } else if (tab === "verification") {
                    return `
                        <div class="priority-border-notice low" style="border-left-color: #10b981;">
                            <h4 style="font-weight: 700; margin-bottom: 10px; color: #1e293b;">🛡️ Gateway Payment Verifications</h4>
                            <p style="font-size: 13px; color: #64748b; margin-bottom: 15px;">Pending mobile banking (bKash/Nagad) receipts from parents.</p>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <div id="verify-row-1" style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px 15px; border-radius: 8px; border-left:4px solid #14b8a6;">
                                    <div>
                                        <div style="font-size:13.5px; font-weight:700; color: #1e293b;">Harris Jamil (Grade 8)</div>
                                        <div style="font-size:12px; color:#64748b;">৳1,200 | bKash TxID: <code>BK9X20PZL</code></div>
                                    </div>
                                    <button class="btn btn-primary btn-sm" style="background:#10b981; border:none;" onclick="document.getElementById('verify-row-1').style.opacity='0.4'; App.showNotification('Transaction verified and posted to Al-Bayan DB!')">Verify</button>
                                </div>
                                <div id="verify-row-2" style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px 15px; border-radius: 8px; border-left:4px solid #14b8a6;">
                                    <div>
                                        <div style="font-size:13.5px; font-weight:700; color: #1e293b;">Mariam Siddique (Grade 10)</div>
                                        <div style="font-size:12px; color:#64748b;">৳2,500 | Nagad TxID: <code>NG5U11WQA</code></div>
                                    </div>
                                    <button class="btn btn-primary btn-sm" style="background:#10b981; border:none;" onclick="document.getElementById('verify-row-2').style.opacity='0.4'; App.showNotification('Transaction verified and posted to Al-Bayan DB!')">Verify</button>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (tab === "inventory") {
                    return `
                        <div class="priority-border-notice low" style="border-left-color: #f59e0b;">
                            <h4 style="font-weight: 700; margin-bottom: 10px; color: #1e293b;">📦 Operations Store Inventory</h4>
                            <p style="font-size: 13px; color: #64748b; margin-bottom: 15px;">Asset trackers and replenish triggers.</p>
                            <div style="display: flex; flex-direction: column; gap: 12px; background: #fff; padding: 15px; border-radius: 8px;">
                                <div>
                                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px; color: #1e293b;">
                                        <strong>Boxed Dustless Chalks</strong>
                                        <span style="color:#d97706; font-weight:700;">12 Boxes Left (Low Stock)</span>
                                    </div>
                                    <div style="background:#f1f5f9; height:8px; border-radius:4px; overflow:hidden; display:flex;">
                                        <div style="background:#f59e0b; width:40%;"></div>
                                    </div>
                                    <button class="btn btn-secondary btn-sm" style="margin-top:8px; padding:3px 8px; font-size:11px;" onclick="App.showNotification('Auto-generated dispatch manifest sent to vendor!')">Restock chalk</button>
                                </div>
                                <hr style="border:none; border-bottom:1px solid #f1f5f9; margin: 4px 0;" />
                                <div>
                                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px; color: #1e293b;">
                                        <strong>Primary Arabic Textbooks (Grade 1)</strong>
                                        <span style="color:#10b981; font-weight:700;">85 Units Left</span>
                                    </div>
                                    <div style="background:#f1f5f9; height:8px; border-radius:4px; overflow:hidden; display:flex;">
                                        <div style="background:#10b981; width:85%;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
                return "";
            };

            contentContainer.innerHTML = `
                <!-- Pastel Gradient Operations Desk Header -->
                <div style="background: linear-gradient(135deg, #c084fc 0%, #f472b6 100%); color: #ffffff; padding: 26px 30px; border-radius: 14px; margin-bottom: 30px; box-shadow: var(--shadow-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span style="font-size: 24px;">💼</span>
                                <h1 style="font-size: 22px; font-weight: 800; tracking: -0.5px;">Operations Desk</h1>
                            </div>
                            <p style="opacity: 0.95; font-size: 13.5px;">Office & Registrars Administration Console | Welcome back, Clerk Office</p>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="Auth.logout()" style="background: rgba(255,255,255,0.22); border: none; color: #ffffff; font-weight:700;">
                            Log Out
                        </button>
                    </div>
                </div>

                <!-- 4 Pastel Stat Boxes -->
                <div class="grid-container">
                    <div class="card" style="border: none; background: #faf5ff; border-top: 4px solid #a855f7; box-shadow: var(--shadow-sm);">
                        <div class="card-title" style="color: #6b21a8;">Staff Attendance</div>
                        <div class="card-value" style="color: #6b21a8;">34 / 36</div>
                        <div class="card-subtitle">94.4% Present Today</div>
                    </div>
                    <div class="card" style="border: none; background: #fdf2f8; border-top: 4px solid #db2777; box-shadow: var(--shadow-sm);">
                        <div class="card-title" style="color: #9d174d;">Pending Admissions</div>
                        <div class="card-value" style="color: #9d174d;">8 Candidates</div>
                        <div class="card-subtitle">Enlistment queue active</div>
                    </div>
                    <div class="card" style="border: none; background: #eff6ff; border-top: 4px solid #2563eb; box-shadow: var(--shadow-sm);">
                        <div class="card-title" style="color: #1e40af;">Fee Receipts Entered</div>
                        <div class="card-value" style="color: #1e40af;">23 Today</div>
                        <div class="card-subtitle">Aggregated over counter logs</div>
                    </div>
                    <div class="card" style="border: none; background: #fffbeb; border-top: 4px solid #d97706; box-shadow: var(--shadow-sm);">
                        <div class="card-title" style="color: #854d0e;">Low Stock Assets</div>
                        <div class="card-value" style="color: #854d0e;">2 Items</div>
                        <div class="card-subtitle">Chalks & Printing Papers</div>
                    </div>
                </div>

                <!-- Interactive Tabs Navigation for Office Operations -->
                <div class="office-tabs-nav">
                    <button class="office-tab-btn ${this.activeOfficeTab === "attendance" ? "active" : ""}" onclick="Router.switchOfficeTab('attendance')">📋 Attendance</button>
                    <button class="office-tab-btn ${this.activeOfficeTab === "admissions" ? "active" : ""}" onclick="Router.switchOfficeTab('admissions')">👤 Admission</button>
                    <button class="office-tab-btn ${this.activeOfficeTab === "fee-entry" ? "active" : ""}" onclick="Router.switchOfficeTab('fee-entry')">💰 Fee Entry</button>
                    <button class="office-tab-btn ${this.activeOfficeTab === "verification" ? "active" : ""}" onclick="Router.switchOfficeTab('verification')">🛡️ Verification</button>
                    <button class="office-tab-btn ${this.activeOfficeTab === "inventory" ? "active" : ""}" onclick="Router.switchOfficeTab('inventory')">📦 Inventory</button>
                </div>

                <!-- Interactive Output Section -->
                <div id="office-tabs-content-pane" style="margin-top: 20px;">
                    ${renderSubTabContent()}
                </div>
            `;
        }
    },

    switchOfficeTab: function(tabName) {
        this.activeOfficeTab = tabName;
        this.renderOfficeAdmin();
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
                <!-- Indigo Vibrant Teacher Banner Header -->
                <div style="background: linear-gradient(135deg, #4f46e5 0%, #ff5a36 100%); color: #ffffff; padding: 26px 30px; border-radius: 14px; margin-bottom: 30px; box-shadow: var(--shadow-sm); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                            <span style="font-size: 24px;">🎓</span>
                            <h1 style="font-size: 22px; font-weight: 800; tracking: -0.5px;">Teacher Portal Desk</h1>
                        </div>
                        <p style="opacity: 0.95; font-size: 14px;">Instructor of <strong>Class ${user.class}</strong> | Arabic Specialist: <strong>${user.subject}</strong></p>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="Auth.logout()" style="background: rgba(255,255,255,0.22); border: none; color: #ffffff; font-weight:700;">
                        Logout
                    </button>
                </div>

                <!-- 4 M3 Vibrant Indicator Cards -->
                <div class="grid-container">
                    <div class="card" style="border: none; border-top: 4px solid #4f46e5; box-shadow: var(--shadow-sm);">
                        <div class="card-title">Classes Today</div>
                        <div class="card-value" style="color: #4f46e5;">4 Periods</div>
                        <div class="card-subtitle">8:30 AM - 2:00 PM schedule</div>
                    </div>
                    <div class="card" style="border: none; border-top: 4px solid #ff5a36; box-shadow: var(--shadow-sm);">
                        <div class="card-title">Total Students Class Coverage</div>
                        <div class="card-value" style="color: #ff5a36;">${students.length} Enrolled</div>
                        <div class="card-subtitle">Assigned to ${user.class}</div>
                    </div>
                    <div class="card" style="border: none; border-top: 4px solid #10b981; box-shadow: var(--shadow-sm);">
                        <div class="card-title">Pending Grades</div>
                        <div class="card-value" style="color: #10b981;">12 Mark sheets</div>
                        <div class="card-subtitle">Requires Semester Final posting</div>
                    </div>
                    <div class="card" style="border: none; border-top: 4px solid #3b82f6; box-shadow: var(--shadow-sm);">
                        <div class="card-title">Homework Due</div>
                        <div class="card-value" style="color: #3b82f6;">8 Published</div>
                        <div class="card-subtitle">Revision worksheets online</div>
                    </div>
                </div>

                <!-- Class Schedule & Quick Roll call Checklist -->
                <div class="chart-flex-row">
                    <!-- Column 1: Class Schedule Timeline -->
                    <div class="chart-card-wrapper" style="flex: 1.1;">
                        <h3 style="font-weight: 700; color: #1e293b; margin-bottom: 12px; display:flex; align-items:center; gap:6px;">
                            <span>📅 Today's Timeline Schedule</span>
                        </h3>
                        <div class="academic-calendar-list">
                            <div class="calendar-item" style="border-left: 4px solid #4f46e5;">
                                <div class="calendar-date-badge" style="background-color: #4f46e5; width:48px; min-width:48px;">
                                    <span style="font-size:11px;">08:30</span>
                                    <span style="font-size:9x; text-transform:uppercase;">AM</span>
                                </div>
                                <div class="calendar-info-body">
                                    <div class="calendar-info-title">Hadith Studies</div>
                                    <div class="calendar-info-desc">Class Room 4 - Grade 10-A | Status: <b style="color:#10b981;">Completed</b></div>
                                </div>
                            </div>

                            <div class="calendar-item" style="border-left: 4px solid #ff5a36;">
                                <div class="calendar-date-badge" style="background-color: #ff5a36; width:48px; min-width:48px;">
                                    <span style="font-size:11px;">10:30</span>
                                    <span style="font-size:9px; text-transform:uppercase;">AM</span>
                                </div>
                                <div class="calendar-info-body">
                                    <div class="calendar-info-title">Tajweed Recitations</div>
                                    <div class="calendar-info-desc">Class Room 1 - Grade 9-A | Status: <b style="color:#3b82f6;">Active Now</b></div>
                                </div>
                            </div>

                            <div class="calendar-item" style="border-left: 4px solid #a855f7;">
                                <div class="calendar-date-badge" style="background-color: #a855f7; width:48px; min-width:48px;">
                                    <span style="font-size:11px;">01:00</span>
                                    <span style="font-size:9px; text-transform:uppercase;">PM</span>
                                </div>
                                <div class="calendar-info-body">
                                    <div class="calendar-info-title">Arabic Grammar</div>
                                    <div class="calendar-info-desc">Main Lecture Hall - Grade 10-A | Status: <b style="color:#e2e8f0; color:#64748b;">Upcoming</b></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Column 2: Quick Interactive Touch Roll call -->
                    <div class="chart-card-wrapper" style="flex: 1;">
                        <h3 style="font-weight: 700; color: #1e293b; margin-bottom: 5px;">📋 Quick Attendance Register</h3>
                        <p style="font-size:12.5px; color:#64748b; margin-bottom:12px;">Tap buttons to log presence statistics instantly.</p>
                        
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div class="calendar-item" style="background:#f8fafc; padding:8px 12px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:13px; font-weight:700; color:#334155;">Ahmed Hasan</span>
                                <div style="display:flex; gap:4px;">
                                    <button class="btn btn-sm btn-primary" style="background:#10b981; border:none; padding:4px 8px; font-size:11px;" onclick="this.parentNode.children[1].style.opacity='0.4'; this.style.opacity='1';">P</button>
                                    <button class="btn btn-sm btn-danger" style="background:#ef4444; border:none; padding:4px 8px; font-size:11px;" onclick="this.parentNode.children[0].style.opacity='0.4'; this.style.opacity='1';">A</button>
                                </div>
                            </div>

                            <div class="calendar-item" style="background:#f8fafc; padding:8px 12px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:13px; font-weight:700; color:#334155;">Fatima Jahan</span>
                                <div style="display:flex; gap:4px;">
                                    <button class="btn btn-sm btn-primary" style="background:#10b981; border:none; padding:4px 8px; font-size:11px;" onclick="this.parentNode.children[1].style.opacity='0.4'; this.style.opacity='1';">P</button>
                                    <button class="btn btn-sm btn-danger" style="background:#ef4444; border:none; padding:4px 8px; font-size:11px;" onclick="this.parentNode.children[0].style.opacity='0.4'; this.style.opacity='1';">A</button>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary" style="background:linear-gradient(135deg, #4f46e5, #6366f1); border:none; margin-top:12px; width:100%; font-size:12.5px; padding:10px; font-weight:700;" onclick="App.showNotification('Class roster attendance published successfully!')">
                            Publish Attendance
                        </button>
                    </div>
                </div>

                <!-- Instant Grade Book Entry and Homework Publisher -->
                <div class="chart-flex-row" style="margin-top:20px;">
                    <!-- Column 1: Grade Input Sheet -->
                    <div class="chart-card-wrapper" style="flex: 1.1;">
                        <h3 style="font-weight: 700; color: #1e293b; margin-bottom: 5px;">📝 Exam Grade Book Entry</h3>
                        <p style="font-size:12.5px; color:#64748b; margin-bottom:12px;">Insert final exam marks below.</p>
                        
                        <div style="background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
                            <table style="width: 100%; border-collapse: collapse; margin-bottom:0;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 10px; font-size:12px; text-align:left; color:#475569;">Student</th>
                                        <th style="padding: 10px; font-size:12px; text-align:center; color:#475569; width: 90px;">Midterm</th>
                                        <th style="padding: 10px; font-size:12px; text-align:center; color:#475569; width: 90px;">Finals</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 10px; font-size:13px; font-weight:700; color:#334155;">Ahmed Hasan</td>
                                        <td style="padding: 10px; text-align:center;"><input type="number" class="form-control" value="84" style="height:32px; padding:4px; text-align:center; font-size:13px; max-width:65px; margin:0 auto;" /></td>
                                        <td style="padding: 10px; text-align:center;"><input type="number" class="form-control" value="88" style="height:32px; padding:4px; text-align:center; font-size:13px; max-width:65px; margin:0 auto;" /></td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 10px; font-size:13px; font-weight:700; color:#334155;">Fatima Jahan</td>
                                        <td style="padding: 10px; text-align:center;"><input type="number" class="form-control" value="92" style="height:32px; padding:4px; text-align:center; font-size:13px; max-width:65px; margin:0 auto;" /></td>
                                        <td style="padding: 10px; text-align:center;"><input type="number" class="form-control" value="95" style="height:32px; padding:4px; text-align:center; font-size:13px; max-width:65px; margin:0 auto;" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <button class="btn btn-primary btn-sm" style="background:#4f46e5; border:none; margin-top:10px; width:100%; font-weight:700;" onclick="App.showNotification('Exam Marksheet saved and distributed onto parent boards!')">
                            Save Results Grid
                        </button>
                    </div>

                    <!-- Column 2: Dashed homework publishers -->
                    <div class="chart-card-wrapper" style="flex:1;">
                        <h3 style="font-weight: 700; color: #1e293b; margin-bottom: 5px;">📁 Publish Digital Homework</h3>
                        <form onsubmit="event.preventDefault(); App.showNotification('New homework assignment dispatched to student dashboards!'); this.reset();" style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
                            <div class="form-group">
                                <input type="text" class="form-control" placeholder="Assignment Title (e.g., Surat Al-Alaq memorization)" style="font-size:12.5px; height:34px;" required />
                            </div>
                            <div class="form-group">
                                <label style="font-size:11px; color:#475569; display:block; margin-bottom: 3px;">Due Date Deadline</label>
                                <input type="date" class="form-control" value="2026-05-30" style="font-size:12.5px; height:34px;" required />
                            </div>
                            <!-- Dashed Dropzone -->
                            <div style="border: 2px dashed #cbd5e1; border-radius: 8px; padding: 12px; text-align:center; color:#64748b; font-size:12px; cursor:pointer;" onclick="App.showNotification('Mock File attach success!')">
                                📎 Drag & Drop Lesson Notes (PDF/Image)
                            </div>
                            <button type="submit" class="btn btn-primary" style="background-color: #ff5a36; border:none; padding:8px; font-size:12.5px; font-weight:700;">Publish Homework</button>
                        </form>
                    </div>
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
            const attendanceRate = totalDaysEvaluated > 0 ? ((presentCount / totalDaysEvaluated) * 100).toFixed(0) : "95";

            contentContainer.innerHTML = `
                <!-- Glassmorphism Gradient youthful Banner -->
                <div style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%); color: #ffffff; padding: 26px 30px; border-radius: 16px; margin-bottom: 30px; position: relative; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(168, 85, 247, 0.35);">
                    <div style="position: absolute; width: 120px; height: 120px; background: rgba(255, 255, 255, 0.08); border-radius: 50%; right: -20px; top: -30px; pointer-events: none;"></div>
                    <div style="position: absolute; width: 200px; height: 200px; background: rgba(255, 255, 255, 0.05); border-radius: 50%; right: 20%; bottom: -100px; pointer-events: none;"></div>
                    
                    <div style="position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                        <div>
                            <span class="badge" style="background: rgba(255,255,255,0.25); color: #fff; font-size:11px; font-weight:700; margin-bottom: 6px;">✨ Student Desk Spark</span>
                            <h1 style="font-size: 24px; font-weight: 800; tracking: -0.5px; margin: 0 0 5px 0;">Welcome, ${user.name}! 👋</h1>
                            <p style="opacity: 0.95; font-size: 13.5px; margin:0;">Roll Number: <b>#${user.rollNumber || '102'}</b> | Class Rank Slot: <b>Grade ${user.class}</b></p>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="Auth.logout()" style="background: rgba(255,255,255,0.22); border: none; color: #ffffff; font-weight:700; border-radius: 20px; padding: 6px 14px;">
                            Logout Portal
                        </button>
                    </div>
                </div>

                <!-- Youthful countdown / Activity log badge line -->
                <div style="background: #ffffff; border-radius: 12px; padding: 14px 20px; margin-bottom: 25px; box-shadow: var(--shadow-sm); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; border-left: 5px solid #ff5a36;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:18px;">🔥</span>
                        <span style="font-size:13.5px; font-weight:800; color:#1e293b;">Final Exam Term Countdown:</span>
                        <span class="badge" style="background:#fef2f2; color:#ef4444; border:1px solid #fee2e2; font-weight:700;">6 Days Remaining</span>
                    </div>
                    <div style="cursor:pointer;" onclick="App.showNotification('You are in excellent academic standing with No due library fine charges!')">
                        <span style="font-size:12px; color:#64748b; font-weight:700;">🔔 3 active updates pending review</span>
                    </div>
                </div>

                <!-- Three Glassmorphic Metric Counters with Circular Radial Progress Meters -->
                <div class="grid-container">
                    <!-- Card 1: Attendance Circular -->
                    <div class="card" style="border: none; position: relative; box-shadow: var(--shadow-sm); display:flex; align-items:center; justify-content:space-between; padding: 20px;">
                        <div>
                            <div class="card-title">My Attendance</div>
                            <div class="card-value" style="color: #a855f7; margin-top:2px;">${attendanceRate}%</div>
                            <div class="card-subtitle">Validated logs</div>
                        </div>
                        <!-- Circular progress graphic -->
                        <div style="position: relative; width: 62px; height: 62px;">
                            <svg class="circular-progress-svg" style="transform: rotate(-90deg); width:62px; height:62px;">
                                <circle cx="31" cy="31" r="25" class="bg-ring" style="fill:none; stroke:#f1f5f9; stroke-width:4;" />
                                <circle cx="31" cy="31" r="25" class="fg-ring" style="fill:none; stroke:#a855f7; stroke-width:4; stroke-dasharray: 157; stroke-dashoffset: ${157 - (157 * Number(attendanceRate)) / 100};" />
                            </svg>
                        </div>
                    </div>

                    <!-- Card 2: Tuition Paid -->
                    <div class="card" style="border: none; position: relative; box-shadow: var(--shadow-sm); display:flex; align-items:center; justify-content:space-between; padding: 20px;">
                        <div>
                            <div class="card-title">Completed Fees</div>
                            <div class="card-value" style="color: #ec4899; margin-top:2px;">${paidTotal.toLocaleString()} ৳</div>
                            <div class="card-subtitle">Tuition receipts</div>
                        </div>
                        <!-- Circular progress graphic -->
                        <div style="position: relative; width: 62px; height: 62px;">
                            <svg class="circular-progress-svg" style="transform: rotate(-90deg); width:62px; height:62px;">
                                <circle cx="31" cy="31" r="25" style="fill:none; stroke:#f1f5f9; stroke-width:4;" />
                                <circle cx="31" cy="31" r="25" style="fill:none; stroke:#ec4899; stroke-width:4; stroke-dasharray: 157; stroke-dashoffset: 20;" />
                            </svg>
                        </div>
                    </div>

                    <!-- Card 3: Outstanding Bill -->
                    <div class="card" style="border: none; position: relative; box-shadow: var(--shadow-sm); display:flex; align-items:center; justify-content:space-between; padding: 20px;">
                        <div>
                            <div class="card-title">Pending Settlement</div>
                            <div class="card-value" style="color: #f97316; margin-top:2px;">${dueTotal.toLocaleString()} ৳</div>
                            <div class="card-subtitle">Due invoices</div>
                        </div>
                        <!-- Circular progress graphic -->
                        <div style="position: relative; width: 62px; height: 62px;">
                            <svg class="circular-progress-svg" style="transform: rotate(-90deg); width:62px; height:62px;">
                                <circle cx="31" cy="31" r="25" style="fill:none; stroke:#f1f5f9; stroke-width:4;" />
                                <circle cx="31" cy="31" r="25" style="fill:none; stroke:#f97316; stroke-width:4; stroke-dasharray: 157; stroke-dashoffset: ${dueTotal > 0 ? 110 : 157};" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="chart-flex-row" style="margin-top:25px;">
                    <!-- Left: Profile Data Glassmorphic card -->
                    <div class="chart-card-wrapper" style="flex:1;">
                        <h3 style="font-weight: 700; color: #1e293b; margin-bottom: 12px; display:flex; align-items:center; gap:6px;">
                            <span>👤 Student Registry Profile</span>
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13.5px; background: #fff; padding: 15px; border-radius: 10px;">
                            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
                                <span style="color:#64748b;">Full Name:</span>
                                <strong style="color: #334155;">${user.name}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
                                <span style="color:#64748b;">Unique Roll ID:</span>
                                <strong style="color: #334155;">#${user.rollNumber}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
                                <span style="color:#64748b;">Assigned Class:</span>
                                <strong style="color: #334155;">Grade ${user.class}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
                                <span style="color:#64748b;">Academic Session:</span>
                                <strong style="color: #334155;">2026-2027</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:#64748b;">Date of Birth:</span>
                                <strong style="color: #334155;">${Utils.formatDate(user.dob)}</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Notice Board Announcements -->
                    <div class="chart-card-wrapper" style="flex:1.4;">
                        <h3 style="font-weight: 700; color: #1e293b; margin-bottom: 12px; display:flex; align-items:center; gap:6px;">
                            <span>📢 Announcements Post</span>
                        </h3>
                        ${notices.length === 0 ? `<p class="text-muted">No notifications posted by the school admin yet.</p>` : `
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${notices.slice(0, 2).map((n, idx) => `
                                    <div class="priority-border-notice low" style="border-left-color: ${idx === 0 ? '#a855f7' : '#ec4899'}; padding:12px; background:#fff;">
                                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-bottom:4px;">
                                            <span class="badge priority-medium" style="background:${idx === 0 ? '#faf5ff' : '#fdf2f8'}; color:${idx === 0 ? '#a855f7' : '#ec4899'};">Audience: ${n.target}</span>
                                            <span>📅 ${n.date}</span>
                                        </div>
                                        <h4 style="color:#1e293b; font-size:13.5px; font-weight:700;">${n.title}</h4>
                                        <p style="font-size:12.5px; color:#64748b; margin-top:2px;">${n.content}</p>
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
