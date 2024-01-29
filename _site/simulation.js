const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
const simulationCanvas = document.getElementById('simulationCanvas');

// scale setup
const size = 500;  // Size of the grid
const divisions = 50;  // Number of divisions on the grid

const gridHelper = new THREE.GridHelper(size, divisions);
scene.add(gridHelper);

const loader = new THREE.FontLoader();

loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    
    for (let i = 0; i <= 500; i += 10) {
        const markerGeometry = new THREE.TextGeometry(i.toString() + 'm', {
            font: font,
            size: 1,   // Adjust the size as needed
            height: 0.1
        });

        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(i, 0, 0); // Adjust y and z as needed
        scene.add(marker);
    }
});

// Set renderer size to match the simulationCanvas div
renderer.setSize(simulationCanvas.clientWidth, simulationCanvas.clientHeight);
simulationCanvas.appendChild(renderer.domElement);

// Update camera aspect ratio based on the size of the simulationCanvas
camera.aspect = simulationCanvas.clientWidth / simulationCanvas.clientHeight;
camera.updateProjectionMatrix();


// cam control setup
const controls = new THREE.OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true; // Optional, but this gives a smoother control feel
// controls.dampingFactor = 0.05;


// Ball
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const ball = new THREE.Mesh(geometry, material);
scene.add(ball);

// Floor
const floorGeometry = new THREE.PlaneGeometry(1000, 1000); // Adjust size as needed
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to lay flat
floor.position.y = -1; // Adjust position as needed
scene.add(floor);

// Lightsource
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

camera.position.set(30, 20, 30);

let stepSize = 0.05; // scary default
let lastUpdateTime = performance.now();
let currentStep = 0;
let animationActive = false;
let accumulatedTime = 0;
const fixedTimeStep = 0.016; // Fixed time step (in seconds), e.g., 60 updates per second

function animate() {
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    accumulatedTime += (currentTime - lastUpdateTime) / 1000; // Convert to seconds
    lastUpdateTime = currentTime;

    while (accumulatedTime >= fixedTimeStep) {
        if (animationActive && trajectoryPoints.length > 0 && currentStep < trajectoryPoints.length) {
            const point = trajectoryPoints[currentStep];
            ball.position.set(point.x, point.y, 0);
            currentStep++;
        }
        accumulatedTime -= stepSize;
    }
    console.log("Animation Active:", animationActive);
    controls.update();
    renderer.render(scene, camera);
}

lastUpdateTime = performance.now(); // Initialize lastUpdateTime
animate();

// Resetting the animation
document.getElementById('animateButton').addEventListener('click', function() {
    currentStep = 0; // Reset to start of trajectory
});



// Function to update ball color
function updateBallColor(hexColor) {
    ball.material.color.set(hexColor);
}

// physics calculation

function calculateTrajectory(mass, dragArea, initialHeight, initialVelocity, angle, airDensity, gravity, timeStep, totalTime) {
    const trajectoryPoints = [];
    let velocityX = initialVelocity * Math.cos(angle * Math.PI / 180);
    let velocityY = initialVelocity * Math.sin(angle * Math.PI / 180);
    let positionX = 0;
    let positionY = initialHeight;
    let maxVelocity = initialVelocity;
    let maxHeight = initialHeight;
    let timeInFlight = 0;

    for (let t = 0; t <= totalTime; t += timeStep) {
        // Calculate forces
        let dragForce = 0.5 * airDensity * (velocityX**2 + velocityY**2) * dragArea;
        let dragForceX = dragForce * (velocityX / Math.sqrt(velocityX**2 + velocityY**2));
        let dragForceY = dragForce * (velocityY / Math.sqrt(velocityX**2 + velocityY**2));

        // Update velocities
        velocityX = velocityX - (dragForceX / mass) * timeStep;
        velocityY = velocityY - (gravity + (dragForceY / mass)) * timeStep;

        // Update positions
        positionX += velocityX * timeStep;
        positionY += velocityY * timeStep;

        // Check for max height and velocity
        maxHeight = Math.max(maxHeight, positionY);
        maxVelocity = Math.max(maxVelocity, Math.sqrt(velocityX**2 + velocityY**2));

        // Update time in flight
        if (positionY > 0) {
            timeInFlight = t + timeStep;
        }

        // Stop if the object hits the ground
        if (positionY <= 0) {
            break;
        }
        // Add point to trajectory
        trajectoryPoints.push({ x: positionX, y: positionY });
        
    }
    console.log(trajectoryPoints)
    return { trajectoryPoints, maxVelocity, maxHeight, horizontalDistance: positionX, timeInFlight };
}

// interactive event listeners:

// color picker
document.addEventListener('DOMContentLoaded', function() {
    const colorInput = document.getElementById('ballColor');

    colorInput.addEventListener('change', function(event) {
        const newColor = event.target.value;
        updateBallColor(newColor);
    });
});

let trajectoryPoints = []; // To store calculated trajectory points

document.getElementById('calculateButton').addEventListener('click', function() {
    const mass = parseFloat(document.getElementById('mass').value);
    const dragArea = parseFloat(document.getElementById('dragArea').value);
    const initialHeight = parseFloat(document.getElementById('height').value);
    const initialVelocity = parseFloat(document.getElementById('velocity').value);
    const angle = parseFloat(document.getElementById('angle').value);
    const airDensity = parseFloat(document.getElementById('airDensity').value);
    const gravity = parseFloat(document.getElementById('gravity').value);
    const duration = parseFloat(document.getElementById('duration').value);
    stepSize = parseFloat(document.getElementById('stepSize').value);

    // Call the trajectory calculation function
    const results = calculateTrajectory(mass, dragArea, initialHeight, initialVelocity, angle, airDensity, gravity, stepSize, duration);
    trajectoryPoints = results.trajectoryPoints;

    document.getElementById('maxHeight').innerText = "Max Height: " + results.maxHeight.toFixed(2) + " m";
    document.getElementById('maxVelocity').innerText = "Max Velocity: " + results.maxVelocity.toFixed(2) + " m/s";
    document.getElementById('horizontalDistance').innerText = "Horizontal Distance: " + results.horizontalDistance.toFixed(2) + " m";
    document.getElementById('timeInFlight').innerText = "Time in Flight: " + results.timeInFlight.toFixed(2) + " s";

    document.getElementById('feedback').innerText = 'Calculation complete! Ready to animate.';
    document.getElementById('animateButton').disabled = false;
    currentStep = 0;
    animationActive = true;
});

