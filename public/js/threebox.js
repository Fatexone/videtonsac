document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('three-container');  // Target the specific container
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    // Add a simple 3D cylinder as the boxing bag
    const geometry = new THREE.CylinderGeometry(1, 1, 4, 32);  // Cylinder representing a bag
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bag = new THREE.Mesh(geometry, material);
    scene.add(bag);

    camera.position.z = 5;

    const animate = function () {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    };

    animate();
});
