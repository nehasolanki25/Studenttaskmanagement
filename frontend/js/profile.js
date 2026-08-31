document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (!requireAuth()) {
      return;
    }

    setupCommonUI();

    const form =
      document.getElementById(
        "profileForm"
      );

    const storedUser =
      getStoredUser();

    if (storedUser) {
      fillProfile(
        storedUser
      );
    }

    try {

      const data =
        await apiRequest(
          "/auth/me"
        );

      setAuth(
        getToken(),
        data.user
      );

      fillProfile(
        data.user
      );

    } catch (error) {

      showToast(
        error.message,
        "error"
      );
    }

    form?.addEventListener(
      "submit",
      updateProfile
    );
  }
);

function fillProfile(user) {

  document
    .querySelectorAll(
      "[data-profile-name]"
    )
    .forEach(el => {

      el.textContent =
        user.name ||
        "Student";
    });

  document
    .querySelectorAll(
      "[data-profile-email]"
    )
    .forEach(el => {

      el.textContent =
        user.email ||
        "";
    });

  const name =
    document.getElementById(
      "profileName"
    );

  const email =
    document.getElementById(
      "profileEmail"
    );

  const phase =
    document.getElementById(
      "profilePhase"
    );

  const avatar =
    document.getElementById(
      "profileAvatar"
    );

  if (name) {
    name.value =
      user.name || "";
  }

  if (email) {
    email.value =
      user.email || "";
  }

  if (phase) {
    phase.value =
      user.phase ||
      "Phase 1";
  }

  if (avatar) {
    avatar.textContent =
      initials(user.name);
  }
}

async function updateProfile(
  event
) {

  event.preventDefault();

  const name =
    document
      .getElementById(
        "profileName"
      )
      .value
      .trim();

  const phase =
    document.getElementById(
      "profilePhase"
    ).value;

  try {

    const data =
      await apiRequest(
        "/auth/profile",
        {
          method: "PUT",
          body:
            JSON.stringify({
              name,
              phase
            })
        }
      );

    setAuth(
      getToken(),
      data.user
    );

    fillProfile(
      data.user
    );

    setupCommonUI();

    showToast(
      "Profile updated successfully"
    );

  } catch (error) {

    showToast(
      error.message,
      "error"
    );
  }
}
