const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('simulationCanvas').appendChild(renderer.domElement);

// Ball
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const ball = new THREE.Mesh(geometry, material);
scene.add(ball);

// Floor
const floorGeometry = new THREE.PlaneGeometry(10, 10); // Adjust size as needed
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to lay flat
floor.position.y = -1; // Adjust position as needed
scene.add(floor);

// Lightsource
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

camera.position.z = 5;

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
        accumulatedTime -= fixedTimeStep;
    }
    console.log("Animation Active:", animationActive);

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

        // Add point to trajectory
        trajectoryPoints.push({ x: positionX, y: positionY });

        // Stop if the object hits the ground
        if (positionY <= 0) {
            break;
        }
        console.log(trajectoryPoints)
    }

    return trajectoryPoints;
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
    const stepSize = parseFloat(document.getElementById('stepSize').value);
    const duration = parseFloat(document.getElementById('duration').value);
    const runUntilGround = document.getElementById('runUntilGround').checked;

    // Adjust duration if 'Run Until Height ≤ 0' is checked
    let adjustedDuration = runUntilGround ? Number.MAX_VALUE : duration;

    // Call the trajectory calculation function
    trajectoryPoints = calculateTrajectory(mass, dragArea, initialHeight, initialVelocity, angle, airDensity, gravity, stepSize, duration);


    document.getElementById('feedback').innerText = 'Calculation complete! Ready to animate.';
    document.getElementById('animateButton').disabled = false;
    currentStep = 0;        // Reset the animation step
});

document.getElementById('animateButton').addEventListener('click', function() {
    animationActive = !animationActive; // Toggle animation on/off
});

