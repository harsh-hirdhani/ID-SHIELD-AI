// =========================================================
// IDSHIELD AI
// Tampering / Alteration Screening Module
// =========================================================

export async function analyzeTampering(file) {

    if (!file) {
        throw new Error("No document provided.");
    }

    if (!file.type.startsWith("image/")) {
        return {
            score: 0,
            findings: [{
                type: "info",
                title: "Tamper screening limited",
                description:
                    "Image-based alteration screening is currently available for image documents."
            }]
        };
    }

    const image = await loadImage(file);

    const canvas = document.createElement("canvas");

    canvas.width = image.width;
    canvas.height = image.height;

    const context =
        canvas.getContext("2d", {
            willReadFrequently: true
        });

    context.drawImage(
        image,
        0,
        0
    );

    const imageData =
        context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

    const pixels =
        imageData.data;


    // =====================================================
    // BASIC PIXEL STATISTICS
    // =====================================================

    let totalBrightness = 0;

    let totalDifference = 0;

    let edgeCount = 0;

    let sampledPixels = 0;


    // We sample pixels instead of processing every pixel.
    // This keeps the browser responsive.

    const step = 8;


    for (
        let y = 0;
        y < canvas.height - step;
        y += step
    ) {

        for (
            let x = 0;
            x < canvas.width - step;
            x += step
        ) {

            const index =
                (y * canvas.width + x) * 4;

            const rightIndex =
                (y * canvas.width + x + step) * 4;

            const currentBrightness =
                (
                    pixels[index] +
                    pixels[index + 1] +
                    pixels[index + 2]
                ) / 3;

            const rightBrightness =
                (
                    pixels[rightIndex] +
                    pixels[rightIndex + 1] +
                    pixels[rightIndex + 2]
                ) / 3;


            totalBrightness +=
                currentBrightness;


            const difference =
                Math.abs(
                    currentBrightness -
                    rightBrightness
                );


            totalDifference +=
                difference;


            // Strong local brightness changes
            // are treated as edge indicators.

            if (difference > 45) {

                edgeCount++;

            }


            sampledPixels++;

        }

    }


    const averageBrightness =
        sampledPixels > 0
            ? totalBrightness / sampledPixels
            : 0;


    const averageDifference =
        sampledPixels > 0
            ? totalDifference / sampledPixels
            : 0;


    const edgeRatio =
        sampledPixels > 0
            ? edgeCount / sampledPixels
            : 0;


    // =====================================================
    // SCREENING FINDINGS
    // =====================================================

    const findings = [];

    let score = 0;


    // -----------------------------------------------------
    // Very dark / very bright image
    // -----------------------------------------------------

    if (
        averageBrightness < 35
    ) {

        score += 10;

        findings.push({

            type: "warning",

            title:
                "Very dark document image",

            description:
                "Low overall brightness may reduce the reliability of visual inspection."

        });

    }

    else if (
        averageBrightness > 235
    ) {

        score += 10;

        findings.push({

            type: "warning",

            title:
                "Very bright document image",

            description:
                "High overall brightness may cause loss of document details."

        });

    }

    else {

        findings.push({

            type: "safe",

            title:
                "Overall image exposure acceptable",

            description:
                `Average brightness: ${averageBrightness.toFixed(1)}.`

        });

    }


    // -----------------------------------------------------
    // Edge density
    // -----------------------------------------------------

    if (
        edgeRatio > 0.35
    ) {

        score += 15;

        findings.push({

            type: "warning",

            title:
                "High local edge activity",

            description:
                "The image contains a high level of local intensity changes. This can occur around text, borders, compression artifacts, or edited regions and requires further analysis."

        });

    }

    else {

        findings.push({

            type: "safe",

            title:
                "Normal edge activity",

            description:
                "No unusually high global edge density was detected."

        });

    }


    // -----------------------------------------------------
    // Pixel variation
    // -----------------------------------------------------

    if (
        averageDifference > 55
    ) {

        score += 15;

        findings.push({

            type: "warning",

            title:
                "High pixel variation",

            description:
                "Strong local pixel variation was detected across the document image."

        });

    }

    else {

        findings.push({

            type: "safe",

            title:
                "Pixel variation within screening range",

            description:
                `Average local intensity difference: ${averageDifference.toFixed(1)}.`

        });

    }


    // =====================================================
    // LIMIT SCORE
    // =====================================================

    score =
        Math.min(
            score,
            40
        );


    return {

        score: score,

        metrics: {

            averageBrightness:
                Number(
                    averageBrightness.toFixed(2)
                ),

            averageDifference:
                Number(
                    averageDifference.toFixed(2)
                ),

            edgeRatio:
                Number(
                    edgeRatio.toFixed(4)
                )

        },

        findings: findings

    };

}


// =========================================================
// LOAD IMAGE
// =========================================================

function loadImage(file) {

    return new Promise(
        function (resolve, reject) {

            const image =
                new Image();

            const objectURL =
                URL.createObjectURL(file);


            image.onload =
                function () {

                    URL.revokeObjectURL(
                        objectURL
                    );

                    resolve(image);

                };


            image.onerror =
                function () {

                    URL.revokeObjectURL(
                        objectURL
                    );

                    reject(
                        new Error(
                            "Unable to load image for tamper screening."
                        )
                    );

                };


            image.src =
                objectURL;

        }
    );

}