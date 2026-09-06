// =========================================================
// IDSHIELD AI
// Smart Risk Engine Module
// =========================================================


// =========================================================
// BASIC IMAGE RISK
// =========================================================

export function calculateRisk(imageAnalysis) {

    let score = 0;

    const findings = [];


    // -----------------------------------------------------
    // Resolution
    // -----------------------------------------------------

    if (
        imageAnalysis.resolution === "Low"
    ) {

        score += 25;

        findings.push({

            type: "warning",

            title:
                "Low image resolution",

            description:
                "The document image has limited resolution for detailed inspection."

        });

    }

    else if (
        imageAnalysis.resolution === "Moderate"
    ) {

        score += 12;

        findings.push({

            type: "warning",

            title:
                "Moderate image resolution",

            description:
                "Some document details may be difficult to inspect."

        });

    }

    else {

        findings.push({

            type: "safe",

            title:
                "Adequate image resolution",

            description:
                `${imageAnalysis.width} × ${imageAnalysis.height}px detected.`

        });

    }


    // -----------------------------------------------------
    // Compression
    // -----------------------------------------------------

    if (
        imageAnalysis.compressionRisk === "High"
    ) {

        score += 20;

        findings.push({

            type: "warning",

            title:
                "High compression indicator",

            description:
                "The file is unusually small and may have undergone significant compression."

        });

    }

    else if (
        imageAnalysis.compressionRisk === "Moderate"
    ) {

        score += 8;

        findings.push({

            type: "warning",

            title:
                "Moderate compression indicator",

            description:
                "Image compression may reduce visual inspection quality."

        });

    }

    else {

        findings.push({

            type: "safe",

            title:
                "File size within expected range",

            description:
                "No strong file-size warning was generated."

        });

    }


    // -----------------------------------------------------
    // Aspect Ratio
    // -----------------------------------------------------

    if (
        imageAnalysis.unusualRatio
    ) {

        score += 12;

        findings.push({

            type: "warning",

            title:
                "Unusual document proportions",

            description:
                `Detected aspect ratio: ${imageAnalysis.aspectRatio}.`

        });

    }

    else {

        findings.push({

            type: "safe",

            title:
                "Document proportions detected",

            description:
                `Aspect ratio: ${imageAnalysis.aspectRatio}.`

        });

    }


    // -----------------------------------------------------
    // Keep score within safe range
    // -----------------------------------------------------

    score =
        Math.min(
            Math.max(score, 0),
            95
        );


    return {

        score: score,

        category:
            getRiskCategory(score),

        findings: findings

    };

}


// =========================================================
// SMART FINAL RISK CALCULATION
// =========================================================

export function calculateSmartRisk({

    imageAnalysis = null,

    ocrConfidence = 0,

    parsedDocument = null,

    tamperAnalysis = null,

    documentType = "Identity Document"

}) {

    let score = 0;

    const findings = [];


    // =====================================================
    // 1. IMAGE QUALITY
    // =====================================================

    if (imageAnalysis) {

        if (
            imageAnalysis.resolution === "Low"
        ) {

            score += 20;

            findings.push({

                type: "warning",

                title:
                    "Low image quality",

                description:
                    "Low resolution may reduce the reliability of document screening."

            });

        }

        else if (
            imageAnalysis.resolution === "Moderate"
        ) {

            score += 10;

            findings.push({

                type: "warning",

                title:
                    "Moderate image quality",

                description:
                    "Some document details may require additional verification."

            });

        }

        else {

            findings.push({

                type: "safe",

                title:
                    "Good image quality",

                description:
                    "Image resolution is suitable for document screening."

            });

        }

    }


    // =====================================================
    // 2. OCR CONFIDENCE
    // =====================================================

    const confidence =
        Number(ocrConfidence) || 0;


    if (confidence < 40) {

        score += 25;

        findings.push({

            type: "warning",

            title:
                "Low OCR confidence",

            description:
                `OCR confidence is ${confidence}%. Extracted document information may be unreliable.`

        });

    }

    else if (confidence < 60) {

        score += 12;

        findings.push({

            type: "warning",

            title:
                "Moderate OCR confidence",

            description:
                `OCR confidence is ${confidence}%. Some extracted text may require verification.`

        });

    }

    else {

        findings.push({

            type: "safe",

            title:
                "Good OCR confidence",

            description:
                `OCR confidence is ${confidence}%.`

        });

    }


    // =====================================================
    // 3. REQUIRED FIELDS
    // =====================================================

    if (parsedDocument) {

        const fieldsFound =
            Number(
                parsedDocument.fieldsFound || 0
            );


        if (fieldsFound === 4) {

            findings.push({

                type: "safe",

                title:
                    "Required identity fields detected",

                description:
                    "Name, date of birth, document number and address were detected."

            });

        }

        else if (fieldsFound >= 2) {

            score += 10;

            findings.push({

                type: "warning",

                title:
                    "Some identity fields missing",

                description:
                    `${fieldsFound} of 4 expected identity fields were detected.`

            });

        }

        else {

            score += 20;

            findings.push({

                type: "warning",

                title:
                    "Required identity fields incomplete",

                description:
                    `${fieldsFound} of 4 expected identity fields were detected.`

            });

        }

    }


    // =====================================================
    // 4. DOCUMENT TYPE
    // =====================================================

    if (
        documentType &&
        documentType !== "Identity Document" &&
        documentType !== "Unknown Document"
    ) {

        findings.push({

            type: "safe",

            title:
                "Document type recognized",

            description:
                `${documentType} characteristics were identified from the OCR text.`

        });

    }

    else {

        score += 5;

        findings.push({

            type: "warning",

            title:
                "Document type uncertain",

            description:
                "The document type could not be confidently identified."

        });

    }


    // =====================================================
    // 5. TAMPERING
    // =====================================================

    if (tamperAnalysis) {

        const tamperScore =
            Number(
                tamperAnalysis.score || 0
            );


        if (tamperScore >= 25) {

            score += 25;

            findings.push({

                type: "warning",

                title:
                    "Potential visual alteration",

                description:
                    "The tampering analysis identified characteristics requiring investigation."

            });

        }

        else if (tamperScore >= 15) {

            score += 12;

            findings.push({

                type: "warning",

                title:
                    "Visual consistency requires review",

                description:
                    "Some visual characteristics require additional verification."

            });

        }

        else {

            findings.push({

                type: "safe",

                title:
                    "No strong alteration indicator",

                description:
                    "No significant visual alteration indicator was identified."

            });

        }

    }


    // =====================================================
    // FINAL SCORE
    // =====================================================

    score =
        Math.min(
            Math.max(
                Math.round(score),
                0
            ),
            100
        );


    // =====================================================
    // RISK CATEGORY
    // =====================================================

    const category =
        getRiskCategory(score);


    // =====================================================
    // FINAL RESULT
    // =====================================================

    return {

        score: score,

        category: category,

        findings: findings

    };

}


// =========================================================
// RISK CATEGORY
// =========================================================

function getRiskCategory(score) {

    if (score < 40) {

        return "LOW RISK";

    }

    if (score < 70) {

        return "REVIEW";

    }

    return "HIGH RISK";

}
