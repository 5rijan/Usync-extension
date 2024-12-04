/**
 * Represents a calendar manager that handles calendar operations.
 */
class CalendarManager {
    /**
     * Initializes the calendar manager.
     */
    constructor() {
      this.subscribedCalendar = null; // The URL of the subscribed calendar.
      this.events = {}; // A dictionary of events, keyed by date.
      this.currentDate = new Date(); // The current date being displayed.
      this.initializeElements(); // Initializes the DOM elements.
      this.loadSavedData(); // Loads saved calendar data from localStorage.
      this.addEventListeners(); // Adds event listeners for calendar navigation and subscription.
      this.renderCalendar(); // Renders the calendar for the current date.
    }
  
    /**
     * Initializes the DOM elements used by the calendar.
     */
    initializeElements() {
      this.monthYearLabel = document.getElementById("month-year"); // The label displaying the current month and year.
      this.daysContainer = document.getElementById("days"); // The container for the days of the month.
      this.prevMonthButton = document.getElementById("prev-month"); // The button for navigating to the previous month.
      this.nextMonthButton = document.getElementById("next-month"); // The button for navigating to the next month.
      this.currentMonthButton = document.getElementById("current-month"); // The button for navigating to the current month.
      this.subscribeButton = document.getElementById("subscribe-calendar"); // The button for subscribing to a calendar.
      this.subscribePopup = document.getElementById("subscribe-popup"); // The popup for subscribing to a calendar.
      this.modalOverlay = document.getElementById("modal-overlay"); // The overlay for the subscribe popup.
    }
  
    /**
     * Loads saved calendar data from localStorage.
     */
    loadSavedData() {
      const storedData = localStorage.getItem("calendarData");
      if (storedData) {
        const { subscribedCalendar, events } = JSON.parse(storedData);
        this.subscribedCalendar = subscribedCalendar;
        this.events = events || {};
        console.log("Loaded saved data:", { subscribedCalendar, events });
      }
    }
  
    /**
     * Saves the current calendar data to localStorage.
     */
    saveCalendarData() {
      const calendarData = {
        subscribedCalendar: this.subscribedCalendar,
        events: this.events
      };
      localStorage.setItem("calendarData", JSON.stringify(calendarData));
      console.log("Saved calendar data:", calendarData);
    }
  
    /**
     * Adds event listeners for calendar navigation and subscription.
     */
    addEventListeners() {
      // Navigation listeners
      this.prevMonthButton.addEventListener("click", () => this.navigateMonth(-1));
      this.nextMonthButton.addEventListener("click", () => this.navigateMonth(1));
      this.currentMonthButton.addEventListener("click", () => this.goToCurrentMonth());
  
      // Subscribe button listeners
      this.monthYearLabel.addEventListener("click", () => this.showSubscribePopup());
      document.getElementById("confirm-subscribe").addEventListener("click", () => this.handleSubscribe());
      document.getElementById("cancel-subscribe").addEventListener("click", () => this.hideSubscribePopup());
  
      // Day click listener
      this.daysContainer.addEventListener("click", (e) => this.handleDayClick(e));
  
      // Modal overlay click
      this.modalOverlay.addEventListener("click", () => this.hideSubscribePopup());
    }
  
    /**
     * Renders the calendar for the current date.
     */
    renderCalendar() {
      this.daysContainer.innerHTML = "";
  
      const currentMonth = this.currentDate.getMonth();
      const currentYear = this.currentDate.getFullYear();
  
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const daysInPreviousMonth = new Date(currentYear, currentMonth, 0).getDate();
  
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      this.monthYearLabel.textContent = `${months[currentMonth]} ${currentYear}`;
  
      // Previous month's days
      for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const day = document.createElement("div");
        day.className = "day previous-month-day";
        day.textContent = daysInPreviousMonth - i;
        this.daysContainer.appendChild(day);
      }
  
      // Current month's days
      for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement("div");
        dayElement.className = "day";
        dayElement.textContent = day;
  
        const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        if (this.events[fullDate]) {
          dayElement.classList.add("has-events");
        }
  
        const today = new Date();
        if (
          day === today.getDate() &&
          currentMonth === today.getMonth() &&
          currentYear === today.getFullYear()
        ) {
          dayElement.classList.add("current-day");
        }
        this.daysContainer.appendChild(dayElement);
      }
  
      // Next month's days
      const totalCells = this.daysContainer.children.length;
      const remainingCells = 42 - totalCells;
      for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement("div");
        day.className = "day next-month-day";
        day.textContent = i;
        this.daysContainer.appendChild(day);
      }
    }
  
    /**
     * Navigates to a month relative to the current month.
     * @param {number} delta - The number of months to navigate. Positive for next month, negative for previous month.
     */
    navigateMonth(delta) {
      this.currentDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() + delta,
        1
      );
      this.renderCalendar();
    }
  
    /**
     * Navigates to the current month.
     */
    goToCurrentMonth() {
      this.currentDate = new Date();
      this.renderCalendar();
    }
  
    /**
     * Shows the subscribe popup.
     */
    showSubscribePopup() {
      this.subscribePopup.style.display = "block";
      this.modalOverlay.style.display = "block";
    }
  
    /**
     * Hides the subscribe popup.
     */
    hideSubscribePopup() {
      this.subscribePopup.style.display = "none";
      this.modalOverlay.style.display = "none";
    }
  
    /**
     * Handles the subscription to a calendar.
     */
    async handleSubscribe() {
      const calendarUrl = document.getElementById("calendar-url").value.trim();
      if (!calendarUrl) {
        alert("Please enter a calendar URL");
        return;
      }
  
      try {
        const response = await fetch(calendarUrl);
        if (!response.ok) throw new Error("Failed to fetch calendar data");
  
        const icalData = await response.text();
        console.log("Received .ics text:", icalData);
  
        // Parse iCal data and update events
        this.events = await this.parseICalData(icalData);
        this.subscribedCalendar = calendarUrl;
  
        console.log("Events before saving:", JSON.stringify(this.events, null, 2));
        this.hideSubscribePopup();
        this.saveCalendarData();
        this.renderCalendar();
      } catch (error) {
        console.error("Error fetching or parsing calendar:", error);
        alert("Failed to fetch or parse the calendar. Check the URL and try again.");
      }
    }
  
    /**
     * Handles the click event on a day in the calendar.
     * @param {Event} e - The event object.
     */
    handleDayClick(e) {
      if (!e.target.classList.contains("day") || 
          e.target.classList.contains("previous-month-day") || 
          e.target.classList.contains("next-month-day")) return;
  
      // Remove previous selection
      const previouslySelected = this.daysContainer.querySelector(".selected-day");
      if (previouslySelected) {
        previouslySelected.classList.remove("selected-day");
      }
  
      // Add selection to clicked day
      e.target.classList.add("selected-day");
  
      const selectedDay = e.target.textContent;
      const selectedDate = `${this.currentDate.getFullYear()}-${String(this.currentDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
      
      this.showEvents(selectedDate);
    }
  
    /**
     * Shows the events for a given date.
     * @param {string} selectedDate - The date to show events for.
     */
    showEvents(selectedDate) {
      const eventsForDay = this.events[selectedDate] || [];
      const eventList = document.getElementById("event-list");
      eventList.innerHTML = '';
  
      if (eventsForDay.length > 0) {
        eventsForDay.forEach(event => {
          const startDateTime = this.parseICALDateTime(event.startTime);
          const endDateTime = this.parseICALDateTime(event.endTime);
  
          const timeFormat = { hour: 'numeric', minute: '2-digit', hour12: true };
          const startTime = startDateTime.toLocaleTimeString('en-US', timeFormat);
          const endTime = endDateTime.toLocaleTimeString('en-US', timeFormat);
  
          const eventCard = document.createElement("div");
          eventCard.className = "event-card";
          eventCard.innerHTML = `
            <div class="event-details">
              <h3 class="event-title">${event.title}</h3>
              <p class="event-time">${startTime} - ${endTime}</p>
              ${event.location ? `<p class="event-location">📍 ${event.location}</p>` : ''}
            </div>
          `;
          eventList.appendChild(eventCard);
        });
        
        // Simply show events section
        const eventsSection = document.getElementById("events-section");
        eventsSection.style.display = "block";
        document.body.classList.add("showing-events");
      } else {
        // Simply hide events section
        const eventsSection = document.getElementById("events-section");
        eventsSection.style.display = "none";
        document.body.classList.remove("showing-events");
      }
    }
  
    /**
     * Parses an iCal datetime string into a Date object.
     * @param {string} icalString - The iCal datetime string.
     * @returns {Date} The parsed Date object.
     */
    parseICALDateTime(icalString) {
      const year = icalString.slice(0, 4);
      const month = icalString.slice(4, 6);
      const day = icalString.slice(6, 8);
      const hour = icalString.slice(9, 11);
      const minute = icalString.slice(11, 13);
      
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    }
  
    /**
     * Parses iCal data and returns a dictionary of events.
     * @param {string} icalText - The iCal data as a string.
     * @returns {Promise} A promise that resolves to a dictionary of events.
     */
    async parseICalData(icalText) {
      const events = {};
      try {
        const parsedData = ICAL.parse(icalText);
        console.log("Parsed Data:", parsedData);

        const component = new ICAL.Component(parsedData);
        const vevents = component.getAllSubcomponents("vevent");

        console.log("Found vevents:", vevents);

        vevents.forEach(eventComponent => {
          const event = new ICAL.Event(eventComponent);
          const startDate = event.startDate.toString();
          const year = startDate.slice(0, 4);
          let month = startDate.slice(5, 7);
          let day = startDate.slice(8, 10);

          // Ensure month and day are two digits
          if (month.length === 1) month = `0${month}`;
          if (day.length === 1) day = `0${day}`;

          const date = `${year}-${month}-${day}`;

          // Store events for the specific date
          if (!events[date]) events[date] = [];
          events[date].push({
            title: event.summary,
            location: event.location,
            startTime: event.startDate.toICALString(),
            endTime: event.endDate.toICALString(),
          });
        });

        console.log("Parsed Events (final):", JSON.stringify(events, null, 2));
      } catch (error) {
        console.error("Error parsing the iCal data:", error);
        throw error; // Re-throw to handle in handleSubscribe
      }

      return events;
    }

    // Initialize calendar when loaded
    static init() {
        window.calendarManager = new CalendarManager();
    }
}

// Initialize calendar when loaded
window.calendarInit = function() {
    CalendarManager.init();
};