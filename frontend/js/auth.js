document.addEventListener(
  "DOMContentLoaded",
  () => {

    const token = getToken();

    if (token) {
      const page =
        location.pathname
          .split("/")
          .pop();

      if (
        page === "" ||
        page === "index.html"
      ) {
        location.href =
          "/dashboard.html";

        return;
      }
    }

    const loginForm =
      document.getElementById(
        "loginForm"
      );

    const registerForm =
      document.getElementById(
        "registerForm"
      );

    // LOGIN

    loginForm?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const button =
          loginForm.querySelector(
            "button[type='submit']"
          );

        const message =
          document.getElementById(
            "loginMessage"
          );

        const email =
          document
            .getElementById(
              "loginEmail"
            )
            .value
            .trim();

        const password =
          document.getElementById(
            "loginPassword"
          ).value;

        button.disabled = true;

        button.textContent =
          "Signing in...";

        message.textContent = "";

        message.className =
          "message";

        try {

          const data =
            await apiRequest(
              "/auth/login",
              {
                method: "POST",
                body:
                  JSON.stringify({
                    email,
                    password
                  })
              }
            );

          setAuth(
            data.token,
            data.user
          );

          message.textContent =
            "Login successful!";

          message.className =
            "message success";

          setTimeout(() => {
            location.href =
              "/dashboard.html";
          }, 350);

        } catch (error) {

          message.textContent =
            error.message;

          message.className =
            "message error";

        } finally {

          button.disabled =
            false;

          button.textContent =
            "Sign In";
        }
      }
    );

    // REGISTER

    registerForm?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const button =
          registerForm.querySelector(
            "button[type='submit']"
          );

        const message =
          document.getElementById(
            "registerMessage"
          );

        const password =
          document.getElementById(
            "registerPassword"
          ).value;

        const confirmPassword =
          document.getElementById(
            "confirmPassword"
          ).value;

        if (
          password !==
          confirmPassword
        ) {

          message.textContent =
            "Passwords do not match";

          message.className =
            "message error";

          return;
        }

        button.disabled = true;

        button.textContent =
          "Creating account...";

        message.textContent = "";

        message.className =
          "message";

        try {

          const data =
            await apiRequest(
              "/auth/register",
              {
                method: "POST",
                body:
                  JSON.stringify({
                    name:
                      document
                        .getElementById(
                          "registerName"
                        )
                        .value
                        .trim(),

                    email:
                      document
                        .getElementById(
                          "registerEmail"
                        )
                        .value
                        .trim(),

                    password,

                    phase:
                      document
                        .getElementById(
                          "registerPhase"
                        )
                        .value
                  })
              }
            );

          setAuth(
            data.token,
            data.user
          );

          message.textContent =
            "Account created successfully!";

          message.className =
            "message success";

          setTimeout(() => {
            location.href =
              "/dashboard.html";
          }, 450);

        } catch (error) {

          message.textContent =
            error.message;

          message.className =
            "message error";

        } finally {

          button.disabled =
            false;

          button.textContent =
            "Create Account";
        }
      }
    );
  }
);
