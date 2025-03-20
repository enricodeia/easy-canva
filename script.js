// Scene manager to keep track of all objects and their properties
class SceneManager {
    constructor() {
        this.objects = [];
        this.selectedObject = null;
        this.objectCount = 0;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    addObject(object, name) {
        const id = Date.now().toString();
        this.objectCount++;
        const objectData = {
            id,
            object,
            name: name || `Object ${this.objectCount}`,
            visible: true,
            type: 'mesh',
            textures: []
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
                this.selectObject(null);
            }
            this.updateLayerPanel();
        }
    }

    selectObject(id) {
        // If previously selected, deselect
        if (this.selectedObject && transformControl) {
            transformControl.detach();
        }

        if (id === null) {
            this.selectedObject = null;
            updateSceneInfo("Click on objects to select them");
            document.getElementById("objectProperties").classList.add("disabled");
            document.getElementById("texturesPanel").classList.add("disabled");
            document.querySelector('.selected-name').textContent = 'No selection';
            return;
        }

        this.selectedObject = this.objects.find(obj => obj.id === id) || null;
        
        if (this.selectedObject) {
            // Attach transform controls to the selected object
            if (transformControl && transformEnabled) {
                transformControl.attach(this.selectedObject.object);
            }
            
            // Update UI
            document.getElementById("objectProperties").classList.remove("disabled");
            document.getElementById("texturesPanel").classList.remove("disabled");
            document.querySelector('.selected-name').textContent = this.selectedObject.name;
            updateSceneInfo(`Selected: ${this.selectedObject.name}`);
            
            // Update textures panel
            this.updateTexturesPanel();
        } else {
            updateSceneInfo("Click on objects to select them");
            document.getElementById("objectProperties").classList.add("disabled");
            document.getElementById("texturesPanel").classList.add("disabled");
            document.querySelector('.selected-name').textContent = 'No selection';
        }
        
        this.updateLayerPanel();
        this.updateControls();
    }

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

    updateControls() {
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

        // Update scale inputs
        document.getElementById('scaleX').value = obj.scale.x.toFixed(2);
        document.getElementById('scaleY').value = obj.scale.y.toFixed(2);
        document.getElementById('scaleZ').value = obj.scale.z.toFixed(2);

        // Update material properties if applicable
        if (obj.material) {
            document.getElementById('objectColor').value = '#' + obj.material.color.getHexString();
            document.getElementById('metalness').value = obj.material.metalness || 0;
            document.getElementById('roughness').value = obj.material.roughness || 1;
            document.getElementById('wireframe').checked = obj.material.wireframe || false;
        }
    }
    
    // Texture management
    addTexture(textureFile) {
        if (!this.selectedObject) return;
        
        const url = URL.createObjectURL(textureFile);
        const textureName = textureFile.name || 'Texture ' + (this.selectedObject.textures.length + 1);
        
        textureLoader.load(url, (texture) => {
            // Create texture data
            const textureData = {
                id: Date.now().toString(),
                name: textureName,
                texture: texture,
                intensity: 1.0,
                opacity: 1.0,
                url: url
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
        
        // Handle multiple textures - we'll use the first as the base map
        if (this.selectedObject.textures.length > 0) {
            const baseTexture = this.selectedObject.textures[0];
            material.map = baseTexture.texture;
            material.map.intensity = baseTexture.intensity;
            material.opacity = baseTexture.opacity;
            material.transparent = baseTexture.opacity < 1;
            
            // If we have additional textures, add them as overlays
            // This is a simplified approach - for production you'd want a more sophisticated texture blending system
            if (this.selectedObject.textures.length > 1) {
                // For demo, we'll use second texture as normal map if available
                const secondTexture = this.selectedObject.textures[1];
                material.normalMap = secondTexture.texture;
                material.normalScale = new THREE.Vector2(secondTexture.intensity, secondTexture.intensity);
                
                // Third texture as roughness map if available
                if (this.selectedObject.textures.length > 2) {
                    const thirdTexture = this.selectedObject.textures[2];
                    material.roughnessMap = thirdTexture.texture;
                    // Adjust roughness based on intensity
                    material.roughness = thirdTexture.intensity;
                }
            }
        } else {
            // No textures, reset to basic material properties
            material.map = null;
            material.normalMap = null;
            material.roughnessMap = null;
            material.transparent = false;
            material.opacity = 1;
        }
        
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
        
        // Find all intersected objects
        const intersects = this.raycaster.intersectObjects(scene.children, true);
        
        // Filter out the ground and grid
        const filteredIntersects = intersects.filter(intersect => 
            intersect.object !== ground && 
            intersect.object !== gridHelper
        );
        
        // If we have intersections, select the first one
        if (filteredIntersects.length > 0) {
            // Find the top level object (in case we hit a child)
            let selectedObject = filteredIntersects[0].object;
            
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
        sceneManager.updateControls();
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

// Create grid helper (visible in scene)
const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
scene.add(gridHelper);

// Create transparent ground plane
const groundGeometry = new THREE.PlaneGeometry(20, 20, 20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x222222,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    wireframe: false
});

// Add grid texture to ground
const gridTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF62lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0MzUyLCAyMDIwLzAxLzMwLTE1OjUwOjM4ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjAtMDUtMDRUMTI6MTY6MjMrMDk6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTA1LTA0VDEyOjE3OjA1KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTA1LTA0VDEyOjE3OjA1KzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjc3NzU1MmJhLTAwYzUtNDM1ZC05MzY1LTIxMDkzODBiZDEyNiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpjOTQ2M2YwMS04YmVlLTRkMmMtOWVjYS02YzI3NTIyMWZiZjUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpjOTQ2M2YwMS04YmVlLTRkMmMtOWVjYS02YzI3NTIyMWZiZjUiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmM5NDYzZjAxLThiZWUtNGQyYy05ZWNhLTZjMjc1MjIxZmJmNSIgc3RFdnQ6d2hlbj0iMjAyMC0wNS0wNFQxMjoxNjoyMyswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjc3NzU1MmJhLTAwYzUtNDM1ZC05MzY1LTIxMDkzODBiZDEyNiIgc3RFdnQ6d2hlbj0iMjAyMC0wNS0wNFQxMjoxNzowNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Rx4QtwAABJ5JREFUeJztm71rFUEQwGe29z4TxU8UGxWsgoWNiKI2ItFGrLQQ/Ad8VBY2YpFSEPErIYhg0MbORhEUFCIYC1FIKgoWKpLGQnL5nHt7u+N97Ozl3u3e7V4iydwLQ3h3OzM7v5mdmX0JMQwD1rsQ6wasdQQD6h3BgHqHKWwJlOHkbSuRNY/P3zaMzqSEtgQGxu/lMQYXZRp5/rnlwfiTKUzUmudwlOKmzOiV8y1GZ9JCMcBoNGb7RaVhZ/vDTBuNvhOg0gCj0ZjtFxq4HSVzfn5olUi0Eop+DZj+ZKKtOGg0SoZEuP2p62Wmja0vPhrjd0fw29DQOUI7dJlOVtdIX1+fMU1JMAYVgXdh1Tz+/ov34Z+/Pvi5c4rGWROgQXL4pD+5TmWjsG/vdtbH3qF9/Dlr4vLzAvhjQPh3B/ixmRcD42+jGY+nCfDHAJ0E6PJrHh+feFgkTtfDlZmEyoA0NzGKswDAGDxhRG25+aPnDQC1Z5t1yYD5oZX0vQDAuGnvIrb72d6d/O0HO88AgKBJ7/XsKgA0HgJkVcP+TjwATRKAz3kIAOH5DQCAjl0BnY4fkQypyQHq+gCAmGPIk5QA6uxBnQWou8F1VB1IU4QIBtQ7ggH1jmBAvSMYUO8IBtQ7ggFgRU6aLWANsF0DlqtAVlfwcnVuSXgm4PEJQDu9LY0FyHUXsG75rGGfhACgS1uSZWGwQgMwHgL8PWSM8XXLMgZIp4A6+yFsRy2z/1XLnQBGQRyKW7VwkjwAXRrgHyQmcxtU1IMmHwCw1ZxS1INM5gbwRtQB0hYkk6kSMQrGGFKxkswNkOtBWD0INYAyTYCxm6ykDCBvETR2k1U0WGm5ELJqgHopbHaT3RTAmAGwTAMgaQE8qQFONAGSW0DQgJ3U/+D1xWZLbZAqhbnjKJfnIhTW+30sSXxUCmMUbLfKIlfHoTjxRR3oqANQLQiw7/kAoNrAtSGhNsQe4sF4AMV4wD3EFYnPNcCryYCifA6Q/E9hnHUwxmOj5zlvAAJ37bHFMBqD9OfGRQRg8QEQnlDSq1CrjQ+AkRDKLGDUAONp0B8DMFJN5R5nzQJsDVimASIL2J0HzCHMNzz4KHYDJlUDNGcCF+qbFmKz66htA6wXI5LZAGrDrNLi3fEPYI5fLJZsG3B0aGXdcm7fPMEfZ1RpdWwdoI1jYeGCZSIaWUCVAFtdAFULYHbxVQCUzXFbLSisCYYQzSzgYwjcZ4LkGcyIq43XGFKNx9eAzSw/r0CkYdZ8BScLqAUAVLUARFUKw+pSWPlrgF3CwsIRO8S6gE4DlCmQ3QJ+rAHsEDgvn92VtqsB7BAi1oboAo4zYNkzgY85wIkGWAZAGQJtDcBvPfDJAP6kbA5wYiDUUQWwDYRBkgE8JRbOh0DSVVQpYOYAJ4dC7AAYYDkPcG4gZBkIVQMcXA7cTxbQXxxRD4RoQKZdq4D98vj0zQDr68HW/UXxewLF74cYHUJfAapcHtPfH9QzggH1jggMNAz4C/NjWPl6tKLmAAAAAElFTkSuQmCC');
gridTexture.wrapS = THREE.RepeatWrapping;
gridTexture.wrapT = THREE.RepeatWrapping;
gridTexture.repeat.set(10, 10);
groundMaterial.map = gridTexture;

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
ground.receiveShadow = true;
scene.add(ground);

// Set clip limits to ensure grid isn't visible outside editor
renderer.clippingPlanes = [
    new THREE.Plane(new THREE.Vector3(0, 0, 1), 10),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 10),
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 10),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10)
];

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
    const textures = sceneManager.selectedObject.textures;
    
    // Detach transform controls if attached
    if (transformControl) {
        transformControl.detach();
    }
    
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
    
    // Save old textures
    sceneManager.selectedObject.object = newMesh;
    sceneManager.selectedObject.textures = textures;
    
    // Reattach transform controls if they were enabled
    if (transformEnabled) {
        transformControl.attach(newMesh);
    }
    
    sceneManager.updateLayerPanel();
    sceneManager.updateControls();
    sceneManager.updateObjectMaterial();
}

// GLTF loader for importing models
const gltfLoader = new THREE.GLTFLoader();

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Transform controls mode
function setTransformMode(mode) {
    // Reset active class
    document.querySelectorAll('.transform-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (mode === 'disable') {
        transformEnabled = false;
        transformControl.detach();
        document.getElementById('disableTransform').classList.add('active');
        return;
    }
    
    // Enable transform and set mode
    transformEnabled = true;
    transformControl.setMode(mode);
    
    // If there's a selected object, attach transform controls
    if (sceneManager.selectedObject) {
        transformControl.attach(sceneManager.selectedObject.object);
    }
    
    // Set active class
    document.getElementById(`${mode}Mode`).classList.add('active');
}

// Add click event for canvas object selection
renderer.domElement.addEventListener('click', (event) => {
    sceneManager.handleCanvasClick(event);
});

// Event listeners for Transform Controls
document.getElementById('translateMode').addEventListener('click', () => setTransformMode('translate'));
document.getElementById('rotateMode').addEventListener('click', () => setTransformMode('rotate'));
document.getElementById('scaleMode').addEventListener('click', () => setTransformMode('scale'));
document.getElementById('disableTransform').addEventListener('click', () => setTransformMode('disable'));

// Event listeners for Objects
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

// Position, scale, and rotation numeric input handlers
['X', 'Y', 'Z'].forEach(axis => {
    document.getElementById(`position${axis}`).addEventListener('input', (e) => {
        if (!sceneManager.selectedObject) return;
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            sceneManager.selectedObject.object.position[axis.toLowerCase()] = value;
            // Update transform controls if attached
            if (transformEnabled) {
                transformControl.updateMatrixWorld();
            }
        }
    });

    document.getElementById(`scale${axis}`).addEventListener('input', (e) => {
        if (!sceneManager.selectedObject) return;
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value > 0) {
            sceneManager.selectedObject.object.scale[axis.toLowerCase()] = value;
            // Update transform controls if attached
            if (transformEnabled) {
                transformControl.updateMatrixWorld();
            }
        }
    });

    document.getElementById(`rotate${axis}`).addEventListener('input', (e) => {
        if (!sceneManager.selectedObject) return;
        const valueDegrees = parseFloat(e.target.value);
        if (!isNaN(valueDegrees)) {
            // Convert degrees to radians for Three.js
            const valueRadians = valueDegrees * (Math.PI/180);
            sceneManager.selectedObject.object.rotation[axis.toLowerCase()] = valueRadians;
            // Update transform controls if attached
            if (transformEnabled) {
                transformControl.updateMatrixWorld();
            }
        }
    });
});

// Camera controls
['X', 'Y', 'Z'].forEach(axis => {
    document.getElementById(`camera${axis}`).addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            camera.position[axis.toLowerCase()] = value;
            orbitControls.update();
        }
    });
    
    document.getElementById(`target${axis}`).addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            cameraTarget[axis.toLowerCase()] = value;
            camera.lookAt(cameraTarget);
            orbitControls.target.copy(cameraTarget);
            orbitControls.update();
        }
    });
});

// Update camera inputs when orbit controls change
orbitControls.addEventListener('change', () => {
    // Update camera position inputs
    document.getElementById('cameraX').value = camera.position.x.toFixed(2);
    document.getElementById('cameraY').value = camera.position.y.toFixed(2);
    document.getElementById('cameraZ').value = camera.position.z.toFixed(2);
    
    // Update target inputs based on orbit controls target
    document.getElementById('targetX').value = orbitControls.target.x.toFixed(2);
    document.getElementById('targetY').value = orbitControls.target.y.toFixed(2);
    document.getElementById('targetZ').value = orbitControls.target.z.toFixed(2);
    
    // Update camera target
    cameraTarget.copy(orbitControls.target);
});

// Light controls
document.getElementById('lightX').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
        directionalLight.position.x = value;
    }
});

document.getElementById('lightY').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
        directionalLight.position.y = value;
    }
});

document.getElementById('lightZ').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
        directionalLight.position.z = value;
    }
});

document.getElementById('lightIntensity').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
        directionalLight.intensity = value;
    }
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
    camera.lookAt(cameraTarget);
    orbitControls.object = camera;
    transformControl.camera = camera;
    
    updateCameraInputs();
});

// Fog controls
document.getElementById('fog').addEventListener('change', (e) => {
    if (e.target.checked) {
        const fogDensity = parseFloat(document.getElementById('fogDensity').value);
        scene.fog = new THREE.FogExp2(scene.background.getHex(), fogDensity);
        document.getElementById('fogDensity').disabled = false;
    } else {
        scene.fog = null;
        document.getElementById('fogDensity').disabled = true;
    }
});

document.getElementById('fogDensity').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    
    if (scene.fog && !isNaN(value)) {
        scene.fog.density = value;
    }
});

// Texture management
document.getElementById('addTexture').addEventListener('click', () => {
    if (!sceneManager.selectedObject) {
        alert('Please select an object first');
        return;
    }
    
    // Create a file input element to get texture
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        sceneManager.addTexture(file);
        document.body.removeChild(fileInput);
    });
    
    fileInput.click();
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
        const objData = sceneManager.addObject(model, file.name.split('.')[0]);
        sceneManager.selectObject(objData.id);
        
        // Show transform controls for the imported model
        if (transformEnabled) {
            transformControl.attach(model);
        }
    }, 
    undefined, // on progress
    (error) => {
        console.error('Error loading model:', error);
        updateSceneInfo('Error loading model');
    });
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
    
    // Add fog if exists
    if (scene.fog) {
        code += `// Add fog\n`;
        if (scene.fog.isFogExp2) {
            code += `scene.fog = new THREE.FogExp2(0x${scene.background.getHexString()}, ${scene.fog.density});\n\n`;
        } else {
            code += `scene.fog = new THREE.Fog(0x${scene.background.getHexString()}, ${scene.fog.near}, ${scene.fog.far});\n\n`;
        }
    }
    
    // Add camera
    code += `// Setup camera\n`;
    if (camera === perspectiveCamera) {
        code += `const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);\n`;
    } else {
        code += `const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 1000);\n`;
    }
    code += `camera.position.set(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)});\n`;
    code += `camera.lookAt(${cameraTarget.x.toFixed(2)}, ${cameraTarget.y.toFixed(2)}, ${cameraTarget.z.toFixed(2)});\n\n`;
    
    // Add renderer
    code += `// Setup renderer\n`;
    code += `const renderer = new THREE.WebGLRenderer({ antialias: true });\n`;
    code += `renderer.setSize(window.innerWidth, window.innerHeight);\n`;
    code += `renderer.shadowMap.enabled = ${renderer.shadowMap.enabled};\n`;
    code += `document.body.appendChild(renderer.domElement);\n\n`;
    
    // Add orbit controls
    code += `// Setup controls\n`;
    code += `const controls = new THREE.OrbitControls(camera, renderer.domElement);\n`;
    code += `controls.enableDamping = true;\n`;
    code += `controls.target.set(${cameraTarget.x.toFixed(2)}, ${cameraTarget.y.toFixed(2)}, ${cameraTarget.z.toFixed(2)});\n\n`;
    
    // Add lights
    code += `// Lighting\n`;
    code += `const ambientLight = new THREE.AmbientLight(0xffffff, ${ambientLight.intensity});\n`;
    code += `scene.add(ambientLight);\n\n`;
    
    code += `const directionalLight = new THREE.DirectionalLight(0xffffff, ${directionalLight.intensity});\n`;
    code += `directionalLight.position.set(${directionalLight.position.x}, ${directionalLight.position.y}, ${directionalLight.position.z});\n`;
    code += `directionalLight.castShadow = ${directionalLight.castShadow};\n`;
    code += `scene.add(directionalLight);\n\n`;
    
    // Grid and ground
    code += `// Grid and ground\n`;
    code += `const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);\n`;
    code += `scene.add(gridHelper);\n\n`;
    
    code += `// Create transparent ground plane\n`;
    code += `const groundGeometry = new THREE.PlaneGeometry(20, 20, 20, 20);\n`;
    code += `const groundMaterial = new THREE.MeshStandardMaterial({ \n`;
    code += `  color: 0x222222,\n`;
    code += `  roughness: 1,\n`;
    code += `  metalness: 0,\n`;
    code += `  transparent: true,\n`;
    code += `  opacity: 0.2\n`;
    code += `});\n`;
    code += `const ground = new THREE.Mesh(groundGeometry, groundMaterial);\n`;
    code += `ground.rotation.x = -Math.PI / 2;\n`;
    code += `ground.position.y = -0.01;\n`;
    code += `ground.receiveShadow = true;\n`;
    code += `scene.add(ground);\n\n`;
    
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
            code += `});\n\n`;
            
            // Add texture loading if needed
            if (obj.textures && obj.textures.length > 0) {
                code += `// Load textures\n`;
                obj.textures.forEach((tex, texIndex) => {
                    code += `// Note: You'll need to replace this with your actual texture URL\n`;
                    code += `const texture${index}_${texIndex} = new THREE.TextureLoader().load('texture-${index}-${texIndex}.jpg');\n`;
                    
                    if (texIndex === 0) {
                        code += `material${index}.map = texture${index}_${texIndex};\n`;
                    } else if (texIndex === 1) {
                        code += `material${index}.normalMap = texture${index}_${texIndex};\n`;
                        code += `material${index}.normalScale = new THREE.Vector2(${obj.textures[texIndex].intensity}, ${obj.textures[texIndex].intensity});\n`;
                    } else if (texIndex === 2) {
                        code += `material${index}.roughnessMap = texture${index}_${texIndex};\n`;
                    }
                });
                code += `\n`;
                
                if (object.material.transparent) {
                    code += `material${index}.transparent = true;\n`;
                    code += `material${index}.opacity = ${object.material.opacity};\n\n`;
                }
            }
            
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
            code += `mesh${index}.position.set(${object.position.x.toFixed(2)}, ${object.position.y.toFixed(2)}, ${object.position.z.toFixed(2)});\n`;
            code += `mesh${index}.rotation.set(${object.rotation.x.toFixed(2)}, ${object.rotation.y.toFixed(2)}, ${object.rotation.z.toFixed(2)});\n`;
            code += `mesh${index}.scale.set(${object.scale.x.toFixed(2)}, ${object.scale.y.toFixed(2)}, ${object.scale.z.toFixed(2)});\n`;
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
    if (camera === perspectiveCamera) {
        code += `  camera.aspect = width / height;\n`;
    } else {
        code += `  camera.left = -5 * (width / height);\n`;
        code += `  camera.right = 5 * (width / height);\n`;
    }
    code += `  camera.updateProjectionMatrix();\n`;
    code += `  renderer.setSize(width, height);\n`;
    code += `});\n`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(code)
        .then(() => {
            updateSceneInfo('Three.js code copied to clipboard!');
            // Reset the info after 3 seconds
            setTimeout(() => {
                if (sceneManager.selectedObject) {
                    updateSceneInfo(`Selected: ${sceneManager.selectedObject.name}`);
                } else {
                    updateSceneInfo('Click on objects to select them');
                }
            }, 3000);
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
            // Reset the info after 3 seconds
            setTimeout(() => {
                if (sceneManager.selectedObject) {
                    updateSceneInfo(`Selected: ${sceneManager.selectedObject.name}`);
                } else {
                    updateSceneInfo('Click on objects to select them');
                }
            }, 3000);
        });
});

// Window resize handler
window.addEventListener('resize', () => {
    const width = window.innerWidth - 320;
    const height = window.innerHeight;
    
    perspectiveCamera.aspect = width / height;
    perspectiveCamera.updateProjectionMatrix();
    
    orthographicCamera.left = -5 * (width / height);
    orthographicCamera.right = 5 * (width / height);
    orthographicCamera.top = 5;
    orthographicCamera.bottom = -5;
    orthographicCamera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
});

// Add CSS class to disable object properties panel initially
document.getElementById('objectProperties').classList.add('disabled');
document.getElementById('texturesPanel').classList.add('disabled');

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
}

// Start animation loop
animate();
