window.productivityInit = function () {
  console.log("Productivity tab initialized");

  // Retrieve elements for To-Do List functionality
  const addTaskBtn = document.getElementById("add-task-btn");
  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  const clearCompletedBtn = document.getElementById("clear-completed-btn");
  const editPopup = document.getElementById("edit-popup");
  const editTaskInput = document.getElementById("edit-task-input");
  const confirmEditBtn = document.getElementById("confirm-edit-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  // Retrieve elements for Pomodoro Timer functionality
  const timerDisplay = document.getElementById("timer-display");
  const startPauseBtn = document.getElementById("start-pause-btn");
  const resetTimerBtn = document.getElementById("reset-timer-btn");
  const setCustomTimerBtn = document.getElementById("set-custom-timer-btn");
  const customTimerModal = document.getElementById("custom-timer-modal");
  const customTimerInput = document.getElementById("custom-timer-input");
  const saveCustomTimerBtn = document.getElementById("save-custom-timer-btn");
  const cancelCustomTimerBtn = document.getElementById("cancel-custom-timer-btn");

  // Initialize variables for Pomodoro Timer
  let currentTaskItem = null; // To store the task being edited
  let timerInterval = null;
  let timerDuration = 25 * 60; // Default 25 minutes in seconds
  let remainingTime = parseInt(localStorage.getItem("remainingTime")) || timerDuration;
  let isTimerRunning = localStorage.getItem("isTimerRunning") === "true";
  let startTime = parseInt(localStorage.getItem("startTime")) || null;

  // Function to update the visibility of the "Clear Completed" button based on the presence of completed tasks
  const updateClearCompletedVisibility = () => {
    const hasCompletedTasks = document.querySelectorAll(".task-item.completed").length > 0;
    clearCompletedBtn.style.display = hasCompletedTasks ? "block" : "none";
  };

  // Function to save tasks to localStorage
  const saveTasksToLocalStorage = () => {
    const tasks = [];
    document.querySelectorAll(".task-item").forEach(taskItem => {
      tasks.push({
        text: taskItem.querySelector("span").textContent,
        completed: taskItem.classList.contains("completed"),
      });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
  };

  // Function to load tasks from localStorage
  const loadTasksFromLocalStorage = () => {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach(task => {
      const taskItem = document.createElement("li");
      taskItem.className = "task-item";
      taskItem.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} />
        <span>${task.text}</span>
        <div class="task-buttons">
          <button class="edit-btn">✏️</button>
          <button class="delete-btn">🗑️</button>
        </div>
      `;

      taskList.appendChild(taskItem);

      if (task.completed) {
        taskItem.classList.add("completed");
      }

      taskItem.querySelector(".task-checkbox").addEventListener("change", function () {
        taskItem.classList.toggle("completed");
        saveTasksToLocalStorage();
        if (taskItem.classList.contains("completed")) {
          taskList.appendChild(taskItem);
        } else {
          taskList.prepend(taskItem);
        }
        updateClearCompletedVisibility();
      });

      taskItem.querySelector(".edit-btn").addEventListener("click", function () {
        currentTaskItem = taskItem;
        editTaskInput.value = taskItem.querySelector("span").textContent;
        editPopup.classList.remove("hidden");
      });

      taskItem.querySelector(".delete-btn").addEventListener("click", function () {
        taskList.removeChild(taskItem);
        saveTasksToLocalStorage();
      });
    });
  };

  loadTasksFromLocalStorage();

  // Event listener for adding a new task
  addTaskBtn.addEventListener("click", function () {
    const taskText = taskInput.value.trim();
    if (taskText) {
      const taskItem = document.createElement("li");
      taskItem.className = "task-item";
      taskItem.innerHTML = `
        <input type="checkbox" class="task-checkbox" />
        <span>${taskText}</span>
        <div class="task-buttons">
          <button class="edit-btn">✏️</button>
          <button class="delete-btn">🗑️</button>
        </div>
      `;
      taskList.prepend(taskItem);
      taskInput.value = "";

      taskItem.querySelector(".task-checkbox").addEventListener("change", function () {
        taskItem.classList.toggle("completed");
        if (taskItem.classList.contains("completed")) {
          taskList.appendChild(taskItem);
        } else {
          taskList.prepend(taskItem);
        }
        updateClearCompletedVisibility();
        saveTasksToLocalStorage();
      });

      taskItem.querySelector(".edit-btn").addEventListener("click", function () {
        currentTaskItem = taskItem;
        editTaskInput.value = taskItem.querySelector("span").textContent;
        editPopup.classList.remove("hidden");
      });

      taskItem.querySelector(".delete-btn").addEventListener("click", function () {
        taskList.removeChild(taskItem);
        saveTasksToLocalStorage();
      });

      saveTasksToLocalStorage();
    }
  });

  // Event listener for clearing completed tasks
  clearCompletedBtn.addEventListener("click", function () {
    const completedTasks = document.querySelectorAll(".task-item.completed");
    completedTasks.forEach(task => taskList.removeChild(task));
    saveTasksToLocalStorage();
    updateClearCompletedVisibility();
  });

  // Event listener for confirming task edit
  confirmEditBtn.addEventListener("click", function () {
    if (currentTaskItem && editTaskInput.value.trim()) {
      currentTaskItem.querySelector("span").textContent = editTaskInput.value.trim();
      editPopup.classList.add("hidden");
      currentTaskItem = null;
      saveTasksToLocalStorage();
    }
  });

  // Event listener for canceling task edit
  cancelEditBtn.addEventListener("click", function () {
    editPopup.classList.add("hidden");
    currentTaskItem = null;
  });

  // Function to update the timer display
  const updateTimerDisplay = () => {
    const minutes = Math.floor(remainingTime / 60).toString().padStart(2, "0");
    const seconds = (remainingTime % 60).toString().padStart(2, "0");
    timerDisplay.textContent = `${minutes}:${seconds}`;
  };

  // Function to save the timer state to localStorage
  const saveTimerState = () => {
    localStorage.setItem("remainingTime", remainingTime);
    localStorage.setItem("isTimerRunning", isTimerRunning);
    localStorage.setItem("startTime", startTime || "");
  };

  // Function to calculate the remaining time
  const calculateRemainingTime = () => {
    if (isTimerRunning && startTime) {
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      remainingTime = Math.max(0, timerDuration - elapsedTime);
      if (remainingTime === 0) {
        console.log("Timer reached zero.");
        clearInterval(timerInterval);
        isTimerRunning = false;
        remainingTime = 25 * 60; // Reset to default 25 minutes
        timerDuration = 25 * 60; // Update the default duration
        saveTimerState();
        updateTimerDisplay();
        alert("Time's up! The timer has been reset to the default duration.");
        startPauseBtn.textContent = "Start"; // Reset the button text
      }      
    }
  };
  

  // Function to start the timer
  const startTimer = () => {
    if (!isTimerRunning) {
      isTimerRunning = true;
      startTime = Date.now() - (timerDuration - remainingTime) * 1000; // Adjust start time
      saveTimerState();
      startPauseBtn.textContent = "Pause";

      timerInterval = setInterval(() => {
        calculateRemainingTime();
        updateTimerDisplay();
        saveTimerState();

        if (remainingTime <= 0) {
          clearInterval(timerInterval);
          isTimerRunning = false;
          saveTimerState();
          startPauseBtn.textContent = "Start";
        }
      }, 1000);
    }
  };

  // Function to pause the timer
  const pauseTimer = () => {
    if (isTimerRunning) {
      clearInterval(timerInterval);
      calculateRemainingTime();
      isTimerRunning = false;
      startTime = null;
      saveTimerState();
      startPauseBtn.textContent = "Start";
    }
  };

  // Function to reset the timer
  const resetTimer = () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    remainingTime = 25 * 60;
    startTime = null;
    updateTimerDisplay();
    saveTimerState();
    startPauseBtn.textContent = "Start";
  };

  // Function to sync the timer state on initialization or visibility change
  const syncState = () => {
    // Load timerDuration from localStorage, fallback to default if not present
    timerDuration = parseInt(localStorage.getItem("timerDuration")) || 25 * 60;
    remainingTime = parseInt(localStorage.getItem("remainingTime")) || timerDuration;
    isTimerRunning = localStorage.getItem("isTimerRunning") === "true";
    startTime = parseInt(localStorage.getItem("startTime")) || null;

    calculateRemainingTime();
    updateTimerDisplay();

    if (isTimerRunning) {
      clearInterval(timerInterval); // Prevent multiple intervals
      timerInterval = setInterval(() => {
        calculateRemainingTime();
        updateTimerDisplay();
        saveTimerState();

        if (remainingTime <= 0) {
          clearInterval(timerInterval);
          isTimerRunning = false;
          saveTimerState();
          startPauseBtn.textContent = "Start";
        }
      }, 1000);
      startPauseBtn.textContent = "Pause";
    } else {
      startPauseBtn.textContent = "Start";
      clearInterval(timerInterval); // Stop interval if not running
    }
  };

  // Initialize timer display and state
  syncState();

  // Event listener for visibility change to resync the timer state
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      syncState();
    }
  });

  // Event listener for start/pause button
  startPauseBtn.addEventListener("click", () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  // Event listener for reset button
  resetTimerBtn.addEventListener("click", resetTimer);

  // Event listener for custom timer button
  setCustomTimerBtn.addEventListener("click", () => {
    customTimerModal.classList.remove("hidden");
  });

  // Event listener for saving custom timer value
  saveCustomTimerBtn.addEventListener("click", () => {
    const customMinutes = parseInt(customTimerInput.value);
    if (customMinutes && customMinutes > 0 && customMinutes <= 120) {
      timerDuration = customMinutes * 60;
      remainingTime = timerDuration;
      updateTimerDisplay();
      customTimerModal.classList.add("hidden");

      // Save the custom timer duration to localStorage
      localStorage.setItem("timerDuration", timerDuration);

      saveTimerState(); // Save the updated timer state
    } else {
      alert("Please enter a value between 1 and 120 minutes.");
    }
  });

  cancelCustomTimerBtn.addEventListener("click", () => {
    customTimerModal.classList.add("hidden");
  });
};
