// Personal Page TypeScript Implementation
// Tab navigation and interactive functionality

interface TabElement extends HTMLElement {
    dataset: {
        tab: string;
    };
}

class PersonalPage {
    private activeTab: string = 'home';
    private tabContents: NodeListOf<Element>;
    private navLinks: NodeListOf<TabElement>;

    constructor() {
        this.tabContents = document.querySelectorAll('.tab-content');
        this.navLinks = document.querySelectorAll('.nav-link') as NodeListOf<TabElement>;
        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        // Only show tab if there are tab contents on this page
        if (this.tabContents.length > 0) {
            this.showTab(this.activeTab);
        }
    }

    private setupEventListeners(): void {
        // Add click event listeners to navigation links (only for single-page navigation)
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e: Event) => {
                const targetTab = (e.target as TabElement).dataset.tab;
                // Only prevent default if it's a tab navigation (has data-tab attribute)
                if (targetTab) {
                    e.preventDefault();
                    this.switchTab(targetTab);
                }
                // If no data-tab attribute, let the link navigate normally
            });
        });

        // Add keyboard navigation support
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            this.handleKeyboardNavigation(e);
        });

        // Add smooth scrolling for better UX
        this.setupSmoothScrolling();
    }

    private switchTab(tabName: string): void {
        if (tabName === this.activeTab) return;

        // Hide current active tab
        this.hideTab(this.activeTab);
        
        // Show new tab
        this.showTab(tabName);
        
        // Update active navigation link
        this.updateActiveNavLink(tabName);
        
        // Update active tab
        this.activeTab = tabName;

        // Add animation class for smooth transition
        this.animateTabSwitch(tabName);
    }

    private showTab(tabName: string): void {
        const tabElement = document.getElementById(tabName);
        if (tabElement) {
            tabElement.classList.add('active');
            tabElement.style.display = 'block';
        }
    }

    private hideTab(tabName: string): void {
        const tabElement = document.getElementById(tabName);
        if (tabElement) {
            tabElement.classList.remove('active');
            tabElement.style.display = 'none';
        }
    }

    private updateActiveNavLink(tabName: string): void {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.tab === tabName) {
                link.classList.add('active');
            }
        });
    }

    private animateTabSwitch(tabName: string): void {
        const tabElement = document.getElementById(tabName);
        if (tabElement) {
            // Add fade-in animation
            tabElement.style.opacity = '0';
            tabElement.style.transform = 'translateY(20px)';
            
            requestAnimationFrame(() => {
                tabElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                tabElement.style.opacity = '1';
                tabElement.style.transform = 'translateY(0)';
            });
        }
    }

    private handleKeyboardNavigation(e: KeyboardEvent): void {
        // Allow tab navigation with arrow keys
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.switchTab('home');
                    break;
                case '2':
                    e.preventDefault();
                    this.switchTab('about');
                    break;
                case '3':
                    e.preventDefault();
                    this.switchTab('sites');
                    break;
            }
        }
    }

    private setupSmoothScrolling(): void {
        // Add smooth scrolling to all internal links
        const internalLinks = document.querySelectorAll('a[href^="#"]');
        internalLinks.forEach(link => {
            link.addEventListener('click', (e: Event) => {
                e.preventDefault();
                const targetId = (e.target as HTMLAnchorElement).getAttribute('href')?.substring(1);
                if (targetId) {
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    // Public method to get current active tab
    public getActiveTab(): string {
        return this.activeTab;
    }

    // Public method to programmatically switch tabs
    public goToTab(tabName: string): void {
        this.switchTab(tabName);
    }

    // Method to add dynamic content loading (for future enhancements)
    public loadDynamicContent(tabName: string, content: string): void {
        const tabElement = document.getElementById(tabName);
        if (tabElement) {
            const contentContainer = tabElement.querySelector('.dynamic-content');
            if (contentContainer) {
                contentContainer.innerHTML = content;
            }
        }
    }
}

// Utility functions for enhanced functionality
class PageUtils {
    // Debounce function for performance optimization
    public static debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Check if element is in viewport
    public static isInViewport(element: Element): boolean {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Animate elements on scroll
    public static animateOnScroll(): void {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, {
            threshold: 0.1
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the personal page
    const personalPage = new PersonalPage();
    
    // Initialize scroll animations
    PageUtils.animateOnScroll();
    
    // Add loading animation
    document.body.classList.add('loaded');
    
    // Log successful initialization
    console.log('Personal Page initialized successfully');
    console.log('Active tab:', personalPage.getActiveTab());
    
    // Add some interactive enhancements
    enhanceUserExperience();
});

// Additional enhancements for better user experience
function enhanceUserExperience(): void {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.card, .site-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('hovered');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hovered');
        });
    });

    // Add click tracking for analytics (placeholder)
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonText = (e.target as HTMLElement).textContent;
            console.log(`Button clicked: ${buttonText}`);
            // Here you could send analytics data
        });
    });

    // Add keyboard shortcuts info
    document.addEventListener('keydown', (e) => {
        if (e.key === '?' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            showKeyboardShortcuts();
        }
    });
}

// Show keyboard shortcuts help
function showKeyboardShortcuts(): void {
    const shortcuts = [
        'Ctrl/Cmd + 1: Go to Home',
        'Ctrl/Cmd + 2: Go to About',
        'Ctrl/Cmd + 3: Go to Related Sites',
        'Ctrl/Cmd + ?: Show this help'
    ];
    
    alert('Keyboard Shortcuts:\n\n' + shortcuts.join('\n'));
}

// Export for potential module usage
export { PersonalPage, PageUtils };