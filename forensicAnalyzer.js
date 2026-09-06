// =========================================================
// IDSHIELD AI
// FORENSIC ANALYSIS ENGINE v1
// =========================================================
//
// Purpose:
// Screen an uploaded identity document for forensic signals.
//
// IMPORTANT:
// These checks are screening indicators.
// They do NOT independently prove that a document is fake.
// =========================================================


// =========================================================
// MAIN FORENSIC ANALYZER
// =========================================================

export async function analyzeForensics(file, ocrResult, parsedDocument) {

    if (!file) {

        throw new Error(
            "No document supplied for forensic analysis."
        );

    }


    // =====================================================
    // RUN FORENSIC CHECKS
    // =====================================================

    const imageResult =
        await analyzeImageManipulation(file);


    const textResult =
        analyzeTextManipulation(
            ocrResult,
            parsedDocument
        );


    const cloneResult =
        await analyzeCopyPaste(file);


    const layoutResult =
        await analyzeLayoutAlteration(
            file,
            parsedDocument
        );


    const photoResult =
        await analyzePhotoReplacement(
            file
        );


    const metadataResult =
        analyzeMetadataAnomaly(
            file
        );


    // =====================================================
    // COMBINE RESULTS
    // =====================================================

    const checks = {

        imageManipulation:
            imageResult,

        textManipulation:
            textResult,

        copyPaste:
            cloneResult,

        layoutAlteration:
            layoutResult,

        photoReplacement:
            photoResult,

        metadataAnomaly:
            metadataResult

    };


    // =====================================================
    // CALCULATE FORENSIC RISK
    // =====================================================

    const score =
        calculateForensicRisk(
            checks
        );


    // =====================================================
    // OVERALL STATUS
    // =====================================================

    let status =
        "LIKELY AUTHENTIC";


    if (score >= 65) {

        status =
            "HIGH RISK";

    }

    else if (score >= 35) {

        status =
            "SUSPICIOUS";

    }


    // =====================================================
    // GENERATE EXPLANATION
    // =====================================================

    const findings =
        generateForensicFindings(
            checks
        );


    return {

        score,

        status,

        checks,

        findings,

        disclaimer:
            "Forensic screening provides risk indicators only and does not independently prove document authenticity."

    };

}


// =========================================================
// IMAGE MANIPULATION
// =========================================================

async function analyzeImageManipulation(file) {

    try {

        const image =
            await loadImage(file);


        const canvas =
            document.createElement(
                "canvas"
            );


        const ctx =
            canvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );


        const width =
            Math.min(
                image.naturalWidth,
                1000
            );


        const scale =
            width /
            image.naturalWidth;


        const height =
            Math.round(
                image.naturalHeight *
                scale
            );


        canvas.width =
            width;

        canvas.height =
            height;


        ctx.drawImage(
            image,
            0,
            0,
            width,
            height
        );


        const imageData =
            ctx.getImageData(
                0,
                0,
                width,
                height
            );


        const data =
            imageData.data;


        let brightnessSum =
            0;


        let brightnessVariance =
            0;


        let pixels =
            data.length /
            4;


        // ---------------------------------------------
        // FIRST PASS
        // ---------------------------------------------

        for (
            let i = 0;
            i < data.length;
            i += 4
        ) {

            const brightness =
                (
                    data[i] +
                    data[i + 1] +
                    data[i + 2]
                ) / 3;


            brightnessSum +=
                brightness;

        }


        const averageBrightness =
            brightnessSum /
            pixels;


        // ---------------------------------------------
        // SECOND PASS
        // ---------------------------------------------

        for (
            let i = 0;
            i < data.length;
            i += 4
        ) {

            const brightness =
                (
                    data[i] +
                    data[i + 1] +
                    data[i + 2]
                ) / 3;


            brightnessVariance +=
                Math.pow(
                    brightness -
                    averageBrightness,
                    2
                );

        }


        brightnessVariance /=
            pixels;


        let score =
            0;


        const reasons =
            [];


        // Very dark / bright documents
        if (
            averageBrightness < 35 ||
            averageBrightness > 235
        ) {

            score += 10;

            reasons.push(
                "Unusual overall image brightness."
            );

        }


        // Extremely low variation
        if (
            brightnessVariance < 250
        ) {

            score += 8;

            reasons.push(
                "Low visual variation detected."
            );

        }


        // Extremely high variation
        if (
            brightnessVariance > 6000
        ) {

            score += 8;

            reasons.push(
                "High local image variation detected."
            );

        }


        // Resolution screening
        if (
            image.naturalWidth < 500 ||
            image.naturalHeight < 300
        ) {

            score += 6;

            reasons.push(
                "Image resolution is relatively low."
            );

        }


        return {

            score:
                Math.min(
                    score,
                    25
                ),

            status:
                score >= 15
                    ? "REVIEW"
                    : "NORMAL",

            reasons,

            metrics: {

                width:
                    image.naturalWidth,

                height:
                    image.naturalHeight,

                averageBrightness:
                    Number(
                        averageBrightness.toFixed(2)
                    ),

                brightnessVariance:
                    Number(
                        brightnessVariance.toFixed(2)
                    )

            }

        };

    }

    catch (error) {

        console.warn(
            "Image forensic analysis failed:",
            error
        );


        return {

            score: 0,

            status:
                "UNAVAILABLE",

            reasons: [
                "Image analysis unavailable."
            ]

        };

    }

}


// =========================================================
// TEXT MANIPULATION
// =========================================================

function analyzeTextManipulation(
    ocrResult,
    parsedDocument
) {

    let score =
        0;


    const reasons =
        [];


    if (
        !ocrResult ||
        !ocrResult.success
    ) {

        return {

            score: 12,

            status:
                "REVIEW",

            reasons: [
                "OCR could not reliably analyze document text."
            ]

        };

    }


    const text =
        String(
            ocrResult.text || ""
        ).trim();


    const confidence =
        Number(
            ocrResult.confidence || 0
        );


    // ---------------------------------------------
    // OCR CONFIDENCE
    // ---------------------------------------------

    if (
        confidence < 50
    ) {

        score += 12;

        reasons.push(
            "Low OCR confidence."
        );

    }

    else if (
        confidence < 70
    ) {

        score += 7;

        reasons.push(
            "Moderate OCR confidence."
        );

    }


    // ---------------------------------------------
    // VERY SHORT OCR
    // ---------------------------------------------

    if (
        text.length < 30
    ) {

        score += 8;

        reasons.push(
            "Very limited readable text detected."
        );

    }


    // ---------------------------------------------
    // UNUSUAL SYMBOL DENSITY
    // ---------------------------------------------

    const characters =
        text.length;


    const suspiciousCharacters =
        (
            text.match(
                /[^A-Za-z0-9\s.,:/()'_-]/g
            ) || []
        ).length;


    if (
        characters > 50 &&
        suspiciousCharacters /
        characters > 0.20
    ) {

        score += 6;

        reasons.push(
            "Unusual character pattern detected in OCR text."
        );

    }


    // ---------------------------------------------
    // FIELD CONSISTENCY
    // ---------------------------------------------

    if (
        parsedDocument
    ) {

        if (
            parsedDocument.fieldsFound === 0
        ) {

            score += 8;

            reasons.push(
                "Expected identity fields were not detected."
            );

        }

    }


    return {

        score:
            Math.min(
                score,
                20
            ),

        status:
            score >= 12
                ? "REVIEW"
                : "NORMAL",

        reasons

    };

}


// =========================================================
// COPY-PASTE / CLONING SCREENING
// =========================================================

async function analyzeCopyPaste(file) {

    try {

        const image =
            await loadImage(file);


        const canvas =
            document.createElement(
                "canvas"
            );


        const ctx =
            canvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );


        const size =
            400;


        const scale =
            Math.min(
                size / image.naturalWidth,
                size / image.naturalHeight
            );


        canvas.width =
            Math.max(
                1,
                Math.round(
                    image.naturalWidth *
                    scale
                )
            );


        canvas.height =
            Math.max(
                1,
                Math.round(
                    image.naturalHeight *
                    scale
                )
            );


        ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
        );


        const data =
            ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            ).data;


        // ---------------------------------------------
        // SIMPLE BLOCK REPETITION SCREEN
        // ---------------------------------------------

        const blockSize =
            8;


        const blocks =
            new Map();


        let duplicateCount =
            0;


        for (
            let y = 0;
            y + blockSize < canvas.height;
            y += blockSize
        ) {

            for (
                let x = 0;
                x + blockSize < canvas.width;
                x += blockSize
            ) {

                let hash =
                    0;


                for (
                    let by = 0;
                    by < blockSize;
                    by++
                ) {

                    for (
                        let bx = 0;
                        bx < blockSize;
                        bx++
                    ) {

                        const px =
                            (
                                (
                                    y + by
                                ) *
                                canvas.width +
                                (
                                    x + bx
                                )
                            ) * 4;


                        const gray =
                            Math.round(
                                (
                                    data[px] +
                                    data[px + 1] +
                                    data[px + 2]
                                ) / 3
                            );


                        hash +=
                            gray;

                    }

                }


                const key =
                    Math.round(
                        hash /
                        (
                            blockSize *
                            blockSize
                        )
                    );


                if (
                    blocks.has(key)
                ) {

                    duplicateCount++;

                }

                else {

                    blocks.set(
                        key,
                        true
                    );

                }

            }

        }


        let score =
            0;


        const reasons =
            [];


        if (
            duplicateCount > 150
        ) {

            score += 12;

            reasons.push(
                "Repeated image patterns detected."
            );

        }

        else if (
            duplicateCount > 80
        ) {

            score += 6;

            reasons.push(
                "Some repeated visual patterns detected."
            );

        }


        return {

            score:
                Math.min(
                    score,
                    15
                ),

            status:
                score >= 10
                    ? "REVIEW"
                    : "NORMAL",

            reasons,

            duplicateBlocks:
                duplicateCount

        };

    }

    catch (error) {

        console.warn(
            "Copy-paste analysis failed:",
            error
        );


        return {

            score: 0,

            status:
                "UNAVAILABLE",

            reasons: [
                "Copy-paste screening unavailable."
            ]

        };

    }

}


// =========================================================
// LAYOUT ALTERATION
// =========================================================

async function analyzeLayoutAlteration(
    file,
    parsedDocument
) {

    const reasons =
        [];


    let score =
        0;


    // ---------------------------------------------
    // DOCUMENT STRUCTURE
    // ---------------------------------------------

    if (
        parsedDocument
    ) {

        const fields =
            parsedDocument.fieldsFound || 0;


        if (
            fields === 0
        ) {

            score += 10;

            reasons.push(
                "Expected document fields were not located."
            );

        }

        else if (
            fields < 2
        ) {

            score += 5;

            reasons.push(
                "Only a small number of expected fields were detected."
            );

        }

    }


    // ---------------------------------------------
    // IMAGE ASPECT RATIO
    // ---------------------------------------------

    try {

        const image =
            await loadImage(file);


        const ratio =
            image.naturalWidth /
            image.naturalHeight;


        if (
            ratio < 0.5 ||
            ratio > 2.5
        ) {

            score += 5;

            reasons.push(
                "Unusual document image proportions detected."
            );

        }

    }

    catch {

        // Ignore image loading error.

    }


    return {

        score:
            Math.min(
                score,
                15
            ),

        status:
            score >= 10
                ? "REVIEW"
                : "NORMAL",

        reasons

    };

}


// =========================================================
// PHOTO REPLACEMENT SCREENING
// =========================================================

async function analyzePhotoReplacement(file) {

    // -------------------------------------------------
    // V1 browser screening
    //
    // We don't claim facial identity verification here.
    // We only look for possible photo-region anomalies.
    // -------------------------------------------------

    try {

        const image =
            await loadImage(file);


        const width =
            image.naturalWidth;


        const height =
            image.naturalHeight;


        let score =
            0;


        const reasons =
            [];


        // Very small images make photo-region analysis
        // unreliable.

        if (
            width < 500 ||
            height < 300
        ) {

            score += 4;

            reasons.push(
                "Image resolution is too limited for reliable photo-region screening."
            );

        }


        return {

            score:
                Math.min(
                    score,
                    10
                ),

            status:
                score >= 7
                    ? "REVIEW"
                    : "NORMAL",

            reasons

        };

    }

    catch {

        return {

            score: 0,

            status:
                "UNAVAILABLE",

            reasons: [
                "Photo replacement screening unavailable."
            ]

        };

    }

}


// =========================================================
// METADATA ANOMALY
// =========================================================

function analyzeMetadataAnomaly(file) {

    let score =
        0;


    const reasons =
        [];


    // Browser File API exposes basic file metadata.
    // Full EXIF analysis will be added in the next
    // forensic upgrade.

    const fileName =
        String(
            file.name || ""
        );


    const fileType =
        String(
            file.type || ""
        );


    const fileSize =
        Number(
            file.size || 0
        );


    // ---------------------------------------------
    // FILE TYPE
    // ---------------------------------------------

    if (
        !fileType.startsWith(
            "image/"
        )
    ) {

        score += 4;

        reasons.push(
            "File MIME type is not a standard image type."
        );

    }


    // ---------------------------------------------
    // UNUSUAL FILE SIZE
    // ---------------------------------------------

    if (
        fileSize > 0 &&
        fileSize < 20 * 1024
    ) {

        score += 5;

        reasons.push(
            "Image file size is unusually small."
        );

    }


    // ---------------------------------------------
    // MULTIPLE EXTENSIONS
    // ---------------------------------------------

    if (
        /\.[a-z0-9]+\.[a-z0-9]+$/i.test(
            fileName
        )
    ) {

        score += 5;

        reasons.push(
            "Filename contains multiple extensions."
        );

    }


    return {

        score:
            Math.min(
                score,
                10
            ),

        status:
            score >= 7
                ? "REVIEW"
                : "NORMAL",

        reasons,

        metadata: {

            fileName,

            fileType,

            fileSize

        }

    };

}


// =========================================================
// FORENSIC RISK CALCULATION
// =========================================================

function calculateForensicRisk(
    checks
) {

    let total =
        0;


    total +=
        checks.imageManipulation.score;


    total +=
        checks.textManipulation.score;


    total +=
        checks.copyPaste.score;


    total +=
        checks.layoutAlteration.score;


    total +=
        checks.photoReplacement.score;


    total +=
        checks.metadataAnomaly.score;


    // Maximum theoretical score:
    //
    // 25 + 20 + 15 + 15 + 10 + 10
    //
    // = 95
    //
    // Normalize to 100.

    const normalized =
        Math.round(
            (
                total /
                95
            ) * 100
        );


    return Math.min(
        normalized,
        100
    );

}


// =========================================================
// FINDINGS
// =========================================================

function generateForensicFindings(
    checks
) {

    const findings =
        [];


    Object.entries(
        checks
    ).forEach(
        function (
            [key, result]
        ) {

            if (
                !result ||
                !result.reasons
            ) {

                return;

            }


            result.reasons.forEach(
                function (
                    reason
                ) {

                    findings.push({

                        type:
                            result.score >= 10
                                ? "warning"
                                : "info",

                        title:
                            formatCheckName(
                                key
                            ),

                        description:
                            reason

                    });

                }
            );

        }
    );


    if (
        findings.length === 0
    ) {

        findings.push({

            type:
                "safe",

            title:
                "Forensic Screening",

            description:
                "No strong forensic anomalies were detected by the available browser-based checks."

        });

    }


    return findings;

}


// =========================================================
// FORMAT CHECK NAME
// =========================================================

function formatCheckName(
    key
) {

    const names = {

        imageManipulation:
            "Image Manipulation",

        textManipulation:
            "Text Manipulation",

        copyPaste:
            "Copy-Paste / Cloning",

        layoutAlteration:
            "Layout Alteration",

        photoReplacement:
            "Photo Replacement",

        metadataAnomaly:
            "Metadata Anomaly"

    };


    return (
        names[key] ||
        key
    );

}


// =========================================================
// IMAGE LOADER
// =========================================================

function loadImage(file) {

    return new Promise(
        function (
            resolve,
            reject
        ) {

            const image =
                new Image();


            const url =
                URL.createObjectURL(
                    file
                );


            image.onload =
                function () {

                    URL.revokeObjectURL(
                        url
                    );


                    resolve(
                        image
                    );

                };


            image.onerror =
                function () {

                    URL.revokeObjectURL(
                        url
                    );


                    reject(
                        new Error(
                            "Unable to load image."
                        )
                    );

                };


            image.src =
                url;

        }
    );

}