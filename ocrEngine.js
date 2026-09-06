// =========================================================
// IDSHIELD AI
// Real OCR Engine
// =========================================================

export async function extractTextFromImage(file) {

    if (!file) {
        throw new Error("No document provided.");
    }

    if (!file.type.startsWith("image/")) {

        return {
            success: false,
            text: "",
            confidence: 0,
            message:
                "OCR currently supports image documents."
        };

    }


    // Check that Tesseract loaded correctly

    if (
        typeof Tesseract === "undefined"
    ) {

        return {
            success: false,
            text: "",
            confidence: 0,
            message:
                "OCR engine could not be loaded."
        };

    }


    try {

        const result =
            await Tesseract.recognize(
                file,
                "eng",
                {

                    logger: function (info) {

                        console.log(
                            "OCR:",
                            info.status,
                            info.progress
                        );

                    }

                }
            );


        const text =
            result.data.text.trim();


        const confidence =
            Number(
                result.data.confidence.toFixed(1)
            );


        if (!text) {

            return {
                success: false,
                text: "",
                confidence: confidence,
                message:
                    "No readable text was detected."
            };

        }


        return {

            success: true,

            text: text,

            confidence: confidence,

            message:
                "Text successfully extracted from the document."

        };


    } catch (error) {

        console.error(
            "OCR error:",
            error
        );


        return {

            success: false,

            text: "",

            confidence: 0,

            message:
                "OCR processing failed. Please try a clearer document image."

        };

    }

}