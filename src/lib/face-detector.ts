import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

export async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      // Load 100% self-hosted local WASM files and model task from project public directory
      const fileset = await FilesetResolver.forVisionTasks("/wasm");
      const modelPath = "/models/face_landmarker.task";

      try {
        return await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        });
      } catch (err) {
        console.warn("GPU delegate fallback to CPU delegate", err);
        return await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        });
      }
    })();
  }
  return landmarkerPromise;
}

export type { FaceLandmarkerResult };
