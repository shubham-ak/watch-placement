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
let normal;
let normal2;
let normal3;
let XAxisVector;
let YAxisVector;
let ZAxisVector;
let initDone = false;

let Axis_x = {x: 1.0, y: 0.0, z: 0.0}
let Axis_y = {x: 0.0, y: 1.0, z: 0.0}
let Axis_z = {x: 0.0, y: 0.0, z: -1.0}
let Axis_XYZ = {x: 1.0, y: 1.0, z: 1.0}

let axesHelperCylinder
let axesHelperCWXR;//Cylinder Watch X Rotation
let axesHelperModel
let cylinder;
let cylinderWatchXRoatation;
let prevAngle = 0;
let prev90Degree = 0;

let flag = 0;


export function init() {

    const container = document.getElementById('container');
    axesHelperCylinder = new THREE.AxesHelper( 10 );
    axesHelperCWXR = new THREE.AxesHelper( 10 );    
    axesHelperModel = new THREE.AxesHelper( 10 );
    const axesHelper2 = new THREE.AxesHelper( 10 );
    XAxisVector = new THREE.Vector3(1.0, 0.0, 0.0);
    YAxisVector = new THREE.Vector3(0.0, 1.0, 0.0);
    ZAxisVector = new THREE.Vector3(0.0, 0.0, 1.0);

    quaternion_x = new THREE.Quaternion();
    quaternion_z = new THREE.Quaternion();
    Quaternion_XYZ = new THREE.Quaternion();
    normal2 = new THREE.Vector3(0,0,-1);
    prev90Degree  = new THREE.Vector3(0, 0, 0);
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
    camera = new THREE.PerspectiveCamera(45, 640.0/480.0, 0.1, 5000);
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
  
    const helper = new THREE.CameraHelper( camera );
    scene.add(helper);

    clipPlanes = [
        new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.3)
    ]

    const helpers = new THREE.Group();
    helpers.add( new THREE.PlaneHelper(clipPlanes[0], 10, 0xff0000));
    helpers.visible = false;
    scene.add(helpers);

    const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 100, 100, true, 3.14);
    const geometry2 = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 100, 100, true, 3.14);
    const material = new THREE.MeshBasicMaterial( { color: 0xff00ff , transparent: true, opacity: 0} ); 
    const material2 = new THREE.MeshBasicMaterial( { color: 0xff0000 , transparent: true, opacity: 0} ); 
    cylinder = new THREE.Mesh( geometry, material );
    cylinderWatchXRoatation = new THREE.Mesh(geometry2, material2);
    cylinder.rotation.z = Math.PI/2;
    axesHelperCylinder.rotation.z = Math.PI/2
    cylinder.visible = true;
    scene.add( cylinder );


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


    //scene.add(axesHelper2);

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

    initDone = true;
   
}

function onWindowResize() {
    // canvas.width = 640;
    // canvas.height = 480;
  
    //controls.update();

    //camera.aspect = 640.0/480.0;
    camera.updateProjectionMatrix();
  
    //console.log("inside onWindowResize");
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
                        
                        cylinder.position.set(watchPosition.x , watchPosition.y , watchPosition.z);
                        axesHelperCylinder.position.set(watchPosition.x , watchPosition.y , watchPosition.z);
                        //axesHelperModel.position.set(watchPosition.x , watchPosition.y , watchPosition.z);
                        //axesHelperCWXR.position.set(watchPosition.x, watchPosition.y, watchPosition.z);
            
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
        cylinder.position.set(watchPosition.x, watchPosition.y, watchPosition.z);
        //cylinder.rotation.set(watchRotation.x , watchRotation.y, watchRotation.z); // Example rotation: 90 degrees around the y-axis
        //model.scale.set(watchScale.x, watchScale.y, watchScale.z);
        cylinder.scale.set(watchScale.x, watchScale.y, watchScale.z);
        model.visible = true;
        model.rotateZ(-Math.PI/2);
        //scene.add(axesHelperCylinder);
        //scene.add(axesHelperModel);
        //axesHelperCylinder.add(axesHelperCWXR);
        cylinder.add(cylinderWatchXRoatation);
        cylinderWatchXRoatation.add(model);

        
        watchLoaded = true;
    });
}


export function updateLandmarkPoints(newLandmarkPoints) {

    landmarkPoints = newLandmarkPoints;
    zWatchOrientation = landmarkPoints[8]

    if (landmarkPoints.length > 0) {
        let landmarkX = landmarkPoints[2].x;
        let landmarkY = landmarkPoints[2].y;
        let landmarkZ = landmarkPoints[2].z;

       // console.log("landmark2" , landmarkPoints[2]);
        //let landmarkZ = landmarkPoints[2].z;
        let x = ((landmarkX ) * 2) - 1;
        let y = - ((landmarkY) * 2) + 1;
        let z = ((landmarkZ) * 2) - 1;

        //console.log("x y z landmarkZ", x, y, z, landmarkZ);

        let wristX = ((landmarkPoints[4].x) * 2) - 1;
        let wristY = -((landmarkPoints[4].y ) * 2) + 1;
        let wristZ = ((landmarkPoints[4].z ) * 2) - 1;

        let pinkyX = ((landmarkPoints[5].x ) * 2) - 1;
        let pinkyY = -((landmarkPoints[5].y ) * 2) + 1;
        let pinkyZ = ((landmarkPoints[5].z ) * 2) - 1;


        let indexX = ((landmarkPoints[6].x ) * 2) - 1;
        let indexY = -((landmarkPoints[6].y ) * 2) + 1;
        let indexZ = ((landmarkPoints[6].z) * 2) - 1;

        let Point1X = ((landmarkPoints[0].x) * 2) - 1;
        let Point1Y = -((landmarkPoints[0].y ) * 2) + 1;
        let Point1Z = ((landmarkPoints[0].z ) * 2) - 1;

        let Point2X = ((landmarkPoints[1].x) * 2) - 1;
        let Point2Y = -((landmarkPoints[1].y ) * 2) + 1;
        let Point2Z = ((landmarkPoints[1].z ) * 2) - 1;

        let Point1Vector = new THREE.Vector3(Point1X, Point1Y, 0.0);
        let Point2Vector = new THREE.Vector3(Point2X, Point2Y, 0.0);
        let WatchUpVector = new THREE.Vector3().subVectors(Point1Vector,Point2Vector);

        let angle = Math.PI;

        pointer.x = x;
        pointer.y = y;

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

            //wristToPinkyVector.z = 0;
            //wristToIndexVector.z = 0;

            //console.log("wristToPinkyVector",wristToPinkyVector);
            //console.log("wristToIndexVector",wristToIndexVector);

            normal = new THREE.Vector3().crossVectors(wristToPinkyVector,wristToIndexVector).normalize();
            normal3 = new THREE.Vector3().crossVectors(wristToIndexVector,normal).normalize();
            
            let angleofPlaneToNormal = wristToIndexVector.angleTo(normal) * 180/Math.PI;
           // console.log("angleofPlaneToNormal : ", angleofPlaneToNormal);

            let angleofPlaneToNormal3 = wristToIndexVector.angleTo(normal3) * 180/Math.PI;
            //console.log("angleofPlaneToNormal3 : ", angleofPlaneToNormal3);

            // Optionally, you may need to compute normals and update other properties
            //normal.y = 0;
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


        quaternion_z.setFromAxisAngle(Axis_z, (zWatchOrientation - prevZWatchOrientation)).normalize();
        cylinder.applyQuaternion(quaternion_z);
        axesHelperCylinder.applyQuaternion(quaternion_z);

        //console.log("Axis Z Angle : ", (zWatchOrientation - prevZWatchOrientation));
        //console.log("zWatchOrientation   : ", (zWatchOrientation * 180/Math.PI ));
        //console.log("prevZWatchOrientation : ", (prevZWatchOrientation * 180/Math.PI));

        //console.log("Final Angle : ", 90.0 - (prev90Degree.angleTo(normal) * 180/Math.PI)); 

        // Quaternion_XYZ.setFromUnitVectors(normal ,normal2).normalize();
        // cylinderWatchXRoatation.applyQuaternion(Quaternion_XYZ);
        // //axesHelperModel.applyQuaternion(Quaternion_XYZ);
        // normal2 = normal;

        //let dotProduct_xyz = normal.dot(new THREE.Vector3(0, 1, 0));

        // let currentAngle = normal2.angleTo(normal);
        // quaternion_x.setFromAxisAngle(Axis_y, currentAngle - prevAngle).normalize();
        // //quaternion_x.setFromAxisAngle(Axis_x, 0.1).normalize();
        // cylinderWatchXRoatation.applyQuaternion(quaternion_x);
        // prevAngle = currentAngle;
        // normal2 = normal;

        // Quaternion_XYZ.setFromUnitVectors(normal ,normal2).normalize();
        // model.applyQuaternion(Quaternion_XYZ);
        // axesHelperModel.applyQuaternion(Quaternion_XYZ);
        // normal2 = normal;

        // Quaternion_XYZ.setFromUnitVectors(normal ,normal2).normalize();
        // cylinderWatchXRoatation.applyQuaternion(Quaternion_XYZ);
        // axesHelperCWXR.applyQuaternion(Quaternion_XYZ);
        // normal2 = normal;
        
        

        quaternion_x.setFromAxisAngle(Axis_y, ((Math.PI/2) - (prev90Degree.angleTo(normal)))).normalize();
        //quaternion_x.setFromAxisAngle(Axis_x, 0.1).normalize();
        cylinderWatchXRoatation.applyQuaternion(quaternion_x);
        // axesHelperCWXR.applyQuaternion(quaternion_x);
        

        //console.log("xAngle : ", xAngle);
        //console.log("Axis x : ", (xAngle - prevXAxisRotationAngle));
        
        prevXAxisRotationAngle = xAngle;
        prevZWatchOrientation = zWatchOrientation;
        prev90Degree = normal3;

        // Scale to the size of the head
        let wristDist = Math.sqrt(
            ( landmarkPoints[3].x  - landmarkPoints[4].x ) ** 2 +
            ( landmarkPoints[3].y  - landmarkPoints[4].y ) ** 2 +
            ( landmarkPoints[3].z - landmarkPoints[4].z ) ** 2
        );

        // console.log(1,wristDist*landmarkPoints[7]);
        let watch_scale_x = ((wristDist*landmarkPoints[7])/7);
        let watch_scale_y = ((wristDist*landmarkPoints[7])/7);
        let watch_scale_z = ((wristDist*landmarkPoints[7])/7);
        // console.log("Watch Scale",watch_scale_x)
        watchScale.x = watch_scale_x; 
        watchScale.y = watch_scale_y; 
        watchScale.z = watch_scale_z;

        //model.scale.set(-watchScale.x, watchScale.y, watchScale.z)
        cylinder.scale.set(watchScale.x * 0.8, watchScale.y * 0.8, watchScale.z * 0.8);
        model.scale.set(1.2, 1.2, 1.2);
        console.log("watchScale : ", watchScale);
    }
}