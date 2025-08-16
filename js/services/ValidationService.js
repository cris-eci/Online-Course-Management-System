/**
 * Validation Service Class
 * Centralized validation logic for forms and data
 * Implements Strategy Pattern for different validation strategies
 */

class ValidationService {
    constructor() {
        this.validators = new Map();
        this.customValidators = new Map();
        this.initializeDefaultValidators();
    }

    /**
     * Initializes default validation strategies
     * @private
     */
    initializeDefaultValidators() {
        // Email validation
        this.validators.set('email', {
            validate: (value) => {
                if (!value || value.trim() === '') {
                    return { isValid: false, message: 'Email is required' };
                }
                if (!Utils.isValidEmail(value)) {
                    return { isValid: false, message: 'Please enter a valid email address' };
                }
                return { isValid: true };
            }
        });

        // Required field validation
        this.validators.set('required', {
            validate: (value, fieldName = 'Field') => {
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    return { isValid: false, message: `${fieldName} is required` };
                }
                return { isValid: true };
            }
        });

        // String length validation
        this.validators.set('length', {
            validate: (value, options = {}) => {
                const { min = 0, max = Infinity, fieldName = 'Field' } = options;
                const length = value ? value.toString().length : 0;
                
                if (length < min) {
                    return { 
                        isValid: false, 
                        message: `${fieldName} must be at least ${min} characters long` 
                    };
                }
                if (length > max) {
                    return { 
                        isValid: false, 
                        message: `${fieldName} must be no more than ${max} characters long` 
                    };
                }
                return { isValid: true };
            }
        });

        // Number validation
        this.validators.set('number', {
            validate: (value, options = {}) => {
                const { min = -Infinity, max = Infinity, fieldName = 'Field' } = options;
                const num = parseFloat(value);
                
                if (isNaN(num)) {
                    return { isValid: false, message: `${fieldName} must be a valid number` };
                }
                if (num < min) {
                    return { isValid: false, message: `${fieldName} must be at least ${min}` };
                }
                if (num > max) {
                    return { isValid: false, message: `${fieldName} cannot exceed ${max}` };
                }
                return { isValid: true };
            }
        });

        // Phone number validation
        this.validators.set('phone', {
            validate: (value) => {
                if (!value || value.trim() === '') {
                    return { isValid: true }; // Phone is optional
                }
                
                // Basic phone validation (allows international formats)
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
                    return { isValid: false, message: 'Please enter a valid phone number' };
                }
                return { isValid: true };
            }
        });

        // Name validation
        this.validators.set('name', {
            validate: (value) => {
                if (!value || value.trim() === '') {
                    return { isValid: false, message: 'Name is required' };
                }
                
                const trimmedValue = value.trim();
                if (trimmedValue.length < 2) {
                    return { isValid: false, message: 'Name must be at least 2 characters long' };
                }
                if (trimmedValue.length > 100) {
                    return { isValid: false, message: 'Name must be no more than 100 characters long' };
                }
                
                // Check for valid characters (letters, spaces, hyphens, apostrophes)
                const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
                if (!nameRegex.test(trimmedValue)) {
                    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
                }
                
                return { isValid: true };
            }
        });

        // Course difficulty validation
        this.validators.set('difficulty', {
            validate: (value) => {
                const validDifficulties = ['beginner', 'intermediate', 'advanced'];
                if (!validDifficulties.includes(value?.toLowerCase())) {
                    return { 
                        isValid: false, 
                        message: 'Difficulty must be one of: Beginner, Intermediate, Advanced' 
                    };
                }
                return { isValid: true };
            }
        });

        // Progress validation
        this.validators.set('progress', {
            validate: (value) => {
                const num = parseFloat(value);
                if (isNaN(num) || num < 0 || num > 100) {
                    return { isValid: false, message: 'Progress must be a number between 0 and 100' };
                }
                return { isValid: true };
            }
        });
    }

    /**
     * Validates a single field
     * @param {string} validatorName - Name of the validator
     * @param {*} value - Value to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateField(validatorName, value, options = {}) {
        const validator = this.validators.get(validatorName) || this.customValidators.get(validatorName);
        
        if (!validator) {
            throw new Error(`Validator '${validatorName}' not found`);
        }

        return validator.validate(value, options);
    }

    /**
     * Validates course data
     * @param {Object} courseData - Course data to validate
     * @returns {Object} Validation result with errors
     */
    validateCourse(courseData) {
        const errors = {};
        let isValid = true;

        // Validate title
        const titleResult = this.validateField('required', courseData.title, { fieldName: 'Course title' });
        if (!titleResult.isValid) {
            errors.title = titleResult.message;
            isValid = false;
        } else {
            const titleLengthResult = this.validateField('length', courseData.title, { 
                min: 3, max: 100, fieldName: 'Course title' 
            });
            if (!titleLengthResult.isValid) {
                errors.title = titleLengthResult.message;
                isValid = false;
            }
        }

        // Validate description
        const descriptionResult = this.validateField('required', courseData.description, { fieldName: 'Description' });
        if (!descriptionResult.isValid) {
            errors.description = descriptionResult.message;
            isValid = false;
        } else {
            const descLengthResult = this.validateField('length', courseData.description, { 
                min: 10, max: 500, fieldName: 'Description' 
            });
            if (!descLengthResult.isValid) {
                errors.description = descLengthResult.message;
                isValid = false;
            }
        }

        // Validate duration
        const durationResult = this.validateField('number', courseData.duration, { 
            min: 1, max: 1000, fieldName: 'Duration' 
        });
        if (!durationResult.isValid) {
            errors.duration = durationResult.message;
            isValid = false;
        }

        // Validate instructor
        const instructorResult = this.validateField('name', courseData.instructor);
        if (!instructorResult.isValid) {
            errors.instructor = instructorResult.message;
            isValid = false;
        }

        // Validate difficulty
        const difficultyResult = this.validateField('difficulty', courseData.difficulty);
        if (!difficultyResult.isValid) {
            errors.difficulty = difficultyResult.message;
            isValid = false;
        }

        return { isValid, errors };
    }

    /**
     * Validates student data
     * @param {Object} studentData - Student data to validate
     * @returns {Object} Validation result with errors
     */
    validateStudent(studentData) {
        const errors = {};
        let isValid = true;

        // Validate name
        const nameResult = this.validateField('name', studentData.name);
        if (!nameResult.isValid) {
            errors.name = nameResult.message;
            isValid = false;
        }

        // Validate email
        const emailResult = this.validateField('email', studentData.email);
        if (!emailResult.isValid) {
            errors.email = emailResult.message;
            isValid = false;
        }

        // Validate phone (optional)
        if (studentData.phone) {
            const phoneResult = this.validateField('phone', studentData.phone);
            if (!phoneResult.isValid) {
                errors.phone = phoneResult.message;
                isValid = false;
            }
        }

        // Validate course ID (required for enrollment)
        if (!studentData.courseId || studentData.courseId.trim() === '') {
            errors.courseId = 'Please select a course';
            isValid = false;
        }

        return { isValid, errors };
    }

    /**
     * Validates form data with real-time feedback
     * @param {HTMLFormElement} form - Form element
     * @param {Object} validationRules - Validation rules for each field
     * @returns {Object} Overall validation result
     */
    validateForm(form, validationRules) {
        const formData = new FormData(form);
        const errors = {};
        let isValid = true;

        // Clear existing error states
        this.clearFormErrors(form);

        // Validate each field according to rules
        for (const [fieldName, rules] of Object.entries(validationRules)) {
            const fieldValue = formData.get(fieldName) || form.querySelector(`[name="${fieldName}"]`)?.value;
            const fieldElement = form.querySelector(`[name="${fieldName}"]`);

            for (const rule of rules) {
                const result = this.validateField(rule.type, fieldValue, rule.options);
                
                if (!result.isValid) {
                    errors[fieldName] = result.message;
                    isValid = false;
                    
                    // Add visual error feedback
                    if (fieldElement) {
                        this.addFieldError(fieldElement, result.message);
                    }
                    break; // Stop at first error for this field
                }
            }

            // Add success state if field is valid
            if (!errors[fieldName] && fieldElement) {
                this.addFieldSuccess(fieldElement);
            }
        }

        return { isValid, errors };
    }

    /**
     * Adds visual error state to a form field
     * @param {HTMLElement} fieldElement - Field element
     * @param {string} message - Error message
     */
    addFieldError(fieldElement, message) {
        fieldElement.classList.add('error');
        fieldElement.classList.remove('success');
        
        // Remove existing error message
        const existingError = fieldElement.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        fieldElement.parentNode.appendChild(errorElement);
    }

    /**
     * Adds visual success state to a form field
     * @param {HTMLElement} fieldElement - Field element
     */
    addFieldSuccess(fieldElement) {
        fieldElement.classList.add('success');
        fieldElement.classList.remove('error');
        
        // Remove error message
        const existingError = fieldElement.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Clears all form errors
     * @param {HTMLFormElement} form - Form element
     */
    clearFormErrors(form) {
        const errorElements = form.querySelectorAll('.field-error');
        errorElements.forEach(el => el.remove());

        const fieldElements = form.querySelectorAll('.error, .success');
        fieldElements.forEach(el => {
            el.classList.remove('error', 'success');
        });
    }

    /**
     * Sets up real-time validation for a form
     * @param {HTMLFormElement} form - Form element
     * @param {Object} validationRules - Validation rules
     * @param {Object} options - Configuration options
     */
    setupRealTimeValidation(form, validationRules, options = {}) {
        const { debounceDelay = APP_CONFIG.DEBOUNCE_DELAY } = options;

        Object.keys(validationRules).forEach(fieldName => {
            const fieldElement = form.querySelector(`[name="${fieldName}"]`);
            if (!fieldElement) return;

            const debouncedValidation = Utils.debounce(() => {
                const fieldValue = fieldElement.value;
                const rules = validationRules[fieldName];

                // Clear previous state
                fieldElement.classList.remove('error', 'success');
                const existingError = fieldElement.parentNode.querySelector('.field-error');
                if (existingError) {
                    existingError.remove();
                }

                // Validate field
                for (const rule of rules) {
                    const result = this.validateField(rule.type, fieldValue, rule.options);
                    
                    if (!result.isValid) {
                        this.addFieldError(fieldElement, result.message);
                        return;
                    }
                }

                // Add success state if all validations pass
                if (fieldValue.trim() !== '') {
                    this.addFieldSuccess(fieldElement);
                }
            }, debounceDelay);

            // Add event listeners for real-time validation
            fieldElement.addEventListener('input', debouncedValidation);
            fieldElement.addEventListener('blur', debouncedValidation);
        });
    }

    /**
     * Registers a custom validator
     * @param {string} name - Validator name
     * @param {Function} validateFn - Validation function
     */
    registerCustomValidator(name, validateFn) {
        this.customValidators.set(name, {
            validate: validateFn
        });
    }

    /**
     * Validates an array of items with a given validator
     * @param {Array} items - Items to validate
     * @param {string} validatorName - Validator to use
     * @param {Object} options - Validation options
     * @returns {Object} Validation results for all items
     */
    validateArray(items, validatorName, options = {}) {
        const results = [];
        let allValid = true;

        items.forEach((item, index) => {
            const result = this.validateField(validatorName, item, { ...options, index });
            results.push(result);
            if (!result.isValid) {
                allValid = false;
            }
        });

        return { isValid: allValid, results };
    }

    /**
     * Sanitizes user input to prevent XSS
     * @param {Object} data - Data to sanitize
     * @returns {Object} Sanitized data
     */
    sanitizeInput(data) {
        const sanitized = {};
        
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'string') {
                sanitized[key] = Utils.sanitizeHtml(data[key].trim());
            } else {
                sanitized[key] = data[key];
            }
        });

        return sanitized;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ValidationService };
}