import base64
import json
import logging
import traceback
from datetime import datetime, timezone
from typing import Optional

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None
    logger_init = logging.getLogger(__name__)
    logger_init.warning("PyMuPDF (fitz) not available - PDF processing will fail")

import openai

from app.core.config import settings
from app.db.supabase_client import supabase_service

logger = logging.getLogger(__name__)

# Constants
MODEL_VERSION = "gpt-4o"
MAX_TOKENS = 1500

SYSTEM_PROMPT = """You are a financial risk analyst for a South African school fee affordability assessment tool.
You will receive images of a bank statement. Analyse them and return ONLY a valid JSON object — no preamble, no markdown, no explanation.
The analysis must be objective, factual, and derived only from the transactions visible in the document."""

USER_PROMPT = """Analyse this bank statement and return a JSON object with exactly this structure:
{
  "is_valid_bank_statement": true,
  "bank_name": "string or null",
  "statement_period": { "from": "YYYY-MM", "to": "YYYY-MM" },
  "account_holder": "string or null",
  "monthly_income_estimate": number,
  "monthly_expense_estimate": number,
  "monthly_surplus": number,
  "risk_score": number (0=lowest risk, 100=highest risk),
  "flags": ["gambling", "irregular_income", "large_cash_withdrawals", "nsf_fees", "salary_deductions", "multiple_loans"],
  "spending_categories": {
    "food_groceries": number,
    "transport": number,
    "utilities": number,
    "entertainment": number,
    "education": number,
    "loan_repayments": number,
    "gambling": number,
    "other": number
  },
  "ai_summary": "2-3 sentence plain English summary of financial health and affordability",
  "confidence": "high" | "medium" | "low"
}
Only include flags that are genuinely present. Set is_valid_bank_statement to false if this does not appear to be a bank statement."""


class BankStatementService:
    def __init__(self):
        if settings.openai_api_key:
            self.openai_client = openai.OpenAI(api_key=settings.openai_api_key)
        else:
            self.openai_client = None

    def _pdf_bytes_to_base64_images(self, pdf_bytes: bytes) -> list[str]:
        """Converts PDF bytes into a list of base64-encoded PNG images (one per page)."""
        if fitz is None:
            raise RuntimeError(
                "PyMuPDF is not installed. Please ensure pymupdf is in requirements.txt "
                "and install it with: pip install pymupdf"
            )
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        base64_images = []
        for page in doc:
            pix = page.get_pixmap()
            img_bytes = pix.tobytes("png")
            b64 = base64.b64encode(img_bytes).decode("utf-8")
            base64_images.append(b64)
        return base64_images

    def _fetch_file_from_uploaded_files(self, application_id: str, file_id: str) -> tuple[str, str]:
        """
        Looks up the file's bucket_name and file_path from the uploaded_files JSONB array.

        The uploaded_files table stores one row per application with a JSONB 'files' array.
        Each element has an 'id' field matching the logical file_id.

        Returns:
            (bucket_name, file_path)

        Raises:
            Exception if the record or file entry is not found.
        """
        result = supabase_service.table("uploaded_files").select("files").eq(
            "application_id", application_id
        ).execute()

        if not result.data or len(result.data) == 0:
            raise Exception(
                f"No uploaded_files record found for application_id: {application_id}"
            )

        files_array = result.data[0].get("files") or []
        for file_entry in files_array:
            entry_id = file_entry.get("id") or file_entry.get("fileId")
            if entry_id == file_id:
                bucket_name = file_entry.get("bucket_name") or file_entry.get("bucketName", "bank_statements")
                file_path = file_entry.get("file_path") or file_entry.get("filePath")
                if not file_path:
                    raise Exception(
                        f"file_path missing for file_id {file_id} in application {application_id}"
                    )
                return bucket_name, file_path

        raise Exception(
            f"file_id {file_id} not found in uploaded_files for application_id: {application_id}"
        )

    def analyse_bank_statement(self, application_id: str, file_id: str, user_id: str) -> None:
        """
        Main entry point called by the background task.

        Steps:
        1. Insert a processing record into bank_statement_analyses
        2. Fetch PDF bytes from Supabase Storage via uploaded_files JSONB metadata
        3. Convert PDF pages to base64 PNG images
        4. Call OpenAI gpt-4o with vision
        5. Parse JSON response and update the DB record to complete/error
        """
        if not supabase_service:
            logger.error("Supabase service client not initialized.")
            return

        if not self.openai_client:
            logger.error("OpenAI API key not configured.")
            return

        # Step 1: Write a processing record
        analysis_id: Optional[str] = None
        try:
            insert_result = supabase_service.table("bank_statement_analyses").insert({
                "application_id": application_id,
                "file_id": file_id,
                "status": "processing",
                "model_version": MODEL_VERSION
            }).execute()

            if insert_result.data and len(insert_result.data) > 0:
                analysis_id = insert_result.data[0]["id"]
            else:
                logger.error("Failed to insert processing record into bank_statement_analyses.")
                return

        except Exception as e:
            logger.error(f"Failed to create processing record: {e}")
            return

        try:
            # Step 2: Resolve file location from uploaded_files JSONB array
            bucket_name, file_path = self._fetch_file_from_uploaded_files(application_id, file_id)

            # Step 3: Download PDF bytes from Supabase Storage
            file_response = supabase_service.storage.from_(bucket_name).download(file_path)

            # Step 4: Convert PDF to base64 images (one per page)
            base64_images = self._pdf_bytes_to_base64_images(file_response)

            if not base64_images:
                raise Exception("Could not extract any images from the PDF.")

            # Step 5: Build and send OpenAI request
            messages = [
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": USER_PROMPT
                        }
                    ]
                }
            ]

            # Append each page as an image_url block
            for b64 in base64_images:
                messages[1]["content"].append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{b64}"
                    }
                })

            response = self.openai_client.chat.completions.create(
                model=MODEL_VERSION,
                max_tokens=MAX_TOKENS,
                response_format={"type": "json_object"},
                messages=messages
            )

            # Step 6: Parse JSON response
            response_text = response.choices[0].message.content
            try:
                result_json = json.loads(response_text)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse OpenAI JSON response: {response_text}")
                raise Exception(f"AI returned invalid JSON: {e}")

            # Step 7: Evaluate validity
            is_valid = result_json.get("is_valid_bank_statement")
            if is_valid is False:
                supabase_service.table("bank_statement_analyses").update({
                    "status": "error",
                    "error_message": "Document does not appear to be a bank statement",
                    "result_json": result_json
                }).eq("id", analysis_id).execute()
                return

            # Step 8: Handle low-confidence flag
            confidence = result_json.get("confidence")
            flags = result_json.get("flags") or []
            if confidence == "low" and "low_confidence" not in flags:
                flags.append("low_confidence")

            risk_score = result_json.get("risk_score")
            ai_summary = result_json.get("ai_summary")

            # Step 9: Write complete record
            supabase_service.table("bank_statement_analyses").update({
                "status": "complete",
                "result_json": result_json,
                "risk_score": risk_score,
                "flags": flags,
                "ai_summary": ai_summary,
                "analysed_at": datetime.now(timezone.utc).isoformat(),
                "model_version": MODEL_VERSION,
            }).eq("id", analysis_id).execute()

            logger.info(
                f"Bank statement analysis complete for application={application_id}, "
                f"file={file_id}, risk_score={risk_score}"
            )

        except Exception as e:
            logger.error(f"Error during bank statement analysis: {traceback.format_exc()}")
            if analysis_id:
                try:
                    supabase_service.table("bank_statement_analyses").update({
                        "status": "error",
                        "error_message": str(e)
                    }).eq("id", analysis_id).execute()
                except Exception as update_err:
                    logger.error(f"Failed to update error status for {analysis_id}: {update_err}")


# Singleton instance
bank_statement_service = BankStatementService()