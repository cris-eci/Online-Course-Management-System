/**
 * Course Manager Class
 * Implements Facade Pattern and Observer Pattern for course management
 * Handles business logic for course operations
 */

class CourseManager {
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
     * Gets all courses with optional caching
     * @param {Object} options - Query options
     * @param {boolean} useCache - Whether to use cache
     * @returns {Promise<Course[]>} Array of courses
     */
    async getCourses(options = {}, useCache = true) {
        const cacheKey = `courses_${JSON.stringify(options)}`;
        
        if (useCache && this.cache.has(cacheKey)) {
            const cachedData = this.cache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < this.cacheTimeout) {
                return cachedData.data;
            }
        }

        try {
            this.notifyObservers('coursesLoading', true);
            const courses = await this.dataService.getCourses(options);
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: courses,
                timestamp: Date.now()
            });

            this.notifyObservers('coursesLoaded', courses);
            return courses;
        } catch (error) {
            this.notifyObservers('coursesError', error);
            throw error;
        }
    }

    /**
     * Gets a course by ID
     * @param {string} id - Course ID
     * @returns {Promise<Course|null>} Course instance or null
     */
    async getCourseById(id) {
        try {
            return await this.dataService.getCourseById(id);
        } catch (error) {
            this.notifyObservers('courseError', error);
            throw error;
        }
    }

    /**
     * Creates a new course with validation
     * @param {Object} courseData - Course data
     * @returns {Promise<Course>} Created course
     */
    async createCourse(courseData) {
        try {
            // Sanitize input
            const sanitizedData = this.validationService.sanitizeInput(courseData);
            
            // Validate course data
            const validation = this.validationService.validateCourse(sanitizedData);
            if (!validation.isValid) {
                const error = new ValidationError('Course validation failed', Object.values(validation.errors));
                this.notifyObservers('courseValidationError', validation.errors);
                throw error;
            }

            this.notifyObservers('courseCreating', sanitizedData);
            
            const course = await this.dataService.createCourse(sanitizedData);
            
            // Clear cache
            this.clearCache();
            
            this.notifyObservers('courseCreated', course);
            return course;
        } catch (error) {
            this.notifyObservers('courseError', error);
            throw error;
        }
    }

    /**
     * Updates an existing course
     * @param {string} id - Course ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Course>} Updated course
     */
    async updateCourse(id, updates) {
        try {
            // Sanitize input
            const sanitizedUpdates = this.validationService.sanitizeInput(updates);
            
            // Get current course data for validation
            const currentCourse = await this.dataService.getCourseById(id);
            if (!currentCourse) {
                throw new Error('Course not found');
            }

            // Merge current data with updates for validation
            const mergedData = { ...currentCourse.toJSON(), ...sanitizedUpdates };
            
            // Validate merged data
            const validation = this.validationService.validateCourse(mergedData);
            if (!validation.isValid) {
                const error = new ValidationError('Course validation failed', Object.values(validation.errors));
                this.notifyObservers('courseValidationError', validation.errors);
                throw error;
            }

            this.notifyObservers('courseUpdating', { id, updates: sanitizedUpdates });
            
            const updatedCourse = await this.dataService.updateCourse(id, sanitizedUpdates);
            
            // Clear cache
            this.clearCache();
            
            this.notifyObservers('courseUpdated', updatedCourse);
            return updatedCourse;
        } catch (error) {
            this.notifyObservers('courseError', error);
            throw error;
        }
    }

    /**
     * Deletes a course with safety checks
     * @param {string} id - Course ID
     * @returns {Promise<boolean>} True if deleted
     */
    async deleteCourse(id) {
        try {
            this.notifyObservers('courseDeleting', id);
            
            const result = await this.dataService.deleteCourse(id);
            
            // Clear cache
            this.clearCache();
            
            this.notifyObservers('courseDeleted', id);
            return result;
        } catch (error) {
            this.notifyObservers('courseError', error);
            throw error;
        }
    }

    /**
     * Updates course progress
     * @param {string} id - Course ID
     * @param {number} progress - Progress percentage
     * @returns {Promise<Course>} Updated course
     */
    async updateCourseProgress(id, progress) {
        try {
            // Validate progress
            const validation = this.validationService.validateField('progress', progress);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            const course = await this.dataService.getCourseById(id);
            if (!course) {
                throw new Error('Course not found');
            }

            course.updateProgress(progress);
            await this.dataService.updateCourse(id, { progress: course.progress });
            
            // Clear cache
            this.clearCache();
            
            this.notifyObservers('courseProgressUpdated', course);
            return course;
        } catch (error) {
            this.notifyObservers('courseError', error);
            throw error;
        }
    }

    /**
     * Simulates random progress for all courses
     * @returns {Promise<Course[]>} Updated courses
     */
    async simulateProgress() {
        try {
            this.notifyObservers('progressSimulating', true);
            
            const courses = await this.getCourses({}, false); // Don't use cache
            const updatedCourses = [];

            for (const course of courses) {
                const randomIncrease = Utils.randomBetween(5, 25);
                const newProgress = Math.min(100, course.progress + randomIncrease);
                
                await this.updateCourseProgress(course.id, newProgress);
                course.updateProgress(newProgress);
                updatedCourses.push(course);
            }

            this.notifyObservers('progressSimulated', updatedCourses);
            return updatedCourses;
        } catch (error) {
            this.notifyObservers('courseError', error);
            throw error;
        }
    }

    /**
     * Searches courses by title or instructor
     * @param {string} query - Search query
     * @returns {Promise<Course[]>} Matching courses
     */
    async searchCourses(query) {
        try {
            if (!query || query.trim() === '') {
                return await this.getCourses();
            }

            const searchTerm = query.toLowerCase().trim();
            const courses = await this.getCourses({}, false);
            
            const filtered = courses.filter(course => 
                course.title.toLowerCase().includes(searchTerm) ||
                course.instructor.toLowerCase().includes(searchTerm) ||
                course.description.toLowerCase().includes(searchTerm)
            );

            this.notifyObservers('coursesSearched', { query, results: filtered });
            return filtered;
        } catch (error) {
            this.notifyObservers('courseError', error);
            throw error;
        }
    }

    /**
     * Gets courses grouped by difficulty
     * @returns {Promise<Object>} Courses grouped by difficulty
     */
    async getCoursesByDifficulty() {
        try {
            const courses = await this.getCourses();
            const grouped = {
                beginner: [],
                intermediate: [],
                advanced: []
            };

            courses.forEach(course => {
                if (grouped[course.difficulty]) {
                    grouped[course.difficulty].push(course);
                }
            });

            return grouped;
        } catch (error) {
            this.notifyObservers('courseError', error);
            throw error;
        }
    }

    /**
     * Gets course statistics
     * @returns {Promise<Object>} Course statistics
     */
    async getCourseStatistics() {
        try {
            const courses = await this.getCourses();
            
            const stats = {
                total: courses.length,
                byDifficulty: {
                    beginner: courses.filter(c => c.difficulty === 'beginner').length,
                    intermediate: courses.filter(c => c.difficulty === 'intermediate').length,
                    advanced: courses.filter(c => c.difficulty === 'advanced').length
                },
                averageProgress: courses.length > 0 
                    ? courses.reduce((sum, course) => sum + course.progress, 0) / courses.length 
                    : 0,
                completedCourses: courses.filter(c => c.isCompleted()).length,
                totalDuration: courses.reduce((sum, course) => sum + course.duration, 0),
                averageDuration: courses.length > 0 
                    ? courses.reduce((sum, course) => sum + course.duration, 0) / courses.length 
                    : 0,
                totalEnrollments: courses.reduce((sum, course) => sum + course.enrollmentCount, 0)
            };

            stats.completionRate = stats.total > 0 ? (stats.completedCourses / stats.total) * 100 : 0;

            return stats;
        } catch (error) {
            this.notifyObservers('courseError', error);
            throw error;
        }
    }

    /**
     * Exports course data
     * @param {string} format - Export format ('json', 'csv')
     * @returns {Promise<string>} Exported data
     */
    async exportCourses(format = 'json') {
        try {
            const courses = await this.getCourses();
            
            if (format === 'json') {
                return JSON.stringify(courses.map(course => course.toJSON()), null, 2);
            } else if (format === 'csv') {
                return this.convertCoursesToCSV(courses);
            } else {
                throw new Error('Unsupported export format');
            }
        } catch (error) {
            this.notifyObservers('courseError', error);
            throw error;
        }
    }

    /**
     * Converts courses to CSV format
     * @param {Course[]} courses - Courses to convert
     * @returns {string} CSV string
     * @private
     */
    convertCoursesToCSV(courses) {
        const headers = ['ID', 'Title', 'Description', 'Duration', 'Instructor', 'Difficulty', 'Progress', 'Enrollments', 'Created'];
        const rows = courses.map(course => [
            course.id,
            `"${course.title}"`,
            `"${course.description.substring(0, 50)}..."`,
            course.duration,
            `"${course.instructor}"`,
            course.difficulty,
            course.progress,
            course.enrollmentCount,
            course.getFormattedCreatedDate()
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
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
    module.exports = { CourseManager };
}