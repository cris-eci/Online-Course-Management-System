/**
 * Test Framework Class
 * Implements comprehensive testing for the application
 * Supports unit tests, integration tests, and async testing
 */

class TestFramework {
    constructor() {
        this.tests = new Map();
        this.results = [];
        this.isRunning = false;
        this.testEnvironment = {
            dataService: null,
            courseManager: null,
            studentManager: null,
            validationService: null
        };
        
        // Test categories
        this.testCategories = {
            unit: [],
            integration: [],
            validation: [],
            ui: []
        };
    }

    /**
     * Initializes the test framework with dependencies
     * @param {Object} dependencies - Application dependencies
     */
    initialize(dependencies) {
        this.testEnvironment = { ...dependencies };
        this.registerAllTests();
    }

    /**
     * Registers a test
     * @param {string} name - Test name
     * @param {Function} testFunction - Test function
     * @param {string} category - Test category (unit, integration, validation, ui)
     * @param {Object} options - Test options
     */
    registerTest(name, testFunction, category = 'unit', options = {}) {
        const test = {
            name,
            testFunction,
            category,
            timeout: options.timeout || 5000,
            retries: options.retries || 0,
            skip: options.skip || false,
            tags: options.tags || []
        };

        this.tests.set(name, test);
        
        if (!this.testCategories[category]) {
            this.testCategories[category] = [];
        }
        this.testCategories[category].push(test);
    }

    /**
     * Registers all application tests
     * @private
     */
    registerAllTests() {
        this.registerUtilityTests();
        this.registerModelTests();
        this.registerServiceTests();
        this.registerManagerTests();
        this.registerIntegrationTests();
        this.registerValidationTests();
    }

    /**
     * Registers utility function tests
     * @private
     */
    registerUtilityTests() {
        this.registerTest('Utils.generateId generates unique IDs', () => {
            const id1 = Utils.generateId();
            const id2 = Utils.generateId();
            
            if (!id1 || !id2) {
                throw new Error('Generated IDs should not be null or undefined');
            }
            
            if (id1 === id2) {
                throw new Error('Generated IDs should be unique');
            }
            
            if (typeof id1 !== 'string' || typeof id2 !== 'string') {
                throw new Error('Generated IDs should be strings');
            }
        }, 'unit');

        this.registerTest('Utils.isValidEmail validates email correctly', () => {
            const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'test+tag@example.org'];
            const invalidEmails = ['invalid', '@example.com', 'test@', 'test..test@example.com'];

            validEmails.forEach(email => {
                if (!Utils.isValidEmail(email)) {
                    throw new Error(`${email} should be valid`);
                }
            });

            invalidEmails.forEach(email => {
                if (Utils.isValidEmail(email)) {
                    throw new Error(`${email} should be invalid`);
                }
            });
        }, 'unit');

        this.registerTest('Utils.calculateProgress calculates correctly', () => {
            if (Utils.calculateProgress(50, 100) !== 50) {
                throw new Error('50/100 should equal 50%');
            }
            
            if (Utils.calculateProgress(0, 100) !== 0) {
                throw new Error('0/100 should equal 0%');
            }
            
            if (Utils.calculateProgress(100, 100) !== 100) {
                throw new Error('100/100 should equal 100%');
            }
            
            if (Utils.calculateProgress(10, 0) !== 0) {
                throw new Error('Any/0 should equal 0%');
            }
        }, 'unit');

        this.registerTest('Utils.sanitizeHtml prevents XSS', () => {
            const maliciousInput = '<script>alert("xss")</script>';
            const sanitized = Utils.sanitizeHtml(maliciousInput);
            
            if (sanitized.includes('<script>')) {
                throw new Error('Script tags should be sanitized');
            }
        }, 'unit');

        this.registerTest('Utils.debounce delays function execution', async () => {
            let called = false;
            const debouncedFunction = Utils.debounce(() => { called = true; }, 100);
            
            debouncedFunction();
            
            if (called) {
                throw new Error('Function should not be called immediately');
            }
            
            await Utils.delay(150);
            
            if (!called) {
                throw new Error('Function should be called after delay');
            }
        }, 'unit');
    }

    /**
     * Registers model tests
     * @private
     */
    registerModelTests() {
        this.registerTest('Course model validates required fields', () => {
            try {
                new Course({});
                throw new Error('Should have thrown validation error');
            } catch (error) {
                if (!(error instanceof ValidationError)) {
                    throw new Error('Should throw ValidationError for missing fields');
                }
            }
        }, 'unit');

        this.registerTest('Course model creates valid instance', () => {
            const courseData = {
                title: 'Test Course',
                description: 'This is a test course description',
                duration: 10,
                instructor: 'Test Instructor',
                difficulty: 'beginner'
            };

            const course = new Course(courseData);
            
            if (course.title !== courseData.title) {
                throw new Error('Course title should match input');
            }
            
            if (course.difficulty !== courseData.difficulty) {
                throw new Error('Course difficulty should match input');
            }
            
            if (!course.id) {
                throw new Error('Course should have an ID');
            }
            
            if (!course.slug) {
                throw new Error('Course should have a slug');
            }
        }, 'unit');

        this.registerTest('Student model validates email format', () => {
            const invalidStudentData = {
                name: 'Test Student',
                email: 'invalid-email',
                courseId: 'test-course'
            };

            try {
                new Student(invalidStudentData);
                throw new Error('Should have thrown validation error for invalid email');
            } catch (error) {
                if (!(error instanceof ValidationError)) {
                    throw new Error('Should throw ValidationError for invalid email');
                }
            }
        }, 'unit');

        this.registerTest('Student model creates valid instance', () => {
            const studentData = {
                name: 'Test Student',
                email: 'test@example.com',
                courseId: 'test-course'
            };

            const student = new Student(studentData);
            
            if (student.name !== studentData.name) {
                throw new Error('Student name should match input');
            }
            
            if (student.email !== studentData.email.toLowerCase()) {
                throw new Error('Student email should be lowercase');
            }
            
            if (!student.initials) {
                throw new Error('Student should have initials');
            }
            
            if (student.progress !== 0) {
                throw new Error('New student should have 0% progress');
            }
        }, 'unit');

        this.registerTest('Course progress updates correctly', () => {
            const course = new Course({
                title: 'Test Course',
                description: 'Test description',
                duration: 10,
                instructor: 'Test Instructor',
                difficulty: 'beginner'
            });

            course.updateProgress(50);
            
            if (course.progress !== 50) {
                throw new Error('Course progress should be updated to 50%');
            }

            try {
                course.updateProgress(150);
                throw new Error('Should not allow progress > 100%');
            } catch (error) {
                if (error.message === 'Should not allow progress > 100%') {
                    throw error;
                }
                // Expected error for invalid progress
            }
        }, 'unit');
    }

    /**
     * Registers service tests
     * @private
     */
    registerServiceTests() {
        this.registerTest('DataService initializes correctly', async () => {
            const dataService = new DataService();
            
            if (dataService.initialized) {
                throw new Error('DataService should not be initialized on creation');
            }

            await dataService.initialize();
            
            if (!dataService.initialized) {
                throw new Error('DataService should be initialized after calling initialize()');
            }
        }, 'unit');

        this.registerTest('ValidationService validates email correctly', () => {
            const validationService = new ValidationService();
            
            const validResult = validationService.validateField('email', 'test@example.com');
            if (!validResult.isValid) {
                throw new Error('Valid email should pass validation');
            }

            const invalidResult = validationService.validateField('email', 'invalid-email');
            if (invalidResult.isValid) {
                throw new Error('Invalid email should fail validation');
            }
        }, 'unit');

        this.registerTest('ValidationService validates required fields', () => {
            const validationService = new ValidationService();
            
            const emptyResult = validationService.validateField('required', '', { fieldName: 'Test Field' });
            if (emptyResult.isValid) {
                throw new Error('Empty field should fail required validation');
            }

            const validResult = validationService.validateField('required', 'value', { fieldName: 'Test Field' });
            if (!validResult.isValid) {
                throw new Error('Non-empty field should pass required validation');
            }
        }, 'unit');
    }

    /**
     * Registers manager tests
     * @private
     */
    registerManagerTests() {
        this.registerTest('CourseManager creates course successfully', async () => {
            if (!this.testEnvironment.courseManager) {
                throw new Error('CourseManager not available in test environment');
            }

            const courseData = {
                title: 'Test Course for Manager',
                description: 'This is a test course for manager testing',
                duration: 15,
                instructor: 'Test Instructor',
                difficulty: 'intermediate'
            };

            const course = await this.testEnvironment.courseManager.createCourse(courseData);
            
            if (!course || !course.id) {
                throw new Error('CourseManager should create course with ID');
            }
            
            if (course.title !== courseData.title) {
                throw new Error('Created course should have correct title');
            }
        }, 'integration');

        this.registerTest('StudentManager creates student successfully', async () => {
            if (!this.testEnvironment.studentManager) {
                throw new Error('StudentManager not available in test environment');
            }

            // First create a course
            const courseData = {
                title: 'Test Course for Student',
                description: 'This is a test course for student testing',
                duration: 10,
                instructor: 'Test Instructor',
                difficulty: 'beginner'
            };

            const course = await this.testEnvironment.courseManager.createCourse(courseData);

            const studentData = {
                name: 'Test Student for Manager',
                email: 'teststudent@example.com',
                courseId: course.id
            };

            const student = await this.testEnvironment.studentManager.createStudent(studentData);
            
            if (!student || !student.id) {
                throw new Error('StudentManager should create student with ID');
            }
            
            if (student.name !== studentData.name) {
                throw new Error('Created student should have correct name');
            }
            
            if (student.courseId !== course.id) {
                throw new Error('Student should be enrolled in correct course');
            }
        }, 'integration');
    }

    /**
     * Registers integration tests
     * @private
     */
    registerIntegrationTests() {
        this.registerTest('Course and Student integration', async () => {
            // Create a course
            const courseData = {
                title: 'Integration Test Course',
                description: 'Course for integration testing',
                duration: 20,
                instructor: 'Integration Instructor',
                difficulty: 'advanced'
            };

            const course = await this.testEnvironment.courseManager.createCourse(courseData);

            // Create a student enrolled in the course
            const studentData = {
                name: 'Integration Test Student',
                email: 'integration@example.com',
                courseId: course.id
            };

            const student = await this.testEnvironment.studentManager.createStudent(studentData);

            // Update student progress
            await this.testEnvironment.studentManager.updateStudentProgress(student.id, 75);
            
            // Verify course enrollment count
            const updatedCourse = await this.testEnvironment.courseManager.getCourseById(course.id);
            if (updatedCourse.enrollmentCount !== 1) {
                throw new Error('Course enrollment count should be updated');
            }

            // Delete student and verify course enrollment decreases
            await this.testEnvironment.studentManager.deleteStudent(student.id);
            
            const finalCourse = await this.testEnvironment.courseManager.getCourseById(course.id);
            if (finalCourse.enrollmentCount !== 0) {
                throw new Error('Course enrollment count should decrease when student is deleted');
            }
        }, 'integration');

        this.registerTest('Data persistence integration', async () => {
            // Create course
            const courseData = {
                title: 'Persistence Test Course',
                description: 'Course for persistence testing',
                duration: 5,
                instructor: 'Persistence Instructor',
                difficulty: 'beginner'
            };

            const course = await this.testEnvironment.courseManager.createCourse(courseData);
            
            // Get courses and verify
            const courses = await this.testEnvironment.courseManager.getCourses();
            const foundCourse = courses.find(c => c.id === course.id);
            
            if (!foundCourse) {
                throw new Error('Created course should be retrievable');
            }
            
            if (foundCourse.title !== courseData.title) {
                throw new Error('Retrieved course should have correct data');
            }
        }, 'integration');

        this.registerTest('Async operations handle errors correctly', async () => {
            // Test creating course with invalid data
            try {
                await this.testEnvironment.courseManager.createCourse({
                    title: '', // Invalid - empty title
                    description: 'Test',
                    duration: 10,
                    instructor: 'Test',
                    difficulty: 'beginner'
                });
                throw new Error('Should have thrown validation error');
            } catch (error) {
                if (!(error instanceof ValidationError)) {
                    throw new Error('Should throw ValidationError for invalid data');
                }
            }

            // Test deleting non-existent course
            try {
                await this.testEnvironment.courseManager.deleteCourse('non-existent-id');
                throw new Error('Should have thrown error for non-existent course');
            } catch (error) {
                if (error.message === 'Should have thrown error for non-existent course') {
                    throw error;
                }
                // Expected error
            }
        }, 'integration');
    }

    /**
     * Registers validation tests
     * @private
     */
    registerValidationTests() {
        this.registerTest('Course validation catches all required fields', () => {
            const validationService = new ValidationService();
            
            const result = validationService.validateCourse({});
            
            if (result.isValid) {
                throw new Error('Empty course data should fail validation');
            }
            
            if (!result.errors.title) {
                throw new Error('Should have title error');
            }
            
            if (!result.errors.description) {
                throw new Error('Should have description error');
            }
            
            if (!result.errors.instructor) {
                throw new Error('Should have instructor error');
            }
        }, 'validation');

        this.registerTest('Student validation catches all required fields', () => {
            const validationService = new ValidationService();
            
            const result = validationService.validateStudent({});
            
            if (result.isValid) {
                throw new Error('Empty student data should fail validation');
            }
            
            if (!result.errors.name) {
                throw new Error('Should have name error');
            }
            
            if (!result.errors.email) {
                throw new Error('Should have email error');
            }
        }, 'validation');

        this.registerTest('Length validation works correctly', () => {
            const validationService = new ValidationService();
            
            const shortResult = validationService.validateField('length', 'ab', { min: 3, fieldName: 'Test' });
            if (shortResult.isValid) {
                throw new Error('Short string should fail min length validation');
            }
            
            const longResult = validationService.validateField('length', 'a'.repeat(101), { max: 100, fieldName: 'Test' });
            if (longResult.isValid) {
                throw new Error('Long string should fail max length validation');
            }
            
            const validResult = validationService.validateField('length', 'valid', { min: 3, max: 10, fieldName: 'Test' });
            if (!validResult.isValid) {
                throw new Error('Valid length string should pass validation');
            }
        }, 'validation');
    }

    /**
     * Runs tests by category or all tests
     * @param {string} category - Test category to run ('all', 'unit', 'integration', etc.)
     * @returns {Promise<Object>} Test results
     */
    async runTests(category = 'all') {
        if (this.isRunning) {
            throw new Error('Tests are already running');
        }

        this.isRunning = true;
        this.results = [];

        try {
            const testsToRun = this.getTestsToRun(category);
            
            this.updateTestUI('start', { total: testsToRun.length, category });

            for (let i = 0; i < testsToRun.length; i++) {
                const test = testsToRun[i];
                
                if (test.skip) {
                    this.results.push({
                        name: test.name,
                        status: 'skipped',
                        duration: 0,
                        error: null
                    });
                    continue;
                }

                const result = await this.runSingleTest(test);
                this.results.push(result);
                
                this.updateTestUI('progress', { 
                    current: i + 1, 
                    total: testsToRun.length,
                    result 
                });
            }

            const summary = this.generateTestSummary();
            this.updateTestUI('complete', { results: this.results, summary });
            
            return { results: this.results, summary };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Runs a single test with timeout and retry logic
     * @param {Object} test - Test to run
     * @returns {Promise<Object>} Test result
     * @private
     */
    async runSingleTest(test) {
        let lastError = null;
        
        for (let attempt = 0; attempt <= test.retries; attempt++) {
            const startTime = Date.now();
            
            try {
                await Promise.race([
                    test.testFunction(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Test timeout')), test.timeout)
                    )
                ]);
                
                return {
                    name: test.name,
                    status: 'pass',
                    duration: Date.now() - startTime,
                    error: null,
                    attempt: attempt + 1
                };
            } catch (error) {
                lastError = error;
                
                if (attempt < test.retries) {
                    await Utils.delay(100); // Brief delay before retry
                }
            }
        }

        return {
            name: test.name,
            status: 'fail',
            duration: Date.now() - startTime,
            error: lastError.message,
            attempt: test.retries + 1
        };
    }

    /**
     * Gets tests to run based on category
     * @param {string} category - Test category
     * @returns {Array} Tests to run
     * @private
     */
    getTestsToRun(category) {
        if (category === 'all') {
            return Array.from(this.tests.values());
        }
        
        return this.testCategories[category] || [];
    }

    /**
     * Generates test summary
     * @returns {Object} Test summary
     * @private
     */
    generateTestSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const skipped = this.results.filter(r => r.status === 'skipped').length;
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

        return {
            total,
            passed,
            failed,
            skipped,
            passRate: total > 0 ? (passed / total) * 100 : 0,
            totalDuration,
            averageDuration: total > 0 ? totalDuration / total : 0
        };
    }

    /**
     * Updates the test UI
     * @param {string} phase - Test phase (start, progress, complete)
     * @param {Object} data - Phase data
     * @private
     */
    updateTestUI(phase, data) {
        const $testResults = $('#test-results');
        const $testSummary = $('#test-summary');
        const $testItems = $('#test-items');

        switch (phase) {
            case 'start':
                $testResults.fadeIn();
                $testSummary.html(`
                    <div class="test-summary-running">
                        <h4>Running ${data.category} tests...</h4>
                        <p>Total tests: ${data.total}</p>
                        <div class="loading">
                            <div class="spinner"></div>
                            Initializing tests...
                        </div>
                    </div>
                `);
                $testItems.empty();
                break;

            case 'progress':
                $testSummary.html(`
                    <div class="test-summary-running">
                        <h4>Running tests... ${data.current}/${data.total}</h4>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(data.current / data.total) * 100}%"></div>
                        </div>
                    </div>
                `);

                const testItemHtml = `
                    <div class="test-item test-${data.result.status}">
                        <span>${data.result.status === 'pass' ? '✅' : '❌'} ${Utils.sanitizeHtml(data.result.name)}</span>
                        <span class="test-status">${data.result.status.toUpperCase()}</span>
                        ${data.result.error ? `<div class="test-error">${Utils.sanitizeHtml(data.result.error)}</div>` : ''}
                    </div>
                `;
                $testItems.append(testItemHtml);
                break;

            case 'complete':
                const summary = data.summary;
                $testSummary.html(`
                    <div class="test-summary-complete">
                        <h4>Test Results Summary</h4>
                        <div class="summary-stats">
                            <div class="stat">
                                <span class="stat-label">Total:</span>
                                <span class="stat-value">${summary.total}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Passed:</span>
                                <span class="stat-value text-success">${summary.passed}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Failed:</span>
                                <span class="stat-value text-danger">${summary.failed}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Skipped:</span>
                                <span class="stat-value text-muted">${summary.skipped}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Pass Rate:</span>
                                <span class="stat-value">${summary.passRate.toFixed(1)}%</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Duration:</span>
                                <span class="stat-value">${summary.totalDuration}ms</span>
                            </div>
                        </div>
                    </div>
                `);
                break;
        }

        // Scroll to latest test item
        if (phase === 'progress') {
            $testItems.scrollTop($testItems[0].scrollHeight);
        }
    }

    /**
     * Gets test statistics
     * @returns {Object} Test statistics
     */
    getTestStatistics() {
        const stats = {
            totalTests: this.tests.size,
            categories: {}
        };

        Object.keys(this.testCategories).forEach(category => {
            stats.categories[category] = this.testCategories[category].length;
        });

        return stats;
    }

    /**
     * Clears test results
     */
    clearResults() {
        this.results = [];
        $('#test-results').hide();
        $('#test-items').empty();
    }
}

// Make TestFramework available globally
window.TestFramework = new TestFramework();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TestFramework };
}