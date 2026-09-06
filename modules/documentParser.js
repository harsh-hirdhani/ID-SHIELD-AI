// =========================================================
// IDSHIELD AI
// Document Intelligence Parser
// One-Pass OCR Identity Field Extraction
// =========================================================

export function parseDocumentText(text) {

    // =====================================================
    // EMPTY OCR
    // =====================================================

    if (!text || !text.trim()) {

        return {
            name: null,
            dateOfBirth: null,
            documentNumber: null,
            address: null,
            documentType: null,
            fieldsFound: 0,

            findings: [{
                type: "warning",
                title: "No document fields detected",
                description:
                    "OCR did not provide enough readable text to extract identity fields."
            }]
        };

    }


    // =====================================================
    // NORMALIZE OCR
    // =====================================================

    const cleanText =
        text
            .replace(/\r/g, "\n")
            .replace(/\t/g, " ")
            .replace(/[|]/g, " ")
            .replace(/[ ]+/g, " ")
            .trim();


    const lines =
        cleanText
            .split("\n")
            .map(line => cleanField(line))
            .filter(Boolean);


    const normalizedText =
        cleanText
            .replace(/\s+/g, " ")
            .trim();


    // =====================================================
    // OCR NORMALIZED COPY
    // =====================================================

    const searchableText =
        normalizedText
            .replace(/A4DH4AR/gi, "AADHAAR")
            .replace(/AADHAR/gi, "AADHAAR")
            .replace(/A4DHAR/gi, "AADHAAR")
            .replace(/P4N/gi, "PAN")
            .replace(/D0B/gi, "DOB");


    let name = null;
    let dateOfBirth = null;
    let documentNumber = null;
    let address = null;
    let documentType = null;


   // =====================================================
// DOCUMENT TYPE — MULTI-DOCUMENT DETECTION
// =====================================================


const documentSignals = {

    aadhaar: 0,
    passport: 0,
    drivingLicence: 0,
    pan: 0

};


// =====================================================
// AADHAAR SIGNALS
// =====================================================

if (
    /\baadhaar\b/i.test(searchableText)
) {
    documentSignals.aadhaar += 5;
}

if (
    /\baadhar\b/i.test(normalizedText)
) {
    documentSignals.aadhaar += 4;
}

if (
    /unique\s+identification/i.test(searchableText)
) {
    documentSignals.aadhaar += 3;
}

if (
    /\buidai\b/i.test(searchableText)
) {
    documentSignals.aadhaar += 3;
}


// =====================================================
// PASSPORT SIGNALS
// =====================================================

if (
    /\bpassport\b/i.test(searchableText)
) {
    documentSignals.passport += 5;
}

if (
    /\bpassport\s*(?:no|number)\b/i.test(searchableText)
) {
    documentSignals.passport += 3;
}

if (
    /\bnationality\b/i.test(searchableText)
) {
    documentSignals.passport += 1;
}

if (
    /\bplace\s+of\s+birth\b/i.test(searchableText)
) {
    documentSignals.passport += 1;
}


// =====================================================
// DRIVING LICENCE SIGNALS
// =====================================================

if (
    /driving\s*licen[cs]e/i.test(searchableText)
) {
    documentSignals.drivingLicence += 5;
}

if (
    /driver'?s?\s*licen[cs]e/i.test(searchableText)
) {
    documentSignals.drivingLicence += 4;
}

if (
    /\bDL\s*(?:NO|NUMBER)\b/i.test(searchableText)
) {
    documentSignals.drivingLicence += 3;
}

if (
    /\bvalid\s+(?:from|upto|until)\b/i.test(searchableText)
) {
    documentSignals.drivingLicence += 1;
}


// =====================================================
// PAN SIGNALS
// =====================================================

if (
    /\bPAN\b/i.test(searchableText)
) {
    documentSignals.pan += 5;
}

if (
    /\bPAN\s*CARD\b/i.test(searchableText)
) {
    documentSignals.pan += 4;
}

if (
    /income\s*tax/i.test(searchableText)
) {
    documentSignals.pan += 2;
}

if (
    /\bPermanent\s+Account\s+Number\b/i.test(searchableText)
) {
    documentSignals.pan += 4;
}


// =====================================================
// FIND HIGHEST CONFIDENCE TYPE
// =====================================================

const documentTypeScores = [

    {
        type: "Aadhaar",
        score: documentSignals.aadhaar
    },

    {
        type: "Passport",
        score: documentSignals.passport
    },

    {
        type: "Driving Licence",
        score: documentSignals.drivingLicence
    },

    {
        type: "PAN Card",
        score: documentSignals.pan
    }

];


documentTypeScores.sort(
    (a, b) => b.score - a.score
);


// =====================================================
// SELECT DOCUMENT TYPE
// =====================================================

if (
    documentTypeScores[0].score >= 3
) {

    documentType =
        documentTypeScores[0].type;

}

else {

    documentType =
        "Identity Document";

}


// =====================================================
// DOCUMENT-SPECIFIC EXTRACTION MODE
// =====================================================

let extractionMode =
    "generic";


switch (documentType) {

    case "Aadhaar":

        extractionMode =
            "aadhaar";

        break;


    case "Passport":

        extractionMode =
            "passport";

        break;


    case "Driving Licence":

        extractionMode =
            "drivingLicence";

        break;


    case "PAN Card":

        extractionMode =
            "pan";

        break;


    default:

        extractionMode =
            "generic";

}

    // =====================================================
    // DATE OF BIRTH
    // =====================================================

    const dobPatterns = [

        // DOB: 07/08/1985
        /(?:DOB|D\.O\.B|DATE\s*OF\s*BIRTH|BIRTH\s*DATE)\s*[:.\-]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,

        // DOB 07 08 1985
        /(?:DOB|D\.O\.B|DATE\s*OF\s*BIRTH|BIRTH\s*DATE)[^\d]{0,20}(\d{1,2}\s+\d{1,2}\s+\d{2,4})/i,

        // DOB: 07-08-1985 with OCR spacing
        /(?:D\s*O\s*B|D0B)\s*[:.\-]?\s*(\d{1,2}\s*[\/.\-]\s*\d{1,2}\s*[\/.\-]\s*\d{2,4})/i

    ];


    for (const pattern of dobPatterns) {

        const match =
            searchableText.match(pattern);

        if (match) {

            const possibleDob =
                cleanField(match[1]);

            if (isValidDate(possibleDob)) {

                dateOfBirth =
                    normalizeDate(possibleDob);

                break;

            }

        }

    }


    // =====================================================
    // DOCUMENT NUMBER
    // =====================================================

    const documentPatterns = [

        // Aadhaar:
        // 3076 6146 3849
        /(?:YOUR\s*)?AADHAAR\s*(?:NO|NUMBER|NUM)?\s*[:.\-]?\s*((?:\d[\s-]*){12})/i,

        /(?:YOUR\s*)?AADHAR\s*(?:NO|NUMBER|NUM)?\s*[:.\-]?\s*((?:\d[\s-]*){12})/i,

        // Generic ID
        /(?:ID\s*NO|ID\s*NUMBER|DOCUMENT\s*NO|DOCUMENT\s*NUMBER)\s*[:.\-]?\s*([A-Z0-9][A-Z0-9\s-]{4,})/i,

        // Passport
        /PASSPORT\s*(?:NO|NUMBER)?\s*[:.\-]?\s*([A-Z0-9]{6,})/i,

        // Driving Licence
        /(?:DRIVING\s*LICEN[CS]E|DL)\s*(?:NO|NUMBER)?\s*[:.\-]?\s*([A-Z0-9\s-]{6,})/i,

        // PAN
        /PAN\s*(?:CARD)?\s*(?:NO|NUMBER)?\s*[:.\-]?\s*([A-Z]{5}[0-9]{4}[A-Z])/i

    ];


    for (const pattern of documentPatterns) {

        const match =
            searchableText.match(pattern);

        if (!match) {
            continue;
        }


        const candidate =
            cleanField(match[1]);


        const digitsOnly =
            candidate.replace(/\D/g, "");


        // Aadhaar
        if (digitsOnly.length === 12) {

            documentNumber =
                digitsOnly;

            break;

        }


        // PAN
        if (
            /^[A-Z]{5}[0-9]{4}[A-Z]$/i
                .test(candidate.replace(/\s/g, ""))
        ) {

            documentNumber =
                candidate
                    .replace(/\s/g, "")
                    .toUpperCase();

            break;

        }


        // Other documents
        if (candidate.length >= 5) {

            documentNumber =
                cleanDocumentNumber(candidate);

            break;

        }

    }


    // =====================================================
    // DOCUMENT NUMBER FALLBACK
    // =====================================================
    // Useful when OCR removes "Aadhaar Number" label.
    // Looks for a standalone 12-digit sequence.

    if (!documentNumber) {

        const aadhaarFallback =
            searchableText.match(
                /(?:^|\s)(\d{4}[\s-]\d{4}[\s-]\d{4})(?:\s|$)/
            );

        if (aadhaarFallback) {

            documentNumber =
                aadhaarFallback[1]
                    .replace(/[\s-]/g, "");

        }

    }


    // =====================================================
    // NAME
    // =====================================================

    const namePatterns = [

        // Name: Khalid Husain
        /(?:FULL\s*)?NAME\s*[:.\-]?\s*([A-Za-z][A-Za-z .'-]{2,})/i,

        // Name Khalid Husain
        /(?:FULL\s*)?NAME\s+([A-Za-z][A-Za-z .'-]{2,})/i,

        // Hindi
        /नाम\s*[:.\-]?\s*([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F .'-]{2,})/i,

        // OCR variation
        /(?:CANDIDATE|HOLDER)\s*NAME\s*[:.\-]?\s*([A-Za-z][A-Za-z .'-]{2,})/i

    ];


    for (const pattern of namePatterns) {

        const match =
            normalizedText.match(pattern);

        if (!match) {
            continue;
        }


        const possibleName =
            cleanField(match[1]);


        if (isValidName(possibleName)) {

            name =
                possibleName;

            break;

        }

    }


    // =====================================================
// NAME LINE FALLBACK
// =====================================================
// Detect a likely person's name when OCR does not capture
// the "Name:" label.

if (!name) {

    const badNameWords =
        /aadhaar|aadhar|government|india|uidai|address|dob|date|birth|mobile|phone|email|male|female|year|card|number|unique|identification/i;

    for (let i = 0; i < lines.length; i++) {

        const candidate = cleanField(lines[i]);

        if (!candidate) {
            continue;
        }

        // Skip obvious labels / document information
        if (isRejectedNameLine(candidate)) {
            continue;
        }

        if (badNameWords.test(candidate)) {
            continue;
        }

        // Skip lines containing too many digits
        const digitCount =
            (candidate.match(/\d/g) || []).length;

        if (digitCount > 1) {
            continue;
        }

        // A likely name should contain only letters,
        // spaces, dots, apostrophes or hyphens.
        if (
            !/^[A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F .'-]{2,60}$/
                .test(candidate)
        ) {
            continue;
        }

        if (isValidName(candidate)) {
            name = candidate;
            break;
        }
    }
}


    // =====================================================
    // ADDRESS
    // =====================================================

    const addressPatterns = [

        /(?:ADDRESS|RESIDENTIAL\s*ADDRESS)\s*[:.\-]?\s*(.+?)(?=\s+(?:DOB|D\.O\.B|DATE\s*OF\s*BIRTH|MOBILE|PHONE|EMAIL)\b|$)/i

    ];


    for (const pattern of addressPatterns) {

        const match =
            normalizedText.match(pattern);

        if (match) {

            const possibleAddress =
                cleanAddress(match[1]);


            if (possibleAddress.length >= 5) {

                address =
                    possibleAddress;

                break;

            }

        }

    }


    // =====================================================
    // MULTI-LINE ADDRESS FALLBACK
    // =====================================================

    if (!address) {

        const addressIndex =
            lines.findIndex(line =>
                /^address\b/i.test(line)
            );


        if (addressIndex !== -1) {

            const addressParts = [];


            for (
                let i = addressIndex;
                i < Math.min(
                    lines.length,
                    addressIndex + 6
                );
                i++
            ) {

                const line =
                    lines[i];


                if (
                    i !== addressIndex &&
                    /^(DOB|D\.O\.B|DATE\s*OF\s*BIRTH|MOBILE|PHONE|EMAIL|AADHAAR|PAN|PASSPORT)\b/i
                        .test(line)
                ) {

                    break;

                }


                addressParts.push(line);

            }


            const possibleAddress =
                cleanAddress(
                    addressParts
                        .join(" ")
                        .replace(
                            /^address\s*[:.\-]?\s*/i,
                            ""
                        )
                );


            if (possibleAddress.length >= 5) {

                address =
                    possibleAddress;

            }

        }

    }


    // =====================================================
    // ADDRESS OCR FALLBACK
    // =====================================================

    if (!address) {

        const addressIndex =
            lines.findIndex(line =>
                /address/i.test(line)
            );


        if (addressIndex !== -1) {

            const parts = [];


            for (
                let i = addressIndex;
                i < Math.min(
                    lines.length,
                    addressIndex + 5
                );
                i++
            ) {

                const line =
                    cleanField(lines[i]);


                if (
                    /^(DOB|DATE|DATE OF BIRTH|AADHAAR|PAN|PASSPORT)\b/i
                        .test(line)
                ) {

                    break;

                }


                parts.push(line);

            }


            const possibleAddress =
                cleanAddress(
                    parts
                        .join(" ")
                        .replace(
                            /^address\s*[:.\-]?\s*/i,
                            ""
                        )
                );


            if (possibleAddress.length >= 5) {

                address =
                    possibleAddress;

            }

        }

    }


    // =====================================================
    // FINAL CLEANING
    // =====================================================

    if (
        name &&
        !isValidName(name)
    ) {

        name = null;

    }


    if (documentNumber) {

        documentNumber =
            cleanDocumentNumber(
                documentNumber
            );

    }


    if (
        address &&
        address.length < 5
    ) {

        address = null;

    }


    // =====================================================
    // FIELD COUNT
    // =====================================================
    // Four identity fields:
    // Name
    // Date of Birth
    // Document Number
    // Address
    //
    // Document Type is metadata and is not included
    // in the existing 4-field UI counter.

    const fields = [
        name,
        dateOfBirth,
        documentNumber,
        address
    ];


    const fieldsFound =
        fields.filter(Boolean).length;


    // =====================================================
    // FINDINGS
    // =====================================================

    const findings = [];


    // -----------------------------------------------------
    // DOCUMENT TYPE
    // -----------------------------------------------------

    if (documentType) {

        findings.push({

            type: "safe",

            title:
                "Document type identified",

            description:
                `Detected document type: ${documentType}.`

        });

    }


    // -----------------------------------------------------
    // NAME
    // -----------------------------------------------------

    if (name) {

        findings.push({

            type: "safe",

            title:
                "Name field detected",

            description:
                `Extracted name: ${name}`

        });

    }

    else {

        findings.push({

            type: "warning",

            title:
                "Name field not detected",

            description:
                "A reliable name could not be extracted from the OCR text."

        });

    }


    // -----------------------------------------------------
    // DATE OF BIRTH
    // -----------------------------------------------------

    if (dateOfBirth) {

        findings.push({

            type: "safe",

            title:
                "Date of birth detected",

            description:
                `Detected value: ${dateOfBirth}`

        });

    }

    else {

        findings.push({

            type: "warning",

            title:
                "Date of birth not detected",

            description:
                "A recognizable date-of-birth field was not found."

        });

    }


    // -----------------------------------------------------
    // DOCUMENT NUMBER
    // -----------------------------------------------------

    if (documentNumber) {

        findings.push({

            type: "safe",

            title:
                "Document number detected",

            description:
                "A possible document identifier was extracted."

        });

    }

    else {

        findings.push({

            type: "warning",

            title:
                "Document number not detected",

            description:
                "A recognizable document identifier was not found."

        });

    }


    // -----------------------------------------------------
    // ADDRESS
    // -----------------------------------------------------

    if (address) {

        findings.push({

            type: "safe",

            title:
                "Address detected",

            description:
                "An address field was extracted from the OCR output."

        });

    }

    else {

        findings.push({

            type: "warning",

            title:
                "Address not detected",

            description:
                "A recognizable address field was not found."

        });

    }


    // -----------------------------------------------------
    // REQUIRED FIELDS
    // -----------------------------------------------------

    if (fieldsFound === 4) {

        findings.push({

            type: "safe",

            title:
                "Required Fields",

            description:
                "All 4 expected identity fields were detected."

        });

    }

    else if (fieldsFound > 0) {

        findings.push({

            type: "warning",

            title:
                "Required Fields",

            description:
                `${fieldsFound} of 4 expected identity fields were detected.`

        });

    }

    else {

        findings.push({

            type: "warning",

            title:
                "Required Fields",

            description:
                "No expected identity fields were detected."

        });

    }


    // =====================================================
    // RETURN
    // =====================================================

    return {

        name,

        dateOfBirth,

        documentNumber,

        address,

        documentType,

        fieldsFound,

        findings

    };

}


// =========================================================
// CLEAN FIELD
// =========================================================

function cleanField(value) {

    if (!value) {
        return "";
    }


    return value

        .replace(/\s+/g, " ")

        .replace(/^[|:;,\-]+/, "")

        .replace(/[|;]+$/, "")

        .trim();

}


// =========================================================
// CLEAN DOCUMENT NUMBER
// =========================================================

function cleanDocumentNumber(value) {

    if (!value) {
        return "";
    }


    const cleaned =
        value
            .replace(/[|:]/g, " ")
            .replace(/\s+/g, " ")
            .trim();


    const digitsOnly =
        cleaned.replace(/\D/g, "");


    // Aadhaar
    if (
        digitsOnly.length === 12
    ) {

        return digitsOnly;

    }


    // PAN
    if (
        /^[A-Z]{5}[0-9]{4}[A-Z]$/i
            .test(
                cleaned.replace(/\s/g, "")
            )
    ) {

        return cleaned
            .replace(/\s/g, "")
            .toUpperCase();

    }


    return cleaned;

}


// =========================================================
// CLEAN ADDRESS
// =========================================================

function cleanAddress(value) {

    if (!value) {
        return "";
    }


    return value

        .replace(/\s+/g, " ")

        .replace(/^[|:;,\-]+/, "")

        .replace(/[|;]+$/, "")

        .trim();

}


// =========================================================
// VALIDATE NAME
// =========================================================

function isValidName(value) {

    if (!value) {
        return false;
    }


    const cleaned =
        value.trim();


    if (
        cleaned.length < 3 ||
        cleaned.length > 80
    ) {

        return false;

    }


    // Reject obvious OCR / UI noise
    if (
        /instagram|government|authority|aadhaar|address|dob|date\s*of\s*birth|follow|messages|likes|page|mobile|phone|email|passport|licence|license|pan\s*card/i
            .test(cleaned)
    ) {

        return false;

    }


    // Reject strings containing too many numbers
    const digits =
        (cleaned.match(/\d/g) || []).length;


    if (digits > 1) {
        return false;
    }


    // Name should contain mostly letters
    const letters =
        (
            cleaned.match(
                /[A-Za-z\u0900-\u097F]/g
            ) || []
        ).length;


    if (letters < 3) {
        return false;
    }


    // A likely name normally contains at least
    // one alphabetic word.
    const words =
        cleaned
            .split(/\s+/)
            .filter(Boolean);


    if (words.length === 0) {
        return false;
    }


    return true;

}


// =========================================================
// REJECT BAD NAME FALLBACK LINES
// =========================================================

function isRejectedNameLine(value) {

    if (!value) {
        return true;
    }


    return /^(address|dob|date|date of birth|s\/o|d\/o|w\/o|son|daughter|wife|mobile|phone|email|aadhaar|aadhar|pan|passport|government|india|uidai)$/i
        .test(value);

}


// =========================================================
// DATE VALIDATION
// =========================================================

function isValidDate(value) {

    if (!value) {
        return false;
    }


    const numbers =
        value.match(/\d+/g);


    if (
        !numbers ||
        numbers.length !== 3
    ) {

        return false;

    }


    const day =
        Number(numbers[0]);

    const month =
        Number(numbers[1]);

    const year =
        Number(numbers[2]);


    if (
        day < 1 ||
        day > 31
    ) {

        return false;

    }


    if (
        month < 1 ||
        month > 12
    ) {

        return false;

    }


    if (
        year < 1900 ||
        year > 2100
    ) {

        return false;

    }


    return true;

}


// =========================================================
// NORMALIZE DATE
// =========================================================

function normalizeDate(value) {

    const numbers =
        value.match(/\d+/g);


    if (
        !numbers ||
        numbers.length !== 3
    ) {

        return cleanField(value);

    }


    const day =
        numbers[0].padStart(2, "0");


    const month =
        numbers[1].padStart(2, "0");


    let year =
        numbers[2];


    if (
        year.length === 2
    ) {

        const numericYear =
            Number(year);

        year =
            numericYear >= 30
                ? `19${year}`
                : `20${year}`;

    }


    return `${day}/${month}/${year}`;

}
// =====================================================
// IDSHIELD AI — STEP 2D
// ADVANCED TAMPERING SCREENING
// =====================================================

function runTamperingScreening(data = {}) {

    const {
        image = null,
        ocrText = "",
        confidence = 0,
        documentType = "Identity Document",
        name = null,
        documentNumber = null,
        dateOfBirth = null,
        address = null
    } = data;


    // =====================================================
    // SCREENING SIGNALS
    // =====================================================

    const signals = [];

    let riskScore = 0;


    // =====================================================
    // 1. OCR CONFIDENCE
    // =====================================================

    const numericConfidence =
        Number(confidence) || 0;


    if (numericConfidence > 0 && numericConfidence < 45) {

        riskScore += 25;

        signals.push({
            type: "warning",
            title: "Low OCR Confidence",
            description:
                "The document text could not be read with high confidence."
        });

    }

    else if (
        numericConfidence >= 45 &&
        numericConfidence < 65
    ) {

        riskScore += 12;

        signals.push({
            type: "warning",
            title: "Moderate OCR Confidence",
            description:
                "Some document text may require additional verification."
        });

    }

    else if (numericConfidence >= 65) {

        signals.push({
            type: "safe",
            title: "OCR Quality",
            description:
                "The document text was extracted with reasonable confidence."
        });

    }


    // =====================================================
    // 2. REQUIRED FIELD CHECK
    // =====================================================

    let fieldsFound = 0;

    if (name) fieldsFound++;
    if (documentNumber) fieldsFound++;
    if (dateOfBirth) fieldsFound++;
    if (address) fieldsFound++;


    if (fieldsFound === 0) {

        riskScore += 30;

        signals.push({
            type: "warning",
            title: "Identity Fields Missing",
            description:
                "No expected identity fields were detected."
        });

    }

    else if (fieldsFound < 2) {

        riskScore += 18;

        signals.push({
            type: "warning",
            title: "Incomplete Identity Data",
            description:
                `${fieldsFound} expected identity field(s) were detected.`
        });

    }

    else {

        signals.push({
            type: "safe",
            title: "Identity Fields",
            description:
                `${fieldsFound} expected identity fields were detected.`
        });

    }


    // =====================================================
    // 3. DOCUMENT NUMBER CHECK
    // =====================================================

    if (!documentNumber) {

        riskScore += 15;

        signals.push({
            type: "warning",
            title: "Document Number Missing",
            description:
                "A recognizable document number was not detected."
        });

    }

    else {

        const number =
            String(documentNumber)
                .replace(/\s+/g, "")
                .trim();


        // Very short identifiers are suspicious
        if (number.length < 5) {

            riskScore += 10;

            signals.push({
                type: "warning",
                title: "Unusual Document Number",
                description:
                    "The detected document number appears unusually short."
            });

        }

        else {

            signals.push({
                type: "safe",
                title: "Document Number",
                description:
                    "A recognizable document number was detected."
            });

        }

    }


    // =====================================================
    // 4. OCR TEXT ANOMALY CHECK
    // =====================================================

    const text =
        String(ocrText || "").trim();


    if (text.length > 0) {

        const replacementCharacters =
            (text.match(/[�]/g) || []).length;


        if (replacementCharacters >= 3) {

            riskScore += 12;

            signals.push({
                type: "warning",
                title: "OCR Text Anomaly",
                description:
                    "The OCR output contains several unreadable characters."
            });

        }


        // Excessive repeated characters
        if (/(.)\1{5,}/.test(text)) {

            riskScore += 8;

            signals.push({
                type: "warning",
                title: "Text Pattern Anomaly",
                description:
                    "The OCR text contains an unusual repeated-character pattern."
            });

        }

    }


    // =====================================================
    // 5. DOCUMENT TYPE CHECK
    // =====================================================

    if (
        !documentType ||
        documentType === "Identity Document"
    ) {

        riskScore += 8;

        signals.push({
            type: "warning",
            title: "Document Type Uncertain",
            description:
                "The document could not be confidently classified."
        });

    }

    else {

        signals.push({
            type: "safe",
            title: "Document Classification",
            description:
                `${documentType} was identified from the document content.`
        });

    }


    // =====================================================
    // 6. IMAGE QUALITY CHECK
    // =====================================================

    if (image) {

        const width =
            image.naturalWidth ||
            image.width ||
            0;

        const height =
            image.naturalHeight ||
            image.height ||
            0;


        if (
            width > 0 &&
            height > 0 &&
            (width < 500 || height < 300)
        ) {

            riskScore += 15;

            signals.push({
                type: "warning",
                title: "Low Image Resolution",
                description:
                    "The uploaded document image has relatively low resolution."
            });

        }

        else if (
            width > 0 &&
            height > 0
        ) {

            signals.push({
                type: "safe",
                title: "Image Resolution",
                description:
                    "The document image has sufficient resolution for screening."
            });

        }

    }


    // =====================================================
    // 7. NORMALIZE SCORE
    // =====================================================

    riskScore =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(riskScore)
            )
        );


    // =====================================================
    // RISK LEVEL
    // =====================================================

    let riskLevel = "Low";

    if (riskScore >= 60) {

        riskLevel = "High";

    }

    else if (riskScore >= 30) {

        riskLevel = "Medium";

    }


    // =====================================================
    // FINAL RESULT
    // =====================================================

    return {

        score: riskScore,

        level: riskLevel,

        fieldsFound,

        documentType,

        signals,

        disclaimer:
            "This screening identifies potential anomalies and does not independently prove document fraud."

    };

}


// =====================================================
// MAKE AVAILABLE TO OTHER MODULES
// =====================================================

if (
    typeof window !== "undefined"
) {

    window.runTamperingScreening =
        runTamperingScreening;

}
