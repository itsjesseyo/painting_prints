// PWA Install Functionality
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.installButton = document.getElementById('install-btn');
        
        // Register service worker
        this.registerServiceWorker();
        
        // Set up install prompt listeners
        this.setupInstallPrompt();
        
        // Check if already installed
        this.checkInstallStatus();
        
        // Set up install button click handler
        if (this.installButton) {
            this.installButton.addEventListener('click', () => this.handleInstallClick());
        }
        
        // Listen for app installed event
        window.addEventListener('appinstalled', () => this.handleAppInstalled());
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                console.log('PWA: Registering service worker');
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                
                registration.addEventListener('updatefound', () => {
                    console.log('PWA: Update available');
                    this.showUpdateAvailable();
                });
                
                console.log('PWA: Service worker registered successfully');
            } catch (error) {
                console.error('PWA: Service worker registration failed', error);
            }
        } else {
            console.warn('PWA: Service workers not supported');
        }
    }

    setupInstallPrompt() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (event) => {
            console.log('PWA: Install prompt available');
            
            // Prevent the default prompt
            event.preventDefault();
            
            // Store the event for later use
            this.deferredPrompt = event;
            
            // Show install button
            this.showInstallButton();
        });
    }

    checkInstallStatus() {
        // Check if running as PWA
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            console.log('PWA: Running as installed app');
            this.isInstalled = true;
            this.hideInstallButton();
            this.hideAppBanner();
        }
        
        // Check if installed via Chrome
        if ('getInstalledRelatedApps' in navigator) {
            navigator.getInstalledRelatedApps().then(apps => {
                if (apps.length > 0) {
                    console.log('PWA: App is installed');
                    this.isInstalled = true;
                    this.hideInstallButton();
                    this.hideAppBanner();
                }
            });
        }
    }

    showInstallButton() {
        if (this.installButton && !this.isInstalled) {
            this.installButton.classList.remove('hidden');
            console.log('PWA: Install button shown');
        }
    }

    hideInstallButton() {
        if (this.installButton) {
            this.installButton.classList.add('hidden');
            console.log('PWA: Install button hidden');
        }
    }

    hideAppBanner() {
        const appBanner = document.getElementById('app-banner');
        if (appBanner) {
            appBanner.style.display = 'none';
            console.log('PWA: App banner hidden for installed app');
        }
    }

    async handleInstallClick() {
        if (!this.deferredPrompt) {
            console.warn('PWA: No install prompt available');
            return;
        }

        try {
            // Show install prompt
            console.log('PWA: Showing install prompt');
            this.deferredPrompt.prompt();
            
            // Wait for user response
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('PWA: User accepted install prompt');
                this.trackInstallEvent('accepted');
            } else {
                console.log('PWA: User dismissed install prompt');
                this.trackInstallEvent('dismissed');
            }
            
            // Clear the deferred prompt
            this.deferredPrompt = null;
            this.hideInstallButton();
            
        } catch (error) {
            console.error('PWA: Install prompt failed', error);
        }
    }

    handleAppInstalled() {
        console.log('PWA: App was installed');
        this.isInstalled = true;
        this.hideInstallButton();
        this.hideAppBanner();
        this.trackInstallEvent('installed');
        
        // Try to set default window size for browsers that support it
        this.setDefaultWindowSize();
        
        // Show success message
        this.showInstallSuccess();
    }

    setDefaultWindowSize() {
        // For browsers that support window resizing in PWAs
        if (window.resizeTo && window.screen) {
            try {
                // Set to 1200x900 as specified in manifest
                window.resizeTo(1200, 900);
                console.log('PWA: Window size set to 1200x900');
            } catch (error) {
                console.log('PWA: Window resize not supported', error);
            }
        }
    }

    showUpdateAvailable() {
        // Only show update banner for installed PWAs
        if (!this.isInstalled) {
            console.log('PWA: Update available but app not installed, skipping banner');
            return;
        }
        
        // Create update notification
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        
        // Position based on app banner visibility
        const appBanner = document.getElementById('app-banner');
        if (appBanner && appBanner.style.display === 'none') {
            updateBanner.style.top = '20px';
        } else {
            updateBanner.style.top = '60px';
        }
        updateBanner.innerHTML = `
            <div class="update-content">
                <span>🔄 New version available!</span>
                <button class="update-btn">Update</button>
                <button class="update-dismiss">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(updateBanner);
        
        // Handle update button
        updateBanner.querySelector('.update-btn').addEventListener('click', () => {
            this.handleUpdate();
            updateBanner.remove();
        });
        
        // Handle dismiss button
        updateBanner.querySelector('.update-dismiss').addEventListener('click', () => {
            updateBanner.remove();
        });
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (updateBanner.parentNode) {
                updateBanner.remove();
            }
        }, 10000);
    }

    async handleUpdate() {
        try {
            // Tell service worker to skip waiting
            const registration = await navigator.serviceWorker.ready;
            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            
            // Reload page to get new version
            window.location.reload();
            
        } catch (error) {
            console.error('PWA: Update failed', error);
        }
    }

    showInstallSuccess() {
        // Create success notification
        const successBanner = document.createElement('div');
        successBanner.className = 'install-success';
        successBanner.innerHTML = `
            <div class="success-content">
                <span>✅ Paint2Print installed successfully!</span>
                <button class="success-dismiss">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(successBanner);
        
        // Handle dismiss button
        successBanner.querySelector('.success-dismiss').addEventListener('click', () => {
            successBanner.remove();
        });
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (successBanner.parentNode) {
                successBanner.remove();
            }
        }, 5000);
    }

    trackInstallEvent(action) {
        // Track install events for analytics
        console.log(`PWA: Install event - ${action}`);
        
        // You can add analytics tracking here
        // Example: gtag('event', 'pwa_install', { action });
    }

    // Public API
    canInstall() {
        return this.deferredPrompt !== null && !this.isInstalled;
    }

    isAppInstalled() {
        return this.isInstalled;
    }

    async triggerInstall() {
        if (this.canInstall()) {
            return this.handleInstallClick();
        }
        return Promise.resolve();
    }
}

// Initialize PWA installer
const pwaInstaller = new PWAInstaller();

// Export for use in other modules
window.pwaInstaller = pwaInstaller;