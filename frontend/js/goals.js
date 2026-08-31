let allTasks = [];

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (!requireAuth()) {
      return;
    }

    setupCommonUI();

    // ADD GOAL
    document
      .getElementById(
        "addGoalButton"
      )
      ?.addEventListener(
        "click",
        () => openGoalModal()
      );

    // ADD REFLECTION
    document
      .getElementById(
        "addReflectionButton"
      )
      ?.addEventListener(
        "click",
        openReflectionModal
      );

    // GOAL MODAL
    document
      .getElementById(
        "closeGoalModal"
      )
      ?.addEventListener(
        "click",
        closeGoalModal
      );

    document
      .getElementById(
        "cancelGoal"
      )
      ?.addEventListener(
        "click",
        closeGoalModal
      );

    document
      .getElementById(
        "goalModal"
      )
      ?.addEventListener(
        "click",
        event => {
          if (
            event.target.id ===
            "goalModal"
          ) {
            closeGoalModal();
          }
        }
      );

    document
      .getElementById(
        "goalForm"
      )
      ?.addEventListener(
        "submit",
        saveGoal
      );

    // REFLECTION MODAL
    document
      .getElementById(
        "closeReflectionModal"
      )
      ?.addEventListener(
        "click",
        closeReflectionModal
      );

    document
      .getElementById(
        "cancelReflection"
      )
      ?.addEventListener(
        "click",
        closeReflectionModal
      );

    document
      .getElementById(
        "reflectionModal"
      )
      ?.addEventListener(
        "click",
        event => {
          if (
            event.target.id ===
            "reflectionModal"
          ) {
            closeReflectionModal();
          }
        }
      );

    document
      .getElementById(
        "reflectionForm"
      )
      ?.addEventListener(
        "submit",
        saveReflection
      );

    // FILTERS
    document
      .getElementById(
        "searchTasks"
      )
      ?.addEventListener(
        "input",
        renderTasks
      );

    document
      .getElementById(
        "filterDate"
      )
      ?.addEventListener(
        "change",
        renderTasks
      );

    document
      .getElementById(
        "filterStatus"
      )
      ?.addEventListener(
        "change",
        renderTasks
      );

    document
      .getElementById(
        "filterPriority"
      )
      ?.addEventListener(
        "change",
        renderTasks
      );

    await loadGoals();
  }
);

async function loadGoals() {

  try {

    const data =
      await apiRequest(
        "/tasks"
      );

    allTasks =
      Array.isArray(data)
        ? data
        : Array.isArray(
            data?.tasks
          )
          ? data.tasks
          : [];

    allTasks.sort(
      (a, b) =>
        new Date(
          b.createdAt || 0
        ) -
        new Date(
          a.createdAt || 0
        )
    );

    renderTasks();

  } catch (error) {

    showToast(
      error.message ||
      "Unable to load goals.",
      "error"
    );
  }
}

function renderTasks() {

  const body =
    document.getElementById(
      "tasksBody"
    );

  if (!body) {
    return;
  }

  const search =
    document
      .getElementById(
        "searchTasks"
      )
      ?.value
      .trim()
      .toLowerCase() ||
    "";

  const date =
    document.getElementById(
      "filterDate"
    )?.value || "";

  const status =
    document.getElementById(
      "filterStatus"
    )?.value || "";

  const priority =
    document.getElementById(
      "filterPriority"
    )?.value || "";

  const filtered =
    allTasks.filter(
      task => {

        const title =
          String(
            task.title || ""
          ).toLowerCase();

        const description =
          String(
            task.description ||
            ""
          ).toLowerCase();

        return (
          (
            !search ||
            title.includes(search) ||
            description.includes(
              search
            )
          ) &&
          (
            !date ||
            getLocalDateString(
              task.createdAt
            ) === date
          ) &&
          (
            !status ||
            task.status ===
              status
          ) &&
          (
            !priority ||
            task.priority ===
              priority
          )
        );
      }
    );

  if (!filtered.length) {

    body.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-state"
        >
          ${
            date
              ? `No goals found for ${formatDate(
                  date
                )}.`
              : "No goals found."
          }
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML =
    filtered
      .map(task => {

        const progress =
          Math.min(
            100,
            Math.max(
              0,
              Number(
                task.progress || 0
              )
            )
          );

        const safeStatus =
          task.status ||
          "Pending";

        const safePriority =
          task.priority ||
          "Medium";

        return `
          <tr>

            <td>
              ${formatDate(
                task.createdAt
              )}
            </td>

            <td>

              <strong
                class="goal-title"
              >
                ${escapeHTML(
                  task.title || ""
                )}
              </strong>

              <small>
                ${escapeHTML(
                  task.description ||
                  "No description"
                )}
              </small>

            </td>

            <td>

              <span
                class="badge ${statusClass(
                  safeStatus
                )}"
              >
                ${escapeHTML(
                  safeStatus
                )}
              </span>

            </td>

            <td>

              <span
                class="badge priority-${safePriority.toLowerCase()}"
              >
                ${escapeHTML(
                  safePriority
                )}
              </span>

            </td>

            <td>

              <div
                class="progress-line"
              >
                <span>
                  ${progress}%
                </span>
              </div>

              <div
                class="progress-track"
              >
                <div
                  class="progress-fill"
                  style="width:${progress}%"
                ></div>
              </div>

            </td>

            <td>
              ${
                task.deadline
                  ? formatDate(
                      task.deadline
                    )
                  : "—"
              }
            </td>

            <td>

              <div class="actions">

                <button
                  class="icon-btn"
                  type="button"
                  title="Edit Goal"
                  onclick="editGoal('${task._id}')"
                >
                  ✎
                </button>

                <button
                  class="icon-btn delete"
                  type="button"
                  title="Delete Goal"
                  onclick="deleteGoal('${task._id}')"
                >
                  ×
                </button>

              </div>

            </td>

          </tr>
        `;
      })
      .join("");
}

function statusClass(status) {

  if (
    status ===
    "Completed"
  ) {
    return "completed";
  }

  if (
    status ===
    "In Progress"
  ) {
    return "progress";
  }

  return "pending";
}

// GOAL MODAL

function openGoalModal(
  task = null
) {

  const modal =
    document.getElementById(
      "goalModal"
    );

  const form =
    document.getElementById(
      "goalForm"
    );

  if (!modal || !form) {
    return;
  }

  form.reset();

  document.getElementById(
    "goalId"
  ).value =
    task?._id || "";

  document.getElementById(
    "goalModalTitle"
  ).textContent =
    task
      ? "Edit Goal"
      : "Add Goal";

  if (task) {

    document.getElementById(
      "goalTitle"
    ).value =
      task.title || "";

    document.getElementById(
      "goalDescription"
    ).value =
      task.description || "";

    document.getElementById(
      "goalPriority"
    ).value =
      task.priority ||
      "Medium";

    document.getElementById(
      "goalStatus"
    ).value =
      task.status ||
      "Pending";

    document.getElementById(
      "goalProgress"
    ).value =
      task.progress ?? 0;

    document.getElementById(
      "goalDeadline"
    ).value =
      task.deadline
        ? getLocalDateString(
            task.deadline
          )
        : "";
  }

  modal.classList.add(
    "open"
  );
}

function closeGoalModal() {

  document
    .getElementById(
      "goalModal"
    )
    ?.classList.remove(
      "open"
    );
}

async function saveGoal(
  event
) {

  event.preventDefault();

  const id =
    document.getElementById(
      "goalId"
    ).value;

  const payload = {

    title:
      document
        .getElementById(
          "goalTitle"
        )
        .value
        .trim(),

    description:
      document
        .getElementById(
          "goalDescription"
        )
        .value
        .trim(),

    priority:
      document.getElementById(
        "goalPriority"
      ).value,

    status:
      document.getElementById(
        "goalStatus"
      ).value,

    progress:
      Math.min(
        100,
        Math.max(
          0,
          Number(
            document.getElementById(
              "goalProgress"
            ).value
          )
        )
      ),

    deadline:
      document.getElementById(
        "goalDeadline"
      ).value ||
      null
  };

  if (!payload.title) {

    showToast(
      "Goal title is required.",
      "error"
    );

    return;
  }

  try {

    await apiRequest(
      id
        ? `/tasks/${id}`
        : "/tasks",
      {
        method:
          id
            ? "PUT"
            : "POST",
        body:
          JSON.stringify(
            payload
          )
      }
    );

    showToast(
      id
        ? "Goal updated successfully"
        : "Goal created successfully"
    );

    closeGoalModal();

    await loadGoals();

  } catch (error) {

    showToast(
      error.message ||
      "Unable to save goal.",
      "error"
    );
  }
}

window.editGoal =
  id => {

    const task =
      allTasks.find(
        item =>
          String(
            item._id
          ) ===
          String(id)
      );

    if (task) {
      openGoalModal(task);
    }
  };

window.deleteGoal =
  async id => {

    if (
      !confirm(
        "Delete this goal?"
      )
    ) {
      return;
    }

    try {

      await apiRequest(
        `/tasks/${id}`,
        {
          method: "DELETE"
        }
      );

      showToast(
        "Goal deleted successfully"
      );

      await loadGoals();

    } catch (error) {

      showToast(
        error.message ||
        "Unable to delete goal.",
        "error"
      );
    }
  };

// ===============================
// DAILY REFLECTION MODAL
// ===============================

function openReflectionModal() {

  const modal =
    document.getElementById(
      "reflectionModal"
    );

  const form =
    document.getElementById(
      "reflectionForm"
    );

  if (!modal || !form) {
    return;
  }

  form.reset();

  document.getElementById(
    "reflectionPriority"
  ).value =
    "Medium";

  document.getElementById(
    "reflectionStatus"
  ).value =
    "Pending";

  document.getElementById(
    "reflectionProgress"
  ).value =
    0;

  document.getElementById(
    "reflectionDateText"
  ).textContent =
    formatLongDate(
      new Date()
    );

  modal.classList.add(
    "open"
  );

  document
    .getElementById(
      "reflection"
    )
    ?.focus();
}

function closeReflectionModal() {

  document
    .getElementById(
      "reflectionModal"
    )
    ?.classList.remove(
      "open"
    );
}

async function saveReflection(
  event
) {

  event.preventDefault();

  const reflection =
    document
      .getElementById(
        "reflection"
      )
      .value
      .trim();

  if (!reflection) {

    showToast(
      "Please write your reflection.",
      "error"
    );

    return;
  }

  const payload = {

    reflection,

    whatILearned:
      document
        .getElementById(
          "whatILearned"
        )
        .value
        .trim(),

    challenges:
      document
        .getElementById(
          "challenges"
        )
        .value
        .trim(),

    priority:
      document.getElementById(
        "reflectionPriority"
      ).value,

    status:
      document.getElementById(
        "reflectionStatus"
      ).value,

    progress:
      Math.min(
        100,
        Math.max(
          0,
          Number(
            document.getElementById(
              "reflectionProgress"
            ).value
          )
        )
      ),

    deadline:
      document.getElementById(
        "reflectionDeadline"
      ).value ||
      null
  };

  try {

    await apiRequest(
      "/reflections",
      {
        method: "POST",
        body:
          JSON.stringify(
            payload
          )
      }
    );

    showToast(
      "Daily reflection saved successfully"
    );

    closeReflectionModal();

  } catch (error) {

    showToast(
      error.message ||
      "Unable to save reflection.",
      "error"
    );
  }
}
