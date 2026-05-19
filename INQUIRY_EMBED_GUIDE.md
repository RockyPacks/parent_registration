# Embeddable Inquiry Form Integration Guide

The Knit Admissions Module Embeddable Inquiry Form is a secure, parent-facing portal that allows schools to collect admission inquiries directly from their own website (via `<iframe>`) or share it as a standalone link.

## 🔗 Standalone Shareable Link

Schools can email, text, or post a direct link to their inquiry form. The `:school_id` UUID determines which branding is displayed.

**Format:**
```
https://<admissions-domain>/inquiry/<school_id>
```

**Alternative Hash Link (for static SPA hosts):**
```
https://<admissions-domain>/#/inquiry/<school_id>
```

---

## 🖼️ Website Embedding (`<iframe>`)

Schools can embed the inquiry form seamlessly onto their existing websites. Copy and paste the following HTML snippet into their site builder (WordPress, Webflow, Wix, Squarespace, or raw HTML).

### 1. Basic Embed Code

```html
<iframe 
  src="https://<admissions-domain>/inquiry/<school_id>" 
  width="100%" 
  height="700px" 
  frameborder="0" 
  style="border: none; max-width: 600px; margin: 0 auto; display: block; background: transparent;"
  allow="payment"
  sandbox="allow-scripts allow-same-origin allow-forms"
  title="Admissions Inquiry Form">
</iframe>
```

### 2. Premium Responsive Embed Code

To ensure the form is beautifully centered, responsive on all mobile screens, and auto-adapts with no unwanted borders:

```html
<div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 10px; box-sizing: border-box;">
  <iframe 
    src="https://<admissions-domain>/inquiry/<school_id>" 
    width="100%" 
    height="700px" 
    frameborder="0" 
    style="border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); background: #f9fafb;"
    allow="payment"
    sandbox="allow-scripts allow-same-origin allow-forms"
    title="Admissions Inquiry Form">
  </iframe>
</div>
```

---

## ⚙️ Technical Requirements

1. **Responsive Styling:** The form has a locked max-width of `580px` and automatically scales down to a minimum of `350px` for mobile viewports (responsive out of the box).
2. **Anonymous Public Access:** The `/inquiry/:school_id` page requires **no cookie dependencies, no user sessions, and no login walls**. It communicates directly with public API endpoints.
3. **Embed Security Headers:**
   To allow this form to render inside an `<iframe>` on a school's external website:
   - Ensure the server/proxy hosting the React frontend assets does **not** send `X-Frame-Options: DENY` or `X-Frame-Options: SAMEORIGIN` headers on the `/inquiry` route.
   - For modern browsers, we recommend setting a standard Content-Security-Policy (CSP) that permits embedding:
     ```http
     Content-Security-Policy: frame-ancestors 'self' *;
     ```
