/* =========================================
   PASSWORD SHOW / HIDE
========================================= */

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");


togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent = "🙈";

        togglePassword.setAttribute(
            "aria-label",
            "Hide password"
        );

    }
       else {

        passwordInput.type = "password";

        togglePassword.textContent = "👁";

        togglePassword.setAttribute(
            "aria-label",
            "Show password"
        );

    }

});



/* =========================================
   LOGIN FORM
========================================= */

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");

const errorMessage = document.getElementById("errorMessage");


loginForm.addEventListener("submit", function (event) {

    event.preventDefault();


    const email = emailInput.value.trim();

    const password = passwordInput.value.trim();


    /* Clear previous error */

    errorMessage.textContent = "";


    /* Email validation */

    if (email === "") {

        errorMessage.textContent =
            "Please enter your Gmail address.";

        emailInput.focus();

        return;
    }


    /* Gmail validation */

    const gmailPattern =
        /^[a-zA-Z0-9._%+-]+@gmail\.com$/;


    if (!gmailPattern.test(email)) {

        errorMessage.textContent =
            "Please enter a valid Gmail address.";

        emailInput.focus();

        return;
    }


    /* Password validation */

    if (password === "") {

        errorMessage.textContent =
            "Please enter your password.";

        passwordInput.focus();

        return;
    }


    if (password.length < 8) {

        errorMessage.textContent =
            "Password must contain at least 8 characters.";

        passwordInput.focus();

        return;
    }


    /* =====================================
       LOGIN SUCCESS
    ===================================== */

    console.log("Login submitted");

    console.log("Email:", email);


    /*
        Backend/API integration will be added here.

        Example:

        fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
    */


    window.location.href = "dashboard.html";
});



/* =========================================
   FORGOT PASSWORD
========================================= */

const forgotPassword =
    document.getElementById("forgotPassword");


forgotPassword.addEventListener("click", function (event) {

    event.preventDefault();

    const email = emailInput.value.trim();


    if (email === "") {

        alert(
            "Please enter your Gmail address first."
        );

        emailInput.focus();

        return;
    }


    alert(
        "Password reset functionality will be available soon."
    );

});
