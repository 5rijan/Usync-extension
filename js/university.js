// Initialize the university tab
window.universityInit = function () {
  console.log("University tab initialized");
  let isRendering = false;
  const contentSelector = document.getElementById("content-selector");
  const contentContainer = document.querySelector(".content-container");
  const weatherDescription = document.getElementById("weather-description");

  // Fetch events from the backend
  async function fetchEvents() {
    try {
      const response = await fetch("https://usu.edu.au/page-data/events/page-data.json");
      const data = await response.json();
      const events = data.result.data.allWpEvent.nodes;
      return events;
    } catch (error) {
      console.error("Failed to fetch events:", error);
      return [];
    }
  }

  // Fetch library data directly from the backend
  async function fetchLibraries() {
    const url = "https://usyd.libcal.com/api_hours_today.php?iid=1447&format=json";
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch library data:", error);
      return null;
    }
  }

  // Fetch current occupation for Fisher and Herbert Smith Law Library
  async function fetchLibraryOccupancy() {
    const fisherUrl = "https://vemcount.app/embed/data/kQRVpG6r0lHU7QM?locale=en";
    const lawLibraryUrl = "https://vemcount.app/embed/data/fto1unIGVbpWSrk?locale=en";

    try {
      const [fisherResponse, lawLibraryResponse] = await Promise.all([
        fetch(fisherUrl),
        fetch(lawLibraryUrl)
      ]);

      const fisherData = await fisherResponse.json();
      const lawLibraryData = await lawLibraryResponse.json();

      return {
        fisher: fisherData.value,
        lawLibrary: lawLibraryData.value
      };
    } catch (error) {
      console.error("Failed to fetch library occupancy:", error);
      return { fisher: null, lawLibrary: null };
    }
  }

  // Format date from "YYYYMMDD" to "21 Jan"
  function formatDate(dateString) {
    const year = dateString.slice(0, 4);
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${monthNames[parseInt(month, 10) - 1]}`;
  }

  // Display events
  function displayEvents(events) {
    contentContainer.innerHTML = ""; // Clear existing content

    if (events.length === 0) {
      contentContainer.innerHTML = "<p>No events found.</p>";
      return;
    }

    events.forEach((event) => {
      const eventTitle = event.title || "No Title Available";
      const eventClub = event.eventFieldsSide?.club?.title || "No Club Available";
      const startDate = event.eventFieldsSide?.startDate || "Invalid Start Date";
      const endDate = event.eventFieldsSide?.endDate || "Invalid End Date";
      const startTime = event.eventFieldsSide?.startTime || "";
      const endTime = event.eventFieldsSide?.endTime || "";

      const eventCard = document.createElement("div");
      eventCard.classList.add("event-card-wrapper");
      eventCard.innerHTML = `
        <a href="https://usu.edu.au/${event.uri}" target="_blank" class="event-card">
          <h3 class="event-title">${eventTitle}</h3>
          <div class="club-title">${eventClub}<br>${formatDate(startDate)} - ${formatDate(endDate)} | ${startTime} - ${endTime}</div>
        </a>
      `;
      contentContainer.appendChild(eventCard);
    });
  }
  async function displayLibraries() {
    const data = await fetchLibraries();
    contentContainer.innerHTML = ""; // Clear existing content
  
    if (!data || !data.locations) {
      contentContainer.innerHTML = "<p>No library data available.</p>";
      return;
    }
  
    const libraryOccupancy = await fetchLibraryOccupancy();
  
    const libraries = data.locations.filter(loc => loc.category === "library");
    const departments = data.locations.filter(loc => loc.category === "department");
  
    // Group departments by parent library ID
    const departmentsByLibrary = {};
    departments.forEach(dep => {
      const parentId = dep.parent_lid;
      if (!departmentsByLibrary[parentId]) {
        departmentsByLibrary[parentId] = [];
      }
      departmentsByLibrary[parentId].push(dep);
    });
  
    const sortedLibraries = libraries.sort((a, b) => {
      if (a.name === "Fisher Library" || a.name === "Herbert Smith Freehills Law Library") return -1;
      if (b.name === "Fisher Library" || b.name === "Herbert Smith Freehills Law Library") return 1;
      return b.times.currently_open - a.times.currently_open;
    });
  
    sortedLibraries.forEach(library => {
      const isOpen = library.times.currently_open;
      const facilities = departmentsByLibrary[library.lid] || [];
      const facilityList = facilities.map(facility => `
        <li>${facility.name} - 
          <span style="color: ${facility.times.currently_open ? 'green' : 'red'};">
            ${facility.times.currently_open ? 'Open' : 'Closed'}
          </span>
        </li>
      `).join("");
      
  
      const card = document.createElement("div");
      card.classList.add("library-card");
      const statusCircle = `
      <span class="status-circle" style="
        background-color: ${isOpen ? 'green' : 'red'};
        width: 8px;
        height: 8px;
        min-width: 8px; /* Ensures consistent width */
        border-radius: 50%;
        display: inline-block;
      "></span>
    `;
  
      const totalSeats = library.name === "Fisher Library" ? 2620 : library.name === "Herbert Smith Freehills Law Library" ? 646 : null;
      const occupancy = library.name === "Fisher Library"
        ? libraryOccupancy.fisher
        : library.name === "Herbert Smith Freehills Law Library"
        ? libraryOccupancy.lawLibrary
        : null;
  
      const occupancyInfo = occupancy !== null
        ? `<p><strong>Occupied:</strong> ${occupancy} (${((occupancy / totalSeats) * 100).toFixed(2)}%)</p>`
        : "";
  
      card.innerHTML = `
        <div class="library-header">
          <h3>${statusCircle}${library.name}</h3>
        </div>
        <div class="library-details">
          <p><strong>${library.desc || "No description available."}</strong></p>
          <p><strong>Hours:</strong> ${library.rendered}</p>
          ${occupancyInfo}
          <p><strong>Facilities:</strong></p>
          <ul>${facilityList || "<li>No additional facilities</li>"}</ul>
        </div>
      `;
  
      const header = card.querySelector(".library-header");
      const details = card.querySelector(".library-details");
  
      header.addEventListener("click", () => {
        const isExpanded = details.style.display === "block";
        details.style.display = isExpanded ? "none" : "block";
      });
  
      contentContainer.appendChild(card);
    });
  }
    
  // Fetch and display content based on selected option
  async function loadContent(option) {
    if (option === "events") {
      const events = await fetchEvents();
      displayEvents(events);
    } else if (option === "library") {
      const data = await fetchLibraries();
    }
  }

  // Update weather every 10 minutes
  async function fetchWeather() {
    try {
      const response = await fetch("https://wttr.in/Sydney?format=%C+|+%t");
      const weatherData = await response.text();
      weatherDescription.textContent = weatherData.trim();
    } catch (error) {
      console.error("Failed to fetch weather:", error);
      weatherDescription.textContent = "N/A | --°C";
    }
  }

  // Fetch food data from the backend
  async function fetchFoodData() {
    try {
      const response = await fetch("data/Eats/eats_locations.csv");
      const text = await response.text();
      const rows = text.split("\n").slice(1); // Skip the header row
      return rows.map(row => {
        const [location, name, url, days, timings, menu] = row.split(",");
        return { 
          location, 
          name, 
          url, 
          days, 
          timings, 
          menu: menu ? menu.trim() === "Yes" : false 
        };
      });
      
    } catch (error) {
      console.error("Failed to fetch food data:", error);
      return [];
    }
  }

  // Check if a location is currently open
  function isCurrentlyOpen(days, timings) {
    if (!days || !timings) return false; // Ensure valid inputs
    
    const now = new Date();
    const sydneyOffset = 11; // Adjust for Sydney time
    now.setHours(now.getUTCHours() + sydneyOffset);
    const currentDay = now.toLocaleString("en-AU", { weekday: "long" });
    const currentTime = now.getHours() + now.getMinutes() / 60;
  
    // Define full week of days
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
    // Check if the days input is a range
    if (days.includes('-')) {
      const [startDay, endDay] = days.split('-');
      const startIndex = daysOfWeek.indexOf(startDay.trim());
      const endIndex = daysOfWeek.indexOf(endDay.trim());
      const currentDayIndex = daysOfWeek.indexOf(currentDay);
  
      // Check if current day is within the range
      let isInRange;
      if (startIndex <= endIndex) {
        isInRange = currentDayIndex >= startIndex && currentDayIndex <= endIndex;
      } else {
        // Handle wrap-around case (e.g., Friday-Monday)
        isInRange = currentDayIndex >= startIndex || currentDayIndex <= endIndex;
      }
  
      if (!isInRange) return false;
    } else {
      // If not a range, check for exact day match
      if (!days.split(',').map(d => d.trim()).includes(currentDay)) return false;
    }
  
    // Time check remains the same
    const [start, end] = timings.split(" - ").map(t => {
      const [hour, min] = t.split(":");
      const isPM = t.toLowerCase().includes("pm");
      return (parseInt(hour, 10) + (isPM && hour !== "12" ? 12 : 0)) + parseInt(min, 10) / 60;
    });
  
    return currentTime >= start && currentTime <= end;
  }  

  
  // Fetch menu data for a location
  async function fetchMenuData(location) {
    const menuPaths = {
      "Courtyard": "data/Eats/Extracted menu csv/Courtyard.csv",
      "Carslaw": "data/Eats/Extracted menu csv/Carslaw.csv",
      "Abercrombie": "data/Eats/Extracted menu csv/Abercrombie.csv",
      "USUeats Food Caravan on Eastern Ave": "data/Eats/Extracted menu csv/FoodCaravan.csv",
      "Laneway": "data/Eats/Extracted menu csv/Laneway.csv",
      "Manning Cantina": "data/Eats/Extracted menu csv/ManningCantina.csv"
    };
  
    const csvPath = menuPaths[location];
    if (!csvPath) {
      console.warn(`No menu file found for location: ${location}`);
      return {};
    }
  
    try {
      const response = await fetch(csvPath);
      if (!response.ok) {
        console.error(`Failed to fetch menu data for ${location}. Response status:`, response.status);
        return {};
      }
      const text = await response.text();
  
      const rows = text.split("\n").slice(1); // Skip the header row
      return rows.reduce((acc, row) => {
        const [type, name, price, availability, timings] = row.split(',');
        if (!type) return acc;
  
        if (!acc[type]) {
          acc[type] = [];
        }
  
        acc[type].push({ name, price, availability, timings });
        return acc;
      }, {});
    } catch (error) {
      console.error(`Error fetching menu for ${location}:`, error);
      return {};
    }
  }
  
// Modify the displayFoodCards function to support the new filter
async function displayFoodCards(data, category) {
  contentContainer.innerHTML = "";

  // Modify filtering logic to handle the new "menu" category
  let filteredData = data;
  if (category === "all") {
    filteredData = data;
  } else if (category === "menu") {
    // Filter for places with menu available
    filteredData = data.filter(item => item.menu === true);
  } else {
    // Original location-based filtering
    filteredData = data.filter(item => item.location === category);
  }

  // Sort by open status (same as before)
  filteredData.sort((a, b) => isCurrentlyOpen(b.days, b.timings) - isCurrentlyOpen(a.days, a.timings));

  if (filteredData.length === 0) {
    contentContainer.innerHTML = "<p>No food locations found for the selected category.</p>";
    return;
  }

  // Rest of the function remains the same as in the previous implementation
  for (const { location, name, days, timings, menu } of filteredData) {
    const isOpen = isCurrentlyOpen(days, timings);
    const menuData = menu ? await fetchMenuData(name) : {};

    const card = document.createElement("div");
    card.className = "food-card";

    const menuSection = Object.keys(menuData).map(category => `
      <div class="menu-category" data-category="${category}">
        <div class="category-header">
          <span>${category}</span>
          <span class="category-timing">${getAvailableTiming(menuData[category])}</span>
        </div>
        <div class="category-items" style="display:none;">
          ${menuData[category].map(item => `
            <div class="menu-item">
              <div class="item-details">
                <span class="item-name">${item.name}</span>
                <span class="item-availability">${item.availability}</span>
              </div>
              <span class="item-price">$${item.price}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="food-header">
        <h3>
          <span class="status-circle" style="background-color: ${isOpen ? "green" : "red"};"></span>
          ${name}
        </h3>
      </div>
      <div class="food-details" style="display: none;">
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Opening Days:</strong> ${days}</p>
        <p><strong>Timings:</strong> ${timings}</p>
        <p><strong>Menu:</strong> ${menu ? "Available" : "Not Available"}</p>
        ${menu ? `<div class="menu-container">${menuSection}</div>` : ''}
      </div>
    `;

    card.addEventListener('click', (e) => {
      const categoryHeader = e.target.closest('.category-header');
      if (categoryHeader) {
        const categoryContainer = categoryHeader.parentElement;
        const categoryItems = categoryContainer.querySelector('.category-items');
        categoryItems.style.display = categoryItems.style.display === 'none' ? 'block' : 'none';

        e.stopPropagation();
        return;
      }

      const details = card.querySelector(".food-details");
      details.style.display = details.style.display === "block" ? "none" : "block";
    });

    contentContainer.appendChild(card);
  }
}
  
  // Helper function to get timing for a category
  function getAvailableTiming(items) {
    return items.length > 0 ? items[0].timings : 'N/A';
  }
  


  // Ensure the correct content and filter are displayed for the selected tab
  document.getElementById("content-selector").addEventListener("change", async (event) => {
    const selectedContent = event.target.value;
    const foodFilter = document.getElementById("food-filter-container");

    contentContainer.innerHTML = ""; // Clear current content

    if (selectedContent === "food") {
      foodFilter.style.display = "block"; // Show filter for food
      const foodData = await fetchFoodData();
      displayFoodCards(foodData, "all");

      document.getElementById("food-category").addEventListener("change", (event) => {
        const category = event.target.value;
        displayFoodCards(foodData, category);
      });
    } else {
      foodFilter.style.display = "none"; // Hide filter for other tabs
      if (selectedContent === "library") {
        displayLibraries();
      } else if (selectedContent === "events") {
        const events = await fetchEvents();
        displayEvents(events);
      }
    }
  });
  
  // Initialize content
  contentSelector.addEventListener("change", (event) => {
    loadContent(event.target.value);
  });

  fetchWeather();
  setInterval(fetchWeather, 600000); // Update weather every 10 minutes
  loadContent(contentSelector.value); // Load initial content
};
