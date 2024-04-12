import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let renderer, scene, camera, controls;
let raycaster; 
let pointer = { x: 0, y: 0 };
let watchPosition = { x: 0.0, y: 0.0, z: 0.0 };
let watchRotation = { x: (-(Math.PI)/2), y: 0.0, z: 0.0 };
//let watchRotation = { x: 0.0, y: 0.0, z: 0.0 };
let watchScale = { x: 16, y: 16, z: 16 };
let model;

let dir;
let oldDir, newDir;
let watchLoaded = false;

let landmarkPoints = [];

let clipPlanes;
let wristAndKnucklePlane;
let vertices;
let thetaDegrees = 0;

let zWatchOrientation = 0.0;
let prevZWatchOrientation = 0.0;
let prevXAxisRotationAngle = 0.0;
let xAngle = 0.0;


let quaternion_x;
let quaternion_z;
let Quaternion_XYZ;
let normal2;

let Axis_x = {x: 1.0, y: 0.0, z: 0.0}
let Axis_y = {x: 0.0, y: 1.0, z: 0.0}
let Axis_z = {x: 0.0, y: 0.0, z: -1.0}
let Axis_XYZ = {x: 1.0, y: 1.0, z: 1.0}

let axesHelper
let sphere;

let flag = 0;


export function init() {

    const container = document.getElementById('container');
    axesHelper = new THREE.AxesHelper( 10 );
    const axesHelper2 = new THREE.AxesHelper( 10 );

    quaternion_x = new THREE.Quaternion();
    quaternion_z = new THREE.Quaternion();
    Quaternion_XYZ = new THREE.Quaternion();
    normal2 = new THREE.Vector3(0,0,-1);
    // Listen for window resize events
    window.addEventListener('resize', onWindowResize);
  
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(640, 480);
    renderer.domElement.style = "display: block; width: 640px; height: 480px; position: absolute; left: 0px; top: 0;"
    renderer.localClippingEnabled = true;
    container.appendChild(renderer.domElement);
  
    // Camera
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
    camera.position.set(0, 0, 20);

    // controls = new OrbitControls(camera, renderer.domElement);
    // controls.minDistance = 1;
    // controls.maxDistance = 10;
    // controls.enablePan = false;
    // controls.enableDamping = true;
    // controls.dampingFactor = .04;
    // controls.enabled = false;
    // controls.update();
  
    // Scene
    scene = new THREE.Scene();
    scene.background = null;
  
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
  
    // Light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);
  
    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = - 100; webcam
    dirLight.shadow.camera.left = - 120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);
  
    

    clipPlanes = [
        new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.9)
    ]

    const helpers = new THREE.Group();
    helpers.add( new THREE.PlaneHelper(clipPlanes[0], 10, 0xff0000));
    helpers.visible = false;
    scene.add(helpers);


    const geometry = new THREE.SphereGeometry( 1, 20, 20 ); 
    const material = new THREE.MeshBasicMaterial( { color: 0xff00ff , transparent: true, opacity: 0} ); 
    sphere = new THREE.Mesh( geometry, material ); 
    sphere.visible = true;
    
    scene.add( sphere );


    loadWatchModel();
    
    //console.log("clipPlanes",clipPlanes);

    let planeGeometry = new THREE.PlaneGeometry(100, 100, 100, 100);
    let planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00
    });
  
    let planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.visible = false;
    planeMesh.name = "plane"
    scene.add(planeMesh);


    scene.add(axesHelper2);

/********************************************* wrist And Knuckle *******************************************************************************/
    vertices =[
    -5.0, -5.0,  -1.0, // v0
    5.0, -5.0,  -1.0, // v1
    5.0,  5.0,  -1.0, // v2
    ];

    const indices = [0, 1, 2]; 
    const wristAndKnuckleGeometry  = new THREE.BufferGeometry();
    const verticesArray = new Float32Array(vertices);
    const indicesArray = new Uint32Array(indices);

    wristAndKnuckleGeometry.setAttribute('position', new THREE.BufferAttribute(verticesArray, 3));
    wristAndKnuckleGeometry.setIndex(new THREE.BufferAttribute(indicesArray, 1));
    wristAndKnuckleGeometry.computeVertexNormals();

    const wristAndKnuckleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });

    wristAndKnucklePlane = new THREE.Mesh(wristAndKnuckleGeometry, wristAndKnuckleMaterial);
    wristAndKnucklePlane.visible = false;

    scene.add(wristAndKnucklePlane);
/************************************************************************************************************************************************/

    // Ensure the canvas is resized to match the window size

    onWindowResize();
    // Start drawing the webcam feed on the canvas
    //render();

    dir = new THREE.Vector3(); // create once an reuse it
    
    oldDir = new THREE.Vector3(0, 0, 0);
    newDir = new THREE.Vector3(0, 0, 0);

   
}

function onWindowResize() {
    // canvas.width = 640;
    // canvas.height = 480;
  
    //controls.update();

    camera.aspect = 1;
    camera.updateProjectionMatrix();
  
    console.log("inside onWindowResize");
    renderer.setSize(640, 480);
  
    render();
}

function render() {
    raycaster.setFromCamera(pointer, camera);
        let intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0) {
            for ( let i = 0; i < intersects.length; i ++ ) {
                let object = intersects[i];
                if (object.object.name == 'plane') {
                    watchPosition = object.point;
                    if (watchLoaded) {
                        
                        sphere.position.set(watchPosition.x , watchPosition.y , watchPosition.z);
                        axesHelper.position.set(watchPosition.x , watchPosition.y , watchPosition.z);
            
                    }
                }
            }
        }  

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function loadWatchModel() {
  
    // Model
    let loader = new GLTFLoader().setPath('./gltf_w/');
    loader.load('watch.gltf', async function (gltf) {
        model = gltf.scene;
        // Make the material transparent

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.transparent = true;
                child.material.alphaToCoverage = true;
                child.material.clippingPlanes = clipPlanes;
            }
        });

        //model.visible = false;
        sphere.position.set(watchPosition.x, watchPosition.y, watchPosition.z);
        //sphere.rotation.set(watchRotation.x , watchRotation.y, watchRotation.z); // Example rotation: 90 degrees around the y-axis
        model.scale.set(watchScale.x, watchScale.y, watchScale.z);
        model.visible = true;
        scene.add(axesHelper);
        sphere.add(model);

        
        watchLoaded = true;
    });
}


export function updateLandmarkPoints(newLandmarkPoints) {

    landmarkPoints = newLandmarkPoints;
    zWatchOrientation = landmarkPoints[8]

    if (landmarkPoints.length > 0) {
        let landmarkX = landmarkPoints[2].x;
        let landmarkY = landmarkPoints[2].y;

        console.log("landmark2" , landmarkPoints[2]);
        //let landmarkZ = landmarkPoints[2].z;
        let x = ((landmarkX / 1) * 2) - 1;
        let y = - ((landmarkY / 1) * 2) + 1;
        let wristX = ((landmarkPoints[4].x) * 2) - 1;
        let wristY = -((landmarkPoints[4].y ) * 2) + 1;
        let wristZ = ((landmarkPoints[4].z ) * 2) - 1;

        let pinkyX = ((landmarkPoints[5].x ) * 2) - 1;
        let pinkyY = -((landmarkPoints[5].y ) * 2) + 1;
        let pinkyZ = ((landmarkPoints[5].z ) * 2) - 1;


        let indexX = ((landmarkPoints[6].x ) * 2) - 1;
        let indexY = -((landmarkPoints[6].y ) * 2) + 1;
        let indexZ = ((landmarkPoints[6].z) * 2) - 1;


        pointer.x = x;
        pointer.y = y;
 
        let normal;

        if (wristAndKnucklePlane) {
            // Retrieve the geometry from the mesh
            const geometry = wristAndKnucklePlane.geometry;
        
        
            const positionAttribute = geometry.getAttribute('position');
        
            // Define the index of the vertex you want to modify
            const vertexIndex = [0,1,2]; // Example: Modify the first vertex
            let mul = 13;
            // Update the position of the vertex
            positionAttribute.setXYZ(vertexIndex[0], wristX * mul , wristY * mul, wristZ * mul);
            positionAttribute.setXYZ(vertexIndex[1], pinkyX * mul , pinkyY * mul, pinkyZ * mul);
            positionAttribute.setXYZ(vertexIndex[2], indexX * mul , indexY * mul, indexZ * mul);
        
            // Notify Three.js that the geometry has been modified
            positionAttribute.needsUpdate = true;
        
            const wristVector = new THREE.Vector3(wristX * mul , wristY * mul, wristZ * mul);
            const pinkyVector = new THREE.Vector3(pinkyX * mul , pinkyY * mul, pinkyZ * mul);
            const IndexVector = new THREE.Vector3(indexX * mul , indexY * mul, indexZ * mul);
            const wristToPinkyVector = new THREE.Vector3().subVectors(wristVector,pinkyVector);
            const wristToIndexVector = new THREE.Vector3().subVectors(wristVector,IndexVector);

            normal = new THREE.Vector3().crossVectors(wristToPinkyVector,wristToIndexVector).normalize();
            // Optionally, you may need to compute normals and update other properties
        }


        //model.applyQuaternion(quaternion_z);

        // Rotational Angle Calculation
        // Extract coordinates from 3D points
        let vector1 = [landmarkPoints[0].x, landmarkPoints[0].y, 0];
        //let vector2 = [landmarkPoints[2].x, landmarkPoints[2].y, landmarkPoints[2].z];
        let vector2 = [landmarkPoints[2].x, landmarkPoints[2].y, 0];

        // Calculate the dot product of the two vectors
        let dotProduct = 0;
        for (let i = 0; i < vector1.length; i++) {
            dotProduct += vector1[i] * vector2[i];
        }

        // Calculate the magnitudes of the two vectors
        let magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val ** 2, 0));
        let magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val ** 2, 0));

        // Calculate the cosine of the angle between the vectors
        let cosineTheta = dotProduct / (magnitude1 * magnitude2);

        // Use arccosine to find the angle in radians
        let thetaRadians = Math.acos(cosineTheta);

        // Convert radians to degrees
        
        thetaDegrees = ((180 / Math.PI) * thetaRadians);

        if (landmarkPoints[0].y > landmarkPoints[1].y)
        {
            xAngle = watchRotation.x + (thetaDegrees )
        }
        else
        {
            xAngle = watchRotation.x + (-thetaDegrees )
        }



        // Quaternion_XYZ.setFromUnitVectors(normal,normal2).normalize();
        // sphere.applyQuaternion(Quaternion_XYZ);
        // axesHelper.applyQuaternion(Quaternion_XYZ);
        // normal2 = normal;

        quaternion_z.setFromAxisAngle(Axis_z, (zWatchOrientation - prevZWatchOrientation)).normalize();
        model.applyQuaternion(quaternion_z);
        axesHelper.applyQuaternion(quaternion_z);
        model.applyQuaternion(quaternion_z.identity());
        

        // //quaternion_x.setFromAxisAngle(Axis_x, (xAngle - prevXAxisRotationAngle)).normalize();
        // quaternion_x.setFromAxisAngle(Axis_x, 0.1).normalize();
        // model.applyQuaternion(quaternion_x);
        // axesHelper.applyQuaternion(quaternion_x);
        

         //console.log("xAngle : ", xAngle);
         //console.log("Axis x : ", (xAngle - prevXAxisRotationAngle));
        
        prevXAxisRotationAngle = xAngle;
        prevZWatchOrientation = zWatchOrientation;


            // Scale to the size of the head
        const wristDist = Math.sqrt(
            ( landmarkPoints[3].x  - landmarkPoints[4].x ) ** 2 +
            ( landmarkPoints[3].y  - landmarkPoints[4].y ) ** 2 +
            ( landmarkPoints[3].z - landmarkPoints[4].z ) ** 2
        );
        // console.log(1,wristDist*landmarkPoints[7]);
        let watch_scale_x = ((wristDist*landmarkPoints[7])/7);
        let watch_scale_y = ((wristDist*landmarkPoints[7])/7);
        let watch_scale_z = ((wristDist*landmarkPoints[7])/7);
        // console.log("Watch Scale",watch_scale_x)
        watchScale.x = -watch_scale_x; 
        watchScale.y = watch_scale_y; 
        watchScale.z = watch_scale_z;

        model.scale.set(-watchScale.x, watchScale.y, watchScale.z)
            
        
    }
}