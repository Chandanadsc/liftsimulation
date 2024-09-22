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

  // Generate building
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

function resetLifts() {
  const lifts = document.querySelectorAll(".lift");
  lifts.forEach((lift) => {
    lift.dataset.floor = 0; // Set lift back to ground floor
    lift.style.transform = `translateY(0)`; // Move lift visually to ground floor
    lift.classList.remove("moving"); // Ensure no moving class is applied
  });

  // Reset occupied floors
  occupiedFloors.fill(false); // Reset occupied floors array
}

function generateBuilding(floors, lifts) {
  document.querySelector(".container").style.visibility = "hidden";
  const liftSimulation = document.getElementById("liftsimulation");
  liftSimulation.innerHTML = "";
  occupiedFloors = Array(floors).fill(false); // Initialize occupied floors
  let liftQueues = Array.from({ length: lifts }, () => []); // Queues for each lift

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
      upButton.addEventListener("click", () =>
        callLift(i, "up", liftQueues, occupiedFloors)
      );
      buttonsWrapper.appendChild(upButton);
    }

    if (i > 0) {
      const downButton = document.createElement("div");
      downButton.classList.add("downbutton");
      downButton.innerText = "Down";
      downButton.addEventListener("click", () =>
        callLift(i, "down", liftQueues, occupiedFloors)
      );
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
      }

      floorDiv.appendChild(liftWrapper);
    }

    liftSimulation.appendChild(floorDiv);
  }
}

// Move the lift to the floor where the button was pressed
function callLift(floor, direction, liftQueues, occupiedFloors) {
  const lifts = document.querySelectorAll(".lift");
  const liftPositions = Array.from(lifts).map(
    (lift) => parseInt(lift.dataset.floor) || 0
  );

  // If a lift is already at the requested floor, ignore the call
  if (occupiedFloors[floor]) {
    console.log(`A lift is already at floor ${floor}. Ignoring request.`);
    return;
  }

  // Queue the request for the relevant lift
  let nearestLift = findNearestLift(
    floor,
    direction,
    liftPositions,
    lifts,
    liftQueues
  );

  if (nearestLift !== null) {
    liftQueues[nearestLift].push(floor); // Add request to the lift's queue
    processLiftQueue(nearestLift, liftQueues, occupiedFloors);
  }
}

// Find the nearest lift to serve the request
function findNearestLift(floor, direction, liftPositions, lifts, liftQueues) {
  let nearestLift = null;
  let minDistance = Infinity;

  liftPositions.forEach((pos, i) => {
    const distance = Math.abs(pos - floor);
    const isMoving = lifts[i].classList.contains("moving");

    // If the lift is moving and there's a queue, only consider it in the same direction
    const isGoingInTheSameDirection =
      (direction === "up" && pos <= floor) ||
      (direction === "down" && pos >= floor);

    // If the lift is not moving, or it's in the queue and we're considering a closer lift
    if (!isMoving || liftQueues[i].length > 0) {
      // Prioritize lifts that are going in the same direction
      if (isGoingInTheSameDirection && distance < minDistance) {
        minDistance = distance;
        nearestLift = i;
      }
      // Allow lifts to respond regardless of direction if they are closer
      else if (!isGoingInTheSameDirection && distance < minDistance) {
        minDistance = distance;
        nearestLift = i;
      }
    }
  });

  return nearestLift;
}

// Process the queue for the specified lift
function processLiftQueue(liftIndex, liftQueues, occupiedFloors) {
  if (liftQueues[liftIndex].length === 0) return; // No requests to process

  const targetFloor = liftQueues[liftIndex].shift(); // Get the next request
  moveLift(liftIndex, targetFloor, occupiedFloors);
}

// Move the nearest lift to the desired floor
function moveLift(liftIndex, targetFloor, occupiedFloors) {
  const lift = document.getElementById(`lift${liftIndex}`);
  const currentFloor = parseInt(lift.dataset.floor) || 0;
  const floorDiff = Math.abs(currentFloor - targetFloor);
  const timeToMove = floorDiff * 2000; // 2 seconds per floor

  lift.classList.add("moving");
  lift.style.transition = `transform ${timeToMove / 1000}s linear`;
  lift.style.transform = `translateY(-${targetFloor * 180}px)`;

  // Lock the floor as soon as the lift starts moving
  occupiedFloors[targetFloor] = true;

  setTimeout(() => {
    lift.dataset.floor = targetFloor; // Update current floor
    openCloseDoors(lift);
  }, timeToMove);

  setTimeout(() => {
    lift.classList.remove("moving");
    occupiedFloors[targetFloor] = false; // Mark the floor as unoccupied after the doors close
    processLiftQueue(liftIndex, liftQueues, occupiedFloors); // Process the next request in the queue
  }, timeToMove + 2000); // Door open/close time
}

// Simulate the opening and closing of lift doors
function openCloseDoors(lift) {
  const doors = lift.querySelector(".door");
  // const rightDoor = doors.querySelector(".right-door");

  // Open doors
  // doors.style.width = "0";
  // rightDoor.style.marginLeft = "0";
  doors.classList.add("open");

  setTimeout(() => {
    // Close doors after 2 seconds
    // doors.style.width = "35px";
    // rightDoor.style.marginLeft = "25px";
    doors.classList.remove("open");
  }, 2000);
}
