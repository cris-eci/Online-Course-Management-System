/**
 * Student Model Class
 * Represents a student entity with enrollment management
 */

class Student {
    /**
     * Creates a new Student instance
     * @param {Object} data - Student data object
     * @param {string} data.name - Student full name
     * @param {string} data.email - Student email address
     * @param {string} [data.phone] - Student phone number
     * @param {string} [data.courseId] - Assigned course ID
     * @param {string} [data.id] - Student ID (auto-generated if not provided)
     */
    constructor(data) {
        // Validate required fields
        this.validate(data);

        // Initialize properties
        this.id = data.id || Utils.generateId();
        this.name = data.name.trim();
        this.email = data.email.toLowerCase().trim();
        this.phone = data.phone ? data.phone.trim() : null;
        this.courseId = data.courseId || null;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.progress = data.progress || 0;
        this.completedLessons = data.completedLessons || [];
        this.lastLoginAt = data.lastLoginAt || null;
        this.enrollmentDate = data.enrollmentDate || new Date();
        
        // Additional computed properties
        this.initials = this.getInitials();
        this.displayName = this.getDisplayName();
    }

    /**
     * Validates student data
     * @param {Object} data - Data to validate
     * @throws {Error} If validation fails
     */
    validate(data) {
        const errors = [];

        if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
            errors.push('Student name is required and must be a non-empty string');
        }

        if (!data.email || typeof data.email !== 'string' || !Utils.isValidEmail(data.email)) {
            errors.push('Valid email address is required');
        }

        if (data.name && data.name.length > 100) {
            errors.push('Student name must be 100 characters or less');
        }

        if (data.name && data.name.length < 2) {
            errors.push('Student name must be at least 2 characters long');
        }

        if (data.phone && typeof data.phone !== 'string') {
            errors.push('Phone number must be a string if provided');
        }

        if (data.phone && data.phone.length > 20) {
            errors.push('Phone number must be 20 characters or less');
        }

        if (data.progress && (isNaN(data.progress) || data.progress < 0 || data.progress > 100)) {
            errors.push('Progress must be a number between 0 and 100');
        }

        if (errors.length > 0) {
            throw new ValidationError('Student validation failed', errors);
        }
    }

    /**
     * Gets student initials from name
     * @returns {string} Student initials (up to 2 characters)
     */
    getInitials() {
        return this.name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    /**
     * Gets formatted display name
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return this.name
            .split(' ')
            .map(word => Utils.capitalize(word))
            .join(' ');
    }

    /**
     * Updates student data
     * @param {Object} updates - Object containing fields to update
     * @returns {Student} Updated student instance
     */
    update(updates) {
        const allowedUpdates = ['name', 'email', 'phone'];
        const filteredUpdates = {};

        // Filter and validate updates
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        // Create new data object for validation
        const newData = { ...this.toJSON(), ...filteredUpdates };
        
        // Validate the updates
        this.validate(newData);

        // Apply updates
        Object.keys(filteredUpdates).forEach(key => {
            if (key === 'email') {
                this[key] = filteredUpdates[key].toLowerCase().trim();
            } else {
                this[key] = filteredUpdates[key].trim();
            }
        });

        this.updatedAt = new Date();
        this.initials = this.getInitials();
        this.displayName = this.getDisplayName();

        return this;
    }

    /**
     * Enrolls student in a course
     * @param {string} courseId - Course ID to enroll in
     * @returns {Student} Updated student instance
     */
    enrollInCourse(courseId) {
        if (!courseId || typeof courseId !== 'string') {
            throw new Error('Valid course ID is required for enrollment');
        }

        this.courseId = courseId;
        this.enrollmentDate = new Date();
        this.progress = 0;
        this.completedLessons = [];
        this.updatedAt = new Date();

        return this;
    }

    /**
     * Unenrolls student from current course
     * @returns {Student} Updated student instance
     */
    unenrollFromCourse() {
        this.courseId = null;
        this.progress = 0;
        this.completedLessons = [];
        this.updatedAt = new Date();

        return this;
    }

    /**
     * Updates student progress
     * @param {number} progress - Progress percentage (0-100)
     * @returns {Student} Updated student instance
     */
    updateProgress(progress) {
        if (isNaN(progress) || progress < 0 || progress > 100) {
            throw new Error('Progress must be a number between 0 and 100');
        }

        this.progress = Math.round(progress * 100) / 100; // Round to 2 decimal places
        this.updatedAt = new Date();

        return this;
    }

    /**
     * Adds a completed lesson
     * @param {string} lessonId - Lesson ID
     * @returns {Student} Updated student instance
     */
    completeLesson(lessonId) {
        if (!lessonId || typeof lessonId !== 'string') {
            throw new Error('Valid lesson ID is required');
        }

        if (!this.completedLessons.includes(lessonId)) {
            this.completedLessons.push(lessonId);
            this.updatedAt = new Date();
        }

        return this;
    }

    /**
     * Removes a completed lesson
     * @param {string} lessonId - Lesson ID
     * @returns {Student} Updated student instance
     */
    uncompleteLesson(lessonId) {
        const index = this.completedLessons.indexOf(lessonId);
        if (index > -1) {
            this.completedLessons.splice(index, 1);
            this.updatedAt = new Date();
        }

        return this;
    }

    /**
     * Records student login
     * @returns {Student} Updated student instance
     */
    recordLogin() {
        this.lastLoginAt = new Date();
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Toggles student active status
     * @returns {Student} Updated student instance
     */
    toggleActive() {
        this.isActive = !this.isActive;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Checks if student is enrolled in any course
     * @returns {boolean} True if enrolled
     */
    isEnrolled() {
        return this.courseId !== null;
    }

    /**
     * Checks if student has completed their course
     * @returns {boolean} True if progress is 100%
     */
    hasCompletedCourse() {
        return this.progress >= 100;
    }

    /**
     * Gets enrollment duration in days
     * @returns {number} Days since enrollment
     */
    getEnrollmentDuration() {
        if (!this.enrollmentDate) return 0;
        
        const now = new Date();
        const enrollment = new Date(this.enrollmentDate);
        const diffTime = Math.abs(now - enrollment);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    /**
     * Gets formatted enrollment date
     * @returns {string} Formatted enrollment date
     */
    getFormattedEnrollmentDate() {
        return Utils.formatDate(this.enrollmentDate);
    }

    /**
     * Gets formatted last login date
     * @returns {string} Formatted last login date or 'Never'
     */
    getFormattedLastLogin() {
        return this.lastLoginAt ? Utils.formatDate(this.lastLoginAt) : 'Never';
    }

    /**
     * Gets student status based on activity and progress
     * @returns {string} Status string
     */
    getStatus() {
        if (!this.isActive) return 'Inactive';
        if (!this.isEnrolled()) return 'Not Enrolled';
        if (this.hasCompletedCourse()) return 'Completed';
        if (this.progress > 0) return 'In Progress';
        return 'Enrolled';
    }

    /**
     * Gets status badge CSS class
     * @returns {string} CSS class for status badge
     */
    getStatusBadgeClass() {
        const status = this.getStatus();
        const classes = {
            'Completed': 'badge-success',
            'In Progress': 'badge-info',
            'Enrolled': 'badge-warning',
            'Not Enrolled': 'badge-secondary',
            'Inactive': 'badge-danger'
        };
        return classes[status] || 'badge-secondary';
    }

    /**
     * Gets student summary for display
     * @returns {Object} Student summary object
     */
    getSummary() {
        return {
            id: this.id,
            name: this.displayName,
            email: this.email,
            phone: this.phone,
            initials: this.initials,
            status: this.getStatus(),
            progress: `${this.progress}%`,
            enrollmentDate: this.getFormattedEnrollmentDate(),
            lastLogin: this.getFormattedLastLogin(),
            enrollmentDuration: `${this.getEnrollmentDuration()} days`,
            completedLessons: this.completedLessons.length,
            isActive: this.isActive,
            isEnrolled: this.isEnrolled(),
            hasCompleted: this.hasCompletedCourse()
        };
    }

    /**
     * Converts student to JSON object
     * @returns {Object} Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            courseId: this.courseId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            isActive: this.isActive,
            progress: this.progress,
            completedLessons: this.completedLessons,
            lastLoginAt: this.lastLoginAt,
            enrollmentDate: this.enrollmentDate,
            initials: this.initials,
            displayName: this.displayName
        };
    }

    /**
     * Creates a Student instance from JSON data
     * @param {Object} json - JSON data
     * @returns {Student} New Student instance
     */
    static fromJSON(json) {
        return new Student({
            ...json,
            createdAt: new Date(json.createdAt),
            updatedAt: new Date(json.updatedAt),
            lastLoginAt: json.lastLoginAt ? new Date(json.lastLoginAt) : null,
            enrollmentDate: json.enrollmentDate ? new Date(json.enrollmentDate) : null
        });
    }

    /**
     * Compares two students for sorting
     * @param {Student} a - First student
     * @param {Student} b - Second student
     * @param {string} sortBy - Field to sort by
     * @param {string} order - Sort order ('asc' or 'desc')
     * @returns {number} Comparison result
     */
    static compare(a, b, sortBy = 'name', order = 'asc') {
        let comparison = 0;

        switch (sortBy) {
            case 'name':
            case 'email':
                comparison = a[sortBy].localeCompare(b[sortBy]);
                break;
            case 'progress':
                comparison = a[sortBy] - b[sortBy];
                break;
            case 'createdAt':
            case 'updatedAt':
            case 'lastLoginAt':
            case 'enrollmentDate':
                const aDate = a[sortBy] ? a[sortBy].getTime() : 0;
                const bDate = b[sortBy] ? b[sortBy].getTime() : 0;
                comparison = aDate - bDate;
                break;
            default:
                comparison = 0;
        }

        return order === 'desc' ? -comparison : comparison;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Student };
}