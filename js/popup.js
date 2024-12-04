// Tab Manager Class
class TabManager {
    /**
     * Constructor for TabManager class
     */
    constructor() {
        this.tabs = document.querySelectorAll(".tab");
        this.tabContent = document.getElementById("tab-content");
        this.currentTab = "calendar";

        this.init();
    }

    /**
     * Initialize the TabManager
     */
    async init() {
        await this.loadTabContent("calendar");
        this.addTabListeners();
    }

    /**
     * Add event listeners to tabs
     */
    addTabListeners() {
        this.tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const tabId = tab.id.replace("tab-", "");
                this.switchTab(tabId);
            });
        });
    }

    /**
     * Switch the active tab
     * @param {string} tabId - The id of the tab to switch to
     */
    async switchTab(tabId) {

        // Clear active state of the old tab
        this.tabs.forEach((tab) => tab.classList.remove("active"));

        // Add active state to the new tab
        document.getElementById(`tab-${tabId}`).classList.add("active");

        await this.loadTabContent(tabId);

        // After content is loaded, allow the height to adjust dynamically
        setTimeout(() => {
            document.body.style.height = "auto"; // Let it adapt dynamically
        }, 300);

        this.currentTab = tabId;
    }

    /**
     * Load the content of a tab
     * @param {string} tabId - The id of the tab to load
     */
    async loadTabContent(tabId) {
        try {
            const response = await fetch(`components/${tabId}.html`);
            if (response.ok) {
                const html = await response.text();
                this.tabContent.innerHTML = html;

                // Make the tab-content visible
                const contentElement = document.querySelector(`#${tabId}-content`);
                if (contentElement) {
                    contentElement.classList.add("active");
                }

                // Initialize feature-specific JS
                if (window[`${tabId}Init`]) {
                    window[`${tabId}Init`]();
                }
            } else {
                console.error(`Failed to load ${tabId} content.`);
            }
        } catch (error) {
            console.error(`Error loading ${tabId} content:`, error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tabManager = new TabManager();
});
