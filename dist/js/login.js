(function () {
  "use strict";

  var emailForm = document.getElementById("emailForm");
  var otpForm = document.getElementById("otpForm");
  var emailInput = document.getElementById("emailInput");
  var otpInput = document.getElementById("otpInput");
  var emailDisplay = document.getElementById("emailDisplay");
  var errorEl = document.getElementById("loginError");
  var sendOtpBtn = document.getElementById("sendOtpBtn");
  var verifyBtn = document.getElementById("verifyBtn");
  var resendBtn = document.getElementById("resendBtn");
  var changeEmailBtn = document.getElementById("changeEmailBtn");

  var currentEmail = "";
  var otpTokens = []; // one per email sent, so codes from earlier emails still work after Resend

  // Login runs on Netlify Functions, which don't exist when this page is
  // opened straight from disk (file://). Say so instead of failing silently.
  if (window.location.protocol === "file:") {
    errorEl.textContent =
      "Login only works on the live site or when running \"netlify dev\" — not when the file is opened directly.";
    sendOtpBtn.disabled = true;
    emailInput.disabled = true;
    return;
  }

  function showError(message) {
    errorEl.textContent = message || "";
  }

  function parseResponse(res) {
    return res
      .json()
      .catch(function () {
        return {};
      })
      .then(function (data) {
        if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
        return data;
      });
  }

  function setBusy(button, busy, idleLabel) {
    button.disabled = busy;
    button.textContent = busy ? "Please wait…" : idleLabel;
  }

  function getRedirectTarget() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get("next");
    return next && next.startsWith("/") ? next : "/";
  }

  function requestOtp(email) {
    return fetch("/.netlify/functions/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email }),
    })
      .then(parseResponse)
      .then(function (data) {
        otpTokens.push(data.token);
      });
  }

  emailForm.addEventListener("submit", function (e) {
    e.preventDefault();
    showError("");

    var email = emailInput.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("Enter a valid email address.");
      return;
    }
    if (email.toLowerCase() !== currentEmail) otpTokens = [];
    currentEmail = email.toLowerCase();

    setBusy(sendOtpBtn, true, "Send OTP");
    requestOtp(currentEmail)
      .then(function () {
        emailDisplay.textContent = currentEmail;
        emailForm.classList.add("hidden");
        otpForm.classList.remove("hidden");
        otpInput.value = "";
        otpInput.focus();
      })
      .catch(function (err) {
        showError(err.message || "Something went wrong. Please try again.");
      })
      .finally(function () {
        setBusy(sendOtpBtn, false, "Send OTP");
      });
  });

  otpForm.addEventListener("submit", function (e) {
    e.preventDefault();
    showError("");

    var otp = otpInput.value.trim();
    if (!/^\d{6}$/.test(otp)) {
      showError("Enter the 6-digit code exactly as you received it.");
      return;
    }

    setBusy(verifyBtn, true, "Verify & Continue");
    fetch("/.netlify/functions/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: currentEmail, otp: otp, tokens: otpTokens }),
    })
      .then(parseResponse)
      .then(function () {
        window.location.href = getRedirectTarget();
      })
      .catch(function (err) {
        showError(err.message || "Incorrect OTP. Please try again.");
      })
      .finally(function () {
        setBusy(verifyBtn, false, "Verify & Continue");
      });
  });

  resendBtn.addEventListener("click", function () {
    showError("");
    resendBtn.disabled = true;
    requestOtp(currentEmail)
      .then(function () {
        showError("A new code has been sent.");
      })
      .catch(function (err) {
        showError(err.message || "Could not resend OTP.");
      })
      .finally(function () {
        setTimeout(function () {
          resendBtn.disabled = false;
        }, 15000);
      });
  });

  changeEmailBtn.addEventListener("click", function () {
    showError("");
    otpForm.classList.add("hidden");
    emailForm.classList.remove("hidden");
    emailInput.focus();
  });

  /* ------------------------------------------------------------
   * Google sign-in. Only shown when GOOGLE_CLIENT_ID is set on
   * the server; otherwise the page falls back to email OTP only.
   * ---------------------------------------------------------- */
  var googleBlock = document.getElementById("googleBlock");
  var googleBtn = document.getElementById("googleBtn");

  function onGoogleCredential(response) {
    showError("");
    fetch("/.netlify/functions/google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    })
      .then(parseResponse)
      .then(function () {
        window.location.href = getRedirectTarget();
      })
      .catch(function (err) {
        showError(err.message || "Google sign-in failed. Please try again.");
      });
  }

  // The GIS script loads async, so wait for it before rendering the button.
  function whenGoogleReady(cb, triesLeft) {
    if (window.google && google.accounts && google.accounts.id) return cb();
    if (triesLeft <= 0) return;
    setTimeout(function () { whenGoogleReady(cb, triesLeft - 1); }, 100);
  }

  function setupGoogle(clientId) {
    whenGoogleReady(function () {
      google.accounts.id.initialize({ client_id: clientId, callback: onGoogleCredential });
      google.accounts.id.renderButton(googleBtn, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: Math.min(googleBtn.offsetWidth || 320, 400),
      });
      googleBlock.classList.remove("hidden");
    }, 100);
  }

  fetch("/.netlify/functions/session", { credentials: "same-origin" })
    .then(parseResponse)
    .then(function (data) {
      if (data.loggedIn) {
        window.location.href = getRedirectTarget();
        return;
      }
      if (data.googleClientId) {
        googleBlock.classList.remove("hidden"); // give the button a width to render into
        setupGoogle(data.googleClientId);
      }
    })
    .catch(function () {
      // Functions unavailable (e.g. opened as a local file) — email form still shows.
    });
})();
