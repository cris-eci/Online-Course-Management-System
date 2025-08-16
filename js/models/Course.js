/**
 * Course Model Class
 * Represents a course entity with validation and business logic
 */

class Course {
    /**
     * Creates a new Course instance
     * @param {Object} data - Course data object
     * @param {string} data.title - Course title
     * @param {string} data.description - Course description
     * @param {number} data.duration - Course duration in hours
     * @param {string} data.instructor - Instructor name
     * @param {string} data.difficulty - Course difficulty level
     * @param {string} [data.id] - Course ID (auto-generated if not provided)
     */
    constructor(data) {
        // Validate required fields
        this.validate(data);

        // Initialize properties
        this.id = data.id || Utils.generateId();
        this.title = data.title.trim();
        this.description = data.description.trim();
        this.duration = parseInt(data.duration);
        this.instructor = data.instructor.trim();
        this.difficulty = data.difficulty.toLowerCase();
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.progress = data.progress || 0;
        this.enrollmentCount = data.enrollmentCount || 0;
        
        // Additional computed properties
        this.slug = Utils.slugify(this.title);
        this.estimatedCompletionTime = this.calculateEstimatedTime();
    }

    /**
     * Validates course data
     * @param {Object} data - Data to validate
     * @throws {Error} If validation fails
     */
    validate(data) {
        const errors = [];

        if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
            errors.push('Course title is required and must be a non-empty string');
        }

        if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
            errors.push('Course description is required and must be a non-empty string');
        }

        if (!data.duration || isNaN(data.duration) || data.duration <= 0) {
            errors.push('Course duration must be a positive number');
        }

        if (!data.instructor || typeof data.instructor !== 'string' || data.instructor.trim().length === 0) {
            errors.push('Instructor name is required and must be a non-empty string');
        }

        if (!data.difficulty || !this.isValidDifficulty(data.difficulty)) {
            errors.push('Course difficulty must be one of: beginner, intermediate, advanced');
        }

        if (data.title && data.title.length > 100) {
            errors.push('Course title must be 100 characters or less');
        }

        if (data.description && data.description.length > 500) {
            errors.push('Course description must be 500 characters or less');
        }

        if (data.duration && data.duration > 1000) {
            errors.push('Course duration cannot exceed 1000 hours');
        }

        if (errors.length > 0) {
            throw new ValidationError('Course validation failed', errors);
        }
    }

    /**
     * Checks if difficulty level is valid
     * @param {string} difficulty - Difficulty to validate
     * @returns {boolean} True if valid
     */
    isValidDifficulty(difficulty) {
        const validDifficulties = ['beginner', 'intermediate', 'advanced'];
        return validDifficulties.includes(difficulty.toLowerCase());
    }

    /**
     * Calculates estimated completion time based on difficulty
     * @returns {number} Estimated completion time in hours
     */
    calculateEstimatedTime() {
        const multipliers = {
            beginner: 1.0,
            intermediate: 1.3,
            advanced: 1.6
        };

        return Math.round(this.duration * (multipliers[this.difficulty] || 1.0));
    }

    /**
     * Updates course data
     * @param {Object} updates - Object containing fields to update
     * @returns {Course} Updated course instance
     */
    update(updates) {
        const allowedUpdates = ['title', 'description', 'duration', 'instructor', 'difficulty'];
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
            this[key] = filteredUpdates[key];
        });

        this.updatedAt = new Date();
        this.slug = Utils.slugify(this.title);
        this.estimatedCompletionTime = this.calculateEstimatedTime();

        return this;
    }

    /**
     * Updates course progress
     * @param {number} progress - Progress percentage (0-100)
     * @returns {Course} Updated course instance
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
     * Increments enrollment count
     * @returns {Course} Updated course instance
     */
    addEnrollment() {
        this.enrollmentCount++;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Decrements enrollment count
     * @returns {Course} Updated course instance
     */
    removeEnrollment() {
        if (this.enrollmentCount > 0) {
            this.enrollmentCount--;
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Toggles course active status
     * @returns {Course} Updated course instance
     */
    toggleActive() {
        this.isActive = !this.isActive;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Gets course difficulty badge color
     * @returns {string} CSS class for difficulty badge
     */
    getDifficultyBadgeClass() {
        const classes = {
            beginner: 'badge-success',
            intermediate: 'badge-warning',
            advanced: 'badge-danger'
        };
        return classes[this.difficulty] || 'badge-secondary';
    }

    /**
     * Checks if course is completed
     * @returns {boolean} True if progress is 100%
     */
    isCompleted() {
        return this.progress >= 100;
    }

    /**
     * Gets formatted duration string
     * @returns {string} Formatted duration
     */
    getFormattedDuration() {
        if (this.duration === 1) {
            return '1 hour';
        }
        return `${this.duration} hours`;
    }

    /**
     * Gets formatted creation date
     * @returns {string} Formatted creation date
     */
    getFormattedCreatedDate() {
        return Utils.formatDate(this.createdAt);
    }

    /**
     * Gets course summary for display
     * @returns {Object} Course summary object
     */
    getSummary() {
        return {
            id: this.id,
            title: this.title,
            instructor: this.instructor,
            duration: this.getFormattedDuration(),
            difficulty: Utils.capitalize(this.difficulty),
            progress: `${this.progress}%`,
            enrollments: this.enrollmentCount,
            isActive: this.isActive,
            isCompleted: this.isCompleted()
        };
    }

    /**
     * Converts course to JSON object
     * @returns {Object} Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            duration: this.duration,
            instructor: this.instructor,
            difficulty: this.difficulty,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            isActive: this.isActive,
            progress: this.progress,
            enrollmentCount: this.enrollmentCount,
            slug: this.slug,
            estimatedCompletionTime: this.estimatedCompletionTime
        };
    }

    /**
     * Creates a Course instance from JSON data
     * @param {Object} json - JSON data
     * @returns {Course} New Course instance
     */
    static fromJSON(json) {
        return new Course({
            ...json,
            createdAt: new Date(json.createdAt),
            updatedAt: new Date(json.updatedAt)
        });
    }

    /**
     * Compares two courses for sorting
     * @param {Course} a - First course
     * @param {Course} b - Second course
     * @param {string} sortBy - Field to sort by
     * @param {string} order - Sort order ('asc' or 'desc')
     * @returns {number} Comparison result
     */
    static compare(a, b, sortBy = 'title', order = 'asc') {
        let comparison = 0;

        switch (sortBy) {
            case 'title':
            case 'instructor':
                comparison = a[sortBy].localeCompare(b[sortBy]);
                break;
            case 'duration':
            case 'progress':
            case 'enrollmentCount':
                comparison = a[sortBy] - b[sortBy];
                break;
            case 'createdAt':
            case 'updatedAt':
                comparison = a[sortBy].getTime() - b[sortBy].getTime();
                break;
            case 'difficulty':
                const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
                comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                break;
            default:
                comparison = 0;
        }

        return order === 'desc' ? -comparison : comparison;
    }
}

/**
 * Custom validation error class
 */
class ValidationError extends Error {
    constructor(message, errors = []) {
        super(message);
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Course, ValidationError };
}