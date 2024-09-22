document.getElementById("setupForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const numFloors = parseInt(document.getElementById("floors").value);
  const numLifts = parseInt(document.getElementById("lifts").value);

  // Validate input values
  if (!numFloors || numFloors <= 0) {
    alert("Please enter a valid number of floors.");
    return;
  }
  if (!numLifts || numLifts <= 0) {
    alert("Please enter a valid number of lifts.");
    return;
  }
  if (numFloors < 2) {
    alert("We need a minimum of 2 floors to simulate lifts.");
    return;
  }

  // Reset buttons
  document.getElementById("resetButton").style.display = "block";
  document.getElementById("backButton").style.display = "block";
  generateBuilding(numFloors, numLifts);
});

document.getElementById("resetButton").addEventListener("click", resetLifts);

document.getElementById("backButton").addEventListener("click", () => {
  document.querySelector(".container").style.visibility = "visible";
  document.getElementById("setupForm").reset(); // Reset input fields
  document.getElementById("resetButton").style.display = "none"; // Hide reset button
  document.getElementById("backButton").style.display = "none"; // Hide back button
  document.getElementById("liftsimulation").innerHTML = ""; // Clear simulation
});

let occupiedFloors; // Declare occupiedFloors variable
let globalRequestQueue = []; // Global queue for lift requests
let activeLiftsOnFloor = {}; // Track how many lifts are serving each floor

function resetLifts() {
  const lifts = document.querySelectorAll(".lift");
  lifts.forEach((lift) => {
    lift.dataset.floor = 0; // Set lift back to ground floor
    lift.style.transform = `translateY(0)`; // Move lift visually to ground floor
    lift.classList.remove("moving"); // Ensure no moving class is applied
  });

  // Reset occupied floors
  occupiedFloors.fill(false); // Reset occupied floors array
  globalRequestQueue = []; // Clear the global request queue
  activeLiftsOnFloor = {}; // Clear active lift counters for each floor
}

function generateBuilding(floors, lifts) {
  document.querySelector(".container").style.visibility = "hidden";
  const liftSimulation = document.getElementById("liftsimulation");
  liftSimulation.innerHTML = "";
  occupiedFloors = Array(floors).fill(false); // Initialize occupied floors
  let liftQueues = Array.from({ length: lifts }, () => []); // Queues for each lift
  activeLiftsOnFloor = {}; // Initialize lifts serving each floor

  // Generate Floors
  for (let i = floors - 1; i >= 0; i--) {
    const floorDiv = document.createElement("div");
    floorDiv.classList.add("floorLine");

    // Create floor number
    const floorNumber = document.createElement("div");
    floorNumber.classList.add("floornumber");
    floorNumber.innerText = `Floor ${i}`;
    floorDiv.appendChild(floorNumber);

    // Create up/down buttons
    const buttonsWrapper = document.createElement("div");
    buttonsWrapper.classList.add("buttons-wrapper");

    if (i < floors - 1) {
      const upButton = document.createElement("div");
      upButton.classList.add("upbutton");
      upButton.innerText = "Up";
      upButton.addEventListener("click", () => queueLiftRequest(i, "up"));

      buttonsWrapper.appendChild(upButton);
    }

    if (i > 0) {
      const downButton = document.createElement("div");
      downButton.classList.add("downbutton");
      downButton.innerText = "Down";
      downButton.addEventListener("click", () => queueLiftRequest(i, "down"));

      buttonsWrapper.appendChild(downButton);
    }

    floorDiv.appendChild(buttonsWrapper);

    // Initialize lifts on the 0th floor
    if (i === 0) {
      const liftWrapper = document.createElement("div");
      liftWrapper.classList.add("lifts");

      for (let j = 0; j < lifts; j++) {
        const lift = document.createElement("div");
        lift.classList.add("lift");
        lift.id = `lift${j}`;
        lift.dataset.floor = 0; // Set initial floor

        const liftDoor = document.createElement("div");
        liftDoor.classList.add("door");

        const leftDoor = document.createElement("div");
        leftDoor.classList.add("left-door");
        const rightDoor = document.createElement("div");
        rightDoor.classList.add("right-door");
        liftDoor.appendChild(leftDoor);

        liftDoor.appendChild(rightDoor);
        lift.appendChild(liftDoor);
        liftWrapper.appendChild(lift);
        console.log(j);
      }

      floorDiv.appendChild(liftWrapper);
    }

    liftSimulation.appendChild(floorDiv);
  }
}

// Queue the lift request into the global queue
function queueLiftRequest(floor, direction) {
  if (!activeLiftsOnFloor[floor]) {
    activeLiftsOnFloor[floor] = { up: 0, down: 0 }; // Initialize floor's lift tracking
  }

  // Only queue the request if less than 2 lifts are serving the floor
  if (activeLiftsOnFloor[floor][direction] < 1) {
    globalRequestQueue.push({ floor, direction });
    // console.log("floor")
    processGlobalQueue(); // Attempt to process the queue whenever a request is added
  } else {
    console.log(
      `Maximum lifts already serving Floor ${floor} for ${direction} direction.`
    );
  }
}

// Process the global queue if any lifts are free
function processGlobalQueue() {
  const lifts = document.querySelectorAll(".lift");
  const liftPositions = Array.from(lifts).map(
    (lift) => parseInt(lift.dataset.floor) || 0
  );

  globalRequestQueue = globalRequestQueue.filter((request) => {
    const nearestLift = findNearestLift(
      request.floor,
      request.direction,
      liftPositions,
      lifts
    );

    if (nearestLift !== null) {
      callLift(request.floor, request.direction, nearestLift); // Call lift for the request
      return false; // Remove this request from the queue as it's being processed
    }

    return true; // Keep the request in the queue if no lifts are available
  });
}

// Find the nearest available lift to serve the request
function findNearestLift(floor, direction, liftPositions, lifts) {
  let nearestLift = null;
  let minDistance = Infinity;

  liftPositions.forEach((pos, i) => {
    const distance = Math.abs(pos - floor);
    const isMoving = lifts[i].classList.contains("moving");

    if (!isMoving && distance < minDistance) {
      minDistance = distance;
      nearestLift = i;
    }
  });

  return nearestLift;
}

// Move the lift to the floor where the button was pressed
function callLift(floor, direction, liftIndex) {
  const lifts = document.querySelectorAll(".lift");
  const lift = lifts[liftIndex];
  const currentFloor = parseInt(lift.dataset.floor) || 0;
  const floorDiff = Math.abs(currentFloor - floor);
  const timeToMove = floorDiff * 2000; // 2 seconds per floor

  lift.classList.add("moving");
  lift.style.transition = `transform ${timeToMove / 1000}s linear`;
  lift.style.transform = `translateY(-${floor * 180}px)`;

  // Increment the counter for lifts serving this floor
  activeLiftsOnFloor[floor][direction]++;
  occupiedFloors[floor] = true; // Lock the floor as soon as the lift starts moving

  setTimeout(() => {
    lift.dataset.floor = floor; // Update current floor
    openCloseDoors(lift);
  }, timeToMove);

  setTimeout(() => {
    lift.classList.remove("moving");
    occupiedFloors[floor] = false; // Mark the floor as unoccupied after the doors close

    // Decrement the counter when the lift finishes serving the floor
    activeLiftsOnFloor[floor][direction]--;
    processGlobalQueue(); // After lift is free, check the global queue
  }, timeToMove + 2500); // Include door open/close time
}

// Simulate the opening and closing of lift doors
function openCloseDoors(lift) {
  const doors = lift.querySelector(".door");

  // Open doors
  doors.classList.add("open");

  setTimeout(() => {
    // Close doors after 2 seconds
    doors.classList.remove("open");
  }, 2500);
}
