// Wait for the DOM to be fully loaded before running any code
document.addEventListener('DOMContentLoaded', function() {
    initEditor();
});

// Main initialization function
function initEditor() {
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
                
                const objectProps = document.getElementById("objectProperties");
                if (objectProps) objectProps.classList.add("disabled");
                
                const materialProps = document.getElementById("materialProperties");
                if (materialProps) materialProps.classList.add("disabled");
                
                const texturesPanel = document.getElementById("texturesPanel");
                if (texturesPanel) texturesPanel.classList.add("disabled");
                
                const selectedName = document.querySelector('.selected-name');
                if (selectedName) selectedName.textContent = 'No selection';
                
                // Hide light-specific and geometry-specific controls
                const lightProperty = document.querySelector('.light-property');
                if (lightProperty) lightProperty.style.display = 'none';
                
                const geometryProperty = document.querySelector('.geometry-property');
                if (geometryProperty) geometryProperty.style.display = 'none';
                
                const scaleProperty = document.querySelector('.scale-property');
                if (scaleProperty) scaleProperty.style.display = 'none';
                
                return;
            }

            this.selectedObject = this.objects.find(obj => obj.id === id) || null;
            
            if (this.selectedObject) {
                // Attach transform controls to the selected object
                if (transformControl && transformEnabled) {
                    transformControl.attach(this.selectedObject.object);
                }
                
                // Update UI based on object type
                const objectProps = document.getElementById("objectProperties");
                if (objectProps) objectProps.classList.remove("disabled");
                
                const selectedName = document.querySelector('.selected-name');
                if (selectedName) selectedName.textContent = this.selectedObject.name;
                
                updateSceneInfo(`Selected: ${this.selectedObject.name}`);
                
                // Show/hide appropriate controls based on object type
                if (this.selectedObject.type.includes('light')) {
                    // Light object - show light controls, hide mesh controls
                    const lightProperty = document.querySelector('.light-property');
                    if (lightProperty) lightProperty.style.display = 'block';
                    
                    const geometryProperty = document.querySelector('.geometry-property');
                    if (geometryProperty) geometryProperty.style.display = 'none';
                    
                    const scaleProperty = document.querySelector('.scale-property');
                    if (scaleProperty) scaleProperty.style.display = 'none';
                    
                    const materialProps = document.getElementById("materialProperties");
                    if (materialProps) materialProps.classList.add("disabled");
                    
                    const texturesPanel = document.getElementById("texturesPanel");
                    if (texturesPanel) texturesPanel.classList.add("disabled");
                    
                    // Configure spotlight-specific controls
                    const spotProps = document.querySelectorAll('.spot-light-prop');
                    if (spotProps.length) {
                        if (this.selectedObject.type === 'light-spot') {
                            spotProps.forEach(el => el.style.display = 'block');
                        } else {
                            spotProps.forEach(el => el.style.display = 'none');
                        }
                    }
                    
                    // Update light controls
                    this.updateLightControls();
                } else {
                    // Mesh object - show mesh controls, hide light controls
                    const lightProperty = document.querySelector('.light-property');
                    if (lightProperty) lightProperty.style.display = 'none';
                    
                    const geometryProperty = document.querySelector('.geometry-property');
                    if (geometryProperty) geometryProperty.style.display = 'block';
                    
                    const scaleProperty = document.querySelector('.scale-property');
                    if (scaleProperty) scaleProperty.style.display = 'block';
                    
                    const materialProps = document.getElementById("materialProperties");
                    if (materialProps) materialProps.classList.remove("disabled");
                    
                    const texturesPanel = document.getElementById("texturesPanel");
                    if (texturesPanel) texturesPanel.classList.remove("disabled");
                    
                    // Update textures panel
                    this.updateTexturesPanel();
                }
                
                // Update layer panel to highlight selected object
                this.updateLayerPanel();
                // Update position/rotation/scale controls
                this.updateObjectControls();
            } else {
                updateSceneInfo("Click on objects to select them");
                
                const objectProps = document.getElementById("objectProperties");
                if (objectProps) objectProps.classList.add("disabled");
                
                const materialProps = document.getElementById("materialProperties");
                if (materialProps) materialProps.classList.add("disabled");
                
                const texturesPanel = document.getElementById("texturesPanel");
                if (texturesPanel) texturesPanel.classList.add("disabled");
                
                const selectedName = document.querySelector('.selected-name');
                if (selectedName) selectedName.textContent = 'No selection';
            }
        }

        // Update the object list in the UI
        updateLayerPanel() {
            const objectList = document.getElementById('objectList');
            if (!objectList) return;
            
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
            if (!lightsPanel) return;
            
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
            const posX = document.getElementById('positionX');
            const posY = document.getElementById('positionY');
            const posZ = document.getElementById('positionZ');
            
            if (posX && posY && posZ) {
                posX.value = obj.position.x.toFixed(2);
                posY.value = obj.position.y.toFixed(2);
                posZ.value = obj.position.z.toFixed(2);
            }

            // Update rotation inputs - convert to degrees for better UX
            const rotX = document.getElementById('rotateX');
            const rotY = document.getElementById('rotateY');
            const rotZ = document.getElementById('rotateZ');
            
            if (rotX && rotY && rotZ) {
                rotX.value = (obj.rotation.x * (180/Math.PI)).toFixed(1);
                rotY.value = (obj.rotation.y * (180/Math.PI)).toFixed(1);
                rotZ.value = (obj.rotation.z * (180/Math.PI)).toFixed(1);
            }

            // Update scale inputs (only for meshes)
            if (!this.selectedObject.type.includes('light')) {
                const scaleX = document.getElementById('scaleX');
                const scaleY = document.getElementById('scaleY');
                const scaleZ = document.getElementById('scaleZ');
                
                if (scaleX && scaleY && scaleZ) {
                    scaleX.value = obj.scale.x.toFixed(2);
                    scaleY.value = obj.scale.y.toFixed(2);
                    scaleZ.value = obj.scale.z.toFixed(2);
                }
            }

            // Update material properties if applicable
            if (obj.material) {
                const objColor = document.getElementById('objectColor');
                const metalness = document.getElementById('metalness');
                const roughness = document.getElementById('roughness');
                const wireframe = document.getElementById('wireframe');
                
                if (objColor) objColor.value = '#' + obj.material.color.getHexString();
                if (metalness) metalness.value = obj.material.metalness || 0;
                if (roughness) roughness.value = obj.material.roughness || 1;
                if (wireframe) wireframe.checked = obj.material.wireframe || false;
                
                // Update geometry type dropdown
                const geometrySelector = document.getElementById('changeGeometryType');
                if (geometrySelector && obj.geometry) {
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
        }
        
        // Update light-specific controls
        updateLightControls() {
            if (!this.selectedObject || !this.selectedObject.type.includes('light')) return;
            
            const light = this.selectedObject.object;
            
            // Update common light properties
            const lightIntensity = document.getElementById('lightIntensity');
            const lightColor = document.getElementById('lightColor');
            
            if (lightIntensity) lightIntensity.value = light.intensity;
            if (lightColor) lightColor.value = '#' + light.color.getHexString();
            
            // Handle light-specific properties
            const lightDistance = document.getElementById('lightDistance');
            if (light.distance !== undefined && lightDistance) {
                lightDistance.value = light.distance;
            }
            
            const lightCastShadow = document.getElementById('lightCastShadow');
            if (light.castShadow !== undefined && lightCastShadow) {
                lightCastShadow.checked = light.castShadow;
            }
            
            // SpotLight specific properties
            if (this.selectedObject.type === 'light-spot') {
                const lightAngle = document.getElementById('lightAngle');
                const lightPenumbra = document.getElementById('lightPenumbra');
                
                if (lightAngle) lightAngle.value = THREE.MathUtils.radToDeg(light.angle).toFixed(1);
                if (lightPenumbra) lightPenumbra.value = light.penumbra;
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
        
        // Rest of your SceneManager methods...
        // (updateTexturesPanel, updateObjectMaterial, handleCanvasClick, etc.)
    }

    // Initialize scene, renderer, camera, and controls
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Get canvas element
    const canvas = document.getElementById('three-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    // Renderer setup with antialiasing and shadows
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        canvas: canvas
    });
    renderer.setSize(window.innerWidth - 320, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;

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

    // Update scene info function
    function updateSceneInfo(text) {
        const infoEl = document.getElementById('scene-info');
        if (infoEl) {
            infoEl.textContent = text;
            
            // Add fade-in animation
            infoEl.classList.remove('animate-fade-in');
            void infoEl.offsetWidth; // Trigger reflow to restart animation
            infoEl.classList.add('animate-fade-in');
        }
    }

    // Create scene manager
    const sceneManager = new SceneManager();

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

    // Add a simple texture for the grid
    const groundTexture = new THREE.TextureLoader();
    groundMaterial.map = groundTexture.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    groundMaterial.map.repeat.set(gridSize, gridSize);
    groundMaterial.map.wrapS = THREE.RepeatWrapping;
    groundMaterial.map.wrapT = THREE.RepeatWrapping;

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add a cube as initial object
    const boxGeometry = new THREE.BoxGeometry();
    const boxMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0077ff,
        metalness: 0,
        roughness: 1
    });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    scene.add(boxMesh);
    
    // Add it to scene manager
    const boxObj = sceneManager.addObject(boxMesh, 'Box');
    
    // Initialize texture loader
    const textureLoader = new THREE.TextureLoader();
    
    // Set up the HDR loader
    const rgbeLoader = new THREE.RGBELoader();
    
    // Function to load HDR environment
    function loadHDREnvironment(file) {
        const url = URL.createObjectURL(file);
        
        rgbeLoader.load(url, function(texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            scene.background = texture;
            
            // Update all materials to use environment map
            sceneManager.objects.forEach(obj => {
                if (obj.object.material && !obj.type.includes('light')) {
                    obj.object.material.envMap = texture;
                    obj.object.material.needsUpdate = true;
                }
            });
            
            // Clean up URL
            URL.revokeObjectURL(url);
            
            updateSceneInfo('HDR environment loaded');
        });
    }
    
    // Function to set transform mode
    function setTransformMode(mode) {
        // Safely find and reset all transform buttons
        const transformBtns = document.querySelectorAll('.transform-btn');
        transformBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (mode === 'disable') {
            transformEnabled = false;
            if (transformControl) {
                transformControl.detach();
            }
            // Try to set the active class
            const disableBtn = document.getElementById('disableTransform');
            if (disableBtn) {
                disableBtn.classList.add('active');
            }
            return;
        }
        
        // Enable transform and set mode
        transformEnabled = true;
        if (transformControl) {
            transformControl.setMode(mode);
        }
        
        // If there's a selected object, attach transform controls
        if (sceneManager.selectedObject) {
            transformControl.attach(sceneManager.selectedObject.object);
        }
        
        // Try to set the active class
        const modeBtn = document.getElementById(`${mode}Mode`);
        if (modeBtn) {
            modeBtn.classList.add('active');
        }
    }
    
    // Function to handle tab switching
    function setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        if (!tabBtns.length) return;
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all tabs and tab content
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab
                btn.classList.add('active');
                
                // Show corresponding tab content
                const tabId = btn.dataset.tab;
                const tabContent = document.getElementById(`${tabId}-tab`);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
    }
    
    // Create event listeners
    function setupEventListeners() {
        // First check if elements exist before adding listeners
        
        // Canvas click event for object selection
        renderer.domElement.addEventListener('click', (event) => {
            sceneManager.handleCanvasClick(event);
        });
        
        // Transform controls
        const translateBtn = document.getElementById('translateMode');
        const rotateBtn = document.getElementById('rotateMode');
        const scaleBtn = document.getElementById('scaleMode');
        const disableBtn = document.getElementById('disableTransform');
        
        if (translateBtn) translateBtn.addEventListener('click', () => setTransformMode('translate'));
        if (rotateBtn) rotateBtn.addEventListener('click', () => setTransformMode('rotate'));
        if (scaleBtn) scaleBtn.addEventListener('click', () => setTransformMode('scale'));
        if (disableBtn) disableBtn.addEventListener('click', () => setTransformMode('disable'));
        
        // Add object button
        const addObjectBtn = document.getElementById('addObject');
        const confirmAddObjectBtn = document.getElementById('confirmAddObject');
        const geometrySelector = document.getElementById('geometrySelector');
        const addObjectType = document.querySelector('.add-object-type');
        
        if (addObjectBtn && addObjectType) {
            addObjectBtn.addEventListener('click', () => {
                addObjectType.style.display = 'block';
            });
            
            if (confirmAddObjectBtn && geometrySelector) {
                confirmAddObjectBtn.addEventListener('click', () => {
                    const type = geometrySelector.value;
                    createNewObject(type);
                    addObjectType.style.display = 'none';
                });
            }
        }
        
        // Import model button
        const importModelBtn = document.getElementById('importModelBtn');
        const importModel = document.getElementById('importModel');
        
        if (importModelBtn && importModel) {
            importModelBtn.addEventListener('click', () => {
                importModel.click();
            });
            
            importModel.addEventListener('change', handleModelImport);
        }
        
        // Add texture button
        const addTextureBtn = document.getElementById('addTexture');
        if (addTextureBtn) {
            addTextureBtn.addEventListener('click', () => {
                if (!sceneManager.selectedObject) {
                    updateSceneInfo('Please select an object first');
                    return;
                }
                
                // Create a file input for texture upload
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.style.display = 'none';
                document.body.appendChild(input);
                
                input.addEventListener('change', (e) => {
                    if (e.target.files.length) {
                        sceneManager.addTexture(e.target.files[0]);
                    }
                    document.body.removeChild(input);
                });
                
                input.click();
            });
        }
        
        // HDR environment map upload
        const hdrUpload = document.getElementById('hdrUpload');
        if (hdrUpload) {
            hdrUpload.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    loadHDREnvironment(e.target.files[0]);
                }
            });
        }
        
        // Set up other event listeners for all controls...
        setupControlEvents();
    }
    
    // Function to set up control event listeners
    function setupControlEvents() {
        // Material controls
        const objectColor = document.getElementById('objectColor');
        const metalness = document.getElementById('metalness');
        const roughness = document.getElementById('roughness');
        const wireframe = document.getElementById('wireframe');
        
        if (objectColor) {
            objectColor.addEventListener('input', (e) => {
                if (!sceneManager.selectedObject) return;
                if (sceneManager.selectedObject.object.material) {
                    sceneManager.selectedObject.object.material.color.set(e.target.value);
                }
            });
        }
        
        if (metalness) {
            metalness.addEventListener('input', (e) => {
                if (!sceneManager.selectedObject) return;
                if (sceneManager.selectedObject.object.material) {
                    sceneManager.selectedObject.object.material.metalness = parseFloat(e.target.value);
                }
            });
        }
        
        if (roughness) {
            roughness.addEventListener('input', (e) => {
                if (!sceneManager.selectedObject) return;
                if (sceneManager.selectedObject.object.material) {
                    sceneManager.selectedObject.object.material.roughness = parseFloat(e.target.value);
                }
            });
        }
        
        if (wireframe) {
            wireframe.addEventListener('change', (e) => {
                if (!sceneManager.selectedObject) return;
                if (sceneManager.selectedObject.object.material) {
                    sceneManager.selectedObject.object.material.wireframe = e.target.checked;
                }
            });
        }
        
        // Position, rotation, scale controls
        ['X', 'Y', 'Z'].forEach(axis => {
            const positionInput = document.getElementById(`position${axis}`);
            const rotateInput = document.getElementById(`rotate${axis}`);
            const scaleInput = document.getElementById(`scale${axis}`);
            
            if (positionInput) {
                positionInput.addEventListener('input', (e) => {
                    if (!sceneManager.selectedObject) return;
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                        sceneManager.selectedObject.object.position[axis.toLowerCase()] = value;
                        if (transformEnabled && transformControl) {
                            transformControl.updateMatrixWorld();
                        }
                    }
                });
            }
            
            if (rotateInput) {
                rotateInput.addEventListener('input', (e) => {
                    if (!sceneManager.selectedObject) return;
                    const valueDegrees = parseFloat(e.target.value);
                    if (!isNaN(valueDegrees)) {
                        // Convert degrees to radians for Three.js
                        const valueRadians = valueDegrees * (Math.PI/180);
                        sceneManager.selectedObject.object.rotation[axis.toLowerCase()] = valueRadians;
                        if (transformEnabled && transformControl) {
                            transformControl.updateMatrixWorld();
                        }
                    }
                });
            }
            
            if (scaleInput) {
                scaleInput.addEventListener('input', (e) => {
                    if (!sceneManager.selectedObject) return;
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value > 0) {
                        sceneManager.selectedObject.object.scale[axis.toLowerCase()] = value;
                        if (transformEnabled && transformControl) {
                            transformControl.updateMatrixWorld();
                        }
                    }
                });
            }
        });
        
        // Camera controls
        ['X', 'Y', 'Z'].forEach(axis => {
            const cameraInput = document.getElementById(`camera${axis}`);
            const targetInput = document.getElementById(`target${axis}`);
            
            if (cameraInput) {
                cameraInput.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                        camera.position[axis.toLowerCase()] = value;
                        orbitControls.update();
                    }
                });
            }
            
            if (targetInput) {
                targetInput.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                        cameraTarget[axis.toLowerCase()] = value;
                        camera.lookAt(cameraTarget);
                        orbitControls.target.copy(cameraTarget);
                        orbitControls.update();
                    }
                });
            }
        });
        
        // Export buttons
        const exportSceneBtn = document.getElementById('exportScene');
        const copyCodeBtn = document.getElementById('copyCode');
        
        if (exportSceneBtn) {
            exportSceneBtn.addEventListener('click', exportScene);
        }
        
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', copyThreeJsCode);
        }
    }
    
    // Function to create a new object
    function createNewObject(type) {
        let object;
        
        if (type.startsWith('light-')) {
            // Create a light
            switch (type) {
                case 'light-point':
                    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
                    pointLight.position.set(0, 2, 0);
                    pointLight.castShadow = true;
                    object = pointLight;
                    scene.add(object);
                    sceneManager.addLight(object, 'Point Light', 'light-point');
                    break;
                case 'light-spot':
                    const spotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI/4, 0.2);
                    spotLight.position.set(0, 5, 0);
                    spotLight.castShadow = true;
                    object = spotLight;
                    scene.add(object);
                    sceneManager.addLight(object, 'Spot Light', 'light-spot');
                    break;
                case 'light-area':
                    // Three.js doesn't have an area light in the core library,
                    // but we can simulate it with a RectAreaLight from the examples
                    const rectLight = new THREE.DirectionalLight(0xffffff, 1);
                    rectLight.position.set(0, 5, 0);
                    rectLight.castShadow = true;
                    object = rectLight;
                    scene.add(object);
                    sceneManager.addLight(object, 'Area Light', 'light-area');
                    break;
            }
        } else {
            // Create a mesh
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
            
            object = new THREE.Mesh(geometry, material);
            object.castShadow = true;
            object.receiveShadow = true;
            
            scene.add(object);
            
            // Add to scene manager
            const objData = sceneManager.addObject(
                object, 
                type.charAt(0).toUpperCase() + type.slice(1)
            );
            
            // Select the new object
            sceneManager.selectObject(objData.id);
        }
        
        return object;
    }
    
    // Function to handle model import
    function handleModelImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const url = URL.createObjectURL(file);
        
        // Create GLTF loader
        const gltfLoader = new THREE.GLTFLoader();
        
        gltfLoader.load(url, (gltf) => {
            const model = gltf.scene;
            
            // Center the model
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
            
            // Apply shadows
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            
            scene.add(model);
            
            // Add to scene manager
            const objData = sceneManager.addObject(
                model, 
                file.name.split('.')[0] || 'Imported Model'
            );
            
            // Select the new model
            sceneManager.selectObject(objData.id);
            
            // Clean up URL
            URL.revokeObjectURL(url);
        }, 
        undefined,  // onProgress
        (error) => {
            console.error('Error loading model:', error);
            updateSceneInfo('Error loading model');
        });
    }
    
    // Function to export scene as JSON
    function exportScene() {
        const sceneJson = scene.toJSON();
        const jsonString = JSON.stringify(sceneJson, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.json';
        a.click();
        
        URL.revokeObjectURL(url);
        
        updateSceneInfo('Scene exported as JSON');
    }
    
    // Function to copy Three.js code
    function copyThreeJsCode() {
        // Generate code...
        let code = `// Three.js Scene exported from 3D Scene Editor\n\n`;
        code += `// Create scene\n`;
        code += `const scene = new THREE.Scene();\n`;
        code += `scene.background = new THREE.Color(0x${scene.background instanceof THREE.Color ? scene.background.getHexString() : '111111'});\n\n`;
        
        // Add camera, lights, objects, etc.
        
        // Copy to clipboard
        navigator.clipboard.writeText(code)
            .then(() => {
                updateSceneInfo('Three.js code copied to clipboard!');
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
                updateSceneInfo('Three.js code copied to clipboard!');
            });
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        orbitControls.update();
        renderer.render(scene, camera);
    }
    
    // Window resize handler
    window.addEventListener('resize', () => {
        const width = window.innerWidth - 320;
        const height = window.innerHeight;
        
        perspectiveCamera.aspect = width / height;
        perspectiveCamera.updateProjectionMatrix();
        
        orthographicCamera.left = -5 * (width / height);
        orthographicCamera.right = 5 * (width / height);
        orthographicCamera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
    });
    
    // Set up the UI components
    setupTabs();
    setupEventListeners();
    
    // Select the initial object
    sceneManager.selectObject(boxObj.id);
    
    // Enable translate mode by default
    setTransformMode('translate');
    
    // Start animation loop
    animate();
    
    // Show ready message
    updateSceneInfo('3D Scene Editor ready. Click on objects to select them.');
}
