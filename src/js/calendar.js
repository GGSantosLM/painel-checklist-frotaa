/* ============================================
   Calendar Component
   Handles month navigation, day rendering,
   and date selection.
   ============================================ */

class CalendarComponent {
    constructor({ containerId, monthLabelId, prevBtnId, nextBtnId, clearBtnId, displayId, onDateSelect }) {
        this.container = document.getElementById(containerId);
        this.monthLabel = document.getElementById(monthLabelId);
        this.prevBtn = document.getElementById(prevBtnId);
        this.nextBtn = document.getElementById(nextBtnId);
        this.clearBtn = document.getElementById(clearBtnId);
        this.display = document.getElementById(displayId);
        this.onDateSelect = onDateSelect;

        this.today = new Date();
        this.currentYear = this.today.getFullYear();
        this.currentMonth = this.today.getMonth();
        this.selectedDate = null;
        this.datesWithData = new Set();

        this._bindEvents();
        this.render();
    }

    /** Set which dates have data (array of 'YYYY-MM-DD' strings) */
    setDatesWithData(dates) {
        this.datesWithData = new Set(dates);
        this.render();
    }

    /** Navigate to a specific month/year */
    goTo(year, month) {
        this.currentYear = year;
        this.currentMonth = month;
        this.render();
    }

    /** Get current month/year */
    getMonth() {
        return { year: this.currentYear, month: this.currentMonth };
    }

    /** Get selected date as 'YYYY-MM-DD' or null */
    getSelectedDate() {
        return this.selectedDate;
    }

    /** Clear selected date */
    clearSelection() {
        this.selectedDate = null;
        this.display.textContent = '';
        this.render();
        this.onDateSelect(null);
    }

    /** Render the calendar grid */
    render() {
        const year = this.currentYear;
        const month = this.currentMonth;

        // Month label
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        this.monthLabel.textContent = `${monthNames[month]} ${year}`;

        // First day of month (0=Sun)
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Build grid
        this.container.innerHTML = '';

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day cal-day--empty';
            this.container.appendChild(cell);
        }

        // Day cells
        for (let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day';
            cell.textContent = d;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            // Today highlight
            if (year === this.today.getFullYear() &&
                month === this.today.getMonth() &&
                d === this.today.getDate()) {
                cell.classList.add('cal-day--today');
            }

            // Has data indicator
            if (this.datesWithData.has(dateStr)) {
                cell.classList.add('cal-day--has-data');
            }

            // Selected
            if (this.selectedDate === dateStr) {
                cell.classList.add('cal-day--selected');
            }

            // Click handler
            cell.addEventListener('click', () => {
                this.selectedDate = dateStr;
                this.display.textContent = this._formatDatePtBR(dateStr);
                this.render();
                this.onDateSelect(dateStr);
            });

            this.container.appendChild(cell);
        }
    }

    _formatDatePtBR(dateStr) {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }

    _bindEvents() {
        this.prevBtn.addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.selectedDate = null;
            this.display.textContent = '';
            this.render();
            this.onDateSelect(null, true); // true = month changed
        });

        this.nextBtn.addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.selectedDate = null;
            this.display.textContent = '';
            this.render();
            this.onDateSelect(null, true);
        });

        this.clearBtn.addEventListener('click', () => {
            this.clearSelection();
        });
    }
}
