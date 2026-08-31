  //  STUDYTRACK REFLECTION HISTORY

let reflections = [];
let filteredReflections = [];

  //  PAGE LOAD

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (!requireAuth()) {
      return;
    }

    setupEvents();

    await loadReflections();

  }
);

  //  EVENT SETUP

function setupEvents() {

  const searchInput =
    document.getElementById(
      "reflectionSearch"
    );

  const dateInput =
    document.getElementById(
      "historyDate"
    );

  const clearButton =
    document.getElementById(
      "clearHistoryDate"
    );

  const modal =
    document.getElementById(
      "historyEditModal"
    );

  const closeButton =
    document.getElementById(
      "closeHistoryEdit"
    );

  const cancelButton =
    document.getElementById(
      "cancelHistoryEdit"
    );

  const editForm =
    document.getElementById(
      "historyEditForm"
    );

    //  SEARCH

  searchInput?.addEventListener(
    "input",
    applyFilters
  );

    //  DATE FILTER

  dateInput?.addEventListener(
    "change",
    applyFilters
  );

    //  CLEAR DATE

  clearButton?.addEventListener(
    "click",
    () => {

      if (dateInput) {
        dateInput.value = "";
      }

      applyFilters();

    }
  );

    //  CLOSE MODAL

  closeButton?.addEventListener(
    "click",
    closeEditModal
  );

  cancelButton?.addEventListener(
    "click",
    closeEditModal
  );

    //  CLICK OUTSIDE MODAL

  modal?.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        closeEditModal();

      }

    }
  );

    //  EDIT FORM

  editForm?.addEventListener(
    "submit",
    updateReflection
  );

    //  ESCAPE

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        modal?.classList.contains("open")
      ) {

        closeEditModal();

      }

    }
  );

}

  //  LOAD REFLECTIONS

async function loadReflections() {

  showLoadingState();

  try {

    const data =
      await apiRequest(
        "/reflections"
      );

    if (
      Array.isArray(data)
    ) {

      reflections = data;

    }

    else if (
      Array.isArray(
        data?.reflections
      )
    ) {

      reflections =
        data.reflections;

    }

    else {

      reflections = [];

    }

      //  NEWEST FIRST

    reflections.sort(
      (a, b) => {

        return (
          getReflectionTimestamp(b) -
          getReflectionTimestamp(a)
        );

      }
    );


    updateStatistics();

    applyFilters();

  }

  catch (error) {

    console.error(
      "Reflection loading error:",
      error
    );


    showErrorState();


    showToast(
      error.message ||
      "Unable to load reflections.",
      "error"
    );

  }

}

//  FILTERS

function applyFilters() {

  const searchInput =
    document.getElementById(
      "reflectionSearch"
    );

  const dateInput =
    document.getElementById(
      "historyDate"
    );


  const search =
    (
      searchInput?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const selectedDate =
    (
      dateInput?.value ||
      ""
    ).trim();


  filteredReflections =
    reflections.filter(
      reflection => {

          //  SEARCH FILTER

        if (search) {

          const searchableText = [

            reflection.reflection,

            reflection.whatILearned,

            reflection.challenges,

            reflection.priority,

            reflection.status

          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          if (
            !searchableText.includes(
              search
            )
          ) {

            return false;

          }

        }

          //  DATE FILTER

        if (selectedDate) {

          const reflectionDate =
            getReflectionDate(
              reflection
            );


          console.log(
            "Date Filter:",
            {
              selectedDate,
              reflectionDate,
              reflection
            }
          );


          if (
            reflectionDate !==
            selectedDate
          ) {

            return false;

          }

        }


        return true;

      }
    );


  renderHistory();

}

  //  GET REFLECTION DATE

function getReflectionDate(
  reflection
) {
  const possibleDates = [

    reflection?.date,

    reflection?.reflectionDate,

    reflection?.createdDate,

    reflection?.createdAt

  ];


  for (
    const value of possibleDates
  ) {

    if (!value) {
      continue;
    }


    const normalized =
      normalizeDateValue(
        value
      );


    if (normalized) {

      return normalized;

    }

  }


  return "";

}

  //  NORMALIZE DATE VALUE

function normalizeDateValue(
  value
) {

  if (!value) {
    return "";
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {

    return value;

  }


  /*
    MongoDB ISO date

    Example:

    2026-08-27T18:30:00.000Z
  */

  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );

}

  //  CLEAR FILTERS

function clearFilters() {

  const searchInput =
    document.getElementById(
      "reflectionSearch"
    );

  const dateInput =
    document.getElementById(
      "historyDate"
    );

  if (searchInput) {

    searchInput.value = "";

  }

  if (dateInput) {

    dateInput.value = "";

  }

  applyFilters();
}

  //  CLEAR FILTERS FROM EMPTY STATE

window.clearFiltersFromEmpty =
  function () {
    clearFilters();
  };

  //  UPDATE STATISTICS

function updateStatistics() {

  const total =
    reflections.length;

  const completed =
    reflections.filter(
      reflection => {

        return (
          String(
            reflection.status ||
            ""
          )
            .trim()
            .toLowerCase() ===
          "completed"
        );

      }
    ).length;

  const totalElement =
    document.getElementById(
      "totalReflections"
    );

  const completedElement =
    document.getElementById(
      "completedReflections"
    );

  if (totalElement) {

    totalElement.textContent =
      total;

  }

  if (completedElement) {

    completedElement.textContent =
      completed;

  }

/*    Overall progress */

  let averageProgress = 0;

  if (total > 0) {

    const totalProgress =
      reflections.reduce(
        (
          sum,
          reflection
        ) => {

          return (
            sum +
            clampProgress(
              reflection.progress
            )
          );

        },
        0
      );

    averageProgress =
      Math.round(
        totalProgress /
        total
      );

  }

  const progressElement =
    document.getElementById(
      "overallProgress"
    );

  const progressFill =
    document.getElementById(
      "overallProgressFill"
    );

  if (progressElement) {

    progressElement.textContent =
      `${averageProgress}%`;

  }

  if (progressFill) {

    progressFill.style.width =
      `${averageProgress}%`;

  }

}

  //  RENDER HISTORY

function renderHistory() {

  const container =
    document.getElementById(
      "historyList"
    );


  if (!container) {
    return;
  }


  updateReflectionCount(
    filteredReflections.length
  );


  if (
    filteredReflections.length ===
    0
  ) {

    renderEmptyState(
      container
    );

    return;

  }

  /*
    IMPORTANT:

    Every reflection is its own
    separate card.

    No grouping by date.
  */

  container.innerHTML =
    filteredReflections
      .map(
        reflection =>
          renderReflectionCard(
            reflection
          )
      )
      .join("");

}

  //  REFLECTION CARD

function renderReflectionCard(
  item
) {

  const progress =
    clampProgress(
      item.progress
    );


  const priority =
    item.priority ||
    "Medium";


  const status =
    item.status ||
    "Pending";


  const reflection =
    item.reflection ||
    "No reflection added.";


  const learned =
    item.whatILearned ||
    "No learning details added.";


  const challenges =
    item.challenges ||
    "No challenges recorded.";


  const date =
    formatLongDate(
      getReflectionDate(
        item
      )
    );


  const relativeDate =
    getRelativeDateLabel(
      getReflectionDate(
        item
      )
    );


  return `

    <article
      class="reflection-card"
      data-id="${escapeHTML(
        item._id
      )}"
    >


      <!-- =================================================
           CARD HEADER
      ================================================== -->

      <div
        class="reflection-card-header"
      >


        <div
          class="reflection-date"
        >

          <div
            class="reflection-date-icon"
          >
            📅
          </div>


          <div>

            <h3>
              ${escapeHTML(
                date
              )}
            </h3>

            <span>
              ${escapeHTML(
                relativeDate
              )}
            </span>

          </div>

        </div>


        <!-- ACTIONS -->

        <div
          class="reflection-actions"
        >

          <button
            type="button"
            class="reflection-action edit"
            title="Edit Reflection"
            onclick="editReflection('${escapeAttribute(
              item._id
            )}')"
          >

            ✎

            <span>
              Edit
            </span>

          </button>


          <button
            type="button"
            class="reflection-action delete"
            title="Delete Reflection"
            onclick="deleteReflection('${escapeAttribute(
              item._id
            )}')"
          >

            🗑

            <span>
              Delete
            </span>

          </button>

        </div>

      </div>


      <!-- =================================================
           CARD CONTENT
      ================================================== -->

      <div
        class="reflection-card-content"
      >


        <!-- HOW WAS YOUR DAY -->

        <div
          class="reflection-content-section"
        >

          <h4>
            HOW WAS YOUR DAY?
          </h4>


          <div
            class="content-divider"
          ></div>


          <p>
            ${escapeHTML(
              reflection
            )}
          </p>

        </div>


        <!-- WHAT I LEARNED -->

        <div
          class="reflection-content-section"
        >

          <h4>
            WHAT I LEARNED
          </h4>


          <div
            class="content-divider"
          ></div>


          <p>
            ${escapeHTML(
              learned
            )}
          </p>

        </div>


        <!-- CHALLENGES -->

        <div
          class="reflection-content-section"
        >

          <h4>
            CHALLENGES
          </h4>


          <div
            class="content-divider"
          ></div>


          <p>
            ${escapeHTML(
              challenges
            )}
          </p>

        </div>

      </div>


      <!-- =================================================
           CARD FOOTER
      ================================================== -->

      <div
        class="reflection-card-footer"
      >


        <!-- PRIORITY -->

        <div
          class="reflection-meta"
        >

          <span
            class="meta-label"
          >
            Priority
          </span>


          <span
            class="
              reflection-badge
              ${getPriorityClass(
                priority
              )}
            "
          >

            <span
              class="badge-dot"
            ></span>

            ${escapeHTML(
              priority
            )}

          </span>

        </div>


        <!-- STATUS -->

        <div
          class="reflection-meta"
        >

          <span
            class="meta-label"
          >
            Status
          </span>


          <span
            class="
              reflection-badge
              ${getStatusClass(
                status
              )}
            "
          >

            <span
              class="badge-icon"
            >

              ${
                String(
                  status
                ).toLowerCase() ===
                "completed"
                  ? "✓"
                  :
                String(
                  status
                ).toLowerCase() ===
                "in progress"
                  ? "◷"
                  : "○"
              }

            </span>

            ${escapeHTML(
              status
            )}

          </span>

        </div>


        <!-- PROGRESS -->

        <div
          class="reflection-progress-meta"
        >

          <div
            class="progress-title"
          >

            <span>
              Progress
            </span>

            <strong>
              ${progress}%
            </strong>

          </div>


          <div
            class="reflection-progress-track"
          >

            <div
              class="reflection-progress-fill"
              style="width:${progress}%"
            ></div>

          </div>

        </div>


        <!-- DEADLINE -->

        <div
          class="
            reflection-meta
            deadline-meta
          "
        >

          <span
            class="meta-label"
          >
            Deadline
          </span>


          <strong>

            ${
              item.deadline
                ? escapeHTML(
                    formatDeadline(
                      item.deadline
                    )
                  )
                : "—"
            }

          </strong>

        </div>

      </div>

    </article>

  `;

}

  //  EDIT REFLECTION

window.editReflection =
  function (id) {

    const reflection =
      reflections.find(
        item =>
          String(
            item._id
          ) === String(id)
      );


    if (!reflection) {

      showToast(
        "Reflection not found.",
        "error"
      );

      return;

    }


    document.getElementById(
      "historyReflectionId"
    ).value =
      reflection._id;


    document.getElementById(
      "historyReflection"
    ).value =
      reflection.reflection ||
      "";


    document.getElementById(
      "historyLearned"
    ).value =
      reflection.whatILearned ||
      "";


    document.getElementById(
      "historyChallenges"
    ).value =
      reflection.challenges ||
      "";


    document.getElementById(
      "historyPriority"
    ).value =
      reflection.priority ||
      "Medium";


    document.getElementById(
      "historyStatus"
    ).value =
      reflection.status ||
      "Pending";


    document.getElementById(
      "historyProgress"
    ).value =
      clampProgress(
        reflection.progress
      );


    document.getElementById(
      "historyDeadline"
    ).value =
      reflection.deadline
        ? normalizeDateValue(
            reflection.deadline
          )
        : "";


    document
      .getElementById(
        "historyEditModal"
      )
      .classList.add(
        "open"
      );


    setTimeout(
      () => {

        document
          .getElementById(
            "historyReflection"
          )
          ?.focus();

      },
      100
    );

  };


/* ============================================================
   CLOSE EDIT MODAL
============================================================ */

function closeEditModal() {

  const modal =
    document.getElementById(
      "historyEditModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "open"
  );

}


/* ============================================================
   UPDATE REFLECTION
============================================================ */

async function updateReflection(
  event
) {

  event.preventDefault();


  const id =
    document.getElementById(
      "historyReflectionId"
    )?.value;


  const reflection =
    document.getElementById(
      "historyReflection"
    )?.value.trim();


  if (!id) {

    showToast(
      "Reflection ID is missing.",
      "error"
    );

    return;

  }


  if (!reflection) {

    showToast(
      "Please write about your day.",
      "error"
    );

    return;

  }


  const progress =
    clampProgress(
      document.getElementById(
        "historyProgress"
      )?.value
    );


  const payload = {

    reflection:

      reflection,


    whatILearned:

      document.getElementById(
        "historyLearned"
      )?.value.trim() ||
      "",


    challenges:

      document.getElementById(
        "historyChallenges"
      )?.value.trim() ||
      "",


    priority:

      document.getElementById(
        "historyPriority"
      )?.value ||
      "Medium",


    status:

      document.getElementById(
        "historyStatus"
      )?.value ||
      "Pending",


    progress:

      progress,


    deadline:

      document.getElementById(
        "historyDeadline"
      )?.value ||
      null

  };


  const submitButton =
    document.querySelector(
      "#historyEditForm button[type='submit']"
    );


  try {

    if (submitButton) {

      submitButton.disabled =
        true;

      submitButton.textContent =
        "Saving...";

    }


    await apiRequest(
      `/reflections/${id}`,
      {
        method: "PUT",

        body:
          JSON.stringify(
            payload
          )

      }
    );


    closeEditModal();


    showToast(
      "Reflection updated successfully."
    );


    await loadReflections();

  }

  catch (error) {

    console.error(
      "Update reflection error:",
      error
    );


    showToast(
      error.message ||
      "Unable to update reflection.",
      "error"
    );

  }

  finally {

    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.textContent =
        "Save Changes";

    }

  }

}


/* ============================================================
   DELETE REFLECTION
============================================================ */

window.deleteReflection =
  async function (id) {

    const reflection =
      reflections.find(
        item =>
          String(
            item._id
          ) === String(id)
      );


    if (!reflection) {
      return;
    }


    const date =
      formatLongDate(
        getReflectionDate(
          reflection
        )
      );


    const confirmed =
      window.confirm(
        `Are you sure you want to delete the reflection for ${date}?\n\nThis action cannot be undone.`
      );


    if (!confirmed) {
      return;
    }


    try {

      await apiRequest(
        `/reflections/${id}`,
        {
          method: "DELETE"
        }
      );


      showToast(
        "Reflection deleted successfully."
      );


      await loadReflections();

    }

    catch (error) {

      console.error(
        "Delete reflection error:",
        error
      );


      showToast(
        error.message ||
        "Unable to delete reflection.",
        "error"
      );

    }

  };


/* ============================================================
   EMPTY STATE
============================================================ */

function renderEmptyState(
  container
) {

  const search =
    document.getElementById(
      "reflectionSearch"
    )?.value.trim();


  const date =
    document.getElementById(
      "historyDate"
    )?.value;


  let message =
    "You haven't added any reflections yet.";


  if (
    search ||
    date
  ) {

    message =
      "No reflections match your current filters.";

  }


  container.innerHTML = `

    <div
      class="history-empty"
    >

      <div
        class="empty-icon"
      >
        ◷
      </div>


      <h3>
        No reflections found
      </h3>


      <p>
        ${escapeHTML(
          message
        )}
      </p>


      ${
        search || date
          ? `
            <button
              type="button"
              class="primary-btn"
              onclick="clearFiltersFromEmpty()"
            >
              Clear Filters
            </button>
          `
          : `
            <a
              href="/goals.html"
              class="primary-btn"
            >
              ＋ Add Reflection
            </a>
          `
      }

    </div>

  `;

}


/* ============================================================
   LOADING
============================================================ */

function showLoadingState() {

  const container =
    document.getElementById(
      "historyList"
    );


  if (!container) {
    return;
  }


  container.innerHTML = `

    <div
      class="history-loading"
    >

      <div
        class="loading-spinner"
      ></div>

      <span>
        Loading your reflections...
      </span>

    </div>

  `;

}


/* ============================================================
   ERROR
============================================================ */

function showErrorState() {

  const container =
    document.getElementById(
      "historyList"
    );


  if (!container) {
    return;
  }


  container.innerHTML = `

    <div
      class="history-empty"
    >

      <div
        class="empty-icon"
      >
        !
      </div>


      <h3>
        Unable to load reflections
      </h3>


      <p>
        Something went wrong while loading
        your journal.
      </p>


      <button
        type="button"
        class="primary-btn"
        onclick="loadReflections()"
      >
        Try Again
      </button>

    </div>

  `;

}


/* ============================================================
   REFLECTION COUNT
============================================================ */

function updateReflectionCount(
  count
) {

  const element =
    document.getElementById(
      "reflectionCount"
    );


  if (!element) {
    return;
  }


  element.textContent =
    `${count} reflection${
      count === 1
        ? ""
        : "s"
    }`;

}


/* ============================================================
   PROGRESS
============================================================ */

function clampProgress(
  value
) {

  const number =
    Number(value);


  if (
    Number.isNaN(
      number
    )
  ) {

    return 0;

  }


  return Math.min(
    100,
    Math.max(
      0,
      number
    )
  );

}


/* ============================================================
   PRIORITY CLASS
============================================================ */

function getPriorityClass(
  priority
) {

  const value =
    String(
      priority || ""
    )
      .trim()
      .toLowerCase();


  if (
    value === "high"
  ) {

    return "priority-high";

  }


  if (
    value === "low"
  ) {

    return "priority-low";

  }


  return "priority-medium";

}


/* ============================================================
   STATUS CLASS
============================================================ */

function getStatusClass(
  status
) {

  const value =
    String(
      status || ""
    )
      .trim()
      .toLowerCase();


  if (
    value === "completed"
  ) {

    return "status-completed";

  }


  if (
    value === "in progress"
  ) {

    return "status-progress";

  }


  return "status-pending";

}


/* ============================================================
   GET TIMESTAMP
============================================================ */

function getReflectionTimestamp(
  reflection
) {

  const date =
    reflection?.createdAt ||
    reflection?.createdDate ||
    reflection?.reflectionDate ||
    reflection?.date;


  if (!date) {
    return 0;
  }


  /*
    Date-only values
    */

  if (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  ) {

    return new Date(
      `${date}T00:00:00`
    ).getTime();

  }


  const timestamp =
    new Date(date).getTime();


  return Number.isNaN(
    timestamp
  )
    ? 0
    : timestamp;

}


/* ============================================================
   LONG DATE
============================================================ */

function formatLongDate(
  value
) {

  if (!value) {
    return "Unknown date";
  }


  const normalized =
    normalizeDateValue(
      value
    );


  if (!normalized) {
    return "Unknown date";
  }


  const [
    year,
    month,
    day
  ] =
    normalized.split("-");


  const date =
    new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );


  return date.toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );

}


/* ============================================================
   DEADLINE DATE
============================================================ */

function formatDeadline(
  value
) {

  if (!value) {
    return "—";
  }


  const normalized =
    normalizeDateValue(
      value
    );


  if (!normalized) {
    return "—";
  }


  const [
    year,
    month,
    day
  ] =
    normalized.split("-");


  const date =
    new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );


  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );

}


/* ============================================================
   RELATIVE DATE
============================================================ */

function getRelativeDateLabel(
  dateValue
) {

  if (!dateValue) {
    return "";
  }


  const normalized =
    normalizeDateValue(
      dateValue
    );


  if (!normalized) {
    return "";
  }


  const [
    year,
    month,
    day
  ] =
    normalized.split("-");


  const selected =
    new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );


  selected.setHours(
    0,
    0,
    0,
    0
  );


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  const difference =
    Math.round(
      (
        today.getTime() -
        selected.getTime()
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    );


  if (
    difference === 0
  ) {

    return "Today";

  }


  if (
    difference === 1
  ) {

    return "Yesterday";

  }


  if (
    difference > 1 &&
    difference < 7
  ) {

    return `${difference} days ago`;

  }


  if (
    difference === 7
  ) {

    return "1 week ago";

  }


  if (
    difference > 7
  ) {

    return `${difference} days ago`;

  }


  return "Journal entry";

}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


/* ============================================================
   ESCAPE ATTRIBUTE
============================================================ */

function escapeAttribute(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "\\",
      "\\\\"
    )
    .replaceAll(
      "'",
      "\\'"
    );

}


/* ============================================================
   TOAST
============================================================ */

function showToast(
  message,
  type = "success"
) {

  const container =
    document.getElementById(
      "toastContainer"
    );


  if (!container) {

    alert(message);

    return;

  }


  const toast =
    document.createElement(
      "div"
    );


  toast.className =
    `history-toast ${type}`;


  toast.textContent =
    message;


  container.appendChild(
    toast
  );


  setTimeout(
    () => {

      toast.classList.add(
        "hide"
      );


      setTimeout(
        () => {

          toast.remove();

        },
        250
      );

    },
    3000
  );

}