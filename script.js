// Scene manager to keep track of all objects and their properties
class SceneManager {
    constructor() {
        this.objects = [];
        this.lights = [];
        this.selectedObject = null;
        this.objectCount = 0;
        this.lightCount = 0;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    // Add a 3D object to the scene
    addObject(object, name, type = 'mesh') {
        const id = Date.now().toString() + Math.floor(Math.random() * 1000);
        this.objectCount++;
        
        const objectData = {
            id,
            object,
            name: name || `Object ${this.objectCount}`,
            visible: true,
            type: type,
            textures: []
        };
        
        this.objects.push(objectData);
        this.updateLayerPanel();
        return objectData;
    }
    
    // Add a light to the scene
    addLight(light, name, type = 'light') {
        const id = 'light_' + Date.now().toString() + Math.floor(Math.random() * 1000);
        this.lightCount++;
        
        const lightData = {
            id,
            object: light,
            name: name || `Light ${this.lightCount}`,
            visible: true,
            type: type
        };
        
        this.objects.push(lightData);
        this.lights.push(lightData);
        
        this.updateLayerPanel();
        this.updateLightsPanel();
        
        return lightData;
    }

    // Remove an object from the scene
    removeObject(id) {
        const index = this.objects.findIndex(obj => obj.id === id);
        if (index !== -1) {
            const obj = this.objects[index];
            scene.remove(obj.object);
            this.objects.splice(index, 1);
            
            // If it's a light, also remove from lights array
            if (obj.type.includes('light')) {
                const lightIndex = this.lights.findIndex(light => light.id === id);
                if (lightIndex !== -1) {
                    this.lights.splice(lightIndex, 1);
                }
                this.updateLightsPanel();
            }
            
            if (this.selectedObject && this.selectedObject.id === id) {
                this.selectObject(null);
            }
            this.updateLayerPanel();
        }
    }

    // Select an object in the scene
    selectObject(id) {
        // If previously selected, deselect
        if (this.selectedObject && transformControl) {
            transformControl.detach();
        }

        if (id === null) {
            this.selectedObject = null;
            updateSceneInfo("Click on objects to select them");
            document.getElementById("objectProperties").classList.add("disabled");
            document.getElementById("materialProperties").classList.add("disabled");
            document.getElementById("texturesPanel").classList.add("disabled");
            document.querySelector('.selected-name').textContent = 'No selection';
            
            // Hide light-specific and geometry-specific controls
            document.querySelector('.light-property').style.display = 'none';
            document.querySelector('.geometry-property').style.display = 'none';
            document.querySelector('.scale-property').style.display = 'none';
            
            return;
        }

        this.selectedObject = this.objects.find(obj => obj.id === id) || null;
        
        if (this.selectedObject) {
            // Attach transform controls to the selected object
            if (transformControl && transformEnabled) {
                transformControl.attach(this.selectedObject.object);
            }
            
            // Update UI based on object type
            document.getElementById("objectProperties").classList.remove("disabled");
            document.querySelector('.selected-name').textContent = this.selectedObject.name;
            updateSceneInfo(`Selected: ${this.selectedObject.name}`);
            
            // Show/hide appropriate controls based on object type
            if (this.selectedObject.type.includes('light')) {
                // Light object - show light controls, hide mesh controls
                document.querySelector('.light-property').style.display = 'block';
                document.querySelector('.geometry-property').style.display = 'none';
                document.querySelector('.scale-property').style.display = 'none';
                document.getElementById("materialProperties").classList.add("disabled");
                document.getElementById("texturesPanel").classList.add("disabled");
                
                // Configure spotlight-specific controls
                const spotProps = document.querySelectorAll('.spot-light-prop');
                if (this.selectedObject.type === 'light-spot') {
                    spotProps.forEach(el => el.style.display = 'block');
                } else {
                    spotProps.forEach(el => el.style.display = 'none');
                }
                
                // Update light controls
                this.updateLightControls();
            } else {
                // Mesh object - show mesh controls, hide light controls
                document.querySelector('.light-property').style.display = 'none';
                document.querySelector('.geometry-property').style.display = 'block';
                document.querySelector('.scale-property').style.display = 'block';
                document.getElementById("materialProperties").classList.remove("disabled");
                document.getElementById("texturesPanel").classList.remove("disabled");
                
                // Update textures panel
                this.updateTexturesPanel();
            }
            
            // Update layer panel to highlight selected object
            this.updateLayerPanel();
            // Update position/rotation/scale controls
            this.updateObjectControls();
        } else {
            updateSceneInfo("Click on objects to select them");
            document.getElementById("objectProperties").classList.add("disabled");
            document.getElementById("materialProperties").classList.add("disabled");
            document.getElementById("texturesPanel").classList.add("disabled");
            document.querySelector('.selected-name').textContent = 'No selection';
        }
    }

    // Update the object list in the UI
    updateLayerPanel() {
        const objectList = document.getElementById('objectList');
        objectList.innerHTML = '';

        this.objects.forEach(obj => {
            const li = document.createElement('li');
            li.dataset.id = obj.id;
            li.classList.add('animate-fade-in');
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
            deleteBtn.style.background = 'var(--danger-color)';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeObject(obj.id);
            });

            controls.appendChild(deleteBtn);
            li.appendChild(visCheckbox);
            li.appendChild(nameSpan);
            li.appendChild(controls);
            objectList.appendChild(li);
        });
    }
    
    // Update lights panel in the UI
    updateLightsPanel() {
        const lightsPanel = document.getElementById('lightsManagerPanel');
        lightsPanel.innerHTML = '';
        
        this.lights.forEach(light => {
            const lightItem = document.createElement('div');
            lightItem.className = 'light-item';
            lightItem.dataset.id = light.id;
            
            if (this.selectedObject && this.selectedObject.id === light.id) {
                lightItem.classList.add('selected');
            }
            
            // Light icon with color
            const lightIcon = document.createElement('div');
            lightIcon.className = 'light-icon';
            
            // Set color based on light type and color
            if (light.object.color) {
                lightIcon.style.backgroundColor = `#${light.object.color.getHexString()}`;
            } else {
                lightIcon.style.backgroundColor = '#ffffff';
            }
            
            // Light name
            const lightName = document.createElement('span');
            lightName.className = 'layerItemName';
            lightName.textContent = light.name;
            
            // Light visibility toggle
            const visCheckbox = document.createElement('input');
            visCheckbox.type = 'checkbox';
            visCheckbox.checked = light.visible;
            visCheckbox.addEventListener('change', () => {
                light.visible = visCheckbox.checked;
                light.object.visible = visCheckbox.checked;
            });
            
            // Click event for selection
            lightItem.addEventListener('click', () => {
                this.selectObject(light.id);
            });
            
            // Add all elements
            lightItem.appendChild(visCheckbox);
            lightItem.appendChild(lightIcon);
            lightItem.appendChild(lightName);
            
            lightsPanel.appendChild(lightItem);
        });
        
        // Add "no lights" message if needed
        if (this.lights.length === 0) {
            const noLights = document.createElement('div');
            noLights.className = 'no-textures';
            noLights.textContent = 'No additional lights. Add a light from the Objects panel.';
            lightsPanel.appendChild(noLights);
        }
    }

    // Update position, rotation, scale controls
    updateObjectControls() {
        if (!this.selectedObject) return;

        const obj = this.selectedObject.object;

        // Update position inputs
        document.getElementById('positionX').value = obj.position.x.toFixed(2);
        document.getElementById('positionY').value = obj.position.y.toFixed(2);
        document.getElementById('positionZ').value = obj.position.z.toFixed(2);

        // Update rotation inputs - convert to degrees for better UX
        document.getElementById('rotateX').value = (obj.rotation.x * (180/Math.PI)).toFixed(1);
        document.getElementById('rotateY').value = (obj.rotation.y * (180/Math.PI)).toFixed(1);
        document.getElementById('rotateZ').value = (obj.rotation.z * (180/Math.PI)).toFixed(1);

        // Update scale inputs (only for meshes)
        if (!this.selectedObject.type.includes('light')) {
            document.getElementById('scaleX').value = obj.scale.x.toFixed(2);
            document.getElementById('scaleY').value = obj.scale.y.toFixed(2);
            document.getElementById('scaleZ').value = obj.scale.z.toFixed(2);
        }

        // Update material properties if applicable
        if (obj.material) {
            document.getElementById('objectColor').value = '#' + obj.material.color.getHexString();
            document.getElementById('metalness').value = obj.material.metalness || 0;
            document.getElementById('roughness').value = obj.material.roughness || 1;
            document.getElementById('wireframe').checked = obj.material.wireframe || false;
            
            // Update geometry type dropdown
            const geometrySelector = document.getElementById('changeGeometryType');
            if (obj.geometry instanceof THREE.BoxGeometry) {
                geometrySelector.value = 'box';
            } else if (obj.geometry instanceof THREE.SphereGeometry) {
                geometrySelector.value = 'sphere';
            } else if (obj.geometry instanceof THREE.CylinderGeometry) {
                geometrySelector.value = 'cylinder';
            } else if (obj.geometry instanceof THREE.TorusGeometry) {
                geometrySelector.value = 'torus';
            } else if (obj.geometry instanceof THREE.PlaneGeometry) {
                geometrySelector.value = 'plane';
            }
        }
    }
    
    // Update light-specific controls
    updateLightControls() {
        if (!this.selectedObject || !this.selectedObject.type.includes('light')) return;
        
        const light = this.selectedObject.object;
        
        // Update common light properties
        document.getElementById('lightIntensity').value = light.intensity;
        document.getElementById('lightColor').value = '#' + light.color.getHexString();
        
        // Handle light-specific properties
        if (light.distance !== undefined) {
            document.getElementById('lightDistance').value = light.distance;
        }
        
        if (light.castShadow !== undefined) {
            document.getElementById('lightCastShadow').checked = light.castShadow;
        }
        
        // SpotLight specific properties
        if (this.selectedObject.type === 'light-spot') {
            document.getElementById('lightAngle').value = THREE.MathUtils.radToDeg(light.angle).toFixed(1);
            document.getElementById('lightPenumbra').value = light.penumbra;
        }
    }
    
    // Texture management
    addTexture(textureFile) {
        if (!this.selectedObject || this.selectedObject.type.includes('light')) return;
        
        const url = URL.createObjectURL(textureFile);
        const textureName = textureFile.name || 'Texture ' + (this.selectedObject.textures.length + 1);
        
        textureLoader.load(url, (texture) => {
            // Create texture data
            const textureData = {
                id: Date.now().toString() + Math.floor(Math.random() * 1000),
                name: textureName,
                texture: texture,
                intensity: 1.0,
                opacity: 1.0,
                url: url,
                type: 'diffuse' // Default type - diffuse, normal, roughness, etc.
            };
            
            // Add to object's textures
            this.selectedObject.textures.push(textureData);
            
            // Apply texture to material
            this.updateObjectMaterial();
            
            // Update UI
            this.updateTexturesPanel();
        });
    }
    
    removeTexture(textureId) {
        if (!this.selectedObject) return;
        
        const index = this.selectedObject.textures.findIndex(tex => tex.id === textureId);
        if (index !== -1) {
            const textureData = this.selectedObject.textures[index];
            
            // Clean up URL
            URL.revokeObjectURL(textureData.url);
            
            // Remove from array
            this.selectedObject.textures.splice(index, 1);
            
            // Update material
            this.updateObjectMaterial();
            
            // Update UI
            this.updateTexturesPanel();
        }
    }
    
    setTextureType(textureId, type) {
        if (!this.selectedObject) return;
        
        const textureData = this.selectedObject.textures.find(tex => tex.id === textureId);
        if (textureData) {
            textureData.type = type;
            this.updateObjectMaterial();
        }
    }
    
    updateTexturesPanel() {
        const texturesList = document.getElementById('texturesList');
        texturesList.innerHTML = '';
        
        if (!this.selectedObject) return;
        
        this.selectedObject.textures.forEach(textureData => {
            const textureItem = document.createElement('div');
            textureItem.className = 'texture-item animate-fade-in';
            textureItem.dataset.id = textureData.id;
            
            // Texture header with name and delete button
            const textureHeader = document.createElement('div');
            textureHeader.className = 'texture-header';
            
            const textureName = document.createElement('span');
            textureName.className = 'texture-name';
            textureName.textContent = textureData.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'texture-remove';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => {
                this.removeTexture(textureData.id);
            });
            
            textureHeader.appendChild(textureName);
            textureHeader.appendChild(removeBtn);
            
            // Texture type selection
            const textureTypes = document.createElement('div');
            textureTypes.className = 'texture-type';
            
            const types = ['diffuse', 'normal', 'roughness', 'metalness', 'emissive'];
            types.forEach(type => {
                const typeBtn = document.createElement('button');
                typeBtn.className = `texture-type-btn ${textureData.type === type ? 'active' : ''}`;
                typeBtn.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                typeBtn.addEventListener('click', () => {
                    this.setTextureType(textureData.id, type);
                    
                    // Update active state
                    textureTypes.querySelectorAll('.texture-type-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    typeBtn.classList.add('active');
                });
                
                textureTypes.appendChild(typeBtn);
            });
            
            // Texture preview
            const texturePreview = document.createElement('div');
            texturePreview.className = 'texture-preview';
            
            // Create a canvas to preview the texture
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            
            // Create image from texture
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                texturePreview.style.backgroundImage = `url(${canvas.toDataURL()})`;
            };
            img.src = textureData.url;
            
            // Intensity control
            const intensityGroup = document.createElement('div');
            intensityGroup.className = 'input-group';
            
            const intensityLabel = document.createElement('label');
            intensityLabel.textContent = 'Intensity:';
            
            const intensityInput = document.createElement('input');
            intensityInput.type = 'number';
            intensityInput.min = '0';
            intensityInput.max = '2';
            intensityInput.step = '0.1';
            intensityInput.value = textureData.intensity;
            intensityInput.addEventListener('input', (e) => {
                textureData.intensity = parseFloat(e.target.value);
                this.updateObjectMaterial();
            });
            
            intensityGroup.appendChild(intensityLabel);
            intensityGroup.appendChild(intensityInput);
            
            // Opacity control
            const opacityGroup = document.createElement('div');
            opacityGroup.className = 'input-group';
            
            const opacityLabel = document.createElement('label');
            opacityLabel.textContent = 'Opacity:';
            
            const opacityInput = document.createElement('input');
            opacityInput.type = 'number';
            opacityInput.min = '0';
            opacityInput.max = '1';
            opacityInput.step = '0.1';
            opacityInput.value = textureData.opacity;
            opacityInput.addEventListener('input', (e) => {
                textureData.opacity = parseFloat(e.target.value);
                this.updateObjectMaterial();
            });
            
            opacityGroup.appendChild(opacityLabel);
            opacityGroup.appendChild(opacityInput);
            
            // Add all elements to texture item
            textureItem.appendChild(textureHeader);
            textureItem.appendChild(textureTypes);
            textureItem.appendChild(texturePreview);
            textureItem.appendChild(intensityGroup);
            textureItem.appendChild(opacityGroup);
            
            texturesList.appendChild(textureItem);
        });
        
        // Show "no textures" message if needed
        if (this.selectedObject.textures.length === 0) {
            const noTextures = document.createElement('div');
            noTextures.className = 'no-textures';
            noTextures.textContent = 'No textures added. Click "Add" to upload a texture.';
            texturesList.appendChild(noTextures);
        }
    }
    
    updateObjectMaterial() {
        if (!this.selectedObject || !this.selectedObject.object.material) return;
        
        const material = this.selectedObject.object.material;
        const textures = this.selectedObject.textures;
        
        // Reset maps first
        material.map = null;
        material.normalMap = null;
        material.roughnessMap = null;
        material.metalnessMap = null;
        material.emissiveMap = null;
        material.aoMap = null;
        material.transparent = false;
        
        // Apply textures based on their type
        if (textures.length > 0) {
            let hasTransparentTexture = false;
            
            textures.forEach(textureData => {
                // Apply texture based on its type
                switch(textureData.type) {
                    case 'diffuse':
                        material.map = textureData.texture;
                        // If this texture has opacity < 1, make material transparent
                        if (textureData.opacity < 1) {
                            material.transparent = true;
                            material.opacity = textureData.opacity;
                            hasTransparentTexture = true;
                        }
                        break;
                    case 'normal':
                        material.normalMap = textureData.texture;
                        material.normalScale = new THREE.Vector2(textureData.intensity, textureData.intensity);
                        break;
                    case 'roughness':
                        material.roughnessMap = textureData.texture;
                        // Adjust base roughness based on intensity
                        material.roughness = textureData.intensity;
                        break;
                    case 'metalness':
                        material.metalnessMap = textureData.texture;
                        // Adjust base metalness based on intensity
                        material.metalness = textureData.intensity;
                        break;
                    case 'emissive':
                        material.emissiveMap = textureData.texture;
                        material.emissive = new THREE.Color(1, 1, 1);
                        material.emissiveIntensity = textureData.intensity;
                        break;
                }
            });
            
            // If no transparent texture was found, ensure opacity is 1
            if (!hasTransparentTexture) {
                material.opacity = 1;
            }
        }
        
        // Ensure material properties are updated
        material.needsUpdate = true;
    }
    
    // Raycasting for object selection
    handleCanvasClick(event) {
        // Calculate mouse position in normalized device coordinates
        const canvasBounds = renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
        this.mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;
        
        // Update the raycaster
        this.raycaster.setFromCamera(this.mouse, camera);
        
        // Create an array of objects to check (excluding grid and ground)
        const selectableObjects = this.objects
            .filter(obj => obj.visible && obj.object !== ground && obj.object !== gridHelper)
            .map(obj => obj.object);
        
        // Find intersected objects
        const intersects = this.raycaster.intersectObjects(selectableObjects, true);
        
        // If we have intersections, select the first one
        if (intersects.length > 0) {
            // Find the top level object (in case we hit a child)
            let selectedObject = intersects[0].object;
            
            // Traverse up the parent chain to find the root object
            while (selectedObject.parent && selectedObject.parent !== scene) {
                selectedObject = selectedObject.parent;
            }
            
            // Find this object in our array
            const objData = this.objects.find(obj => obj.object === selectedObject || obj.object.uuid === selectedObject.uuid);
            
            if (objData) {
                this.selectObject(objData.id);
                return;
            }
        }
        
        // If we get here, we didn't hit anything - deselect
        if (event.target === renderer.domElement) {
            this.selectObject(null);
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
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better HDR rendering
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding; // Proper color space for HDR

// Camera setup
const aspectRatio = (window.innerWidth - 320) / window.innerHeight;
const perspectiveCamera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
const orthographicCamera = new THREE.OrthographicCamera(
    -5 * aspectRatio, 5 * aspectRatio, 
    5, -5, 0.1, 1000
);

// Set initial camera position and target
let camera = perspectiveCamera;
camera.position.set(0, 2, 5);
const cameraTarget = new THREE.Vector3(0, 0, 0);
camera.lookAt(cameraTarget);

// Update camera UI inputs
function updateCameraInputs() {
    document.getElementById('cameraX').value = camera.position.x.toFixed(2);
    document.getElementById('cameraY').value = camera.position.y.toFixed(2);
    document.getElementById('cameraZ').value = camera.position.z.toFixed(2);
    
    document.getElementById('targetX').value = cameraTarget.x.toFixed(2);
    document.getElementById('targetY').value = cameraTarget.y.toFixed(2);
    document.getElementById('targetZ').value = cameraTarget.z.toFixed(2);
}

// Initial update
updateCameraInputs();

// Orbit controls for camera
const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;

// Transform controls for object manipulation
let transformControl = new THREE.TransformControls(camera, renderer.domElement);
transformControl.setSize(0.75);
transformControl.addEventListener('dragging-changed', function(event) {
    orbitControls.enabled = !event.value;
    
    // Update UI when object is transformed via the control
    if (!event.value && sceneManager.selectedObject) {
        sceneManager.updateObjectControls();
    }
});
scene.add(transformControl);

let transformEnabled = false;

// Scene info update function
function updateSceneInfo(text) {
    const infoEl = document.getElementById('scene-info');
    infoEl.textContent = text;
    
    // Add fade-in animation
    infoEl.classList.remove('animate-fade-in');
    void infoEl.offsetWidth; // Trigger reflow to restart animation
    infoEl.classList.add('animate-fade-in');
}

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

// Add directional light to the scene manager
sceneManager.addLight(directionalLight, 'Main Directional Light', 'light-directional');

// Create grid helper (visible in scene)
const gridSize = 20;
const gridDivisions = 20;
const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
scene.add(gridHelper);

// Create transparent ground plane
const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize, gridDivisions, gridDivisions);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x222222,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    wireframe: false
});

// Add grid texture to ground
const gridTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF62lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0MzUyLCAyMDIwLzAxLzMwLTE1OjUwOjM4ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjAtMDUtMDRUMTI6MTY6MjMrMDk6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTA1LTA0VDEyOjE3OjA1KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTA1LTA0VDEyOjE3OjA1KzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjc3NzU1MmJhLTAwYzUtNDM1ZC05MzY1LTIxMDkzODBiZDEyNiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpjOTQ2M2YwMS04YmVlLTRkMmMtOWVjYS02YzI3NTIyMWZiZjUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpjOTQ2M2YwMS04YmVlLTRkMmMtOWVjYS02YzI3NTIyMWZiZjUiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmM5NDYzZjAxLThiZWUtNGQyYy05ZWNhLTZjMjc1MjIxZmJmNSIgc3RFdnQ6d2hlbj0iMjAyMC0wNS0wNFQxMjoxNjoyMyswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjc3NzU1MmJhLTAwYzUtNDM1ZC05MzY1LTIxMDkzODBiZDEyNiIgc3RFdnQ6d2hlbj0iMjAyMC0wNS0wNFQxMjoxNzowNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Rx4QtwAABJ5JREFUeJztm71rFUEQwGe29z4TxU8UGxWsgoWNiKI2ItFGrLQQ/Ad8VBY2YpFSEPErIYhg0MbORhEUFCIYC1FIKgoWKpLGQnL5nHt7u+N97Ozl3u3e7V4iydwLQ3h3OzM7v5mdmX0JMQwD1rsQ6wasdQQD6h3BgHqHKWwJlOHkbSuRNY/P3zaMzqSEtgQGxu/lMQYXZRp5/rnlwfiTKUzUmudwlOKmzOiV8y1GZ9JCMcBoNGb7RaVhZ/vDTBuNvhOg0gCj0ZjtFxq4HSVzfn5olUi0Eop+DZj+ZKKtOGg0SoZEuP2p62Wmja0vPhrjd0fw29DQOUI7dJlOVtdIX1+fMU1JMAYVgXdh1Tz+/ov34Z+/Pvi5c4rGWROgQXL4pD+5TmWjsG/vdtbH3qF9/Dlr4vLzAvhjQPh3B/ixmRcD42+jGY+nCfDHAJ0E6PJrHh+feFgkTtfDlZmEyoA0NzGKswDAGDxhRG25+aPnDQC1Z5t1yYD5oZX0vQDAuGnvIrb72d6d/O0HO88AgKBJ7/XsKgA0HgJkVcP+TjwATRKAz3kIAOH5DQCAjl0BnY4fkQypyQHq+gCAmGPIk5QA6uxBnQWou8F1VB1IU4QIBtQ7ggH1jmBAvSMYUO8IBtQ7ggFgRU6aLWANsF0DlqtAVlfwcnVuSXgm4PEJQDu9LY0FyHUXsG75rGGfhACgS1uSZWGwQgMwHgL8PWSM8XXLMgZIp4A6+yFsRy2z/1XLnQBGQRyKW7VwkjwAXRrgHyQmcxtU1IMmHwCw1ZxS1INM5gbwRtQB0hYkk6kSMQrGGFKxkswNkOtBWD0INYAyTYCxm6ykDCBvETR2k1U0WGm5ELJqgHopbHaT3RTAmAGwTAMgaQE8qQFONAGSW0DQgJ3U/+D1xWZLbZAqhbnjKJfnIhTW+30sSXxUCmMUbLfKIlfHoTjxRR3oqANQLQiw7/kAoNrAtSGhNsQe4sF4AMV4wD3EFYnPNcCryYCifA6Q/E9hnHUwxmOj5zlvAAJ37bHFMBqD9OfGRQRg8QEQnlDSq1CrjQ+AkRDKLGDUAONp0B8DMFJN5R5nzQJsDVimASIL2J0HzCHMNzz4KHYDJlUDNGcCF+qbFmKz66htA6wXI5LZAGrDrNLi3fEPYI5fLJZsG3B0aGXdcm7fPMEfZ1RpdWwdoI1jYeGCZSIaWUCVAFtdAFULYHbxVQCUzXFbLSisCYYQzSzgYwjcZ4LkGcyIq43XGFKNx9eAzSw/r0CkYdZ8BScLqAUAVLUARFUKw+pSWPlrgF3CwsIRO8S6gE4DlCmQ3QJ+rAHsEDgvn92VtqsB7BAi1oboAo4zYNkzgY85wIkGWAZAGQJtDcB
