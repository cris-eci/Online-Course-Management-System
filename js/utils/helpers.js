/**
 * Utility Helper Functions
 * Collection of pure functions for common operations
 */

// Utility namespace using Module Pattern
const Utils = (function() {
    'use strict';

    /**
     * Generates a unique ID based on timestamp and random number
     * @returns {string} Unique identifier
     */
    function generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Formats a date to a localized string
     * @param {Date} date - The date to format
     * @param {string} locale - The locale (default: 'en-US')
     * @returns {string} Formatted date string
     */
    function formatDate(date, locale = 'en-US') {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Debounce function to limit the rate of function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function to limit function execution frequency
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Sanitizes HTML to prevent XSS attacks
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    function sanitizeHtml(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    }

    /**
     * Validates email format using regex
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email format
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Calculates progress percentage
     * @param {number} current - Current value
     * @param {number} total - Total value
     * @returns {number} Percentage (0-100)
     */
    function calculateProgress(current, total) {
        if (total === 0) return 0;
        return Math.min(100, Math.max(0, (current / total) * 100));
    }

    /**
     * Deep clones an object
     * @param {Object} obj - Object to clone
     * @returns {Object} Deep cloned object
     */
    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    /**
     * Capitalizes the first letter of a string
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Generates a random number between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    function randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Formats a number with thousand separators
     * @param {number} num - Number to format
     * @param {string} locale - Locale for formatting
     * @returns {string} Formatted number
     */
    function formatNumber(num, locale = 'en-US') {
        return new Intl.NumberFormat(locale).format(num);
    }

    /**
     * Converts a string to URL-friendly slug
     * @param {string} text - Text to convert
     * @returns {string} URL slug
     */
    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    /**
     * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
     * @param {*} value - Value to check
     * @returns {boolean} True if empty
     */
    function isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    /**
     * Creates a promise that resolves after specified delay
     * @param {number} ms - Delay in milliseconds
     * @returns {Promise} Promise that resolves after delay
     */
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retries an async function with exponential backoff
     * @param {Function} fn - Async function to retry
     * @param {number} retries - Number of retries
     * @param {number} backoff - Initial backoff time in ms
     * @returns {Promise} Promise that resolves with function result
     */
    async function retryWithBackoff(fn, retries = 3, backoff = 1000) {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                await delay(backoff);
                return retryWithBackoff(fn, retries - 1, backoff * 2);
            }
            throw error;
        }
    }

    // Public API
    return {
        generateId,
        formatDate,
        debounce,
        throttle,
        sanitizeHtml,
        isValidEmail,
        calculateProgress,
        deepClone,
        capitalize,
        randomBetween,
        formatNumber,
        slugify,
        isEmpty,
        delay,
        retryWithBackoff
    };
})();

// Constants and Configuration
const APP_CONFIG = {
    API_DELAY: 500,
    NOTIFICATION_DURATION: 3000,
    MAX_RETRIES: 3,
    DEBOUNCE_DELAY: 300,
    PROGRESS_ANIMATION_DURATION: 1000,
    SUPPORTED_LOCALES: ['en-US', 'es-ES', 'fr-FR'],
    DEFAULT_LOCALE: 'en-US'
};

// Export for module systems (if available)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, APP_CONFIG };
}