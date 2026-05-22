/**
 * Madrasah ERP Utility and Helpers Module
 * Contains translation engines for English-Bengali dual views,
 * GPA calculators, and class-wise merit ranking sorters.
 */

const Utils = {
    // Current application language state
    getLanguage: function() {
        return localStorage.getItem("saas_language") || "en";
    },

    setLanguage: function(lang) {
        localStorage.setItem("saas_language", lang);
    },

    // Translation lexicon dictionary
    dictionary: {
        en: {
            app_title: "Madrasah ERP SaaS",
            super_admin: "Super Admin Portal",
            school_admin: "Institutional Head Portal",
            teacher_portal: "Teacher Classroom Portal",
            student_parent_portal: "Student / Parent Portal",
            dashboard: "Dashboard",
            schools: "Schools Register",
            total_schools: "Total Schools",
            active_schools: "Active Schools",
            suspended_schools: "Suspended Schools",
            total_students: "Total Students",
            total_teachers: "Total Teachers",
            revenue: "Overall SaaS Revenue",
            add_school: "Create New School",
            school_id: "School ID",
            subdomain: "Subdomain / Pattern",
            status: "Status",
            actions: "Actions",
            academic_session: "Academic Session",
            student_management: "Student Management",
            teacher_management: "Teacher Management",
            fee_management: "Fee Ledger",
            results_system: "Result & Grading",
            attendance: "Attendance Tracker",
            notices: "Islamic Notice Board",
            settings: "SaaS Custom Settings",
            role: "Select Designation",
            logout: "Logout",
            admission_date: "Admission Date",
            add_student: "Admit Student",
            add_teacher: "Engage Teacher",
            collect_fee: "Record Fee Payment",
            save: "Save / সংরক্ষণ",
            cancel: "Cancel / বাতিল",
            print: "Print A4 Receipt (PDF) / প্রিন্ট",
            grade: "Letter Grade",
            point: "Grade Point",
            gpa: "GPA",
            merit: "Class Merit Position",
            view_mode: "View-Only Mode",
            back_to_super: "Return to Super Admin",
            arabic: "Arabic & Quran",
            hadith: "Al-Hadith",
            history: "Islamic History",
            grammar: "Arabic Grammar"
        },
        bn: {
            app_title: "মাদরাসা ইআরপি স্যাস",
            super_admin: "সুপার এডমিন পোর্টাল",
            school_admin: "প্রাতিষ্ঠানিক প্রধান পোর্টাল",
            teacher_portal: "শিক্ষক তথ্য পোর্টাল",
            student_parent_portal: "শিক্ষার্থী / অভিভাবক পোর্টাল",
            dashboard: "ড্যাশবোর্ড",
            schools: "মাদরাসা তালিকা",
            total_schools: "মোট মাদরাসা",
            active_schools: "সক্রিয় মাদরাসা",
            suspended_schools: "স্থগিত মাদরাসা",
            total_students: "মোট ছাত্র-ছাত্রী",
            total_teachers: "মোট শিক্ষক",
            revenue: "মোট স্যাস রাজস্ব",
            add_school: "নতুন মাদরাসা তৈরি করুন",
            school_id: "মাদরাসা আইডি",
            subdomain: "সাবডোমেইন প্যাটার্ন",
            status: "অবস্থা",
            actions: "কার্যক্রম",
            academic_session: "শিক্ষাবর্ষ",
            student_management: "ছাত্র-ছাত্রী ব্যবস্থাপনা",
            teacher_management: "শিক্ষক ব্যবস্থাপনা",
            fee_management: "ফি আদায় খাতা",
            results_system: "পরীক্ষার ফলাফল ও গ্রেডিং",
            attendance: "হাজিরা ট্র্যাকার",
            notices: "বিজ্ঞপ্তি বোর্ড",
            settings: "স্যাস কাস্টম সেটিংস",
            role: "পদবি নির্বাচন করুন",
            logout: "লগআউট",
            admission_date: "ভর্তির তারিখ",
            add_student: "শিক্ষার্থী ভর্তি",
            add_teacher: "শিক্ষক নিয়োগ",
            collect_fee: "ফি সংগ্রহ জমা",
            save: "সংরক্ষণ করুন",
            cancel: "বাতিল",
            print: "এ৪ রশিদ প্রিন্ট করুন (পিডিএফ)",
            grade: "লেটার গ্রেড",
            point: "গ্রেড পয়েন্ট",
            gpa: "জিপিএ",
            merit: "মেধা স্থান",
            view_mode: "ভিউ মোড (শুধুমাত্র প্রদর্শন)",
            back_to_super: "সুপার এডমিনে ফিরে যান",
            arabic: "কুরআন ও তাজবিদ",
            hadith: "আল-হাদিস",
            history: "ইসলামের ইতিহাস",
            grammar: "আরবি ব্যাকরণ"
        }
    },

    // Translation engine
    t: function(key) {
        const lang = this.getLanguage();
        return this.dictionary[lang][key] || key;
    },

    // Standard Quranic / Academic Grading (Customizable Scale)
    calculateSubjectGPA: function(marks) {
        const scale = DEFAULT_GRADING_SCALE;
        for (let rule of scale) {
            if (marks >= rule.min && marks <= rule.max) {
                return rule;
            }
        }
        return { grade: "F", points: 0.0, remarks: "Failed / অকৃতকার্য" };
    },

    // Compile GPA and average letter grade for a whole marksheet
    calculateOverallGPA: function(subjectMarks) {
        const subjects = Object.keys(subjectMarks);
        if (subjects.length === 0) return { gpa: 0, grade: "F" };

        let totalPoints = 0;
        let isFailed = false;

        subjects.forEach(subject => {
            const marks = subjectMarks[subject];
            const rule = this.calculateSubjectGPA(marks);
            totalPoints += rule.points;
            if (rule.points === 0) {
                isFailed = true; // Failing any single subject results in an overall F in conventional grading scales
            }
        });

        const gpaValue = isFailed ? 0.0 : Number((totalPoints / subjects.length).toFixed(2));
        
        // Match gpaValue to a letter grade
        let letterGrade = "F";
        if (gpaValue >= 5.0) letterGrade = "A+";
        else if (gpaValue >= 4.0) letterGrade = "A";
        else if (gpaValue >= 3.5) letterGrade = "A-";
        else if (gpaValue >= 3.0) letterGrade = "B";
        else if (gpaValue >= 2.0) letterGrade = "C";
        else if (gpaValue >= 1.0) letterGrade = "D";

        return {
            gpa: gpaValue,
            grade: letterGrade
        };
    },

    // Compute Class Merit Position based on results
    // Automatically recalculates ranks based on average GPA and tie broke by cumulative marks
    calculateMeritRanks: function(schoolId, classId, examType, academicSession) {
        const results = Storage.getSchoolData(schoolId, "results");
        // Filter elements of the target class & exam
        const filteredResults = results.filter(r => 
            r.class === classId && 
            r.examType === examType && 
            r.academicSession === academicSession
        );

        // Map them with detailed metrics
        const ranked = filteredResults.map(r => {
            const subjects = Object.keys(r.subjectMarks);
            let totalMarks = 0;
            subjects.forEach(sub => { totalMarks += Number(r.subjectMarks[sub]); });
            
            const evaluation = this.calculateOverallGPA(r.subjectMarks);
            return {
                id: r.id,
                studentId: r.studentId,
                gpa: evaluation.gpa,
                totalMarks: totalMarks,
                original: r
            };
        });

        // Sort descending by GPA first, then by total overall marks (tie-breaker)
        ranked.sort((a, b) => {
            if (b.gpa !== a.gpa) {
                return b.gpa - a.gpa;
            }
            return b.totalMarks - a.totalMarks;
        });

        // Map id to Merit Rank
        const ranksMap = {};
        ranked.forEach((item, index) => {
            ranksMap[item.id] = index + 1;
        });

        return ranksMap;
    },

    // Custom receipt number generator
    generateReceiptNumber: function(schoolId) {
        const random = Math.floor(10000 + Math.random() * 90000);
        return `REC-${schoolId}-${random}`;
    },

    // Format dates cleanly
    formatDate: function(dateStr) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString(this.getLanguage() === "en" ? "en-US" : "bn-BD", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
};
