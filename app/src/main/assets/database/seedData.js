/**
 * Madrasah ERP Seed Data
 * Pre-populates LocalStorage with full-featured dashboards so the sandbox is lively right from compilation.
 * Super Admin Credentials:
 *   Username: superadmin
 *   Password: admin123
 */

const SeedData = {
    initialize: function() {
        // Prevent re-seeding if already initialized
        if (localStorage.getItem("saas_seeded") === "true") {
            return;
        }

        // 1. Global Schools (Multi-Tenant Master Registry)
        const schools = [
            {
                id: "001",
                name: "Al-Bayan Islamic Academy",
                subdomain: "bayan.madrasaherp.com",
                logo: "🕌",
                themeColor: "#1b5e20",
                status: "Active",
                adminEmail: "bayan.head@islamic.edu",
                adminPassword: "admin123", // For simplicity, initialized clearly
                academicSession: "2026-2027",
                planStart: "2026-01-01",
                planEnd: "2027-12-31"
            },
            {
                id: "002",
                name: "Darul Uloom Noor Al-Islam",
                subdomain: "noor.madrasaherp.com",
                logo: "📖",
                themeColor: "#0f5a47",
                status: "Active",
                adminEmail: "noor.head@islamic.edu",
                adminPassword: "admin123",
                academicSession: "2026-2027",
                planStart: "2026-02-15",
                planEnd: "2027-02-14"
            },
            {
                id: "003",
                name: "An-Najaf Model High Madrasah",
                subdomain: "najaf.madrasaherp.com",
                logo: "🌙",
                themeColor: "#1e3a8a",
                status: "Suspended", // Seeded suspended so user can see suspension block in action
                adminEmail: "najaf.admin@islamic.edu",
                adminPassword: "admin123",
                academicSession: "2026-2027",
                planStart: "2026-03-01",
                planEnd: "2026-05-01" // Plan already expired
            }
        ];
        localStorage.setItem("saas_schools", JSON.stringify(schools));

        // 2. School 001 Data (Al-Bayan Academy)
        const school001_students = [
            { id: "STU-001-101", name: "Muhammad Abdullah", rollNumber: "101", class: "Class 1", dob: "2015-05-12", guardianName: "Siddiqur Rahman", phone: "01712345678", admissionDate: "2026-01-10", status: "Active" },
            { id: "STU-001-102", name: "Fatimah Al-Zahra", rollNumber: "102", class: "Class 1", dob: "2015-08-22", guardianName: "Farid Uddin", phone: "01812345679", admissionDate: "2026-01-12", status: "Active" },
            { id: "STU-001-103", name: "Sajid Ibn Mahmud", rollNumber: "103", class: "Class 1", dob: "2015-11-03", guardianName: "Mahmudul Hasan", phone: "01912345680", admissionDate: "2026-01-15", status: "Active" },
            { id: "STU-001-201", name: "Aisha Siddiqa", rollNumber: "201", class: "Class 2", dob: "2014-03-14", guardianName: "Kamrul Islam", phone: "01512345681", admissionDate: "2025-01-05", status: "Active" }
        ];
        localStorage.setItem("school_001_students", JSON.stringify(school001_students));

        const school001_teachers = [
            { id: "TCH-001-501", name: "Mufti Ahmadullah", email: "ahm@bayan.edu", phone: "01722223333", password: "teacher123", designatedClass: "Class 1", designatedSubject: "Quran & Tajweed" },
            { id: "TCH-001-502", name: "Maulana Hasan Ali", email: "hasan@bayan.edu", phone: "01833334444", password: "teacher123", designatedClass: "Class 2", designatedSubject: "Islamic History" }
        ];
        localStorage.setItem("school_001_teachers", JSON.stringify(school001_teachers));

        const school001_results = [
            {
                id: "RES-001-101-MID",
                studentId: "STU-001-101",
                examType: "Midterm",
                academicSession: "2026-2027",
                class: "Class 1",
                subjectMarks: { "Quran & Tajweed": 85, "Hadith": 90, "Islamic History": 78, "Arabic Grammar": 82 }
            },
            {
                id: "RES-001-102-MID",
                studentId: "STU-001-102",
                examType: "Midterm",
                academicSession: "2026-2027",
                class: "Class 1",
                subjectMarks: { "Quran & Tajweed": 92, "Hadith": 95, "Islamic History": 88, "Arabic Grammar": 91 }
            },
            {
                id: "RES-001-103-MID",
                studentId: "STU-001-103",
                examType: "Midterm",
                academicSession: "2026-2027",
                class: "Class 1",
                subjectMarks: { "Quran & Tajweed": 45, "Hadith": 50, "Islamic History": 55, "Arabic Grammar": 38 }
            }
        ];
        localStorage.setItem("school_001_results", JSON.stringify(school001_results));

        const school001_attendance = [
            {
                date: "2026-05-20",
                type: "Student",
                records: { "STU-001-101": "Present", "STU-001-102": "Present", "STU-001-103": "Absent", "STU-001-201": "Present" }
            },
            {
                date: "2026-05-21",
                type: "Student",
                records: { "STU-001-101": "Present", "STU-001-102": "Present", "STU-001-103": "Present", "STU-001-201": "Absent" }
            }
        ];
        localStorage.setItem("school_001_attendance", JSON.stringify(school001_attendance));

        const school001_fees = [
            {
                id: "REC-001-10001",
                studentId: "STU-001-101",
                class: "Class 1",
                academicSession: "2026-2027",
                feeType: "Admission Fee",
                amountTotal: 5000,
                amountPaid: 5000,
                amountDue: 0,
                status: "Paid",
                paymentDate: "2026-01-10"
            },
            {
                id: "REC-001-10002",
                studentId: "STU-001-102",
                class: "Class 1",
                academicSession: "2026-2027",
                feeType: "Monthly Tuition Fee",
                amountTotal: 1500,
                amountPaid: 1000,
                amountDue: 500,
                status: "Partial",
                paymentDate: "2026-05-15"
            },
            {
                id: "REC-001-10003",
                studentId: "STU-001-103",
                class: "Class 1",
                academicSession: "2026-2027",
                feeType: "Monthly Tuition Fee",
                amountTotal: 1500,
                amountPaid: 0,
                amountDue: 1500,
                status: "Due",
                paymentDate: ""
            }
        ];
        localStorage.setItem("school_001_fees", JSON.stringify(school001_fees));

        const school001_notices = [
            { id: "NOT-001-01", title: "Ramadan Holidays Announcement", content: "Dear Parents and Students, Bayan Academy will remain closed from the 20th of Ramadan till 5th of Shawwal. Rest classes will be virtual. Eid Mubarak!", target: "All", date: "2026-05-10" },
            { id: "NOT-001-02", title: "Tajweed Oral Assessment", content: "Mufti Ahmadullah will conduct the Tajweed evaluation on Saturday during class hours. Please ensure prompt attendance.", target: "Class 1", date: "2026-05-18" }
        ];
        localStorage.setItem("school_001_notices", JSON.stringify(school001_notices));


        // 3. School 002 Data (Darul Uloom Noor Al-Islam) - SHOWCASING TENANT ISOLATION
        const school002_students = [
            { id: "STU-002-801", name: "Zubair Al-Farooq", rollNumber: "801", class: "Hifz Section", dob: "2013-02-10", guardianName: "Farooq Mahmud", phone: "01799988811", admissionDate: "2026-02-20", status: "Active" },
            { id: "STU-002-802", name: "Sumaiya Sajjad", rollNumber: "802", class: "Hifz Section", dob: "2014-07-16", guardianName: "Sajjad Husain", phone: "01899988812", admissionDate: "2026-02-22", status: "Active" }
        ];
        localStorage.setItem("school_002_students", JSON.stringify(school002_students));

        const school002_teachers = [
            { id: "TCH-002-601", name: "Maulana Qari Yusuf", email: "yusuf@noor.edu", phone: "01755556666", password: "teacher123", designatedClass: "Hifz Section", designatedSubject: "Hifz-ul-Quran" }
        ];
        localStorage.setItem("school_002_teachers", JSON.stringify(school002_teachers));

        const school002_results = [
            {
                id: "RES-002-801-MID",
                studentId: "STU-002-801",
                examType: "Midterm",
                academicSession: "2026-2027",
                class: "Hifz Section",
                subjectMarks: { "Hifz-ul-Quran": 98 }
            }
        ];
        localStorage.setItem("school_002_results", JSON.stringify(school002_results));

        const school002_attendance = [
            {
                date: "2026-05-20",
                type: "Student",
                records: { "STU-002-801": "Present", "STU-002-802": "Present" }
            }
        ];
        localStorage.setItem("school_002_attendance", JSON.stringify(school002_attendance));

        const school002_notices = [
            { id: "NOT-002-01", title: "Quran Recitation Assembly", content: "Global Qari Ibrahim will join us this Friday. Attendance is open and encouraged for family members.", target: "All", date: "2026-05-19" }
        ];
        localStorage.setItem("school_002_notices", JSON.stringify(school002_notices));


        // Set state to seeded
        localStorage.setItem("saas_seeded", "true");
        console.log("Madrasah ERP sandbox successfully seeded.");
    }
};
