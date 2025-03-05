interface ChamadoFilters {
    status: string;
    searchTerm: string;
}

class ChamadosManager {
    private filters: ChamadoFilters = {
        status: 'todos',
        searchTerm: ''
    };

    private readonly tableBody: HTMLElement;
    private readonly searchInput: HTMLInputElement;
    private readonly filterButtons: NodeListOf<HTMLElement>;

    constructor() {
        this.tableBody = document.querySelector('.chamados-table tbody')!;
        this.searchInput = document.querySelector('.chamados-search')!;
        this.filterButtons = document.querySelectorAll('.filter-btn');

        this.initializeEventListeners();
        this.initializeAnimations();
    }

    private initializeEventListeners(): void {
        // Search functionality
        this.searchInput?.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            this.filters.searchTerm = target.value.toLowerCase();
            this.filterChamados();
        });

        // Filter buttons
        this.filterButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filters.status = btn.dataset.status || 'todos';
                this.filterChamados();
            });
        });
    }

    private filterChamados(): void {
        const rows = this.tableBody?.querySelectorAll('tr');
        
        rows?.forEach(row => {
            const title = row.querySelector('.chamado-titulo')?.textContent?.toLowerCase() || '';
            const status = row.querySelector('.chamado-status')?.textContent?.toLowerCase() || '';
            const matchesSearch = title.includes(this.filters.searchTerm);
            const matchesStatus = this.filters.status === 'todos' || status === this.filters.status.toLowerCase();
            
            if (matchesSearch && matchesStatus) {
                row.classList.remove('hidden');
                this.animateRow(row as HTMLElement);
            } else {
                row.classList.add('hidden');
            }
        });
    }

    private initializeAnimations(): void {
        // Animate rows on page load
        const rows = this.tableBody?.querySelectorAll('tr');
        rows?.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                row.style.transition = 'all 0.3s ease-out';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    private animateRow(row: HTMLElement): void {
        row.style.animation = 'none';
        row.offsetHeight; // Trigger reflow
        row.style.animation = 'slideIn 0.3s ease-out';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChamadosManager();
});

// Add types for custom elements
declare global {
    interface HTMLElementTagNameMap {
        'chamados-table': HTMLElement;
        'chamados-search': HTMLInputElement;
    }
}
