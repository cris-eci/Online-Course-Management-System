/**
 * UI Manager Class
 * Implements Observer Pattern and uses jQuery for DOM manipulation
 * Handles all user interface updates and interactions
 */

class UIManager {
    constructor() {
        this.courseManager = null;
        this.studentManager = null;
        this.validationService = null;
        this.activeTab = 'courses';
        this.loading = false;
        this.notifications = [];
        
        // Initialize jQuery elements cache
        this.$elements = {};
    }

    /**
     * Initializes the UI Manager with dependencies
     * @param {CourseManager} courseManager - Course manager instance
     * @param {StudentManager} studentManager - Student manager instance
     * @param {ValidationService} validationService - Validation service instance
     */
    initialize(courseManager, studentManager, validationService) {
        this.courseManager = courseManager;
        this.studentManager = studentManager;
        this.validationService = validationService;
        
        this.cacheElements();
        this.setupEventListeners();
        this.setupFormValidation();
        
        // Register as observer for both managers
        this.courseManager.addObserver(this);
        this.studentManager.addObserver(this);
    }

    /**
     * Caches frequently used jQuery elements
     * @private
     */
    cacheElements() {
        this.$elements = {
            // Navigation
            navTabs: $('.nav-tab'),
            tabContents: $('.tab-content'),
            
            // Forms
            courseForm: $('#course-form'),
            studentForm: $('#student-form'),
            
            // Lists and containers
            coursesList: $('#courses-list'),
            studentsList: $('#students-list'),
            progressList: $('#progress-list'),
            
            // Statistics
            totalCourses: $('#total-courses'),
            totalStudents: $('#total-students'),
            averageProgress: $('#average-progress'),
            completionRate: $('#completion-rate'),
            
            // Course form fields
            courseTitle: $('#course-title'),
            courseDescription: $('#course-description'),
            courseDuration: $('#course-duration'),
            courseInstructor: $('#course-instructor'),
            courseDifficulty: $('#course-difficulty'),
            
            // Student form fields
            studentName: $('#student-name'),
            studentEmail: $('#student-email'),
            studentPhone: $('#student-phone'),
            studentCourse: $('#student-course'),
            
            // Loading and messages
            loadingCourses: $('#loading-courses'),
            messageContainer: $('#message-container'),
            
            // Buttons
            simulateProgress: $('#simulate-progress'),
            exportData: $('#export-data'),
            runTests: $('#run-tests'),
            runUnitTests: $('#run-unit-tests'),
            runIntegrationTests: $('#run-integration-tests'),
            
            // Test results
            testResults: $('#test-results'),
            testSummary: $('#test-summary'),
            testItems: $('#test-items')
        };
    }

    /**
     * Sets up event listeners using jQuery
     * @private
     */
    setupEventListeners() {
        // Tab navigation
        this.$elements.navTabs.on('click', (e) => {
            const $tab = $(e.currentTarget);
            const targetTab = $tab.data('tab');
            this.switchTab(targetTab);
        });

        // Course form submission
        this.$elements.courseForm.on('submit', async (e) => {
            e.preventDefault();
            await this.handleCourseSubmission();
        });

        // Student form submission
        this.$elements.studentForm.on('submit', async (e) => {
            e.preventDefault();
            await this.handleStudentSubmission();
        });

        // Progress simulation
        this.$elements.simulateProgress.on('click', async () => {
            await this.handleProgressSimulation();
        });

        // Data export
        this.$elements.exportData.on('click', async () => {
            await this.handleDataExport();
        });

        // Test runners
        this.$elements.runTests.on('click', async () => {
            await this.handleTestExecution('all');
        });

        this.$elements.runUnitTests.on('click', async () => {
            await this.handleTestExecution('unit');
        });

        this.$elements.runIntegrationTests.on('click', async () => {
            await this.handleTestExecution('integration');
        });

        // Card hover effects
        $(document).on('mouseenter', '.course-card, .student-card, .progress-card', function() {
            $(this).addClass('card-hover-effect');
        }).on('mouseleave', '.course-card, .student-card, .progress-card', function() {
            $(this).removeClass('card-hover-effect');
        });

        // Delete button handlers
        $(document).on('click', '.delete-course-btn', async (e) => {
            const courseId = $(e.currentTarget).data('course-id');
            await this.handleCourseDelete(courseId);
        });

        $(document).on('click', '.delete-student-btn', async (e) => {
            const studentId = $(e.currentTarget).data('student-id');
            await this.handleStudentDelete(studentId);
        });
    }

    /**
     * Sets up real-time form validation
     * @private
     */
    setupFormValidation() {
        // Course form validation rules
        const courseValidationRules = {
            'course-title': [
                { type: 'required', options: { fieldName: 'Course title' } },
                { type: 'length', options: { min: 3, max: 100, fieldName: 'Course title' } }
            ],
            'course-description': [
                { type: 'required', options: { fieldName: 'Description' } },
                { type: 'length', options: { min: 10, max: 500, fieldName: 'Description' } }
            ],
            'course-duration': [
                { type: 'number', options: { min: 1, max: 1000, fieldName: 'Duration' } }
            ],
            'course-instructor': [
                { type: 'name' }
            ],
            'course-difficulty': [
                { type: 'difficulty' }
            ]
        };

        // Student form validation rules
        const studentValidationRules = {
            'student-name': [
                { type: 'name' }
            ],
            'student-email': [
                { type: 'email' }
            ],
            'student-phone': [
                { type: 'phone' }
            ]
        };

        // Setup real-time validation
        this.validationService.setupRealTimeValidation(
            this.$elements.courseForm[0], 
            courseValidationRules
        );
        
        this.validationService.setupRealTimeValidation(
            this.$elements.studentForm[0], 
            studentValidationRules
        );
    }

    /**
     * Switches between tabs with animation
     * @param {string} tabName - Tab to switch to
     */
    switchTab(tabName) {
        if (this.activeTab === tabName) return;

        // Update active tab
        this.$elements.navTabs.removeClass('active');
        $(`.nav-tab[data-tab="${tabName}"]`).addClass('active');

        // Hide current tab content with fade out
        const $currentTab = this.$elements.tabContents.filter('.active');
        $currentTab.fadeOut(200, () => {
            $currentTab.removeClass('active');
            
            // Show new tab content with fade in
            const $newTab = $(`#${tabName}`);
            $newTab.addClass('active').fadeIn(300);
        });

        this.activeTab = tabName;

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    /**
     * Loads data for the active tab
     * @param {string} tabName - Tab name
     * @private
     */
    async loadTabData(tabName) {
        try {
            switch (tabName) {
                case 'courses':
                    await this.loadCourses();
                    break;
                case 'students':
                    await this.loadStudents();
                    await this.updateCourseOptions();
                    break;
                case 'progress':
                    await this.loadProgress();
                    await this.updateStatistics();
                    break;
                case 'analytics':
                    await this.loadAnalytics();
                    break;
                default:
                    break;
            }
        } catch (error) {
            this.showMessage('Error loading tab data: ' + error.message, 'error');
        }
    }

    /**
     * Handles course form submission
     * @private
     */
    async handleCourseSubmission() {
        try {
            const formData = {
                title: this.$elements.courseTitle.val().trim(),
                description: this.$elements.courseDescription.val().trim(),
                duration: parseInt(this.$elements.courseDuration.val()),
                instructor: this.$elements.courseInstructor.val().trim(),
                difficulty: this.$elements.courseDifficulty.val()
            };

            await this.courseManager.createCourse(formData);
            this.$elements.courseForm[0].reset();
        } catch (error) {
            this.showMessage('Error creating course: ' + error.message, 'error');
        }
    }

    /**
     * Handles student form submission
     * @private
     */
    async handleStudentSubmission() {
        try {
            const formData = {
                name: this.$elements.studentName.val().trim(),
                email: this.$elements.studentEmail.val().trim(),
                phone: this.$elements.studentPhone.val().trim() || null,
                courseId: this.$elements.studentCourse.val()
            };

            await this.studentManager.createStudent(formData);
            this.$elements.studentForm[0].reset();
        } catch (error) {
            this.showMessage('Error registering student: ' + error.message, 'error');
        }
    }

    /**
     * Handles course deletion
     * @param {string} courseId - Course ID to delete
     * @private
     */
    async handleCourseDelete(courseId) {
        const confirmed = await this.showConfirmDialog(
            'Delete Course', 
            'Are you sure you want to delete this course? This action cannot be undone.'
        );

        if (confirmed) {
            try {
                await this.courseManager.deleteCourse(courseId);
            } catch (error) {
                this.showMessage('Error deleting course: ' + error.message, 'error');
            }
        }
    }

    /**
     * Handles student deletion
     * @param {string} studentId - Student ID to delete
     * @private
     */
    async handleStudentDelete(studentId) {
        const confirmed = await this.showConfirmDialog(
            'Delete Student', 
            'Are you sure you want to delete this student? This action cannot be undone.'
        );

        if (confirmed) {
            try {
                await this.studentManager.deleteStudent(studentId);
            } catch (error) {
                this.showMessage('Error deleting student: ' + error.message, 'error');
            }
        }
    }

    /**
     * Handles progress simulation
     * @private
     */
    async handleProgressSimulation() {
        try {
            this.setLoadingState(true);
            await Promise.all([
                this.courseManager.simulateProgress(),
                this.studentManager.simulateProgress()
            ]);
        } catch (error) {
            this.showMessage('Error simulating progress: ' + error.message, 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Handles data export
     * @private
     */
    async handleDataExport() {
        try {
            const [coursesData, studentsData] = await Promise.all([
                this.courseManager.exportCourses('json'),
                this.studentManager.exportStudents('json')
            ]);

            const exportData = {
                courses: JSON.parse(coursesData),
                students: JSON.parse(studentsData),
                exportedAt: new Date(),
                version: '1.0.0'
            };

            this.downloadJSON(exportData, 'course_management_export.json');
            this.showMessage('Data exported successfully!', 'success');
        } catch (error) {
            this.showMessage('Error exporting data: ' + error.message, 'error');
        }
    }

    /**
     * Handles test execution
     * @param {string} testType - Type of tests to run
     * @private
     */
    async handleTestExecution(testType) {
        try {
            this.$elements.testResults.fadeIn();
            this.$elements.testSummary.html('<div class="loading">Running tests...</div>');
            
            // This will be implemented by the TestFramework
            if (window.TestFramework) {
                await window.TestFramework.runTests(testType);
            } else {
                this.showMessage('Test framework not available', 'warning');
            }
        } catch (error) {
            this.showMessage('Error running tests: ' + error.message, 'error');
        }
    }

    // Observer Pattern Methods

    /**
     * Called when courses are loaded
     * @param {Course[]} courses - Loaded courses
     */
    coursesLoaded(courses) {
        this.renderCourses(courses);
        this.hideLoading();
    }

    /**
     * Called when a course is created
     * @param {Course} course - Created course
     */
    courseCreated(course) {
        this.showMessage('Course created successfully!', 'success');
        this.loadCourses();
        this.updateCourseOptions();
        this.updateStatistics();
    }

    /**
     * Called when a course is updated
     * @param {Course} course - Updated course
     */
    courseUpdated(course) {
        this.showMessage('Course updated successfully!', 'success');
        this.loadCourses();
    }

    /**
     * Called when a course is deleted
     * @param {string} courseId - Deleted course ID
     */
    courseDeleted(courseId) {
        this.showMessage('Course deleted successfully!', 'success');
        this.loadCourses();
        this.updateCourseOptions();
        this.updateStatistics();
    }

    /**
     * Called when students are loaded
     * @param {Student[]} students - Loaded students
     */
    studentsLoaded(students) {
        this.renderStudents(students);
        this.hideLoading();
    }

    /**
     * Called when a student is created
     * @param {Student} student - Created student
     */
    studentCreated(student) {
        this.showMessage('Student registered successfully!', 'success');
        this.loadStudents();
        this.updateStatistics();
    }

    /**
     * Called when a student is updated
     * @param {Student} student - Updated student
     */
    studentUpdated(student) {
        this.showMessage('Student updated successfully!', 'success');
        this.loadStudents();
    }

    /**
     * Called when a student is deleted
     * @param {string} studentId - Deleted student ID
     */
    studentDeleted(studentId) {
        this.showMessage('Student deleted successfully!', 'success');
        this.loadStudents();
        this.updateStatistics();
    }

    /**
     * Called when progress is simulated
     * @param {Array} items - Updated items
     */
    progressSimulated(items) {
        this.showMessage('Progress simulated successfully!', 'success');
        this.loadProgress();
        this.updateStatistics();
    }

    /**
     * Called when there's a course error
     * @param {Error} error - Error object
     */
    courseError(error) {
        this.hideLoading();
        this.showMessage(`Course error: ${error.message}`, 'error');
    }

    /**
     * Called when there's a student error
     * @param {Error} error - Error object
     */
    studentError(error) {
        this.hideLoading();
        this.showMessage(`Student error: ${error.message}`, 'error');
    }

    /**
     * Called when there's a validation error
     * @param {Object} errors - Validation errors
     */
    courseValidationError(errors) {
        Object.keys(errors).forEach(field => {
            const fieldElement = this.$elements.courseForm.find(`#course-${field}`)[0];
            if (fieldElement) {
                this.validationService.addFieldError(fieldElement, errors[field]);
            }
        });
    }

    /**
     * Called when there's a student validation error
     * @param {Object} errors - Validation errors
     */
    studentValidationError(errors) {
        Object.keys(errors).forEach(field => {
            const fieldElement = this.$elements.studentForm.find(`#student-${field === 'courseId' ? 'course' : field}`)[0];
            if (fieldElement) {
                this.validationService.addFieldError(fieldElement, errors[field]);
            }
        });
    }

    // Rendering Methods

    /**
     * Renders courses list
     * @param {Course[]} courses - Courses to render
     * @private
     */
    renderCourses(courses) {
        if (!courses || courses.length === 0) {
            this.$elements.coursesList.html('<div class="empty-state">No courses found. Create your first course!</div>');
            return;
        }

        const coursesHtml = courses.map(course => `
            <div class="course-card" data-course-id="${course.id}">
                <div class="card-header">
                    <h3 class="card-title">${Utils.sanitizeHtml(course.title)}</h3>
                    <span class="card-badge ${course.getDifficultyBadgeClass()}">${course.getFormattedDuration()}</span>
                </div>
                <div class="card-content">
                    <p><strong>Instructor:</strong> ${Utils.sanitizeHtml(course.instructor)}</p>
                    <p><strong>Description:</strong> ${Utils.sanitizeHtml(course.description)}</p>
                    <p><strong>Difficulty:</strong> ${Utils.capitalize(course.difficulty)}</p>
                    <p><strong>Created:</strong> ${course.getFormattedCreatedDate()}</p>
                    <p><strong>Enrollments:</strong> ${course.enrollmentCount}</p>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${course.progress}%"></div>
                </div>
                <p class="progress-text">Progress: ${course.progress.toFixed(1)}%</p>
                <div class="card-actions">
                    <button class="btn-danger delete-course-btn" data-course-id="${course.id}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');

        this.$elements.coursesList.html(coursesHtml);
    }

    /**
     * Renders students list
     * @param {Student[]} students - Students to render
     * @private
     */
    async renderStudents(students) {
        if (!students || students.length === 0) {
            this.$elements.studentsList.html('<div class="empty-state">No students found. Register your first student!</div>');
            return;
        }

        // Get courses for display
        const courses = await this.courseManager.getCourses();
        const coursesMap = new Map(courses.map(c => [c.id, c]));

        const studentsHtml = students.map(student => {
            const course = coursesMap.get(student.courseId);
            return `
                <div class="student-card" data-student-id="${student.id}">
                    <div class="card-header">
                        <h3 class="card-title">${Utils.sanitizeHtml(student.displayName)}</h3>
                        <span class="card-badge ${student.getStatusBadgeClass()}">${student.getStatus()}</span>
                    </div>
                    <div class="card-content">
                        <p><strong>Email:</strong> ${student.email}</p>
                        ${student.phone ? `<p><strong>Phone:</strong> ${student.phone}</p>` : ''}
                        <p><strong>Course:</strong> ${course ? Utils.sanitizeHtml(course.title) : 'Not enrolled'}</p>
                        <p><strong>Enrolled:</strong> ${student.getFormattedEnrollmentDate()}</p>
                        <p><strong>Last Login:</strong> ${student.getFormattedLastLogin()}</p>
                    </div>
                    ${student.isEnrolled() ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${student.progress}%"></div>
                        </div>
                        <p class="progress-text">Progress: ${student.progress.toFixed(1)}%</p>
                    ` : ''}
                    <div class="card-actions">
                        <button class="btn-danger delete-student-btn" data-student-id="${student.id}">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.$elements.studentsList.html(studentsHtml);
    }

    /**
     * Renders progress tracking
     * @private
     */
    async renderProgress() {
        try {
            const [students, courses] = await Promise.all([
                this.studentManager.getStudents(),
                this.courseManager.getCourses()
            ]);

            const enrolledStudents = students.filter(s => s.isEnrolled());
            const coursesMap = new Map(courses.map(c => [c.id, c]));

            if (enrolledStudents.length === 0) {
                this.$elements.progressList.html('<div class="empty-state">No enrolled students to track.</div>');
                return;
            }

            const progressHtml = enrolledStudents.map(student => {
                const course = coursesMap.get(student.courseId);
                return `
                    <div class="progress-card">
                        <h4>${Utils.sanitizeHtml(student.displayName)}</h4>
                        <p>Course: ${course ? Utils.sanitizeHtml(course.title) : 'Unknown'}</p>
                        <p>Status: ${student.getStatus()}</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${student.progress}%"></div>
                        </div>
                        <p>Progress: ${student.progress.toFixed(1)}%</p>
                        <p>Duration: ${student.getEnrollmentDuration()} days</p>
                    </div>
                `;
            }).join('');

            this.$elements.progressList.html(progressHtml);
        } catch (error) {
            this.showMessage('Error loading progress: ' + error.message, 'error');
        }
    }

    /**
     * Updates course options in student form
     * @private
     */
    async updateCourseOptions() {
        try {
            const courses = await this.courseManager.getCourses();
            
            const optionsHtml = '<option value="">Select course...</option>' +
                courses.map(course => 
                    `<option value="${course.id}">${Utils.sanitizeHtml(course.title)}</option>`
                ).join('');

            this.$elements.studentCourse.html(optionsHtml);
        } catch (error) {
            console.error('Error updating course options:', error);
        }
    }

    /**
     * Updates statistics display
     * @private
     */
    async updateStatistics() {
        try {
            const [courseStats, studentStats] = await Promise.all([
                this.courseManager.getCourseStatistics(),
                this.studentManager.getStudentStatistics()
            ]);

            this.$elements.totalCourses.text(courseStats.total);
            this.$elements.totalStudents.text(studentStats.total);
            this.$elements.averageProgress.text(`${studentStats.averageProgress.toFixed(1)}%`);
            this.$elements.completionRate.text(`${studentStats.completionRate.toFixed(1)}%`);

            // Animate the numbers
            this.animateNumbers();
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    /**
     * Loads courses data
     * @private
     */
    async loadCourses() {
        try {
            this.showLoading();
            const courses = await this.courseManager.getCourses();
            this.renderCourses(courses);
        } catch (error) {
            this.showMessage('Error loading courses: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Loads students data
     * @private
     */
    async loadStudents() {
        try {
            this.showLoading();
            const students = await this.studentManager.getStudents();
            await this.renderStudents(students);
        } catch (error) {
            this.showMessage('Error loading students: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Loads progress data
     * @private
     */
    async loadProgress() {
        try {
            await this.renderProgress();
        } catch (error) {
            this.showMessage('Error loading progress: ' + error.message, 'error');
        }
    }

    /**
     * Loads analytics data
     * @private
     */
    async loadAnalytics() {
        try {
            // This would integrate with a charting library
            // For now, just show placeholder
            $('#enrollment-chart').html('<div class="chart-placeholder">Enrollment chart would be rendered here</div>');
            $('#progress-chart').html('<div class="chart-placeholder">Progress chart would be rendered here</div>');
        } catch (error) {
            this.showMessage('Error loading analytics: ' + error.message, 'error');
        }
    }

    // Utility Methods

    /**
     * Shows loading state
     * @private
     */
    showLoading() {
        this.loading = true;
        this.$elements.loadingCourses.show();
    }

    /**
     * Hides loading state
     * @private
     */
    hideLoading() {
        this.loading = false;
        this.$elements.loadingCourses.hide();
    }

    /**
     * Sets loading state for specific operations
     * @param {boolean} isLoading - Loading state
     * @private
     */
    setLoadingState(isLoading) {
        this.loading = isLoading;
        if (isLoading) {
            $('button').prop('disabled', true).addClass('loading');
        } else {
            $('button').prop('disabled', false).removeClass('loading');
        }
    }

    /**
     * Shows a notification message
     * @param {string} message - Message to show
     * @param {string} type - Message type (success, error, warning, info)
     */
    showMessage(message, type = 'info') {
        const messageId = Utils.generateId();
        const $message = $(`
            <div class="message ${type}" data-message-id="${messageId}">
                <span>${Utils.sanitizeHtml(message)}</span>
                <button class="message-close" onclick="$(this).parent().fadeOut()">&times;</button>
            </div>
        `);

        this.$elements.messageContainer.append($message);
        $message.fadeIn();

        // Auto-remove after timeout
        setTimeout(() => {
            $message.fadeOut(() => $message.remove());
        }, APP_CONFIG.NOTIFICATION_DURATION);

        this.notifications.push({ id: messageId, message, type, timestamp: new Date() });
    }

    /**
     * Shows a confirmation dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @returns {Promise<boolean>} User's choice
     */
    async showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const confirmed = confirm(`${title}\n\n${message}`);
            resolve(confirmed);
        });
    }

    /**
     * Downloads data as JSON file
     * @param {Object} data - Data to download
     * @param {string} filename - File name
     * @private
     */
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const $link = $('<a>').attr({
            href: url,
            download: filename
        });
        
        $('body').append($link);
        $link[0].click();
        $link.remove();
        URL.revokeObjectURL(url);
    }

    /**
     * Animates number changes in statistics
     * @private
     */
    animateNumbers() {
        $('.stat-number').each(function() {
            const $this = $(this);
            const targetText = $this.text();
            const targetNumber = parseFloat(targetText.replace(/[^\d.-]/g, ''));
            
            if (!isNaN(targetNumber)) {
                $({ number: 0 }).animate({ number: targetNumber }, {
                    duration: 1000,
                    step: function() {
                        if (targetText.includes('%')) {
                            $this.text(Math.round(this.number) + '%');
                        } else {
                            $this.text(Math.round(this.number));
                        }
                    },
                    complete: function() {
                        $this.text(targetText); // Ensure final value is correct
                    }
                });
            }
        });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
}