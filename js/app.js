/**
 * Main Application Entry Point
 * Implements Application Controller Pattern and Dependency Injection
 * Initializes and coordinates all application components
 */

class CourseManagementApp {
    constructor() {
        this.components = {};
        this.initialized = false;
        this.version = '1.0.0';
        
        // Application state
        this.state = {
            currentUser: null,
            theme: 'light',
            locale: 'en-US'
        };
    }

    /**
     * Initializes the application
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            console.warn('Application already initialized');
            return;
        }

        try {
            console.log('🚀 Initializing Course Management System v' + this.version);
            
            // Show loading state
            this.showGlobalLoading('Initializing application...');

            // Initialize core services
            await this.initializeServices();
            
            // Initialize managers
            await this.initializeManagers();
            
            // Initialize UI
            await this.initializeUI();
            
            // Initialize testing framework
            await this.initializeTestFramework();
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            // Load initial data
            await this.loadInitialData();
            
            this.initialized = true;
            this.hideGlobalLoading();
            
            console.log('✅ Application initialized successfully');
            
            // Show welcome message
            this.showWelcomeMessage();
            
        } catch (error) {
            this.hideGlobalLoading();
            console.error('❌ Failed to initialize application:', error);
            this.showCriticalError('Failed to initialize application: ' + error.message);
        }
    }

    /**
     * Initializes core services
     * @private
     */
    async initializeServices() {
        console.log('📦 Initializing services...');
        
        // Data Service - handles persistence
        this.components.dataService = new DataService();
        await this.components.dataService.initialize();
        
        // Validation Service - handles form validation
        this.components.validationService = new ValidationService();
        
        console.log('✓ Services initialized');
    }

    /**
     * Initializes business logic managers
     * @private
     */
    async initializeManagers() {
        console.log('🏗️ Initializing managers...');
        
        // Course Manager - manages course operations
        this.components.courseManager = new CourseManager(
            this.components.dataService,
            this.components.validationService
        );
        
        // Student Manager - manages student operations
        this.components.studentManager = new StudentManager(
            this.components.dataService,
            this.components.validationService
        );
        
        console.log('✓ Managers initialized');
    }

    /**
     * Initializes user interface
     * @private
     */
    async initializeUI() {
        console.log('🎨 Initializing UI...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // UI Manager - handles all UI interactions
        this.components.uiManager = new UIManager();
        this.components.uiManager.initialize(
            this.components.courseManager,
            this.components.studentManager,
            this.components.validationService
        );
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup responsive design handlers
        this.setupResponsiveHandlers();
        
        console.log('✓ UI initialized');
    }

    /**
     * Initializes testing framework
     * @private
     */
    async initializeTestFramework() {
        console.log('🧪 Initializing test framework...');
        
        if (window.TestFramework) {
            window.TestFramework.initialize({
                dataService: this.components.dataService,
                courseManager: this.components.courseManager,
                studentManager: this.components.studentManager,
                validationService: this.components.validationService
            });
        }
        
        console.log('✓ Test framework initialized');
    }

    /**
     * Loads initial application data
     * @private
     */
    async loadInitialData() {
        console.log('📊 Loading initial data...');
        
        try {
            // Load courses and students in parallel
            await Promise.all([
                this.components.courseManager.getCourses(),
                this.components.studentManager.getStudents()
            ]);
            
            console.log('✓ Initial data loaded');
        } catch (error) {
            console.warn('⚠️ Failed to load initial data:', error);
            // Don't throw here - app can still function
        }
    }

    /**
     * Sets up global error handling
     * @private
     */
    setupErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            this.components.uiManager?.showMessage(
                'An unexpected error occurred. Please try again.',
                'error'
            );
            event.preventDefault();
        });

        // Handle global JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('Global Error:', event.error);
            this.components.uiManager?.showMessage(
                'A system error occurred. Please refresh the page.',
                'error'
            );
        });

        // Handle jQuery errors (if available)
        if (typeof $ !== 'undefined') {
            $(document).ajaxError((event, xhr, settings, error) => {
                console.error('AJAX Error:', error);
                this.components.uiManager?.showMessage(
                    'Network error occurred. Please check your connection.',
                    'error'
                );
            });
        }
    }

    /**
     * Sets up performance monitoring
     * @private
     */
    setupPerformanceMonitoring() {
        // Monitor page load performance
        if (performance && performance.timing) {
            $(window).on('load', () => {
                setTimeout(() => {
                    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                    console.log(`📈 Page load time: ${loadTime}ms`);
                    
                    if (loadTime > 3000) {
                        console.warn('⚠️ Slow page load detected');
                    }
                }, 0);
            });
        }

        // Monitor memory usage (if available)
        if (performance && performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
                
                if (usedMB > 50) { // More than 50MB
                    console.warn(`⚠️ High memory usage: ${usedMB}MB`);
                }
            }, 60000); // Check every minute
        }
    }

    /**
     * Sets up keyboard shortcuts
     * @private
     */
    setupKeyboardShortcuts() {
        $(document).on('keydown', (e) => {
            // Ctrl/Cmd + K - Search functionality
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.focusSearch();
            }
            
            // Ctrl/Cmd + N - New course
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.switchToTab('courses');
                $('#course-title').focus();
            }
            
            // Ctrl/Cmd + Shift + N - New student
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.switchToTab('students');
                $('#student-name').focus();
            }
            
            // Escape - Close modals/clear forms
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
    }

    /**
     * Sets up responsive design handlers
     * @private
     */
    setupResponsiveHandlers() {
        const handleResize = Utils.throttle(() => {
            // Update UI for mobile/desktop
            if (window.innerWidth < 768) {
                $('body').addClass('mobile-view');
            } else {
                $('body').removeClass('mobile-view');
            }
        }, 250);

        $(window).on('resize', handleResize);
        handleResize(); // Initial call
    }

    /**
     * Shows global loading overlay
     * @param {string} message - Loading message
     * @private
     */
    showGlobalLoading(message = 'Loading...') {
        if ($('#global-loading').length === 0) {
            $('body').append(`
                <div id="global-loading" class="global-loading">
                    <div class="loading-content">
                        <div class="spinner"></div>
                        <p id="loading-message">${Utils.sanitizeHtml(message)}</p>
                    </div>
                </div>
            `);
        } else {
            $('#loading-message').text(message);
            $('#global-loading').show();
        }
    }

    /**
     * Hides global loading overlay
     * @private
     */
    hideGlobalLoading() {
        $('#global-loading').fadeOut(() => {
            $('#global-loading').remove();
        });
    }

    /**
     * Shows welcome message
     * @private
     */
    showWelcomeMessage() {
        if (this.components.uiManager) {
            this.components.uiManager.showMessage(
                'Welcome to Course Management System! 🎓',
                'success'
            );
        }
    }

    /**
     * Shows critical error message
     * @param {string} message - Error message
     * @private
     */
    showCriticalError(message) {
        $('body').html(`
            <div class="critical-error">
                <div class="error-content">
                    <h1>❌ Application Error</h1>
                    <p>${Utils.sanitizeHtml(message)}</p>
                    <button onclick="location.reload()" class="btn-primary">
                        🔄 Reload Application
                    </button>
                </div>
            </div>
        `);
    }

    /**
     * Switches to a specific tab
     * @param {string} tabName - Tab to switch to
     */
    switchToTab(tabName) {
        if (this.components.uiManager) {
            this.components.uiManager.switchTab(tabName);
        }
    }

    /**
     * Focuses search input (placeholder for future search feature)
     * @private
     */
    focusSearch() {
        // Placeholder for search functionality
        this.components.uiManager?.showMessage(
            'Search functionality coming soon! Use Ctrl+K to access.',
            'info'
        );
    }

    /**
     * Handles escape key press
     * @private
     */
    handleEscapeKey() {
        // Clear form focus
        $('input, textarea, select').blur();
        
        // Clear form validation errors
        $('.field-error').remove();
        $('.error, .success').removeClass('error success');
    }

    /**
     * Gets application information
     * @returns {Object} Application info
     */
    getInfo() {
        return {
            version: this.version,
            initialized: this.initialized,
            components: Object.keys(this.components),
            state: this.state,
            performance: this.getPerformanceInfo()
        };
    }

    /**
     * Gets performance information
     * @returns {Object} Performance info
     * @private
     */
    getPerformanceInfo() {
        const info = {
            loadTime: null,
            memory: null
        };

        if (performance && performance.timing) {
            info.loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        }

        if (performance && performance.memory) {
            info.memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }

        return info;
    }

    /**
     * Exports application data
     * @returns {Promise<Object>} Exported data
     */
    async exportApplicationData() {
        if (!this.initialized) {
            throw new Error('Application not initialized');
        }

        const data = await this.components.dataService.exportData();
        return {
            ...data,
            appVersion: this.version,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Resets application to initial state
     * @returns {Promise<void>}
     */
    async reset() {
        if (!this.initialized) {
            throw new Error('Application not initialized');
        }

        const confirmed = confirm('Are you sure you want to reset all data? This action cannot be undone.');
        if (!confirmed) return;

        try {
            await this.components.dataService.clearAllData();
            
            // Refresh the page to reinitialize
            location.reload();
        } catch (error) {
            console.error('Failed to reset application:', error);
            throw error;
        }
    }

    /**
     * Checks if application is ready
     * @returns {boolean} True if ready
     */
    isReady() {
        return this.initialized && this.components.uiManager;
    }
}

// Create global app instance
const app = new CourseManagementApp();

// Initialize when DOM is ready
$(document).ready(async () => {
    try {
        await app.initialize();
        
        // Make app available globally for debugging
        window.app = app;
        
        // Setup development helpers
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Development mode enabled');
            window.dev = {
                app,
                utils: Utils,
                config: APP_CONFIG,
                getStats: () => app.getInfo(),
                runTests: () => window.TestFramework?.runTests('all'),
                reset: () => app.reset()
            };
            console.log('Development tools available in window.dev');
        }
        
    } catch (error) {
        console.error('Failed to start application:', error);
    }
});

// Handle page unload
$(window).on('beforeunload', () => {
    if (app.isReady()) {
        // Could save any pending changes here
        console.log('Application shutting down...');
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CourseManagementApp, app };
}