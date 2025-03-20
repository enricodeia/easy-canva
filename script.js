// Scene manager to keep track of all objects
class SceneManager {
    constructor() {
        this.objects = [];
        this.selectedObject = null;
        this.objectCount = 0;
    }

    addObject(object, name) {
        const id = Date.now().toString();
        this.objectCount++;
        const objectData = {
            id,
            object,
            name: name || `Object ${this.objectCount}`,
            visible: true,
            type: 'mesh'
        };
        this.objects.push(objectData);
        this.updateLayerPanel();
        return objectData;
    }

    removeObject(id) {
        const index = this.objects.findIndex(obj => obj.id === id);
        if (index !== -1) {
            const obj = this.objects[index];
            scene.remove(obj.object);
            this.objects.splice(index, 1);
            if (this.selectedObject && this.selectedObject.id === id) {
                this.selectedObject = null;
            }
            this.updateLayerPanel();
        }
    }

    selectObject(id) {
        this.selectedObject = this.objects.find(obj => obj.id === id) || null;
        this.updateLayerPanel();
        this.updateControls();
    }

    updateLayerPanel() {
        const objectList = document.getElementById('objectList');
        objectList.innerHTML = '';

        this.objects.forEach(obj => {
            const li = document.createElement('li');
            li.dataset.id = obj.id;
            if (this.selectedObject && this.selectedObject.id === obj.id) {
                li.classList.add('selected');
            }

            // Create visibility toggle
            const visCheckbox = document.createElement('input');
            visCheckbox.type = 'checkbox';
            visCheckbox.checked = obj.visible;
            visCheckbox.addEventListener('change', () => {
                obj.visible = visCheckbox.checked;
                obj.object.visible = visCheckbox.checked;
            });

            // Create name element
            const nameSpan = document.createElement('span');
            nameSpan.className = 'layerItemName';
            nameSpan.textContent = obj.name;
            nameSpan.addEventListener('click', () => {
                this.selectObject(obj.id);
            });

            // Create controls
            const controls = document.createElement('div');
            controls.className = 'layerItemControls';

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.title = 'Delete';
            deleteBtn.style.background = '#ff3333';
            deleteBtn.addEventListener('click', () => {
                this.removeObject(obj.id);
            });

            controls.appendChild(deleteBtn);
            li.appendChild(visCheckbox);
            li.appendChild(nameSpan);
            li.appendChild(controls);
            objectList.appendChild(li);
        });
    }

    updateControls() {
        if (!this.selectedObject) return;

        const obj = this.selectedObject.object;

        // Update position sliders
        document.getElementById('positionX').value = obj.position.x;
        document.getElementById('positionY').value = obj.position.y;
        document.getElementById('positionZ').value = obj.position.z;

        // Update rotation sliders
        document.getElementById('rotateX').value = obj.rotation.x;
        document.getElementById('rotateY').value = obj.rotation.y;
        document.getElementById('rotateZ').value = obj.rotation.z;

        // Update scale sliders
        document.getElementById('scaleX').value = obj.scale.x;
        document.getElementById('scaleY').value = obj.scale.y;
        document.getElementById('scaleZ').value = obj.scale.z;

        // Update material properties if applicable
        if (obj.material) {
            document.getElementById('objectColor').value = '#' + obj.material.color.getHexString();
            document.getElementById('metalness').value = obj.material.metalness || 0;
            document.getElementById('roughness').value = obj.material.roughness || 1;
            document.getElementById('wireframe').checked = obj.material.wireframe || false;
        }
    }
}

// Initialize scene, renderer, camera, and controls
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Renderer setup with antialiasing and shadows
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    canvas: document.getElementById('three-canvas')
});
renderer.setSize(window.innerWidth - 320, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Camera setup
const aspectRatio = (window.innerWidth - 320) / window.innerHeight;
const perspectiveCamera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
const orthographicCamera = new THREE.OrthographicCamera(
    -5 * aspectRatio, 5 * aspectRatio, 
    5, -5, 0.1, 1000
);

// Set initial camera
let camera = perspectiveCamera;
camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);

// Orbit controls for camera
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Create scene manager
const sceneManager = new SceneManager();

// Setup lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

// Create grid helper
const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
scene.add(gridHelper);

// Add ground plane
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x222222,
    roughness: 1,
    metalness: 0
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
ground.receiveShadow = true;
scene.add(ground);

// Function to create new objects
function createNewObject(type = 'box') {
    let geometry;
    
    switch (type) {
        case 'box':
            geometry = new THREE.BoxGeometry();
            break;
        case 'sphere':
            geometry = new THREE.SphereGeometry(0.5, 32, 32);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
            break;
        case 'torus':
            geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32);
            break;
        case 'plane':
            geometry = new THREE.PlaneGeometry(1, 1);
            break;
        default:
            geometry = new THREE.BoxGeometry();
    }
    
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x0077ff,
        metalness: 0,
        roughness: 1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    
    const objData = sceneManager.addObject(mesh, `${type.charAt(0).toUpperCase() + type.slice(1)}`);
    sceneManager.selectObject(objData.id);
    
    return mesh;
}

// Add initial object
createNewObject('box');

// Function to update an object's geometry
function updateGeometry(type) {
    if (!sceneManager.selectedObject) return;
    
    const oldObject = sceneManager.selectedObject.object;
    const position = oldObject.position.clone();
    const rotation = oldObject.rotation.clone();
    const scale = oldObject.scale.clone();
    const material = oldObject.material.clone();
    
    scene.remove(oldObject);
    
    let geometry;
    switch (type) {
        case 'box': geometry = new THREE.BoxGeometry(); break;
        case 'sphere': geometry = new THREE.SphereGeometry(0.5, 32, 32); break;
        case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
        case 'torus': geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32); break;
        case 'plane': geometry = new THREE.PlaneGeometry(1, 1); break;
    }
    
    const newMesh = new THREE.Mesh(geometry, material);
    newMesh.position.copy(position);
    newMesh.rotation.copy(rotation);
    newMesh.scale.copy(scale);
    newMesh.castShadow = true;
    newMesh.receiveShadow = true;
    
    scene.add(newMesh);
    
    const objId = sceneManager.selectedObject.id;
    sceneManager.selectedObject.object = newMesh;
    sceneManager.updateLayerPanel();
}

// GLTF loader for importing models
const gltfLoader = new THREE.GLTFLoader();

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Event listeners
document.getElementById('addObject').addEventListener('click', () => {
    const type = document.getElementById('geometrySelector').value;
    createNewObject(type);
});

document.getElementById('geometrySelector').addEventListener('change', (e) => {
    updateGeometry(e.target.value);
});

document.getElementById('objectColor').addEventListener('input', (e) => {
    if (!sceneManager.selectedObject) return;
    sceneManager.selectedObject.object.material.color.set(e.target.value);
});

document.getElementById('metalness').addEventListener('input', (e) => {
    if (!sceneManager.selectedObject) return;
    sceneManager.selectedObject.object.material.metalness = parseFloat(e.target.value);
});

document.getElementById('roughness').addEventListener('input', (e) => {
    if (!sceneManager.selectedObject) return;
    sceneManager.selectedObject.object.material.roughness = parseFloat(e.target.value);
});

document.getElementById('wireframe').addEventListener('change', (e) => {
    if (!sceneManager.selectedObject) return;
    sceneManager.selectedObject.object.material.wireframe = e.target.checked;
});

// Position, scale, and rotation controls
['X', 'Y', 'Z'].forEach(axis => {
    document.getElementById(`position${axis}`).addEventListener('input', (e) => {
        if (!sceneManager.selectedObject) return;
        sceneManager.selectedObject.object.position[axis.toLowerCase()] = parseFloat(e.target.value);
    });

    document.getElementById(`scale${axis}`).addEventListener('input', (e) => {
        if (!sceneManager.selectedObject) return;
        sceneManager.selectedObject.object.scale[axis.toLowerCase()] = parseFloat(e.target.value);
    });

    document.getElementById(`rotate${axis}`).addEventListener('input', (e) => {
        if (!sceneManager.selectedObject) return;
        sceneManager.selectedObject.object.rotation[axis.toLowerCase()] = parseFloat(e.target.value);
    });
});

// Light controls
document.getElementById('lightX').addEventListener('input', (e) => {
    directionalLight.position.x = parseFloat(e.target.value);
});

document.getElementById('lightY').addEventListener('input', (e) => {
    directionalLight.position.y = parseFloat(e.target.value);
});

document.getElementById('lightZ').addEventListener('input', (e) => {
    directionalLight.position.z = parseFloat(e.target.value);
});

document.getElementById('lightIntensity').addEventListener('input', (e) => {
    directionalLight.intensity = parseFloat(e.target.value);
});

document.getElementById('enableShadows').addEventListener('change', (e) => {
    renderer.shadowMap.enabled = e.target.checked;
    
    // Update all objects to cast/receive shadows
    sceneManager.objects.forEach(obj => {
        if (obj.object.isMesh) {
            obj.object.castShadow = e.target.checked;
            obj.object.receiveShadow = e.target.checked;
        }
    });
    
    ground.receiveShadow = e.target.checked;
    directionalLight.castShadow = e.target.checked;
});

// Camera type toggle
document.getElementById('cameraType').addEventListener('change', (e) => {
    const position = camera.position.clone();
    
    if (e.target.value === 'perspective') {
        camera = perspectiveCamera;
    } else {
        camera = orthographicCamera;
    }
    
    camera.position.copy(position);
    camera.lookAt(0, 0, 0);
    controls.object = camera;
});

// Import model
document.getElementById('importModel').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    
    gltfLoader.load(url, (gltf) => {
        // Add model to scene
        const model = gltf.scene;
        
        // Center model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // Normalize scale
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) {
            const scale = 2 / maxDim;
            model.scale.set(scale, scale, scale);
        }
        
        // Apply shadows to all model parts
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        
        scene.add(model);
        const objData = sceneManager.addObject(model, file.name);
        sceneManager.selectObject(objData.id);
    }, 
    undefined, // on progress
    (error) => {
        console.error('Error loading model:', error);
        alert('Error loading model. Check console for details.');
    });
});

// Upload texture
document.getElementById('textureUpload').addEventListener('change', (event) => {
    if (!sceneManager.selectedObject) {
        alert('Please select an object to apply texture');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    
    textureLoader.load(url, (texture) => {
        const material = sceneManager.selectedObject.object.material;
        material.map = texture;
        material.needsUpdate = true;
    });
});

// Effects
document.getElementById('bloom').addEventListener('change', (e) => {
    // Simple bloom effect simulation with exposure
    renderer.toneMappingExposure = e.target.checked ? 1.5 : 1.0;
});

document.getElementById('fog').addEventListener('change', (e) => {
    scene.fog = e.target.checked ? new THREE.Fog(0x111111, 5, 30) : null;
});

// Export scene as JSON
document.getElementById('exportScene').addEventListener('click', () => {
    const sceneJson = scene.toJSON();
    const jsonString = JSON.stringify(sceneJson, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.json';
    a.click();
    
    URL.revokeObjectURL(url);
});

// Copy Three.js code
document.getElementById('copyCode').addEventListener('click', () => {
    // Generate code representation of the scene
    let code = `// Three.js Scene exported from 3D Scene Editor\n\n`;
    code += `// Create scene\n`;
    code += `const scene = new THREE.Scene();\n`;
    code += `scene.background = new THREE.Color(0x${scene.background.getHexString()});\n\n`;
    
    // Add camera
    code += `// Setup camera\n`;
    if (camera === perspectiveCamera) {
        code += `const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);\n`;
    } else {
        code += `const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 1000);\n`;
    }
    code += `camera.position.set(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)});\n`;
    code += `camera.lookAt(0, 0, 0);\n\n`;
    
    // Add renderer
    code += `// Setup renderer\n`;
    code += `const renderer = new THREE.WebGLRenderer({ antialias: true });\n`;
    code += `renderer.setSize(window.innerWidth, window.innerHeight);\n`;
    code += `renderer.shadowMap.enabled = ${renderer.shadowMap.enabled};\n`;
    code += `document.body.appendChild(renderer.domElement);\n\n`;
    
    // Add orbit controls
    code += `// Setup controls\n`;
    code += `const controls = new THREE.OrbitControls(camera, renderer.domElement);\n`;
    code += `controls.enableDamping = true;\n\n`;
    
    // Add lights
    code += `// Lighting\n`;
    code += `const ambientLight = new THREE.AmbientLight(0xffffff, ${ambientLight.intensity});\n`;
    code += `scene.add(ambientLight);\n\n`;
    
    code += `const directionalLight = new THREE.DirectionalLight(0xffffff, ${directionalLight.intensity});\n`;
    code += `directionalLight.position.set(${directionalLight.position.x}, ${directionalLight.position.y}, ${directionalLight.position.z});\n`;
    code += `directionalLight.castShadow = ${directionalLight.castShadow};\n`;
    code += `scene.add(directionalLight);\n\n`;
    
    // Add objects
    code += `// Objects\n`;
    sceneManager.objects.forEach((obj, index) => {
        const object = obj.object;
        code += `// ${obj.name}\n`;
        
        if (object.isMesh) {
            // Get geometry type
            let geometryType = 'BoxGeometry';
            if (object.geometry instanceof THREE.SphereGeometry) geometryType = 'SphereGeometry';
            else if (object.geometry instanceof THREE.CylinderGeometry) geometryType = 'CylinderGeometry';
            else if (object.geometry instanceof THREE.TorusGeometry) geometryType = 'TorusGeometry';
            else if (object.geometry instanceof THREE.PlaneGeometry) geometryType = 'PlaneGeometry';
            
            code += `const material${index} = new THREE.MeshStandardMaterial({\n`;
            code += `  color: 0x${object.material.color.getHexString()},\n`;
            code += `  metalness: ${object.material.metalness},\n`;
            code += `  roughness: ${object.material.roughness},\n`;
            code += `  wireframe: ${object.material.wireframe}\n`;
            if (object.material.map) {
                code += `  // Note: You'll need to load the texture separately\n`;
            }
            code += `});\n\n`;
            
            switch (geometryType) {
                case 'BoxGeometry':
                    code += `const geometry${index} = new THREE.BoxGeometry();\n`;
                    break;
                case 'SphereGeometry':
                    code += `const geometry${index} = new THREE.SphereGeometry(0.5, 32, 32);\n`;
                    break;
                case 'CylinderGeometry':
                    code += `const geometry${index} = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);\n`;
                    break;
                case 'TorusGeometry':
                    code += `const geometry${index} = new THREE.TorusGeometry(0.5, 0.2, 16, 32);\n`;
                    break;
                case 'PlaneGeometry':
                    code += `const geometry${index} = new THREE.PlaneGeometry(1, 1);\n`;
                    break;
            }
            
            code += `const mesh${index} = new THREE.Mesh(geometry${index}, material${index});\n`;
            code += `mesh${index}.position.set(${object.position.x}, ${object.position.y}, ${object.position.z});\n`;
            code += `mesh${index}.rotation.set(${object.rotation.x}, ${object.rotation.y}, ${object.rotation.z});\n`;
            code += `mesh${index}.scale.set(${object.scale.x}, ${object.scale.y}, ${object.scale.z});\n`;
            code += `mesh${index}.castShadow = ${object.castShadow};\n`;
            code += `mesh${index}.receiveShadow = ${object.receiveShadow};\n`;
            code += `scene.add(mesh${index});\n\n`;
        } else {
            code += `// This is a complex object (e.g., imported model)\n`;
            code += `// You'll need to import it using GLTFLoader\n\n`;
        }
    });
    
    // Animation loop
    code += `// Animation loop\n`;
    code += `function animate() {\n`;
    code += `  requestAnimationFrame(animate);\n`;
    code += `  controls.update();\n`;
    code += `  renderer.render(scene, camera);\n`;
    code += `}\n\n`;
    code += `animate();\n\n`;
    
    // Resize handler
    code += `// Handle window resize\n`;
    code += `window.addEventListener('resize', () => {\n`;
    code += `  const width = window.innerWidth;\n`;
    code += `  const height = window.innerHeight;\n`;
    code += `  camera.aspect = width / height;\n`;
    code += `  camera.updateProjectionMatrix();\n`;
    code += `  renderer.setSize(width, height);\n`;
    code += `});\n`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(code)
        .then(() => {
            alert('Three.js code copied to clipboard!');
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Three.js code copied to clipboard!');
        });
});

// Window resize handler
window.addEventListener('resize', () => {
    const width = window.innerWidth - 320;
    const height = window.innerHeight;
    
    perspectiveCamera.aspect = width / height;
    perspectiveCamera.updateProjectionMatrix();
    
    orthographicCamera.left = -5 * aspectRatio;
    orthographicCamera.right = 5 * aspectRatio;
    orthographicCamera.top = 5;
    orthographicCamera.bottom = -5;
    orthographicCamera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Start animation loop
animate();
