/**
 * Pyodide Loader - Loads Python runtime for browser execution
 */

let pyodideInstance: any = null;
let loadingPromise: Promise<any> | null = null;

/**
 * Load Pyodide (Python runtime for the browser)
 * This is loaded lazily when user selects Python
 */
export async function loadPyodide(): Promise<any> {
    // Return existing instance if already loaded
    if (pyodideInstance) {
        return pyodideInstance;
    }

    // Return existing loading promise if currently loading
    if (loadingPromise) {
        return loadingPromise;
    }

    // Start loading
    loadingPromise = (async () => {
        try {
            // Load Pyodide from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
            document.head.appendChild(script);

            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });

            // Initialize Pyodide
            if (typeof (window as any).loadPyodide === 'undefined') {
                throw new Error('Pyodide failed to load');
            }

            const pyodide = await (window as any).loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
            });

            pyodideInstance = pyodide;
            (window as any).pyodide = pyodide;

            console.log('Pyodide loaded successfully');
            return pyodide;
        } catch (error) {
            console.error('Failed to load Pyodide:', error);
            loadingPromise = null;
            throw error;
        }
    })();

    return loadingPromise;
}

/**
 * Check if Pyodide is loaded
 */
export function isPyodideLoaded(): boolean {
    return pyodideInstance !== null;
}

/**
 * Get Pyodide instance (returns null if not loaded)
 */
export function getPyodide(): any {
    return pyodideInstance;
}