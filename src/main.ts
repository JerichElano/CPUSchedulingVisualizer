import "./style.css";
import {
  ValidationError,
  nonPreemptivePriority,
  type ProcessInput,
  type SimulationResult,
  type ProcessResult,
  type TimelineSegment,
} from "./scheduler.ts";

const mount = document.getElementById("app");
if (!mount) {
  throw new Error("Missing #app element.");
}

mount.innerHTML = `
  <main class="app">
    <section class="panel">
      <header>
        <h1>Non-Preemptive Priority Scheduler</h1>
        <p>Simulate CPU process scheduling entirely in your browser.</p>
      </header>

      <div class="controls">
        <button type="button" id="addRow">+ Add Process</button>
        <button type="button" id="resetRows">Reset</button>
      </div>

      <form id="processForm">
        <table class="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Arrival</th>
              <th>Burst</th>
              <th>Priority</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="processBody"></tbody>
        </table>

        <div class="form-actions">
          <button type="submit" class="primary">Run Simulation</button>
        </div>
      </form>
    </section>

    <section class="panel" id="resultsPanel" hidden>
      <header>
        <h2>Results</h2>
        <div id="stats"></div>
      </header>

      <table class="table" id="resultsTable">
        <thead>
          <tr>
            <th>Job</th>
            <th>Arrival</th>
            <th>Burst</th>
            <th>Priority</th>
            <th>Completion</th>
            <th>Turnaround</th>
            <th>Waiting</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>

      <div>
        <h3>Timeline</h3>
        <div id="timeline" class="timeline"></div>
      </div>
    </section>

    <template id="rowTemplate">
      <tr>
        <td><input name="job" type="text" maxlength="3" required /></td>
        <td><input name="arrival" type="number" min="0" value="0" required /></td>
        <td><input name="burst" type="number" min="1" value="1" required /></td>
        <td><input name="priority" type="number" min="0" value="0" required /></td>
        <td>
          <button type="button" class="icon removeRow" aria-label="Remove row">×</button>
        </td>
      </tr>
    </template>
  </main>
`;

const processBody = document.getElementById("processBody") as HTMLTableSectionElement;
const rowTemplate = document.getElementById("rowTemplate") as HTMLTemplateElement;
const form = document.getElementById("processForm") as HTMLFormElement;
const resultsPanel = document.getElementById("resultsPanel") as HTMLElement;
const resultsTableBody = document.querySelector<HTMLTableSectionElement>("#resultsTable tbody")!;
const stats = document.getElementById("stats") as HTMLElement;
const timeline = document.getElementById("timeline") as HTMLElement;

const addRowButton = document.getElementById("addRow") as HTMLButtonElement;
const resetButton = document.getElementById("resetRows") as HTMLButtonElement;

const createRow = (jobLabel = "") => {
  const clone = rowTemplate.content.firstElementChild?.cloneNode(true) as HTMLTableRowElement;
  if (!clone) {
    throw new Error("Cannot clone process row template.");
  }

  const inputs = clone.querySelectorAll<HTMLInputElement>("input");
  const [jobInput] = inputs;
  jobInput.value = jobLabel;
  jobInput.placeholder = jobLabel || "Job";

  const removeButton = clone.querySelector<HTMLButtonElement>(".removeRow");
  removeButton?.addEventListener("click", () => {
    if (processBody.children.length > 1) {
      clone.remove();
    }
  });

  processBody.appendChild(clone);
};

const seedRows = (count = 3) => {
  processBody.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const label = String.fromCharCode(65 + i);
    createRow(label);
  }
};

const collectProcesses = (): ProcessInput[] => {
  const rows = Array.from(processBody.querySelectorAll<HTMLTableRowElement>("tr"));
  return rows.map((row, index) => {
    const data = Object.fromEntries(
      Array.from(row.querySelectorAll<HTMLInputElement>("input")).map((input) => [
        input.name,
        input.value.trim(),
      ]),
    );

    return {
      job: data.job || `P${index + 1}`,
      arrival: Number(data.arrival),
      burst: Number(data.burst),
      priority: Number(data.priority),
    };
  });
};

const renderResults = (result: SimulationResult) => {
  resultsPanel.hidden = false;
  stats.textContent = `Average Waiting: ${result.averages.waiting} | Average Turnaround: ${result.averages.turnaround}`;

  resultsTableBody.innerHTML = "";
  result.processes.forEach((proc: ProcessResult) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${proc.job}</td>
      <td>${proc.arrival}</td>
      <td>${proc.burst}</td>
      <td>${proc.priority}</td>
      <td>${proc.completion}</td>
      <td>${proc.turnaround}</td>
      <td>${proc.waiting}</td>
    `;
    resultsTableBody.appendChild(row);
  });

  timeline.innerHTML = "";
  if (!result.timeline.length) {
    timeline.innerHTML = "<p>Timeline unavailable.</p>";
    return;
  }

  result.timeline.forEach((segment: TimelineSegment) => {
    const block = document.createElement("div");
    block.className = "timeline-segment";
    block.style.flex = String(segment.end - segment.start);
    block.innerHTML = `
      ${segment.job}
      <span>${segment.start} → ${segment.end}</span>
    `;
    timeline.appendChild(block);
  });
};

const handleSubmit = (event: SubmitEvent) => {
  event.preventDefault();
  try {
    const result = nonPreemptivePriority(collectProcesses());
    renderResults(result);
  } catch (error) {
    const message =
      error instanceof ValidationError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Simulation failed. Please try again.";
    alert(message);
  }
};

addRowButton.addEventListener("click", () => {
  const nextIndex = processBody.children.length;
  const label = String.fromCharCode(65 + nextIndex);
  createRow(label);
});

resetButton.addEventListener("click", () => seedRows());
form.addEventListener("submit", handleSubmit);

seedRows();



