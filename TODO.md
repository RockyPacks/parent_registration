# Netcash PayNow Integration TODO

- [x] Update backend/app/core/config.py to add Netcash PayNow settings (NETCASH_PAYNOW_KEY, NETCASH_PAYNOW_BASE, RETURN_URL, WEBHOOK_URL)
- [x] Update backend/app/api/v1/schemas/payment.py to match the new PaymentRequest model (amount as float, reference as str, description as str)
- [x] Replace logic in backend/app/api/v1/routers/payment.py with the provided create-payment and webhook code
- [x] Add HTML PayNow button to components/ReviewSubmitStep.tsx
- [ ] Set environment variables in .env file for backend
- [ ] Test the integration with mock data
- [ ] Test live integration with provided credentials
