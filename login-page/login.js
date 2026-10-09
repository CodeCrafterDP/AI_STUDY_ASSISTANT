
"use strict";

// ---------------- SUPABASE CONFIGURATION ----------------

const SUPABASE_URL = "https://lauhltxwzasfjjksbihx.supabase.co";
const SUPABASE_KEY = "sb_publishable_2PTLzATKATqz4hoB--4j3w_WCJwKKm2";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ---------------- PASSWORD SHOW / HIDE ----------------

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", function () {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "🙈";
        togglePassword.setAttribute("aria-label", "Hide password");
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "👁";
        togglePassword.setAttribute("aria-label", "Show password");
    }
});

// ---------------- LOGIN FORM ----------------

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const errorMessage = document.getElementById("errorMessage");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    errorMessage.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
        errorMessage.textContent =
            "Please enter your email and password.";
        return;
    }

    // Gmail validation (remove this block if other email providers are allowed)
    const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailPattern.test(email)) {
        errorMessage.textContent =
            "Please enter a valid Gmail address.";
        emailInput.focus();
        return;
    }

    if (password.length < 8) {
        errorMessage.textContent =
            "Password must contain at least 8 characters.";
        passwordInput.focus();
        return;
    }

    const loginButton = loginForm.querySelector(
        'button[type="submit"]'
    );

    if (loginButton) {
        loginButton.disabled = true;
    }

    try {
        // REAL SUPABASE AUTHENTICATION
        const { data, error } = await supabaseClient.auth
            .signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            errorMessage.textContent = error.message;
            return;
        }

        if (data.session) {
            // Change this path to your actual dashboard location
            window.location.href = "../Landing-page/landing_page.html";
        } else {
            errorMessage.textContent =
                "Login could not be completed. Please try again.";
        }
    } catch (error) {
        console.error("Login error:", error);

        errorMessage.textContent =
            "Unable to connect. Check your internet and Supabase configuration.";
    } finally {
        if (loginButton) {
            loginButton.disabled = false;
        }
    }
});

// ---------------- FORGOT PASSWORD ----------------

const forgotPassword = document.getElementById("forgotPassword");

forgotPassword.addEventListener("click", async function (event) {
    event.preventDefault();

    errorMessage.textContent = "";

    const email = emailInput.value.trim();

    if (!email) {
        errorMessage.textContent =
            "Enter your Gmail address first.";
        emailInput.focus();
        return;
    }

    const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailPattern.test(email)) {
        errorMessage.textContent =
            "Please enter a valid Gmail address.";
        emailInput.focus();
        return;
    }

    try {
        const { error } = await supabaseClient.auth
            .resetPasswordForEmail(email, {
                redirectTo: window.location.origin +
                    "/update-password.html"
            });

        if (error) {
            errorMessage.textContent = error.message;
        } else {
            errorMessage.textContent =
                "If an account exists for this email, a password reset email will be sent.";
        }
    } catch (error) {
        console.error("Password reset error:", error);

        errorMessage.textContent =
            "Could not request a password reset. Please try again.";
    }
});
