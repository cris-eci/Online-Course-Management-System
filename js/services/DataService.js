/**
 * Data Service Class
 * Handles data persistence and retrieval using localStorage with async simulation
 * Implements Repository Pattern for data access
 */

class DataService {
    constructor() {
        this.storageKey = 'course_management_data';
        this.version = '1.0.0';
        this.initialized = false;
        this.data = {
            courses: [],
            students: [],
            settings: {},
            metadata: {
                version: this.version,
                createdAt: new Date(),
                lastUpdated: new Date()
            }
        };
    }

    /**
     * Initializes the data service
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) return;

        try {
            await this.loadData();
            this.initialized = true;
        } catch (error) {
            console.warn('Failed to load existing data, starting with empty dataset:', error);
            await this.saveData();
            this.initialized = true;
        }
    }

    /**
     * Loads data from localStorage with async simulation
     * @returns {Promise<Object>} Loaded data
     */
    async loadData() {
        // Simulate network delay
        await Utils.delay(APP_CONFIG.API_DELAY);

        const storedData = localStorage.getItem(this.storageKey);
        
        if (!storedData) {
            throw new Error('No data found in storage');
        }

        try {
            const parsedData = JSON.parse(storedData);
            
            // Validate data structure
            this.validateDataStructure(parsedData);
            
            // Convert plain objects back to model instances
            this.data = {
                ...parsedData,
                courses: parsedData.courses.map(courseData => Course.fromJSON(courseData)),
                students: parsedData.students.map(studentData => Student.fromJSON(studentData))
            };

            return this.data;
        } catch (error) {
            throw new Error(`Failed to parse stored data: ${error.message}`);
        }
    }

    /**
     * Saves data to localStorage with async simulation
     * @returns {Promise<void>}
     */
    async saveData() {
        // Simulate network delay
        await Utils.delay(APP_CONFIG.API_DELAY / 2);

        try {
            // Update metadata
            this.data.metadata.lastUpdated = new Date();
            this.data.metadata.version = this.version;

            // Convert model instances to plain objects
            const dataToStore = {
                ...this.data,
                courses: this.data.courses.map(course => course.toJSON()),
                students: this.data.students.map(student => student.toJSON())
            };

            localStorage.setItem(this.storageKey, JSON.stringify(dataToStore));
        } catch (error) {
            throw new Error(`Failed to save data: ${error.message}`);
        }
    }

    /**
     * Validates the structure of loaded data
     * @param {Object} data - Data to validate
     * @throws {Error} If data structure is invalid
     */
    validateDataStructure(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        if (!Array.isArray(data.courses)) {
            data.courses = [];
        }

        if (!Array.isArray(data.students)) {
            data.students = [];
        }

        if (!data.metadata || typeof data.metadata !== 'object') {
            data.metadata = {
                version: this.version,
                createdAt: new Date(),
                lastUpdated: new Date()
            };
        }

        if (!data.settings || typeof data.settings !== 'object') {
            data.settings = {};
        }
    }

    /**
     * Gets all courses with optional filtering and sorting
     * @param {Object} options - Query options
     * @param {string} options.sortBy - Field to sort by
     * @param {string} options.order - Sort order ('asc' or 'desc')
     * @param {Function} options.filter - Filter function
     * @returns {Promise<Course[]>} Array of courses
     */
    async getCourses(options = {}) {
        await this.ensureInitialized();
        await Utils.delay(APP_CONFIG.API_DELAY / 3);

        let courses = [...this.data.courses];

        // Apply filter if provided
        if (options.filter && typeof options.filter === 'function') {
            courses = courses.filter(options.filter);
        }

        // Apply sorting
        if (options.sortBy) {
            courses.sort((a, b) => Course.compare(a, b, options.sortBy, options.order));
        }

        return courses;
    }

    /**
     * Gets a course by ID
     * @param {string} id - Course ID
     * @returns {Promise<Course|null>} Course instance or null
     */
    async getCourseById(id) {
        await this.ensureInitialized();
        await Utils.delay(APP_CONFIG.API_DELAY / 4);

        return this.data.courses.find(course => course.id === id) || null;
    }

    /**
     * Creates a new course
     * @param {Object} courseData - Course data
     * @returns {Promise<Course>} Created course
     */
    async createCourse(courseData) {
        await this.ensureInitialized();

        // Simulate API processing delay
        await Utils.delay(APP_CONFIG.API_DELAY);

        // Check for duplicate titles
        const existingCourse = this.data.courses.find(
            course => course.title.toLowerCase() === courseData.title.toLowerCase()
        );

        if (existingCourse) {
            throw new Error('A course with this title already exists');
        }

        const course = new Course(courseData);
        this.data.courses.push(course);
        
        await this.saveData();
        return course;
    }

    /**
     * Updates an existing course
     * @param {string} id - Course ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Course>} Updated course
     */
    async updateCourse(id, updates) {
        await this.ensureInitialized();
        await Utils.delay(APP_CONFIG.API_DELAY);

        const course = this.data.courses.find(c => c.id === id);
        if (!course) {
            throw new Error('Course not found');
        }

        course.update(updates);
        await this.saveData();
        return course;
    }

    /**
     * Deletes a course
     * @param {string} id - Course ID
     * @returns {Promise<boolean>} True if deleted
     */
    async deleteCourse(id) {
        await this.ensureInitialized();
        await Utils.delay(APP_CONFIG.API_DELAY);

        const index = this.data.courses.findIndex(course => course.id === id);
        if (index === -1) {
            throw new Error('Course not found');
        }

        // Check if any students are enrolled in this course
        const enrolledStudents = this.data.students.filter(student => student.courseId === id);
        if (enrolledStudents.length > 0) {
            throw new Error('Cannot delete course with enrolled students');
        }

        this.data.courses.splice(index, 1);
        await this.saveData();
        return true;
    }

    /**
     * Gets all students with optional filtering and sorting
     * @param {Object} options - Query options
     * @returns {Promise<Student[]>} Array of students
     */
    async getStudents(options = {}) {
        await this.ensureInitialized();
        await Utils.delay(APP_CONFIG.API_DELAY / 3);

        let students = [...this.data.students];

        // Apply filter if provided
        if (options.filter && typeof options.filter === 'function') {
            students = students.filter(options.filter);
        }

        // Apply sorting
        if (options.sortBy) {
            students.sort((a, b) => Student.compare(a, b, options.sortBy, options.order));
        }

        return students;
    }

    /**
     * Gets a student by ID
     * @param {string} id - Student ID
     * @returns {Promise<Student|null>} Student instance or null
     */
    async getStudentById(id) {
        await this.ensureInitialized();
        await Utils.delay(APP_CONFIG.API_DELAY / 4);

        return this.data.students.find(student => student.id === id) || null;
    }

    /**
     * Creates a new student
     * @param {Object} studentData - Student data
     * @returns {Promise<Student>} Created student
     */
    async createStudent(studentData) {
        await this.ensureInitialized();
        await Utils.delay(APP_CONFIG.API_DELAY);

        // Check for duplicate email
        const existingStudent = this.data.students.find(
            student => student.email.toLowerCase() === studentData.email.toLowerCase()
        );

        if (existingStudent) {
            throw new Error('A student with this email already exists');
        }

        // Validate course exists if courseId is provided
        if (studentData.courseId) {
            const course = this.data.courses.find(c => c.id === studentData.courseId);
            if (!course) {
                throw new Error('Selected course does not exist');
            }
            // Increment course enrollment count
            course.addEnrollment();
        }

        const student = new Student(studentData);
        this.data.students.push(student);
        
        await this.saveData();
        return student;
    }

    /**
     * Updates an existing student
     * @param {string} id - Student ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Student>} Updated student
     */
    async updateStudent(id, updates) {
        await this.ensureInitialized();
        await Utils.delay(APP_CONFIG.API_DELAY);

        const student = this.data.students.find(s => s.id === id);
        if (!student) {
            throw new Error('Student not found');
        }

        student.update(updates);
        await this.saveData();
        return student;
    }

    /**
     * Deletes a student
     * @param {string} id - Student ID
     * @returns {Promise<boolean>} True if deleted
     */
    async deleteStudent(id) {
        await this.ensureInitialized();
        await Utils.delay(APP_CONFIG.API_DELAY);

        const index = this.data.students.findIndex(student => student.id === id);
        if (index === -1) {
            throw new Error('Student not found');
        }

        const student = this.data.students[index];
        
        // Decrement course enrollment count if student was enrolled
        if (student.courseId) {
            const course = this.data.courses.find(c => c.id === student.courseId);
            if (course) {
                course.removeEnrollment();
            }
        }

        this.data.students.splice(index, 1);
        await this.saveData();
        return true;
    }

    /**
     * Gets analytics data
     * @returns {Promise<Object>} Analytics object
     */
    async getAnalytics() {
        await this.ensureInitialized();
        await Utils.delay(APP_CONFIG.API_DELAY / 2);

        const courses = this.data.courses;
        const students = this.data.students;

        const totalCourses = courses.length;
        const totalStudents = students.length;
        const activeStudents = students.filter(s => s.isActive).length;
        const enrolledStudents = students.filter(s => s.isEnrolled()).length;
        const completedStudents = students.filter(s => s.hasCompletedCourse()).length;

        const averageProgress = students.length > 0
            ? students.reduce((sum, student) => sum + student.progress, 0) / students.length
            : 0;

        const completionRate = enrolledStudents > 0
            ? (completedStudents / enrolledStudents) * 100
            : 0;

        // Course enrollment distribution
        const enrollmentDistribution = courses.map(course => ({
            courseTitle: course.title,
            enrollmentCount: course.enrollmentCount,
            averageProgress: students
                .filter(s => s.courseId === course.id)
                .reduce((sum, s, _, arr) => arr.length > 0 ? sum + s.progress / arr.length : 0, 0)
        }));

        return {
            totalCourses,
            totalStudents,
            activeStudents,
            enrolledStudents,
            completedStudents,
            averageProgress: Math.round(averageProgress * 100) / 100,
            completionRate: Math.round(completionRate * 100) / 100,
            enrollmentDistribution
        };
    }

    /**
     * Exports all data
     * @returns {Promise<Object>} Complete data export
     */
    async exportData() {
        await this.ensureInitialized();
        await Utils.delay(APP_CONFIG.API_DELAY);

        return {
            ...this.data,
            courses: this.data.courses.map(course => course.toJSON()),
            students: this.data.students.map(student => student.toJSON()),
            exportedAt: new Date()
        };
    }

    /**
     * Clears all data
     * @returns {Promise<void>}
     */
    async clearAllData() {
        await Utils.delay(APP_CONFIG.API_DELAY);

        this.data = {
            courses: [],
            students: [],
            settings: {},
            metadata: {
                version: this.version,
                createdAt: new Date(),
                lastUpdated: new Date()
            }
        };

        await this.saveData();
    }

    /**
     * Ensures service is initialized
     * @private
     */
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataService };
}