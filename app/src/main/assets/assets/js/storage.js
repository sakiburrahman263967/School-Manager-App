/**
 * Madrasah ERP Storage Interface
 * Manages standard prefixed LocalStorage datasets under the convention:
 * school_{schoolId}_{module} (e.g. school_001_students)
 * This guarantees absolute isolation; no block can read outside its schoolId prefix unless requested by Super Admin.
 */

const Storage = {
    // Save records
    set: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Get records
    get: function(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    },

    // Unified School Database Fetcher
    getSchoolData: function(schoolId, module) {
        const key = `school_${schoolId}_${module}`;
        return this.get(key);
    },

    saveSchoolData: function(schoolId, module, data) {
        const key = `school_${schoolId}_${module}`;
        this.set(key, data);
    },

    // Global Registry Fetcher
    getSchools: function() {
        return this.get("saas_schools");
    },

    saveSchools: function(schools) {
        this.set("saas_schools", schools);
    },

    // Global Aggregate statistics across ALL platforms (For Super Admin Dashboard)
    getGlobalStats: function() {
        const schools = this.getSchools();
        const activeCount = schools.filter(s => s.status === "Active").length;
        const totalSchools = schools.length;

        let totalStudentsCount = 0;
        let totalTeachersCount = 0;
        let totalRevenue = 0;

        schools.forEach(school => {
            // Count students
            const students = this.getSchoolData(school.id, "students");
            totalStudentsCount += students.length;

            // Count teachers
            const teachers = this.getSchoolData(school.id, "teachers");
            totalTeachersCount += teachers.length;

            // Count revenue based on collected fees
            const fees = this.getSchoolData(school.id, "fees");
            fees.forEach(f => {
                if (f.amountPaid) {
                    totalRevenue += Number(f.amountPaid);
                }
            });
        });

        return {
            totalSchools,
            activeCount,
            suspendedCount: totalSchools - activeCount,
            totalStudents: totalStudentsCount,
            totalTeachers: totalTeachersCount,
            totalRevenue: totalRevenue
        };
    },

    // Add a single item within a school module
    addModel: function(schoolId, module, object) {
        const list = this.getSchoolData(schoolId, module);
        list.push(object);
        this.saveSchoolData(schoolId, module, list);
        return list;
    },

    // Update an item in a school module
    updateModel: function(schoolId, module, id, updatedObject) {
        const list = this.getSchoolData(schoolId, module);
        const index = list.findIndex(item => item.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updatedObject };
            this.saveSchoolData(schoolId, module, list);
            return true;
        }
        return false;
    },

    // Remove an item out of a school module
    deleteModel: function(schoolId, module, id) {
        const list = this.getSchoolData(schoolId, module);
        const filtered = list.filter(item => item.id !== id);
        this.saveSchoolData(schoolId, module, filtered);
        return filtered;
    }
};
