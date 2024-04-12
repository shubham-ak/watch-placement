import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as WebGLRender from './renderer'

const demosSection = document.getElementById("demos");

let handLandmarker = undefined;
let runningMode = "VIDEO";
let enableWebcamButton;
let webcamRunning = false;
let WebGLCanvas;
// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createHandLandmarker = async () => {
  
  const vision = await FilesetResolver.forVisionTasks(
    './node_modules/@mediapipe/tasks-vision/wasm'
  );
  
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: './models/hand_landmarker.task',
      delegate: "GPU"
    },
    runningMode: runningMode,
    numHands: 2
  });

  demosSection.classList.remove("invisible");
};

createHandLandmarker();
WebGLRender.init();
  
/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/
  
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
WebGLCanvas =  document.getElementById('webgl_canvas');
// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;
  
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}
  
// Enable the live webcam view and start detection.
function enableCam(event) {
  
  if (!handLandmarker) {
    console.log("Wait! objectDetector not loaded yet.");
    return;
  }
  
  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }
  
  // getUsermedia parameters.
  const constraints = {
    video: true
  };
  
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}
let lastVideoTime = -1;
let results = undefined;
console.log(video);

async function predictWebcam() {
  canvasElement.style.width = video.videoWidth;;
  canvasElement.style.height = video.videoHeight;
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;

  //console.log("Video size : ",video.videoWidth,video.videoHeight);
  
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await handLandmarker.setOptions({ runningMode: "VIDEO" });
  }

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = handLandmarker.detectForVideo(video, startTimeMs);
  }
  
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      
      let landmarkWrist = landmarks[0];
      let landmarkIndexFingerMCP = landmarks[5];
      let landmarkPinkyMCP = landmarks[17];
      let landmarkmidMCP = landmarks[9];


      //console.log("landmarkWrist : ", landmarkWrist);
      //console.log("landmarkIndexFingerMCP : ", landmarkIndexFingerMCP);
      //console.log("landmarkPinkyMCP : ", landmarkPinkyMCP);

      let point1 = pointFinder(landmarkIndexFingerMCP.x, landmarkIndexFingerMCP.y, landmarkWrist.x, landmarkWrist.y, 1.45);
      let point2 = pointFinder(landmarkPinkyMCP.x, landmarkPinkyMCP.y, landmarkWrist.x, landmarkWrist.y, 1.55);
      let point3 = pointFinder(point1.x, point1.y, point2.x, point2.y, 0.5);
      let point4 = {x:0,y:0}
      point4.x = point3.x
      point4.y = landmarkWrist.y

      let point5 = {x:0,y:0}
      point5.x = point3.x
      point5.y = point1.y

      let b = distfinder(landmarkWrist.x,landmarkWrist.y,point4.x,point4.y)
      let c = distfinder(landmarkWrist.x,landmarkWrist.y,point3.x,point3.y)
      let a = distfinder(point3.x,point3.y,point4.x,point4.y)

      let d = distfinder(point3.x,point3.y,point1.x,point1.y)
      let e = distfinder(point3.x,point3.y,point5.x,point5.y)
      let f = distfinder(point1.x,point1.y,point5.x,point5.y)


      let temp1 = ((b**2) + (c**2) - (a**2))
      let temp2 = 2 * b * c

      let temp3 = ((d**2) + (e**2) - (f**2))
      let temp4 = 2 * d * e
      
      let tempradians1 = Math.acos(temp3/temp4);
        if(point1.x < point3.x)
        {
          tempradians1 = -tempradians1;
        }

      //console.log("rad",tempradians1);
      let tempDegrees1 = ((180 / Math.PI) * tempradians1);
      //console.log("deg",tempDegrees1);

      let point1anglexrad = Math.atan2(point1.y, point1.x);
      let point1angleyrad = (Math.PI/2) - point1anglexrad;
      let point1anglexdeg = ((180 / Math.PI) * point1anglexrad);
      let point1angleydeg = 90 - point1anglexdeg;
      //console.log("check",point1anglexrad,point1angleyrad,point1anglexdeg,point1angleydeg);
     
//*********************************************************************************
      let point6 = {x:0,y:0}
      point6.x = landmarkWrist.x
      point6.y = point3.y
      
      let m = distfinder(point3.x,point3.y,landmarkWrist.x,landmarkWrist.y)
      let n = distfinder(point3.x,point3.y,point6.x,point6.y)
      let o = distfinder(point6.x,point6.y,landmarkWrist.x,landmarkWrist.y)
      
      let temp7 = ((m**2) + (n**2) - (o**2))
      let temp8 = 2 * m * n
      
      let tempradians3 = Math.acos(temp7/temp8);
      let tempDegrees3 = ((180 / Math.PI) * tempradians3);
      
      let tempradians4;
      let tempradiansPoint4;

    // if (landmarkWrist.y < point3.y){
    //         tempradians4 = tempradians3;
    //       }
    // else if (landmarkWrist.y > point3.y){
    //         tempradians4 = -tempradians3;
    //       }
    if (landmarkWrist.x < point4.x){
            tempradians4 = tempradians3;
          }
    else if (landmarkWrist.x > point4.x){
            tempradians4 = -tempradians3;
          }
 //*********************************************************************************
      if (temp2!=0){
        tempradiansPoint4 = Math.acos(temp1/temp2);
        //console.log("rectification_angle",tempradians);
        let tempDegrees = ((180 / Math.PI) * tempradiansPoint4);
        //console.log("rectification_angle_degree",tempDegrees);
      }
      else{
        tempradiansPoint4 = 1.5707;
        //console.log("rectification_angle",tempradians);
        let tempDegrees = ((180 / Math.PI) * tempradiansPoint4);
        //console.log("rectification_angle_degree",tempDegrees);
      }

  //*********************************************************************************
      let point3toyaxis = {x:0,y:0}
      point3toyaxis.x = 0
      point3toyaxis.y = point3.y

      let point3toxaxis = {x:0,y:0}
      point3toxaxis.x = point3.x
      point3toxaxis.y = 0 

      let p3towristdistance = distfinder(point3.x,point3.y,landmarkWrist.x,landmarkWrist.y)
      let wristtoyaxisdistance = distfinder(landmarkWrist.x,landmarkWrist.y,point3toyaxis.x,point3toyaxis.y)
      let yaxistop3distance = distfinder(point3toyaxis.x,point3toyaxis.y,point3.x,point3.y)

      let numerator = ((p3towristdistance**2) + (yaxistop3distance**2) - (wristtoyaxisdistance**2))
      let denominator = 2 * p3towristdistance * yaxistop3distance
      
      let angle_3tow_and_3toy_radian = Math.acos(numerator/denominator);
      let angle_3tow_and_3toy_degree = ((180 / Math.PI) * angle_3tow_and_3toy_radian);

      let newangle_radian;
      let newangle_degree;
      if (point3toyaxis.y >= landmarkWrist.y){
        newangle_radian = angle_3tow_and_3toy_radian;
        newangle_degree = angle_3tow_and_3toy_degree;
      }
      else if (point3toyaxis.y <= landmarkWrist.y){
        newangle_radian = (2*Math.PI) - angle_3tow_and_3toy_radian;
        newangle_degree = 360 - angle_3tow_and_3toy_degree;
      }
//*********************************************************************************
      //console.log("landmarkWrist",landmarkWrist);
      //console.log("landmarkPinkyMCP",landmarkPinkyMCP);
      //console.log("landmarkIndexFingerMCP",landmarkIndexFingerMCP);

      //console.log("WebGLCanvas", WebGLCanvas.width,WebGLCanvas.height);

      WebGLRender.updateLandmarkPoints([point1, point2, point4,
        landmarkmidMCP,landmarkWrist,landmarkPinkyMCP,
        landmarkIndexFingerMCP,canvasElement.width, newangle_radian]);  //accessing required landmarks

      drawConnectors(
        canvasCtx, 
        landmarks, 
        HAND_CONNECTIONS, 
        {
          color: "#00FF00",
          lineWidth: 1
        }
      );

      drawLandmarks(
        canvasCtx, 
        landmarks, 
        { 
          color: "#FF0000", 
          lineWidth: 1 
        }
      );

      drawLandmarks(
        canvasCtx, 
        Array(point1, point2, point3), 
        { 
          color: "#FF0000", 
          lineWidth: 1 
        }
      );
    }
  }

  canvasCtx.restore();

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

function pointFinder(x1, y1, x2, y2, dist) {
  const new_x = (1 - dist) * x1 + dist * x2;
  const new_y = (1 - dist) * y1 + dist * y2;
  const new_z = 0.0;
  const visibility = undefined;

  return { visibility: visibility, x: new_x, y: new_y, z: new_z};
}

function distfinder(x3, y3, x4, y4) {
  const deltaX = x4 - x3;
  const deltaY = y4 - y3;
  //console.log("x",deltaX);
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

  return distance;
}
  