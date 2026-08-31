let dashboardTasks = [];

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (!requireAuth()) {
      return;
    }

    setupCommonUI();

    document
      .getElementById(
        "addTaskButton"
      )
      ?.addEventListener(
        "click",
        () => openTaskModal()
      );

    document
      .getElementById(
        "closeTaskModal"
      )
      ?.addEventListener(
        "click",
        closeTaskModal
      );

    document
      .getElementById(
        "cancelTask"
      )
      ?.addEventListener(
        "click",
        closeTaskModal
      );

    document
      .getElementById(
        "taskModal"
      )
      ?.addEventListener(
        "click",
        event => {
          if (
            event.target.id ===
            "taskModal"
          ) {
            closeTaskModal();
          }
        }
      );

    document
      .getElementById(
        "taskForm"
      )
      ?.addEventListener(
        "submit",
        saveTask
      );

    await loadDashboard();
  }
);

async function loadDashboard() {

  try {

    const data =
      await apiRequest(
        "/tasks"
      );

    dashboardTasks =
      Array.isArray(data)
        ? data
        : Array.isArray(
            data?.tasks
          )
          ? data.tasks
          : [];

    dashboardTasks.sort(
      (a, b) =>
        new Date(
          b.createdAt || 0
        ) -
        new Date(
          a.createdAt || 0
        )
    );

    renderDashboard();

  } catch (error) {

    showToast(
      error.message,
      "error"
    );
  }
}

function renderDashboard() {

  const total =
    dashboardTasks.length;

  const completed =
    dashboardTasks.filter(
      task =>
        task.status === "Completed"
    ).length;

  const pending =
    dashboardTasks.filter(
      task =>
        task.status === "Pending"
    ).length;

  const inProgress =
    dashboardTasks.filter(
      task =>
        task.status === "In Progress"
    ).length;


  // Overall progress
  const overallProgress =
    total
      ? Math.round(
          dashboardTasks.reduce(
            (sum, task) =>
              sum +
              Number(task.progress || 0),
            0
          ) / total
        )
      : 0;


  // =========================
  // UPDATE STATISTICS
  // =========================

  document.getElementById(
    "totalTasks"
  ).textContent = total;


  document.getElementById(
    "completedTasks"
  ).textContent = completed;


  document.getElementById(
    "pendingTasks"
  ).textContent = pending;


  document.getElementById(
    "inProgressTasks"
  ).textContent = inProgress;


  document.getElementById(
    "averageProgress"
  ).textContent =
    `${overallProgress}%`;


  // =========================
  // PROGRESS OVERVIEW
  // =========================

  const items = [
    [
      "Overall progress",
      overallProgress
    ],

    [
      "Completed",
      total
        ? Math.round(
            (completed / total) * 100
          )
        : 0
    ],

    [
      "In progress",
      total
        ? Math.round(
            (inProgress / total) * 100
          )
        : 0
    ],

    [
      "Pending",
      total
        ? Math.round(
            (pending / total) * 100
          )
        : 0
    ]
  ];


  document.getElementById(
    "progressOverview"
  ).innerHTML =
    items
      .map(
        ([label, value]) => `
          <div class="overview-item">

            <div class="progress-line">

              <span>
                ${escapeHTML(label)}
              </span>

              <span>
                ${value}%
              </span>

            </div>


            <div class="progress-track">

              <div
                class="progress-fill"
                style="width:${value}%"
              ></div>

            </div>

          </div>
        `
      )
      .join("");


  // =========================
  // RECENT GOALS
  // =========================

  const list =
    document.getElementById(
      "recentTasks"
    );

  const recent =
    dashboardTasks.slice(0, 5);


  if (!recent.length) {

    list.innerHTML = `
      <div class="empty-state">
        No goals yet.
        Click "Add Goal" to create
        your first goal.
      </div>
    `;

    return;
  }


  list.innerHTML =
    recent
      .map(
        task => `
          <div class="task-mini">

            <div>

              <div class="task-mini-title">
                ${escapeHTML(
                  task.title
                )}
              </div>

              <small class="task-mini-date">
                ${
                  task.deadline
                    ? `Deadline: ${formatLongDate(
                        task.deadline
                      )}`
                    : "No deadline"
                }
              </small>

            </div>


            <span
              class="badge ${statusClass(
                task.status
              )}"
            >
              ${escapeHTML(
                task.status ||
                "Pending"
              )}
            </span>

          </div>
        `
      )
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

function openTaskModal(
  task = null
) {

  const modal =
    document.getElementById(
      "taskModal"
    );

  const form =
    document.getElementById(
      "taskForm"
    );

  if (!modal || !form) {
    return;
  }

  form.reset();

  document.getElementById(
    "taskId"
  ).value =
    task?._id || "";

  document.getElementById(
    "taskModalTitle"
  ).textContent =
    task
      ? "Edit Goal"
      : "Add Goal";

  if (task) {

    document.getElementById(
      "taskTitle"
    ).value =
      task.title || "";

    document.getElementById(
      "taskDescription"
    ).value =
      task.description || "";

    document.getElementById(
      "taskPriority"
    ).value =
      task.priority ||
      "Medium";

    document.getElementById(
      "taskStatus"
    ).value =
      task.status ||
      "Pending";

    document.getElementById(
      "taskProgress"
    ).value =
      task.progress ?? 0;

    document.getElementById(
      "taskDeadline"
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

function closeTaskModal() {

  document
    .getElementById(
      "taskModal"
    )
    ?.classList.remove(
      "open"
    );
}

async function saveTask(
  event
) {

  event.preventDefault();

  const id =
    document.getElementById(
      "taskId"
    ).value;

  const payload = {

    title:
      document
        .getElementById(
          "taskTitle"
        )
        .value
        .trim(),

    description:
      document
        .getElementById(
          "taskDescription"
        )
        .value
        .trim(),

    priority:
      document.getElementById(
        "taskPriority"
      ).value,

    status:
      document.getElementById(
        "taskStatus"
      ).value,

    progress:
      Math.min(
        100,
        Math.max(
          0,
          Number(
            document.getElementById(
              "taskProgress"
            ).value
          )
        )
      ),

    deadline:
      document.getElementById(
        "taskDeadline"
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

    closeTaskModal();

    await loadDashboard();

  } catch (error) {

    showToast(
      error.message,
      "error"
    );
  }
}
