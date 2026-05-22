/**
 * Madrasah ERP Authentication Module
 * Manages 4-Tier logins and handles session routing guards.
 */

const Auth = {
    // Current logged in user object
    getActiveUser: function() {
        const user = localStorage.getItem("saas_active_user");
        return user ? JSON.parse(user) : null;
    },

    // Save active session
    setActiveUser: function(userObj) {
        localStorage.setItem("saas_active_user", JSON.stringify(userObj));
    },

    // Clear active session
    logout: function() {
        localStorage.removeItem("saas_active_user");
        localStorage.removeItem("saas_view_only_mode"); // Cancel any Super Admin monitoring mode
        localStorage.removeItem("saas_view_only_school_id");
    },

    // Logins Orchestrator
    login: function(role, credentials) {
        // TIER 1: SUPER ADMIN
        if (role === "superadmin") {
            if (credentials.username === "superadmin" && credentials.password === "admin123") {
                const user = {
                    role: "superadmin",
                    name: "System Super Admin",
                    email: "superadmin@saas.com"
                };
                this.setActiveUser(user);
                return { success: true, user };
            }
            return { success: false, message: "Invalid Super Admin credentials!" };
        }

        // Must specify school for subsequent tiers
        const schoolId = credentials.schoolId;
        if (!schoolId) {
            return { success: false, message: "Please select a School / Institution." };
        }

        const schools = Storage.getSchools();
        const school = schools.find(s => s.id === schoolId);
        
        if (!school) {
            return { success: false, message: "School not found." };
        }

        if (school.status === "Suspended") {
            return { success: false, message: "This school's subscription is Suspended. Please contact Super Admin." };
        }

        // TIER 2: SCHOOL ADMIN
        if (role === "schooladmin") {
            if (school.adminEmail.toLowerCase() === credentials.email.toLowerCase() && school.adminPassword === credentials.password) {
                const user = {
                    role: "schooladmin",
                    schoolId: school.id,
                    schoolName: school.name,
                    name: "Institutional Admin",
                    email: school.adminEmail
                };
                this.setActiveUser(user);
                return { success: true, user };
            }
            return { success: false, message: "Invalid School Admin credentials!" };
        }

        // TIER 3: TEACHER
        if (role === "teacher") {
            const teachers = Storage.getSchoolData(schoolId, "teachers");
            const teacher = teachers.find(t => t.email.toLowerCase() === credentials.email.toLowerCase() && t.password === credentials.password);
            if (teacher) {
                const user = {
                    role: "teacher",
                    schoolId: school.id,
                    schoolName: school.name,
                    id: teacher.id,
                    name: teacher.name,
                    email: teacher.email,
                    class: teacher.designatedClass,
                    subject: teacher.designatedSubject
                };
                this.setActiveUser(user);
                return { success: true, user };
            }
            return { success: false, message: "Invalid Teacher credentials!" };
        }

        // TIER 4: STUDENT / PARENT
        if (role === "student") {
            const students = Storage.getSchoolData(schoolId, "students");
            const student = students.find(s => s.rollNumber.toString().trim() === credentials.rollNumber.toString().trim() && s.dob === credentials.dob);
            if (student) {
                if (student.status === "Suspended") {
                    return { success: false, message: "This student profile is suspended." };
                }
                const user = {
                    role: "student",
                    schoolId: school.id,
                    schoolName: school.name,
                    id: student.id,
                    name: student.name,
                    rollNumber: student.rollNumber,
                    dob: student.dob,
                    class: student.class
                };
                this.setActiveUser(user);
                return { success: true, user };
            }
            return { success: false, message: "Invalid Roll Number or Date of Birth pairing!" };
        }

        return { success: false, message: "Unsupported role authentication." };
    },

    // Check permissions helper
    hasAccess: function(requiredRole) {
        const user = this.getActiveUser();
        if (!user) return false;

        // Super Admin has master view permissions, can do everything except edit schools when mimicking.
        if (user.role === "superadmin") return true;

        if (requiredRole === "superadmin" && user.role !== "superadmin") return false;
        if (requiredRole === "schooladmin" && !["superadmin", "schooladmin"].includes(user.role)) return false;
        if (requiredRole === "teacher" && !["superadmin", "schooladmin", "teacher"].includes(user.role)) return false;

        return true;
    },

    // Super Admin View Mode check
    isViewOnlyMode: function() {
        return localStorage.getItem("saas_view_only_mode") === "true";
    },

    // Get current executing Tenant School ID
    getWorkingSchoolId: function() {
        const user = this.getActiveUser();
        if (!user) return null;

        if (user.role === "superadmin" && this.isViewOnlyMode()) {
            return localStorage.getItem("saas_view_only_school_id");
        }

        return user.schoolId;
    }
};
