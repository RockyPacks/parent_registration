# TODO: Remove PDF Download and Netcash Code

## Steps to Complete

- [x] Remove PDF generator utility: Delete `frontend/src/utils/pdfGenerator.ts` and check for any imports
- [x] Remove Netcash client service: Delete `backend/app/services/netcash_client.py` and check for any imports
- [x] Remove Netcash configurations: Clean up Netcash-related settings in `backend/app/core/config.py`
- [x] Remove Netcash configurations: Clean up Netcash-related settings in `backend/app/core/config_old.py`
- [x] Search and remove any remaining references to PDF generation or Netcash in the codebase
- [x] Test frontend: Start development server and verify no errors or broken functionality
- [x] Test backend: Start backend server and test key API endpoints (auth, enrollment, documents)
- [x] Verify core system functionality: Ensure enrollment process works without removed features
