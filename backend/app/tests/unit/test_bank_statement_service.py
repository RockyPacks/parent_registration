"""
Unit tests for BankStatementService.

Covers:
- Happy path: valid bank statement → complete DB record
- Invalid document: AI says not a bank statement → error record
- AI API failure: OpenAI raises exception → error record
- Supabase file fetch failure: storage.download raises → error record
- Low confidence: result saved with 'low_confidence' appended to flags
"""
import json
from unittest.mock import patch, MagicMock, call

import pytest

from app.services.bank_statement_service import bank_statement_service, MODEL_VERSION


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_supabase():
    with patch("app.services.bank_statement_service.supabase_service") as mock:
        yield mock


@pytest.fixture
def mock_openai():
    with patch.object(bank_statement_service, "openai_client") as mock:
        yield mock


@pytest.fixture
def mock_fitz():
    with patch("app.services.bank_statement_service.fitz") as mock:
        mock_doc = MagicMock()
        mock_page = MagicMock()
        mock_pixmap = MagicMock()
        mock_pixmap.tobytes.return_value = b"fake_png_bytes"
        mock_page.get_pixmap.return_value = mock_pixmap
        mock_doc.__iter__.return_value = [mock_page]
        mock.open.return_value = mock_doc
        yield mock


def _make_insert_response(analysis_id: str = "test_analysis_id") -> MagicMock:
    """Helper: build a mock Supabase insert response."""
    resp = MagicMock()
    resp.data = [{"id": analysis_id}]
    return resp


def _make_files_select_response(
    file_id: str = "file_1",
    bucket: str = "bank_statements",
    file_path: str = "path/to/file.pdf",
    doc_type: str = "bank_statement",
) -> MagicMock:
    """Helper: build a mock uploaded_files select response."""
    resp = MagicMock()
    resp.data = [{
        "files": [{
            "id": file_id,
            "bucket_name": bucket,
            "file_path": file_path,
            "document_type": doc_type,
        }]
    }]
    return resp


def _make_openai_response(payload: dict) -> MagicMock:
    """Helper: build a mock OpenAI chat completion response."""
    completion = MagicMock()
    choice = MagicMock()
    choice.message.content = json.dumps(payload)
    completion.choices = [choice]
    return completion


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_analyse_bank_statement_happy_path(mock_supabase, mock_openai, mock_fitz):
    """Valid bank statement → status=complete with all fields populated."""
    mock_supabase.table().insert().execute.return_value = _make_insert_response()
    mock_supabase.table().select().eq().execute.return_value = _make_files_select_response()
    mock_supabase.storage.from_().download.return_value = b"mock_pdf_bytes"
    mock_openai.chat.completions.create.return_value = _make_openai_response({
        "is_valid_bank_statement": True,
        "risk_score": 45,
        "flags": ["gambling"],
        "ai_summary": "Summary text",
        "confidence": "high"
    })

    bank_statement_service.analyse_bank_statement("app_1", "file_1", "user_1")

    # Verify processing record was inserted
    mock_supabase.table().insert.assert_called_with({
        "application_id": "app_1",
        "file_id": "file_1",
        "status": "processing",
        "model_version": MODEL_VERSION
    })

    # Verify OpenAI was called
    mock_openai.chat.completions.create.assert_called_once()

    # Verify update was called with complete status and all expected fields
    update_args = mock_supabase.table().update.call_args[0][0]
    assert update_args["status"] == "complete"
    assert update_args["risk_score"] == 45
    assert update_args["flags"] == ["gambling"]
    assert update_args["ai_summary"] == "Summary text"
    assert update_args["model_version"] == MODEL_VERSION
    assert "analysed_at" in update_args


def test_analyse_bank_statement_invalid_document(mock_supabase, mock_openai, mock_fitz):
    """AI returns is_valid_bank_statement=False → status=error with descriptive message."""
    mock_supabase.table().insert().execute.return_value = _make_insert_response()
    mock_supabase.table().select().eq().execute.return_value = _make_files_select_response()
    mock_supabase.storage.from_().download.return_value = b"mock_pdf_bytes"
    mock_openai.chat.completions.create.return_value = _make_openai_response({
        "is_valid_bank_statement": False
    })

    bank_statement_service.analyse_bank_statement("app_1", "file_1", "user_1")

    update_args = mock_supabase.table().update.call_args[0][0]
    assert update_args["status"] == "error"
    assert update_args["error_message"] == "Document does not appear to be a bank statement"


def test_analyse_bank_statement_api_failure(mock_supabase, mock_openai, mock_fitz):
    """OpenAI API raises → status=error with exception message."""
    mock_supabase.table().insert().execute.return_value = _make_insert_response()
    mock_supabase.table().select().eq().execute.return_value = _make_files_select_response()
    mock_supabase.storage.from_().download.return_value = b"mock_pdf_bytes"
    mock_openai.chat.completions.create.side_effect = Exception("API connection failed")

    bank_statement_service.analyse_bank_statement("app_1", "file_1", "user_1")

    update_args = mock_supabase.table().update.call_args[0][0]
    assert update_args["status"] == "error"
    assert "API connection failed" in update_args["error_message"]


def test_analyse_bank_statement_supabase_fetch_failure(mock_supabase, mock_openai, mock_fitz):
    """Supabase storage.download raises → status=error, no unhandled exception."""
    mock_supabase.table().insert().execute.return_value = _make_insert_response()
    mock_supabase.table().select().eq().execute.return_value = _make_files_select_response()
    mock_supabase.storage.from_().download.side_effect = Exception("Storage unavailable")

    # Should not raise — all errors are caught and written to DB
    bank_statement_service.analyse_bank_statement("app_1", "file_1", "user_1")

    update_args = mock_supabase.table().update.call_args[0][0]
    assert update_args["status"] == "error"
    assert "Storage unavailable" in update_args["error_message"]


def test_analyse_bank_statement_file_not_found_in_jsonb(mock_supabase, mock_openai, mock_fitz):
    """file_id not found in uploaded_files JSONB array → status=error."""
    mock_supabase.table().insert().execute.return_value = _make_insert_response()

    # Return a files array that doesn't contain the requested file_id
    not_found_resp = MagicMock()
    not_found_resp.data = [{"files": [{"id": "other_file_id", "file_path": "x", "bucket_name": "bank_statements"}]}]
    mock_supabase.table().select().eq().execute.return_value = not_found_resp

    bank_statement_service.analyse_bank_statement("app_1", "file_1", "user_1")

    update_args = mock_supabase.table().update.call_args[0][0]
    assert update_args["status"] == "error"
    assert "file_1" in update_args["error_message"]


def test_analyse_bank_statement_low_confidence_adds_flag(mock_supabase, mock_openai, mock_fitz):
    """AI returns confidence=low → 'low_confidence' appended to flags array."""
    mock_supabase.table().insert().execute.return_value = _make_insert_response()
    mock_supabase.table().select().eq().execute.return_value = _make_files_select_response()
    mock_supabase.storage.from_().download.return_value = b"mock_pdf_bytes"
    mock_openai.chat.completions.create.return_value = _make_openai_response({
        "is_valid_bank_statement": True,
        "risk_score": 30,
        "flags": ["irregular_income"],
        "ai_summary": "Uncertain analysis",
        "confidence": "low"
    })

    bank_statement_service.analyse_bank_statement("app_1", "file_1", "user_1")

    update_args = mock_supabase.table().update.call_args[0][0]
    assert update_args["status"] == "complete"
    assert "low_confidence" in update_args["flags"]
    assert "irregular_income" in update_args["flags"]


def test_analyse_bank_statement_invalid_json_response(mock_supabase, mock_openai, mock_fitz):
    """AI returns non-JSON text → JSONDecodeError caught, status=error."""
    mock_supabase.table().insert().execute.return_value = _make_insert_response()
    mock_supabase.table().select().eq().execute.return_value = _make_files_select_response()
    mock_supabase.storage.from_().download.return_value = b"mock_pdf_bytes"

    bad_response = MagicMock()
    bad_choice = MagicMock()
    bad_choice.message.content = "This is not valid JSON at all!"
    bad_response.choices = [bad_choice]
    mock_openai.chat.completions.create.return_value = bad_response

    bank_statement_service.analyse_bank_statement("app_1", "file_1", "user_1")

    update_args = mock_supabase.table().update.call_args[0][0]
    assert update_args["status"] == "error"
    assert "invalid JSON" in update_args["error_message"]
