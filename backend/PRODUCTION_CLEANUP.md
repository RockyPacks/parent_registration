# Production Cleanup Tasks

## Phase 1: File Removal (Safe to Remove)
- [ ] Remove debug files: `backend/debug_info.txt`, `backend/test_live_endpoints.py`
- [ ] Remove test data files: `backend/test.nif`, `backend/test.pdf`
- [ ] Remove development requirements: `backend/requirements_new.txt`
- [ ] Remove TODO files: `TODO.md`, `backend/TODO.md`, `frontend/TODO.md`
- [ ] Remove cache directories: `backend/__pycache__/`, `backend/.pytest_cache/`
- [ ] Remove development SQL patches: all `backend/fix_*.sql` files
- [ ] Remove development SQL updates: `backend/update_*.sql`, `backend/add_*.sql` files
- [ ] Remove development data: `backend/fee_agreement_codes.txt`, `backend/metadata.json`

## Phase 2: Environment Security
- [ ] Review `.env` file and move sensitive data to secure location
- [ ] Create `.env.example` template for production setup
- [ ] Ensure no sensitive data is committed

## Phase 3: Build Optimization
- [ ] Test frontend production build: `npm run build`
- [ ] Verify backend runs without removed files
- [ ] Create production deployment script

## Phase 4: Final Verification
- [ ] Run basic functionality tests
- [ ] Verify all critical endpoints work
- [ ] Confirm database connections work
- [ ] Test file uploads and downloads
