// ==========================================
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL = "https://lauhltxwzasfjjksbihx.supabase.co";

const SUPABASE_KEY = "sb_publishable_2PTLzATKATqz4hoB--4j3w_WCJwKKm2";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const form = document.getElementById("registerForm");

const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const terms = document.getElementById("terms");

const usernameError = document.getElementById("usernameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const termsError = document.getElementById("termsError");

const togglePassword = document.getElementById("togglePassword");

const strengthBar = document.getElementById("strengthBar");
const passwordHint = document.getElementById("passwordHint");


// ==========================================
// SHOW / HIDE PASSWORD
// ==========================================

togglePassword.addEventListener("click", () => {

    if (password.type === "password") {

        password.type = "text";
        togglePassword.textContent = "🙈";

    } else {

        password.type = "password";
        togglePassword.textContent = "👁";

    }

});


// ==========================================
// PASSWORD STRENGTH
// ==========================================

password.addEventListener("input", () => {

    const value = password.value;

    let strength = 0;

    if (value.length >= 8) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^A-Za-z0-9]/.test(value)) strength++;

    const widths = [
        "0%",
        "25%",
        "50%",
        "75%",
        "100%"
    ];

    strengthBar.style.width = widths[strength];

    if (strength === 0) {

        passwordHint.textContent =
            "Use at least 8 characters";

    } else if (strength === 1) {

        passwordHint.textContent =
            "Weak password";

    } else if (strength === 2) {

        passwordHint.textContent =
            "Medium password";

    } else if (strength === 3) {

        passwordHint.textContent =
            "Strong password";

    } else {

        passwordHint.textContent =
            "Very strong password";

    }

});


// ==========================================
// REGISTRATION / SUPABASE SIGNUP
// ==========================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    let valid = true;


    // Clear old errors

    usernameError.textContent = "";
    emailError.textContent = "";
    passwordError.textContent = "";
    termsError.textContent = "";


    // ======================================
    // USERNAME VALIDATION
    // ======================================

    const usernameValue = username.value.trim();

    if (usernameValue.length < 3) {

        usernameError.textContent =
            "Username must contain at least 3 characters.";

        valid = false;
    }


    // ======================================
    // GMAIL VALIDATION
    // ======================================

    const emailValue = email.value.trim();

    const gmailPattern =
        /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailPattern.test(emailValue)) {

        emailError.textContent =
            "Please enter a valid Gmail address.";

        valid = false;
    }


    // ======================================
    // PASSWORD VALIDATION
    // ======================================

    const passwordValue = password.value;

    if (passwordValue.length < 8) {

        passwordError.textContent =
            "Password must contain at least 8 characters.";

        valid = false;
    }


    // ======================================
    // TERMS VALIDATION
    // ======================================

    if (!terms.checked) {

        termsError.textContent =
            "Please accept the Terms and Privacy Policy.";

        valid = false;
    }


    // Stop if validation failed

    if (!valid) {
        return;
    }


    // ======================================
    // SEND DATA TO SUPABASE
    // ======================================

    const { data, error } =
        await supabaseClient.auth.signUp({

            email: emailValue,

            password: passwordValue,

            options: {

                data: {
                     display_name: usernameValue
                }

            }

        });


    // ======================================
    // CHECK ERROR
    // ======================================

    if (error) {

        console.error("Supabase Signup Error:", error);

        alert(
            "Registration failed:\n" +
            error.message
        );

        return;
    }


    // ======================================
    // SUCCESS
    // ======================================

    console.log("Signup successful:", data);


    alert(
    "Registration successful! Please verify your email, then login."
);

window.location.href = "../login-page/index.html";

});