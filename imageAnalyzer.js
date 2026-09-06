// =========================================================
// IDSHIELD AI
// Image Analyzer Module
// =========================================================

export function analyzeImage(file) {

    return new Promise((resolve, reject) => {

        if (!file) {
            reject(
                new Error("No image provided.")
            );
            return;
        }

        if (!file.type.startsWith("image/")) {
            reject(
                new Error("Selected file is not an image.")
            );
            return;
        }

        const image = new Image();

        const url =
            URL.createObjectURL(file);

        image.onload = function () {

            const width =
                image.naturalWidth;

            const height =
                image.naturalHeight;

            const ratio =
                width / height;

            const fileSize =
                file.size;


            // ---------------------------------------------
            // Resolution classification
            // ---------------------------------------------

            let resolution = "Good";

            if (
                width < 600 ||
                height < 400
            ) {

                resolution = "Low";

            } else if (
                width < 1000 ||
                height < 700
            ) {

                resolution = "Moderate";

            }


            // ---------------------------------------------
            // File-size classification
            // ---------------------------------------------

            let compressionRisk = "Low";

            if (fileSize < 30000) {

                compressionRisk = "High";

            } else if (fileSize < 80000) {

                compressionRisk = "Moderate";

            }


            // ---------------------------------------------
            // Aspect-ratio check
            // ---------------------------------------------

            const unusualRatio =
                ratio < 0.45 ||
                ratio > 1.9;


            // ---------------------------------------------
            // Return analysis
            // ---------------------------------------------

            URL.revokeObjectURL(url);


            resolve({

                fileName: file.name,

                fileType: file.type,

                fileSize: fileSize,

                width: width,

                height: height,

                aspectRatio:
                    Number(
                        ratio.toFixed(3)
                    ),

                resolution: resolution,

                compressionRisk:
                    compressionRisk,

                unusualRatio:
                    unusualRatio

            });

        };


        image.onerror = function () {

            URL.revokeObjectURL(url);

            reject(
                new Error(
                    "Unable to read image."
                )
            );

        };


        image.src = url;

    });

}