/**
 * Student Manager Class
 * Implements Facade Pattern and Observer Pattern for student management
 * Handles business logic for student operations and enrollment management
 */

class StudentManager {
    constructor(dataService, validationService) {
        this.dataService = dataService;
        this.validationService = validationService;
        this.observers = [];
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Adds an observer to the manager
     * @param {Object} observer - Observer object with event handler methods
     */
    addObserver(observer) {
        this.observers.push(observer);
    }

    /**
     * Removes an observer from the manager
     * @param {Object} observer - Observer to remove
     */
    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    /**
     * Notifies all observers of an event
     * @param {string} eventType - Type of event
     * @param {*} data - Event data
     * @private
     */
    notifyObservers(eventType, data) {
        this.observers.forEach(observer => {
            if (typeof observer[eventType] === 'function') {
                try {
                    observer[eventType](data);
                } catch (error) {
                    console.error(`Error in observer ${eventType}:`, error);
                }
            }
        });
    }

    /**
     * Gets all students with optional caching
     * @param {Object} options - Query options
     * @param {boolean} useCache - Whether to use cache
     * @returns {Promise<Student[]>} Array of students
     */
    async getStudents(options = {}, useCache = true) {
        const cacheKey = `students_${JSON.stringify(options)}`;
        
        if (useCache && this.cache.has(cacheKey)) {
            const cachedData = this.cache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < this.cacheTimeout) {
                return cachedData.data;
            }
        }

        try {
            this.notifyObservers('studentsLoading', true);
            const students = await this.dataService.getStudents(options);
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: students,
                timestamp: Date.now()
            });

            this.notifyObservers('studentsLoaded', students);
            return students;
        } catch (error) {
            this.notifyObservers('studentsError', error);
            throw error;
        }
    }

    /**
     * Gets a student by ID
     * @param {string} id - Student ID
     * @returns {Promise<Student|null>} Student instance or null
     */
    async getStudentById(id) {
        try {
            return await this.dataService.getStudentById(id);
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Creates a new student with validation and enrollment
     * @param {Object} studentData - Student data
     * @returns {Promise<Student>} Created student
     */
    async createStudent(studentData) {
        try {
            // Sanitize input
            const sanitizedData = this.validationService.sanitizeInput(studentData);
            
            // Validate student data
            const validation = this.validationService.validateStudent(sanitizedData);
            if (!validation.isValid) {
                const error = new ValidationError('Student validation failed', Object.values(validation.errors));
                this.notifyObservers('studentValidationError', validation.errors);
                throw error;
            }

            // Check if course exists (if courseId provided)
            if (sanitizedData.courseId) {
                const course = await this.dataService.getCourseById(sanitizedData.courseId);
                if (!course) {
                    throw new Error('Selected course does not exist');
                }
            }

            this.notifyObservers('studentCreating', sanitizedData);
            
            const student = await this.dataService.createStudent(sanitizedData);
            
            // Clear cache
            this.clearCache();
            
            this.notifyObservers('studentCreated', student);
            return student;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Updates an existing student
     * @param {string} id - Student ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Student>} Updated student
     */
    async updateStudent(id, updates) {
        try {
            // Sanitize input
            const sanitizedUpdates = this.validationService.sanitizeInput(updates);
            
            // Get current student data for validation
            const currentStudent = await this.dataService.getStudentById(id);
            if (!currentStudent) {
                throw new Error('Student not found');
            }

            // Merge current data with updates for validation
            const mergedData = { ...currentStudent.toJSON(), ...sanitizedUpdates };
            
            // Validate merged data (excluding courseId for update validation)
            const validationData = { ...mergedData };
            delete validationData.courseId; // Don't validate courseId on update
            const validation = this.validationService.validateStudent({ ...validationData, courseId: 'dummy' });
            
            // Remove the dummy courseId validation
            if (validation.errors && validation.errors.courseId === 'Please select a course') {
                delete validation.errors.courseId;
                validation.isValid = Object.keys(validation.errors).length === 0;
            }
            
            if (!validation.isValid) {
                const error = new ValidationError('Student validation failed', Object.values(validation.errors));
                this.notifyObservers('studentValidationError', validation.errors);
                throw error;
            }

            this.notifyObservers('studentUpdating', { id, updates: sanitizedUpdates });
            
            const updatedStudent = await this.dataService.updateStudent(id, sanitizedUpdates);
            
            // Clear cache
            this.clearCache();
            
            this.notifyObservers('studentUpdated', updatedStudent);
            return updatedStudent;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Deletes a student
     * @param {string} id - Student ID
     * @returns {Promise<boolean>} True if deleted
     */
    async deleteStudent(id) {
        try {
            this.notifyObservers('studentDeleting', id);
            
            const result = await this.dataService.deleteStudent(id);
            
            // Clear cache
            this.clearCache();
            
            this.notifyObservers('studentDeleted', id);
            return result;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Enrolls a student in a course
     * @param {string} studentId - Student ID
     * @param {string} courseId - Course ID
     * @returns {Promise<Student>} Updated student
     */
    async enrollStudent(studentId, courseId) {
        try {
            // Validate course exists
            const course = await this.dataService.getCourseById(courseId);
            if (!course) {
                throw new Error('Course not found');
            }

            // Get current student
            const student = await this.dataService.getStudentById(studentId);
            if (!student) {
                throw new Error('Student not found');
            }

            // Check if student is already enrolled in a course
            if (student.isEnrolled()) {
                throw new Error('Student is already enrolled in a course. Please unenroll first.');
            }

            this.notifyObservers('studentEnrolling', { studentId, courseId });

            // Enroll student
            student.enrollInCourse(courseId);
            await this.dataService.updateStudent(studentId, { 
                courseId: courseId,
                enrollmentDate: student.enrollmentDate,
                progress: 0
            });

            // Update course enrollment count
            course.addEnrollment();
            await this.dataService.updateCourse(courseId, { enrollmentCount: course.enrollmentCount });

            // Clear cache
            this.clearCache();

            this.notifyObservers('studentEnrolled', { student, course });
            return student;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Unenrolls a student from their current course
     * @param {string} studentId - Student ID
     * @returns {Promise<Student>} Updated student
     */
    async unenrollStudent(studentId) {
        try {
            const student = await this.dataService.getStudentById(studentId);
            if (!student) {
                throw new Error('Student not found');
            }

            if (!student.isEnrolled()) {
                throw new Error('Student is not enrolled in any course');
            }

            const courseId = student.courseId;

            this.notifyObservers('studentUnenrolling', { studentId, courseId });

            // Update course enrollment count
            if (courseId) {
                const course = await this.dataService.getCourseById(courseId);
                if (course) {
                    course.removeEnrollment();
                    await this.dataService.updateCourse(courseId, { enrollmentCount: course.enrollmentCount });
                }
            }

            // Unenroll student
            student.unenrollFromCourse();
            await this.dataService.updateStudent(studentId, { 
                courseId: null,
                progress: 0,
                completedLessons: []
            });

            // Clear cache
            this.clearCache();

            this.notifyObservers('studentUnenrolled', student);
            return student;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Updates student progress
     * @param {string} id - Student ID
     * @param {number} progress - Progress percentage
     * @returns {Promise<Student>} Updated student
     */
    async updateStudentProgress(id, progress) {
        try {
            // Validate progress
            const validation = this.validationService.validateField('progress', progress);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            const student = await this.dataService.getStudentById(id);
            if (!student) {
                throw new Error('Student not found');
            }

            student.updateProgress(progress);
            await this.dataService.updateStudent(id, { progress: student.progress });
            
            // Clear cache
            this.clearCache();
            
            this.notifyObservers('studentProgressUpdated', student);
            return student;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Simulates random progress for all enrolled students
     * @returns {Promise<Student[]>} Updated students
     */
    async simulateProgress() {
        try {
            this.notifyObservers('progressSimulating', true);
            
            const students = await this.getStudents({}, false); // Don't use cache
            const enrolledStudents = students.filter(student => student.isEnrolled());
            const updatedStudents = [];

            for (const student of enrolledStudents) {
                const randomIncrease = Utils.randomBetween(3, 20);
                const newProgress = Math.min(100, student.progress + randomIncrease);
                
                await this.updateStudentProgress(student.id, newProgress);
                student.updateProgress(newProgress);
                updatedStudents.push(student);
            }

            this.notifyObservers('progressSimulated', updatedStudents);
            return updatedStudents;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Searches students by name or email
     * @param {string} query - Search query
     * @returns {Promise<Student[]>} Matching students
     */
    async searchStudents(query) {
        try {
            if (!query || query.trim() === '') {
                return await this.getStudents();
            }

            const searchTerm = query.toLowerCase().trim();
            const students = await this.getStudents({}, false);
            
            const filtered = students.filter(student => 
                student.name.toLowerCase().includes(searchTerm) ||
                student.email.toLowerCase().includes(searchTerm)
            );

            this.notifyObservers('studentsSearched', { query, results: filtered });
            return filtered;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Gets students by course
     * @param {string} courseId - Course ID
     * @returns {Promise<Student[]>} Students enrolled in course
     */
    async getStudentsByCourse(courseId) {
        try {
            const students = await this.getStudents({
                filter: student => student.courseId === courseId
            });

            return students;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Gets student statistics
     * @returns {Promise<Object>} Student statistics
     */
    async getStudentStatistics() {
        try {
            const students = await this.getStudents();
            
            const stats = {
                total: students.length,
                active: students.filter(s => s.isActive).length,
                enrolled: students.filter(s => s.isEnrolled()).length,
                completed: students.filter(s => s.hasCompletedCourse()).length,
                averageProgress: students.length > 0 
                    ? students.reduce((sum, student) => sum + student.progress, 0) / students.length 
                    : 0,
                byStatus: {
                    'Not Enrolled': students.filter(s => !s.isEnrolled()).length,
                    'Enrolled': students.filter(s => s.isEnrolled() && s.progress === 0).length,
                    'In Progress': students.filter(s => s.progress > 0 && s.progress < 100).length,
                    'Completed': students.filter(s => s.hasCompletedCourse()).length,
                    'Inactive': students.filter(s => !s.isActive).length
                }
            };

            stats.completionRate = stats.enrolled > 0 ? (stats.completed / stats.enrolled) * 100 : 0;
            stats.enrollmentRate = stats.total > 0 ? (stats.enrolled / stats.total) * 100 : 0;

            return stats;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Gets enrollment analytics
     * @returns {Promise<Object>} Enrollment analytics
     */
    async getEnrollmentAnalytics() {
        try {
            const students = await this.getStudents();
            const courses = await this.dataService.getCourses();

            // Group students by course
            const courseEnrollments = {};
            courses.forEach(course => {
                courseEnrollments[course.id] = {
                    course: course,
                    students: students.filter(s => s.courseId === course.id),
                    averageProgress: 0,
                    completionRate: 0
                };
            });

            // Calculate metrics for each course
            Object.values(courseEnrollments).forEach(enrollment => {
                const { students: courseStudents } = enrollment;
                if (courseStudents.length > 0) {
                    enrollment.averageProgress = courseStudents.reduce((sum, s) => sum + s.progress, 0) / courseStudents.length;
                    enrollment.completionRate = (courseStudents.filter(s => s.hasCompletedCourse()).length / courseStudents.length) * 100;
                }
            });

            return courseEnrollments;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Exports student data
     * @param {string} format - Export format ('json', 'csv')
     * @returns {Promise<string>} Exported data
     */
    async exportStudents(format = 'json') {
        try {
            const students = await this.getStudents();
            
            if (format === 'json') {
                return JSON.stringify(students.map(student => student.toJSON()), null, 2);
            } else if (format === 'csv') {
                return this.convertStudentsToCSV(students);
            } else {
                throw new Error('Unsupported export format');
            }
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Converts students to CSV format
     * @param {Student[]} students - Students to convert
     * @returns {string} CSV string
     * @private
     */
    convertStudentsToCSV(students) {
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Course ID', 'Status', 'Progress', 'Enrollment Date', 'Last Login'];
        const rows = students.map(student => [
            student.id,
            `"${student.name}"`,
            student.email,
            student.phone || '',
            student.courseId || '',
            student.getStatus(),
            student.progress,
            student.getFormattedEnrollmentDate(),
            student.getFormattedLastLogin()
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    /**
     * Records student login
     * @param {string} studentId - Student ID
     * @returns {Promise<Student>} Updated student
     */
    async recordStudentLogin(studentId) {
        try {
            const student = await this.dataService.getStudentById(studentId);
            if (!student) {
                throw new Error('Student not found');
            }

            student.recordLogin();
            await this.dataService.updateStudent(studentId, { lastLoginAt: student.lastLoginAt });

            // Clear cache
            this.clearCache();

            this.notifyObservers('studentLoginRecorded', student);
            return student;
        } catch (error) {
            this.notifyObservers('studentError', error);
            throw error;
        }
    }

    /**
     * Clears the cache
     * @private
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Gets cache size for debugging
     * @returns {number} Number of cached items
     */
    getCacheSize() {
        return this.cache.size;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StudentManager };
}