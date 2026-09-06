// =========================================================
// IDSHIELD AI
// Document Screening Engine - Prototype v3
// =========================================================


// =========================================================
// IMPORTS
// =========================================================

import { analyzeImage } from "./modules/imageAnalyzer.js";
import {
    calculateRisk,
    calculateSmartRisk
} from "./modules/riskEngine.js";
import { extractTextFromImage } from "./modules/ocrEngine.js";
import { parseDocumentText } from "./modules/documentParser.js";
import { analyzeTampering } from "./modules/tamperAnalyzer.js";
import { analyzeForensics } from "./modules/forensicAnalyzer.js";


// =========================================================
// ELEMENTS
// =========================================================

const documentInput =
    document.getElementById("documentInput");

const uploadContainer =
    document.getElementById("uploadContainer");

const documentPanel =
    document.getElementById("documentPanel");

const analysisPanel =
    document.getElementById("analysisPanel");

const resultPanel =
    document.getElementById("resultPanel");

const fileName =
    document.getElementById("fileName");

const fileDetails =
    document.getElementById("fileDetails");

const previewArea =
    document.getElementById("previewArea");

const documentFileIcon =
    document.getElementById("documentFileIcon");


// =========================================================
// CURRENT ANALYSIS DATA
// =========================================================

let currentFile = null;

let analysisData = {

    score: 0,

    findings: [],

    dimensions: null,

    quality: "Unknown",

    fileType: "Unknown",

    parsedDocument: null,

    tamperAnalysis: null,

    forensicAnalysis: null

};


// =========================================================
// FILE UPLOAD
// =========================================================

documentInput.addEventListener(
    "change",
    function () {

        const file =
            this.files[0];

        if (!file) {
            return;
        }

        handleDocument(file);

    }
);


// =========================================================
// DRAG & DROP
// =========================================================

uploadContainer.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        uploadContainer.classList.add(
            "drag-over"
        );

    }
);


uploadContainer.addEventListener(
    "dragleave",
    function () {

        uploadContainer.classList.remove(
            "drag-over"
        );

    }
);


uploadContainer.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        uploadContainer.classList.remove(
            "drag-over"
        );

        const file =
            event.dataTransfer.files[0];

        if (!file) {
            return;
        }

        handleDocument(file);

    }
);


// =========================================================
// HANDLE DOCUMENT
// =========================================================

function handleDocument(file) {

    const allowedTypes = [

        "image/jpeg",

        "image/png",

        "image/jpg",

        "application/pdf"

    ];


    if (!allowedTypes.includes(file.type)) {

        alert(
            "Please upload a JPG, PNG or PDF document."
        );

        return;

    }


    currentFile = file;


    const sizeInKB =
        (file.size / 1024).toFixed(1);


    fileName.textContent =
        file.name;


    fileDetails.textContent =
        `${sizeInKB} KB • ${getFileType(file)}`;


    if (
        file.type ===
        "application/pdf"
    ) {

        documentFileIcon.textContent =
            "📕";

    } else {

        documentFileIcon.textContent =
            "🖼️";

    }


    // =====================================================
    // IMAGE PREVIEW
    // =====================================================

    if (
        file.type.startsWith("image/")
    ) {

        const imageURL =
            URL.createObjectURL(file);


        previewArea.innerHTML = `

            <img
                src="${imageURL}"
                alt="Uploaded identity document"
            >

        `;

    } else {

        previewArea.innerHTML = `

            <div class="preview-placeholder">

                📕

                <span>
                    PDF document selected
                </span>

            </div>

        `;

    }


    uploadContainer.classList.add(
        "hidden"
    );

    documentPanel.classList.remove(
        "hidden"
    );

    analysisPanel.classList.add(
        "hidden"
    );

    resultPanel.classList.add(
        "hidden"
    );

}


// =========================================================
// FILE TYPE
// =========================================================

function getFileType(file) {

    if (
        file.type ===
        "application/pdf"
    ) {

        return "PDF Document";

    }


    if (
        file.type ===
        "image/png"
    ) {

        return "PNG Image";

    }


    if (
        file.type === "image/jpeg" ||
        file.type === "image/jpg"
    ) {

        return "JPEG Image";

    }


    return "Document";

}


// =========================================================
// REMOVE DOCUMENT
// =========================================================

function removeDocument() {

    documentInput.value = "";

    currentFile = null;


    uploadContainer.classList.remove(
        "hidden"
    );

    documentPanel.classList.add(
        "hidden"
    );

    analysisPanel.classList.add(
        "hidden"
    );

    resultPanel.classList.add(
        "hidden"
    );


    previewArea.innerHTML = `

        <div class="preview-placeholder">

            📄

            <span>
                Document preview
            </span>

        </div>

    `;

}


// =========================================================
// START ANALYSIS
// =========================================================

function analyzeDocument() {

    if (!currentFile) {

        alert(
            "Please select a document first."
        );

        return;

    }


    documentPanel.classList.add(
        "hidden"
    );

    resultPanel.classList.add(
        "hidden"
    );

    analysisPanel.classList.remove(
        "hidden"
    );


    runAnalysis();

}


// =========================================================
// ANALYSIS PIPELINE
// =========================================================

function runAnalysis() {

    resetAnalysisUI();


    let progress = 0;


    const progressBar =
        document.getElementById(
            "progressBar"
        );


    const progressPercent =
        document.getElementById(
            "progressPercent"
        );


    const checks = [

        document.getElementById(
            "check1"
        ),

        document.getElementById(
            "check2"
        ),

        document.getElementById(
            "check3"
        ),

        document.getElementById(
            "check4"
        ),

        document.getElementById(
            "check5"
        )

    ];


    const interval =
        setInterval(
            async function () {

                progress += 2;


                if (progress > 100) {

                    progress = 100;

                }


                progressBar.style.width =
                    progress + "%";


                progressPercent.textContent =
                    progress + "%";


                if (progress >= 20) {

                    completeCheck(
                        checks[0]
                    );

                }


                if (progress >= 40) {

                    completeCheck(
                        checks[1]
                    );

                }


                if (progress >= 60) {

                    completeCheck(
                        checks[2]
                    );

                }


                if (progress >= 80) {

                    completeCheck(
                        checks[3]
                    );

                }


                if (progress >= 100) {

                    completeCheck(
                        checks[4]
                    );


                    clearInterval(
                        interval
                    );


                    try {

                        await performDocumentAnalysis();

                    } catch (error) {

                        console.error(
                            "Analysis error:",
                            error
                        );

                        createFallbackAnalysis();

                    }


                    setTimeout(
                        showResult,
                        500
                    );

                }

            },
            35
        );

}


// =========================================================
// RESET ANALYSIS UI
// =========================================================

function resetAnalysisUI() {

    const progressBar =
        document.getElementById(
            "progressBar"
        );


    const progressPercent =
        document.getElementById(
            "progressPercent"
        );


    progressBar.style.width =
        "0%";


    progressPercent.textContent =
        "0%";


    const checks = [

        document.getElementById(
            "check1"
        ),

        document.getElementById(
            "check2"
        ),

        document.getElementById(
            "check3"
        ),

        document.getElementById(
            "check4"
        ),

        document.getElementById(
            "check5"
        )

    ];


    checks.forEach(
        function (check) {

            check.classList.remove(
                "complete"
            );

            check.querySelector(
                "span"
            ).textContent =
                "○";

        }
    );


    // Reset analysis data only once

    analysisData = {

        score: 0,

        findings: [],

        dimensions: null,

        quality: "Unknown",

        fileType: "Unknown",

        parsedDocument: null,

        tamperAnalysis: null

    };

}


// =========================================================
// COMPLETE CHECK
// =========================================================

function completeCheck(element) {

    element.classList.add(
        "complete"
    );


    element.querySelector(
        "span"
    ).textContent =
        "✓";

}


// =========================================================
// REAL DOCUMENT ANALYSIS
// =========================================================

async function performDocumentAnalysis() {

    const file =
        currentFile;


    if (!file) {

        throw new Error(
            "No document selected."
        );

    }


    analysisData.fileType =
        getFileType(file);


    // =====================================================
    // IMAGE DOCUMENT
    // =====================================================

    if (
        file.type.startsWith("image/")
    ) {


        // -------------------------------------------------
        // IMAGE ANALYSIS
        // -------------------------------------------------

        const imageAnalysis =
            await analyzeImage(file);


        analysisData.dimensions = {

            width:
                imageAnalysis.width,

            height:
                imageAnalysis.height

        };


        analysisData.quality =
            imageAnalysis.resolution;


        // -------------------------------------------------
        // BASIC RISK ANALYSIS
        // -------------------------------------------------

        const riskResult =
            calculateRisk(
                imageAnalysis
            );


        analysisData.score =
            riskResult.score;


        analysisData.findings =
            riskResult.findings;


        // -------------------------------------------------
        // OCR
        // -------------------------------------------------

        const ocrResult =
            await extractTextFromImage(
                file
            );


        // -------------------------------------------------
        // DISPLAY OCR RESULT
        // -------------------------------------------------

        const ocrTextElement =
            document.getElementById(
                "ocrText"
            );


        const ocrConfidenceElement =
            document.getElementById(
                "ocrConfidence"
            );


        if (ocrResult.success) {

            ocrTextElement.textContent =
                ocrResult.text;


            ocrConfidenceElement.textContent =
                `Confidence: ${ocrResult.confidence}%`;

        } else {

            ocrTextElement.textContent =
                ocrResult.message;


            ocrConfidenceElement.textContent =
                "OCR unavailable";

        }


        // =================================================
        // DOCUMENT FIELD EXTRACTION
        // =================================================

      if (ocrResult.success) {

    const parsedDocument =
        parseDocumentText(
            ocrResult.text
        );
        console.log("===== IDSHIELD PARSER DEBUG =====");
console.log("OCR TEXT:", ocrResult.text);
console.log("PARSED DOCUMENT:", parsedDocument);
console.log("NAME:", parsedDocument.name);
console.log("DOB:", parsedDocument.dateOfBirth);
console.log("DOCUMENT NUMBER:", parsedDocument.documentNumber);
console.log("ADDRESS:", parsedDocument.address);
console.log("FIELDS:", parsedDocument.fieldsFound);
console.log("================================");


    analysisData.parsedDocument =
        parsedDocument;


    // =====================================================
    // DISPLAY EXTRACTED DOCUMENT INFORMATION
    // =====================================================

    const documentTypeElement =
        document.getElementById(
            "extractedDocumentType"
        );

    const nameElement =
        document.getElementById(
            "extractedName"
        );

    const documentNumberElement =
        document.getElementById(
            "extractedDocumentNumber"
        );

    const dobElement =
        document.getElementById(
            "extractedDob"
        );
        const addressElement =
    document.getElementById(
        "extractedAddress"
    );

    const detectedFieldsElement =
        document.getElementById(
            "detectedFields"
        );

    const confidenceElement =
        document.getElementById(
            "extractedConfidence"
        );


   // =====================================================
// DOCUMENT TYPE DETECTION
// =====================================================

if (documentTypeElement) {

    documentTypeElement.textContent =
        detectDocumentType(
            ocrResult.text
        );

}


    // Name

    if (nameElement) {

        nameElement.textContent =
            parsedDocument.name ||
            "Not detected";

    }


    // Document number

    if (documentNumberElement) {

        documentNumberElement.textContent =
            parsedDocument.documentNumber ||
            "Not detected";

    }


    // Date of birth

    if (dobElement) {

        dobElement.textContent =
            parsedDocument.dateOfBirth ||
            "Not detected";

    }
    if (addressElement) {

    addressElement.textContent =
        parsedDocument.address ||
        "Not detected";

}


    // Detected fields

    if (detectedFieldsElement) {

        detectedFieldsElement.textContent =
            `${parsedDocument.fieldsFound} / 4`;

    }


    // OCR confidence

    if (confidenceElement) {

        confidenceElement.textContent =
            ocrResult.confidence !== undefined
                ? `${ocrResult.confidence}%`
                : "Unavailable";

    }


    // Add parser findings

    analysisData.findings.push(
        ...parsedDocument.findings
    );

}


        // =================================================
        // TAMPERING / ALTERATION SCREENING
        // =================================================

        const tamperResult =
            await analyzeTampering(
                file
            );


        analysisData.tamperAnalysis =
            tamperResult;
// =====================================================
// DISPLAY TAMPERING METRICS
// =====================================================

const tamperScoreElement =
    document.getElementById(
        "tamperScore"
    );

const tamperBrightnessElement =
    document.getElementById(
        "tamperBrightness"
    );

const tamperVariationElement =
    document.getElementById(
        "tamperVariation"
    );

const tamperEdgesElement =
    document.getElementById(
        "tamperEdges"
    );


if (tamperScoreElement) {

    tamperScoreElement.textContent =
        `${tamperResult.score}/40`;

}


if (
    tamperResult.metrics
) {

    if (tamperBrightnessElement) {

        tamperBrightnessElement.textContent =
            tamperResult.metrics.averageBrightness;

    }


    if (tamperVariationElement) {

        tamperVariationElement.textContent =
            tamperResult.metrics.averageDifference;

    }


    if (tamperEdgesElement) {

        tamperEdgesElement.textContent =
            tamperResult.metrics.edgeRatio;

    }

}

        // Add tampering indicators

        analysisData.findings.push(
            ...tamperResult.findings
        );


// =====================================================
// SMART FINAL RISK CALCULATION
// =====================================================

const finalRisk =
    calculateSmartRisk({

        imageAnalysis: imageAnalysis,

        ocrConfidence:
            ocrResult.confidence,

        parsedDocument:
            analysisData.parsedDocument,

        tamperAnalysis:
            tamperResult,

        documentType:
            detectDocumentType(
                ocrResult.text
            )

    });


// =====================================================
// STORE FINAL RISK RESULT
// =====================================================

analysisData.score =
    finalRisk.score;


// Replace the temporary image/tamper findings
// with the complete explainable risk findings.

analysisData.findings =
    finalRisk.findings;


// Keep tamper analysis available
// for the UI and report.

analysisData.tamperAnalysis =
    tamperResult;
// =====================================================
// AI FORENSIC ANALYSIS
// =====================================================

const forensicResult =
    await analyzeForensics(

        file,

        ocrResult,

        analysisData.parsedDocument

    );


analysisData.forensicAnalysis =
    forensicResult;
// =====================================================
// DISPLAY AI FORENSIC RESULTS
// =====================================================

displayForensicResults(
    forensicResult
);


// =====================================================
// FORENSIC RESULT UI
// =====================================================

function displayForensicResults(forensicResult) {

    if (!forensicResult) {
        return;
    }


    // -------------------------------------------------
    // FORENSIC SCORE
    // -------------------------------------------------

    const scoreElement =
        document.getElementById(
            "forensicScore"
        );


    if (scoreElement) {

        scoreElement.textContent =
            forensicResult.score;

    }


    // -------------------------------------------------
    // FORENSIC STATUS
    // -------------------------------------------------

    const statusElement =
        document.getElementById(
            "forensicStatus"
        );


    if (statusElement) {

        statusElement.textContent =
            forensicResult.status;


        statusElement.classList.remove(
            "safe",
            "warning",
            "danger"
        );


        if (
            forensicResult.status ===
            "LIKELY AUTHENTIC"
        ) {

            statusElement.classList.add(
                "safe"
            );

        }

        else if (
            forensicResult.status ===
            "SUSPICIOUS"
        ) {

            statusElement.classList.add(
                "warning"
            );

        }

        else {

            statusElement.classList.add(
                "danger"
            );

        }

    }


    // -------------------------------------------------
    // FORENSIC SUMMARY
    // -------------------------------------------------

    const summaryElement =
        document.getElementById(
            "forensicSummary"
        );


    if (summaryElement) {

        if (
            forensicResult.status ===
            "LIKELY AUTHENTIC"
        ) {

            summaryElement.textContent =
                "No strong forensic anomalies were detected by the available screening checks.";

        }

        else if (
            forensicResult.status ===
            "SUSPICIOUS"
        ) {

            summaryElement.textContent =
                "Some forensic signals require additional document verification.";

        }

        else {

            summaryElement.textContent =
                "Multiple forensic signals require manual investigation.";

        }

    }


    // -------------------------------------------------
    // INDIVIDUAL CHECKS
    // -------------------------------------------------

    const checks =
        forensicResult.checks;


    if (!checks) {
        return;
    }


    updateForensicCard(
        "forensicImage",
        checks.imageManipulation
    );


    updateForensicCard(
        "forensicText",
        checks.textManipulation
    );


    updateForensicCard(
        "forensicCopyPaste",
        checks.copyPaste
    );


    updateForensicCard(
        "forensicLayout",
        checks.layoutAlteration
    );


    updateForensicCard(
        "forensicPhoto",
        checks.photoReplacement
    );


    updateForensicCard(
        "forensicMetadata",
        checks.metadataAnomaly
    );

}


// =====================================================
// UPDATE FORENSIC CARD
// =====================================================

function updateForensicCard(
    elementId,
    result
) {

    const card =
        document.getElementById(
            elementId
        );


    if (!card || !result) {
        return;
    }


    const statusElement =
    card.querySelector(".forensic-check-status") ||
    card.querySelector("strong");


    const descriptionElement =
    card.querySelector("p") ||
    card.querySelector("small");


    // -------------------------------------------------
    // STATUS
    // -------------------------------------------------

    if (statusElement) {

        statusElement.textContent =
            result.status;


        statusElement.classList.remove(
            "safe",
            "warning",
            "danger"
        );


        if (
            result.status ===
            "NORMAL"
        ) {

            statusElement.classList.add(
                "safe"
            );

        }

        else if (
            result.status ===
            "REVIEW"
        ) {

            statusElement.classList.add(
                "warning"
            );

        }

        else {

            statusElement.classList.add(
                "danger"
            );

        }

    }


    // -------------------------------------------------
    // DESCRIPTION
    // -------------------------------------------------

    if (descriptionElement) {

        if (
            Array.isArray(
                result.reasons
            ) &&
            result.reasons.length > 0
        ) {

            descriptionElement.textContent =
                result.reasons.join(" ");

        }

        else {

            descriptionElement.textContent =
                "No significant anomaly detected.";

        }

    }
// -------------------------------------------------
// EVIDENCE DETAILS
// -------------------------------------------------

const evidenceMap = {

    forensicImage:
        "forensicImageEvidence",

    forensicText:
        "forensicTextEvidence",

    forensicCopyPaste:
        "forensicCopyPasteEvidence",

    forensicLayout:
        "forensicLayoutEvidence",

    forensicPhoto:
        "forensicPhotoEvidence",

    forensicMetadata:
        "forensicMetadataEvidence"

};


const evidenceElement =
    document.getElementById(
        evidenceMap[elementId]
    );


if (evidenceElement) {

    let evidence = "";


    // =============================================
    // IMAGE MANIPULATION
    // =============================================

    if (
        elementId ===
        "forensicImage"
    ) {

        const metrics =
            result.metrics;


        if (metrics) {

            evidence = `

                <span class="forensic-metric">
                    <span class="forensic-metric-label">
                        Resolution:
                    </span>

                    <span class="forensic-metric-value">
                        ${metrics.width} × ${metrics.height}
                    </span>
                </span>

                <span class="forensic-metric">
                    <span class="forensic-metric-label">
                        Brightness:
                    </span>

                    <span class="forensic-metric-value">
                        ${metrics.averageBrightness}
                    </span>
                </span>

                <span class="forensic-metric">
                    <span class="forensic-metric-label">
                        Variance:
                    </span>

                    <span class="forensic-metric-value">
                        ${metrics.brightnessVariance}
                    </span>
                </span>

            `;

        }

        else {

            evidence =
                "Image metrics unavailable.";

        }

    }


    // =============================================
    // TEXT MANIPULATION
    // =============================================

    else if (
        elementId ===
        "forensicText"
    ) {

        const confidence =
            Number(
                result.ocrConfidence || 0
            );


        evidence =
            `OCR confidence and extracted text consistency were evaluated.`;

    }


    // =============================================
    // COPY-PASTE
    // =============================================

    else if (
        elementId ===
        "forensicCopyPaste"
    ) {

        if (
            result.duplicateBlocks !==
            undefined
        ) {

            evidence = `

                <span class="forensic-metric">

                    <span class="forensic-metric-label">
                        Repeated blocks:
                    </span>

                    <span class="forensic-metric-value">
                        ${result.duplicateBlocks}
                    </span>

                </span>

            `;

        }

        else {

            evidence =
                "Repeated image-pattern analysis completed.";

        }

    }


    // =============================================
    // LAYOUT
    // =============================================

    else if (
        elementId ===
        "forensicLayout"
    ) {

        evidence =
            "Document proportions and detected field structure were evaluated.";

    }


    // =============================================
    // PHOTO
    // =============================================

    else if (
        elementId ===
        "forensicPhoto"
    ) {

        evidence =
            "Photo-region screening was performed using available image characteristics.";

    }


    // =============================================
    // METADATA
    // =============================================

    else if (
        elementId ===
        "forensicMetadata"
    ) {

        if (
            result.metadata
        ) {

            evidence = `

                <span class="forensic-metric">

                    <span class="forensic-metric-label">
                        Type:
                    </span>

                    <span class="forensic-metric-value">
                        ${result.metadata.fileType || "Unknown"}
                    </span>

                </span>

                <span class="forensic-metric">

                    <span class="forensic-metric-label">
                        Size:
                    </span>

                    <span class="forensic-metric-value">
                        ${formatFileSize(
                            result.metadata.fileSize || 0
                        )}
                    </span>

                </span>

            `;

        }

        else {

            evidence =
                "Available file metadata could not be fully inspected.";

        }

    }


    evidenceElement.innerHTML =
        evidence;

}

    // -------------------------------------------------
    // CARD STATUS
    // -------------------------------------------------

    card.classList.remove(
        "safe",
        "warning",
        "danger"
    );


    if (
        result.status ===
        "NORMAL"
    ) {

        card.classList.add(
            "safe"
        );

    }

    else if (
        result.status ===
        "REVIEW"
    ) {

        card.classList.add(
            "warning"
        );

    }

    else {

        card.classList.add(
            "danger"
        );

    }

}

console.log(
    "===== IDSHIELD FORENSIC ANALYSIS ====="
);

console.log(
    "FORENSIC SCORE:",
    forensicResult.score
);

console.log(
    "FORENSIC STATUS:",
    forensicResult.status
);

console.log(
    "FORENSIC CHECKS:",
    forensicResult.checks
);

console.log(
    "FORENSIC FINDINGS:",
    forensicResult.findings
);

console.log(
    "======================================="
);

// =====================================================
// FINAL RESULT
// =====================================================

return;

    }


    // =====================================================
    // PDF DOCUMENT
    // =====================================================

    if (
        file.type ===
        "application/pdf"
    ) {

        analyzePDF(file);

        return;

    }


    createFallbackAnalysis();

}
// =========================================================
// DOCUMENT TYPE DETECTION
// =========================================================

function detectDocumentType(text) {

    if (!text) {

        return "Unknown Document";

    }


    const normalizedText =
        text
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();


    // =====================================================
    // AADHAAR
    // =====================================================

    if (
        normalizedText.includes("aadhaar") ||
        normalizedText.includes("unique identification authority") ||
        normalizedText.includes("your aadhaar no")
    ) {

        return "Aadhaar Card";

    }


    // =====================================================
    // PASSPORT
    // =====================================================

    if (
        normalizedText.includes("passport") ||
        normalizedText.includes("republic of india") &&
        normalizedText.includes("passport")
    ) {

        return "Passport";

    }


    // =====================================================
    // PAN CARD
    // =====================================================

    if (
        normalizedText.includes("income tax department") &&
        normalizedText.includes("permanent account number")
    ) {

        return "PAN Card";

    }


    if (
        normalizedText.includes("permanent account number")
    ) {

        return "PAN Card";

    }


    // =====================================================
    // DRIVING LICENCE
    // =====================================================

    if (
        normalizedText.includes("driving licence") ||
        normalizedText.includes("driving license") ||
        normalizedText.includes("transport department")
    ) {

        return "Driving Licence";

    }


    // =====================================================
    // VOTER ID
    // =====================================================

    if (
        normalizedText.includes("election commission") ||
        normalizedText.includes("elector photo identity card") ||
        normalizedText.includes("epic")
    ) {

        return "Voter ID";

    }


    // =====================================================
    // UNKNOWN
    // =====================================================

    return "Identity Document";

}

// =========================================================
// IMAGE INSPECTION
// =========================================================

function inspectImage(file) {

    return new Promise(
        function (resolve, reject) {

            const image =
                new Image();


            const objectURL =
                URL.createObjectURL(
                    file
                );


            image.onload =
                function () {

                    const width =
                        image.naturalWidth;


                    const height =
                        image.naturalHeight;


                    URL.revokeObjectURL(
                        objectURL
                    );


                    resolve({

                        width:
                            width,

                        height:
                            height,

                        ratio:
                            width / height

                    });

                };


            image.onerror =
                function () {

                    URL.revokeObjectURL(
                        objectURL
                    );


                    reject(
                        new Error(
                            "Unable to read image."
                        )
                    );

                };


            image.src =
                objectURL;

        }
    );

}


// =========================================================
// IMAGE PROPERTY ANALYSIS
// =========================================================

function analyzeImageProperties(
    file,
    imageData
) {

    let score = 10;

    const findings = [];


    const width =
        imageData.width;


    const height =
        imageData.height;


    const ratio =
        imageData.ratio;


    const fileSize =
        file.size;


    // -----------------------------------------------------
    // RESOLUTION CHECK
    // -----------------------------------------------------

    if (
        width < 600 ||
        height < 400
    ) {

        score += 25;


        findings.push({

            type:
                "warning",

            title:
                "Low image resolution",

            description:
                `Image resolution is ${width} × ${height}px. Low-resolution documents may require manual review.`

        });


        analysisData.quality =
            "Low";

    }

    else if (
        width < 1000 ||
        height < 700
    ) {

        score += 12;


        findings.push({

            type:
                "warning",

            title:
                "Moderate image resolution",

            description:
                `Image resolution is ${width} × ${height}px. Text and security details may be harder to inspect.`

        });


        analysisData.quality =
            "Moderate";

    }

    else {

        findings.push({

            type:
                "safe",

            title:
                "Adequate image resolution",

            description:
                `Image resolution is ${width} × ${height}px.`

        });


        analysisData.quality =
            "Good";

    }


    // -----------------------------------------------------
    // FILE SIZE CHECK
    // -----------------------------------------------------

    if (
        fileSize < 30000
    ) {

        score += 20;


        findings.push({

            type:
                "warning",

            title:
                "Very small file size",

            description:
                "The image file is unusually small for detailed document screening."

        });

    }

    else if (
        fileSize < 80000
    ) {

        score += 8;


        findings.push({

            type:
                "warning",

            title:
                "Small file size",

            description:
                "Compression may reduce the reliability of visual inspection."

        });

    }

    else {

        findings.push({

            type:
                "safe",

            title:
                "File size within expected range",

            description:
                `${formatFileSize(fileSize)} image file detected.`

        });

    }


    // -----------------------------------------------------
    // ASPECT RATIO CHECK
    // -----------------------------------------------------

    if (
        ratio < 0.45 ||
        ratio > 1.9
    ) {

        score += 12;


        findings.push({

            type:
                "warning",

            title:
                "Unusual document proportions",

            description:
                `Detected aspect ratio: ${ratio.toFixed(2)}. Document proportions should be reviewed.`

        });

    }

    else {

        findings.push({

            type:
                "safe",

            title:
                "Document proportions detected",

            description:
                `Aspect ratio: ${ratio.toFixed(2)}.`

        });

    }


    // -----------------------------------------------------
    // FORMAT CHECK
    // -----------------------------------------------------

    if (
        file.type ===
        "image/jpeg"
    ) {

        findings.push({

            type:
                "info",

            title:
                "JPEG image detected",

            description:
                "JPEG compression characteristics will be considered during deeper analysis."

        });

    }

    else if (
        file.type ===
        "image/png"
    ) {

        findings.push({

            type:
                "info",

            title:
                "PNG image detected",

            description:
                "PNG image selected for screening."

        });

    }


    // -----------------------------------------------------
    // CAP SCORE
    // -----------------------------------------------------

    score =
        Math.min(
            Math.max(
                score,
                0
            ),
            95
        );


    analysisData.score =
        score;


    analysisData.findings =
        findings;

}


// =========================================================
// PDF ANALYSIS
// =========================================================

async function analyzePDF(file) {

    let score = 10;

    const findings = [];

    const fileSize =
        file.size;


    // -----------------------------------------------------
    // PDF DETECTED
    // -----------------------------------------------------

    findings.push({

        type: "info",

        title:
            "PDF document detected",

        description:
            "A PDF document was successfully selected for screening."

    });


    // -----------------------------------------------------
    // FILE SIZE
    // -----------------------------------------------------

    if (fileSize < 20000) {

        score += 20;

        findings.push({

            type: "warning",

            title:
                "Very small PDF",

            description:
                "The PDF contains a relatively small amount of data and may require additional review."

        });

    }

    else if (fileSize < 100000) {

        score += 8;

        findings.push({

            type: "warning",

            title:
                "Small PDF document",

            description:
                "The PDF file is relatively small. Content completeness should be verified."

        });

    }

    else {

        findings.push({

            type: "safe",

            title:
                "PDF size within expected range",

            description:
                `${formatFileSize(fileSize)} PDF document detected.`

        });

    }


    // -----------------------------------------------------
    // BASIC PDF SIGNATURE CHECK
    // -----------------------------------------------------

    try {

        const headerBuffer =
            await file.slice(0, 5).arrayBuffer();

        const headerBytes =
            new Uint8Array(headerBuffer);

        const headerText =
            new TextDecoder().decode(
                headerBytes
            );


        if (headerText === "%PDF-") {

            findings.push({

                type: "safe",

                title:
                    "Valid PDF signature detected",

                description:
                    "The uploaded file begins with a valid PDF file signature."

            });

        }

        else {

            score += 25;

            findings.push({

                type: "warning",

                title:
                    "Unexpected PDF signature",

                description:
                    "The file is labelled as PDF but its header could not be validated."

            });

        }

    }

    catch (error) {

        findings.push({

            type: "warning",

            title:
                "PDF header could not be inspected",

            description:
                "The browser could not inspect the initial PDF bytes."

        });

    }


    // -----------------------------------------------------
    // FILE TYPE CHECK
    // -----------------------------------------------------

    if (
        file.type ===
        "application/pdf"
    ) {

        findings.push({

            type: "safe",

            title:
                "PDF MIME type confirmed",

            description:
                "The browser reports the uploaded document as application/pdf."

        });

    }


    // -----------------------------------------------------
    // PDF QUALITY STATUS
    // -----------------------------------------------------

    analysisData.quality =
        "Basic PDF screening";


    // -----------------------------------------------------
    // FINAL SCORE
    // -----------------------------------------------------

    score =
        Math.min(
            Math.max(score, 0),
            95
        );


    analysisData.score =
        score;


    analysisData.findings =
        findings;

}


// =========================================================
// FALLBACK
// =========================================================

function createFallbackAnalysis() {

    analysisData.score =
        35;


    analysisData.quality =
        "Unable to determine";


    analysisData.findings = [

        {

            type:
                "warning",

            title:
                "Limited document analysis",

            description:
                "The browser could not extract all available document properties."

        }

    ];

}


// =========================================================
// FILE SIZE FORMATTER
// =========================================================

function formatFileSize(bytes) {

    if (
        bytes < 1024
    ) {

        return bytes + " B";

    }


    if (
        bytes < 1024 * 1024
    ) {

        return (
            (bytes / 1024).toFixed(1)
            +
            " KB"
        );

    }


    return (
        (bytes / (1024 * 1024)).toFixed(2)
        +
        " MB"
    );

}


// =========================================================
// SHOW RESULT
// =========================================================

function showResult() {

    analysisPanel.classList.add(
        "hidden"
    );

    resultPanel.classList.remove(
        "hidden"
    );

    updateRiskResult(
        analysisData.score
    );

    updateIndicators(
        analysisData.findings
    );
// =========================================================
// UPDATE AI FORENSIC RESULTS
// =========================================================

function updateForensicResults(forensicAnalysis) {

    if (!forensicAnalysis) {
        return;
    }

    console.log(
        "Displaying forensic results:",
        forensicAnalysis
    );

    // -------------------------------------------------
    // FORENSIC STATUS
    // -------------------------------------------------

   const statusElement =
    document.getElementById(
        "forensicStatusText"
    );

const statusContainer =
    document.getElementById(
        "forensicStatus"
    );

if (statusElement) {

    statusElement.textContent =
        forensicAnalysis.status;
}

if (statusContainer) {

    statusContainer.classList.remove(
        "safe",
        "warning",
        "danger"
    );

    if (
        forensicAnalysis.status ===
        "LIKELY AUTHENTIC"
    ) {

        statusContainer.classList.add(
            "safe"
        );

    }

    else if (
        forensicAnalysis.status ===
        "SUSPICIOUS"
    ) {

        statusContainer.classList.add(
            "warning"
        );

    }

    else {

        statusContainer.classList.add(
            "danger"
        );
    }
}


    // -------------------------------------------------
    // FORENSIC SUMMARY
    // -------------------------------------------------

    const summaryElement =
        document.getElementById(
            "forensicSummary"
        );

    if (summaryElement) {

        if (
            forensicAnalysis.status ===
            "LIKELY AUTHENTIC"
        ) {

            summaryElement.textContent =
                "No strong forensic anomalies were detected by the available screening checks.";

        }

        else if (
            forensicAnalysis.status ===
            "SUSPICIOUS"
        ) {

            summaryElement.textContent =
                "Some forensic signals require additional document verification.";

        }

        else {

            summaryElement.textContent =
                "Multiple forensic signals require manual investigation.";

        }

    }


    // -------------------------------------------------
    // FORENSIC CHECKS
    // -------------------------------------------------

    const checks =
        forensicAnalysis.checks;

    if (!checks) {
        return;
    }


    updateForensicCard(
        "forensicImage",
        checks.imageManipulation
    );

    updateForensicCard(
        "forensicText",
        checks.textManipulation
    );

    updateForensicCard(
        "forensicCopyPaste",
        checks.copyPaste
    );

    updateForensicCard(
        "forensicLayout",
        checks.layoutAlteration
    );

    updateForensicCard(
        "forensicPhoto",
        checks.photoReplacement
    );

    updateForensicCard(
        "forensicMetadata",
        checks.metadataAnomaly
    );

}
    // =====================================================
    // AI FORENSIC ANALYSIS
    // =====================================================

    updateForensicResults(
        analysisData.forensicAnalysis
    );

}


// =========================================================
// PREMIUM RISK SCORE & RISK METER
// =========================================================

function updateRiskMeter(score) {

    const riskScore =
        document.getElementById("riskScore");

    const riskFill =
        document.getElementById("riskFill");

    const riskLevel =
        document.getElementById("riskLevel");

    if (!riskScore || !riskFill) {
        return;
    }

    // Keep score between 0 and 100
    score = Math.max(
        0,
        Math.min(
            100,
            Math.round(score)
        )
    );


    // =====================================================
    // ANIMATE SCORE NUMBER
    // =====================================================

    let current = 0;

    const duration = 900;

    const startTime = performance.now();

    function animateScore(time) {

        const progress =
            Math.min(
                (time - startTime) / duration,
                1
            );

        current =
            Math.round(
                progress * score
            );

        riskScore.textContent =
            current;

        if (progress < 1) {

            requestAnimationFrame(
                animateScore
            );

        }

    }

    requestAnimationFrame(
        animateScore
    );


    // =====================================================
    // UPDATE RISK METER
    // =====================================================

    setTimeout(function () {

        riskFill.style.width =
            score + "%";

    }, 100);


    // =====================================================
    // RISK LEVEL
    // =====================================================

    let level = "LOW RISK";

    if (score >= 61) {

        level = "HIGH RISK";

    } else if (score >= 31) {

        level = "MEDIUM RISK";

    }


    if (riskLevel) {

        riskLevel.textContent =
            level;

        riskLevel.classList.remove(
            "low",
            "medium",
            "high"
        );


        if (score >= 61) {

            riskLevel.classList.add(
                "high"
            );

        } else if (score >= 31) {

            riskLevel.classList.add(
                "medium"
            );

        } else {

            riskLevel.classList.add(
                "low"
            );

        }

    }


    // =====================================================
    // RISK METER STATE
    // =====================================================

    riskFill.classList.remove(
        "low",
        "medium",
        "high"
    );


    if (score >= 61) {

        riskFill.classList.add(
            "high"
        );

    } else if (score >= 31) {

        riskFill.classList.add(
            "medium"
        );

    } else {

        riskFill.classList.add(
            "low"
        );

    }

}


// =========================================================
// IDSHIELD AI — EXPLAINABLE SCREENING INDICATORS
// =========================================================

function updateIndicators(findings) {

    const indicatorElements = [
        document.getElementById("indicator1"),
        document.getElementById("indicator2"),
        document.getElementById("indicator3"),
        document.getElementById("indicator4")
    ];


    // =====================================================
    // DEFAULT INDICATORS
    // =====================================================

    const indicators = [

        {
            type: "warning",
            title: "Image Quality",
            description:
                "Document image quality requires additional verification."
        },

        {
            type: "warning",
            title: "Visual Consistency",
            description:
                "Visual consistency requires additional verification."
        },

        {
            type: "safe",
            title: "Document Structure",
            description:
                "Document structure appears consistent with the available screening checks."
        },

        {
            type: "warning",
            title: "Required Fields",
            description:
                "Required identity fields could not be fully verified."
        }

    ];


    // =====================================================
    // ANALYZE ACTUAL FINDINGS
    // =====================================================

    if (Array.isArray(findings)) {

        findings.forEach(function (finding) {

            if (!finding) {
                return;
            }


            const title =
                String(
                    finding.title || ""
                ).toLowerCase();


            const description =
                finding.description ||
                "Additional verification recommended.";


            const type =
                finding.type || "warning";


            // =================================================
            // IMAGE QUALITY
            // =================================================

            if (
                title.includes("resolution") ||
                title.includes("image quality") ||
                title.includes("image exposure") ||
                title.includes("blur")
            ) {

                indicators[0] = {

                    type:
                        type === "safe"
                            ? "safe"
                            : "warning",

                    title:
                        "Image Quality",

                    description:
                        description

                };

            }


            // =================================================
            // VISUAL CONSISTENCY
            // =================================================

            if (
                title.includes("manipulation") ||
                title.includes("tamper") ||
                title.includes("visual") ||
                title.includes("consistency") ||
                title.includes("alteration")
            ) {

                indicators[1] = {

                    type:
                        type === "safe"
                            ? "safe"
                            : "warning",

                    title:
                        "Visual Consistency",

                    description:
                        description

                };

            }


            // =================================================
            // DOCUMENT STRUCTURE
            // =================================================

            if (
                title.includes("document type") ||
                title.includes("document structure") ||
                title.includes("structure")
            ) {

                indicators[2] = {

                    type:
                        type === "safe"
                            ? "safe"
                            : "warning",

                    title:
                        "Document Structure",

                    description:
                        description

                };

            }


            // =================================================
            // REQUIRED FIELDS
            // =================================================

            if (
                title.includes("required fields") ||
                title.includes("identity fields") ||
                title.includes("fields")
            ) {

                indicators[3] = {

                    type:
                        type === "safe"
                            ? "safe"
                            : "warning",

                    title:
                        "Required Fields",

                    description:
                        description

                };

            }

        });

    }


    // =====================================================
    // UPDATE UI
    // =====================================================

    indicators.forEach(
        function (indicator, index) {

            const element =
                indicatorElements[index];


            if (!element) {
                return;
            }


            const icon =
                element.querySelector(
                    ".indicator-icon"
                );


            const title =
                element.querySelector(
                    "strong"
                );


            const description =
                element.querySelector(
                    "p"
                );


            // -------------------------------------------------
            // REMOVE OLD STATE
            // -------------------------------------------------

            element.classList.remove(
                "safe",
                "warning",
                "danger"
            );


            if (icon) {

                icon.classList.remove(
                    "safe"
                );

            }


            // -------------------------------------------------
            // TEXT
            // -------------------------------------------------

            if (title) {

                title.textContent =
                    indicator.title;

            }


            if (description) {

                description.textContent =
                    indicator.description;

            }


            // -------------------------------------------------
            // STATE
            // -------------------------------------------------

            if (
                indicator.type === "safe"
            ) {

                element.classList.add(
                    "safe"
                );


                if (icon) {

                    icon.textContent =
                        "✓";

                    icon.classList.add(
                        "safe"
                    );

                }

            }

            else if (
                indicator.type === "danger"
            ) {

                element.classList.add(
                    "danger"
                );


                if (icon) {

                    icon.textContent =
                        "✕";

                }

            }

            else {

                element.classList.add(
                    "warning"
                );


                if (icon) {

                    icon.textContent =
                        "⚠";

                }

            }

        }
    );

}






// =========================================================
// SCORE ANIMATION
// =========================================================

function animateScore(target) {

    const element =
        document.getElementById(
            "scoreNumber"
        );


    let current = 0;


    const animation =
        setInterval(
            function () {

                current++;


                element.textContent =
                    current;


                if (
                    current >= target
                ) {

                    clearInterval(
                        animation
                    );

                }

            },
            15
        );

}


// =========================================================
// NEW VERIFICATION
// =========================================================

function newVerification() {

    documentInput.value =
        "";


    currentFile =
        null;


    resultPanel.classList.add(
        "hidden"
    );


    analysisPanel.classList.add(
        "hidden"
    );


    documentPanel.classList.add(
        "hidden"
    );


    uploadContainer.classList.remove(
        "hidden"
    );


    window.scrollTo({

        top:
            document.getElementById(
                "verification"
            ).offsetTop - 100,

        behavior:
            "smooth"

    });

}


// =========================================================
// GENERATE REPORT
// =========================================================

function generateReport() {

    // Check PDF library
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("PDF generator could not be loaded. Please refresh the page.");
        return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    // -------------------------------------------------
    // BASIC INFORMATION
    // -------------------------------------------------

    const file = analysisData.file;
    const score = analysisData.score ?? 0;

    let status = "LOW RISK";

    if (score >= 70) {
        status = "HIGH RISK";
    } else if (score >= 40) {
        status = "MEDIUM RISK";
    }

    const documentType =
        analysisData.parsedDocument?.documentType ||
        "Unknown";

    const name =
    analysisData.parsedDocument?.name ||
    analysisData.parsedDocument?.fullName ||
    analysisData.parsedDocument?.holderName ||
    analysisData.parsedDocument?.extractedName ||
    document.getElementById("extractedName")?.textContent ||
    "Not detected";

    const dob =
        analysisData.parsedDocument?.dob ||
        "Not detected";

    const documentNumber =
        analysisData.parsedDocument?.documentNumber ||
        "Not detected";

    const address =
        analysisData.parsedDocument?.address ||
        "Not detected";

    const ocrConfidence =
        analysisData.ocr?.confidence ??
        analysisData.ocrResult?.confidence ??
        0;

    // -------------------------------------------------
    // HEADER
    // -------------------------------------------------

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("IDShield AI", 20, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
        "Identity & Document Verification Report",
        20,
        28
    );

    doc.line(20, 33, 190, 33);

    // -------------------------------------------------
    // REPORT DETAILS
    // -------------------------------------------------

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Verification Summary", 20, 45);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(
        `File: ${file?.name || "Unknown"}`,
        20,
        55
    );

    doc.text(
        `Document Type: ${documentType}`,
        20,
        63
    );

    doc.text(
        `Risk Score: ${score}/100`,
        20,
        71
    );

    doc.text(
        `Risk Status: ${status}`,
        20,
        79
    );

    doc.text(
        `OCR Confidence: ${ocrConfidence}%`,
        20,
        87
    );

    // -------------------------------------------------
    // EXTRACTED INFORMATION
    // -------------------------------------------------

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Extracted Information", 20, 102);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`Name: ${name}`, 20, 112);
    doc.text(`Date of Birth: ${dob}`, 20, 120);
    doc.text(
        `Document Number: ${documentNumber}`,
        20,
        128
    );

    const addressLines =
        doc.splitTextToSize(
            `Address: ${address}`,
            165
        );

    doc.text(addressLines, 20, 136);

    let currentY =
        136 + (addressLines.length * 5) + 10;

    // -------------------------------------------------
    // SCREENING FINDINGS
    // -------------------------------------------------

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    doc.text(
        "Screening Findings",
        20,
        currentY
    );

    currentY += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const findings =
        analysisData.findings || [];

    if (findings.length === 0) {

        doc.text(
            "No significant screening findings were detected.",
            20,
            currentY
        );

        currentY += 8;

    } else {

        findings.slice(0, 10).forEach(
            (finding, index) => {

                const title =
                    finding.title ||
                    `Finding ${index + 1}`;

                const description =
                    finding.description ||
                    "";

                const text =
                    `• ${title}: ${description}`;

                const lines =
                    doc.splitTextToSize(
                        text,
                        165
                    );

                // New page if necessary
                if (currentY > 270) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.text(
                    lines,
                    20,
                    currentY
                );

                currentY +=
                    (lines.length * 5) + 4;
            }
        );
    }

    // -------------------------------------------------
    // FORENSIC ANALYSIS
    // -------------------------------------------------

    if (currentY > 250) {
        doc.addPage();
        currentY = 20;
    }

    currentY += 5;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    doc.text(
        "AI Forensic Analysis",
        20,
        currentY
    );

    currentY += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const forensic =
        analysisData.forensicAnalysis;

    if (forensic) {

        doc.text(
            `Forensic Status: ${forensic.status || "Not available"}`,
            20,
            currentY
        );

        currentY += 7;

        if (forensic.checks) {

            Object.entries(
                forensic.checks
            ).forEach(
                ([key, check]) => {

                    if (currentY > 270) {
                        doc.addPage();
                        currentY = 20;
                    }

                    const label =
                        key
                            .replace(
                                /([A-Z])/g,
                                " $1"
                            )
                            .replace(
                                /^./,
                                c => c.toUpperCase()
                            );

                    const result =
                        check?.status ||
                        "Not available";

                    doc.text(
                        `${label}: ${result}`,
                        20,
                        currentY
                    );

                    currentY += 6;
                }
            );
        }

    } else {

        doc.text(
            "Forensic analysis data not available.",
            20,
            currentY
        );

        currentY += 8;
    }

    // -------------------------------------------------
    // DISCLAIMER
    // -------------------------------------------------

    if (currentY > 245) {
        doc.addPage();
        currentY = 20;
    }

    currentY += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");

    const disclaimer =
        "This report is generated by the IDShield AI SIH 2026 prototype. " +
        "The browser-based screening system provides risk indicators " +
        "and does not independently prove that an identity document is " +
        "genuine or forged. Manual verification is recommended.";

    const disclaimerLines =
        doc.splitTextToSize(
            disclaimer,
            165
        );

    doc.text(
        disclaimerLines,
        20,
        currentY
    );

    // -------------------------------------------------
    // FOOTER
    // -------------------------------------------------

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(
        "IDShield AI • SIH 2026 Prototype",
        20,
        285
    );

    // -------------------------------------------------
    // DOWNLOAD PDF
    // -------------------------------------------------

    doc.save(
        "IDShield-AI-Verification-Report.pdf"
    );
}


// =========================================================
// NAVIGATION
// =========================================================

function scrollToUpload() {

    document
        .getElementById(
            "verification"
        )
        .scrollIntoView({

            behavior:
                "smooth"

        });

}


function scrollToHowItWorks() {

    document
        .getElementById(
            "how-it-works"
        )
        .scrollIntoView({

            behavior:
                "smooth"

        });

}


// =========================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// =========================================================

window.analyzeDocument =
    analyzeDocument;

window.removeDocument =
    removeDocument;

window.newVerification =
    newVerification;

window.generateReport =
    generateReport;

window.scrollToUpload =
    scrollToUpload;

window.scrollToHowItWorks =
    scrollToHowItWorks;
