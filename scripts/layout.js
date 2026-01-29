//layout.js - Centralized loader for shared UI components

/**
 * Loads a component HTML file and injects it into the page
 * @param {string} componentPath - Path to the component HTML file
 * @param {string} selector - CSS selector to find the element to inject
 * @param {Function} injectCallback - Function to handle injection (receives the element)
 */
async function loadComponent(componentPath, selector, injectCallback) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            return; // Fail silently
        }
        const componentHTML = await response.text();
        
        // Create a temporary container to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = componentHTML;
        
        // Get the target element
        const element = tempDiv.querySelector(selector);
        
        if (element && injectCallback) {
            injectCallback(element);
        }
    } catch (error) {
        // Fail silently
    }
}

// Initializes all shared layout components
function initLayout() {
    // Load footer component
    loadComponent('./components/footer.html', 'footer', (footer) => {
        document.body.appendChild(footer);
    });
}

// Initialize layout when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayout);
} else {
    initLayout();
}

