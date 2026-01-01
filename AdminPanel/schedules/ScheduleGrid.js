// /AdminPanel/js/AdminPanel/schedules/ScheduleGrid.js
export function createScheduleGrid(containerId) {
  const container = document.getElementById(containerId);
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const hours = Array.from({ length: 13 }, (_, i) => 9 + i); // 9–21 => 9–22

  let html = `
    <table class="min-w-full text-xs border-collapse border border-gray-200">
      <thead class="bg-gray-100 sticky top-0">
        <tr>
          <th class="border p-2 w-20">Time</th>
          ${days.map(d => `<th class="border p-2 text-center">${d}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
  `;

  hours.forEach(hour => {
    const label = `${hour.toString().padStart(2,"0")}:00 – ${(hour+1).toString().padStart(2,"0")}:00`;
    html += `<tr><td class="border p-2 font-medium bg-gray-50">${label}</td>`;
    days.forEach(day => {
      html += `<td class="border p-1 align-top h-16" data-day="${day.toLowerCase()}" data-time="${hour}:00"></td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

export function fillGrid(classes, teachers, onClick) {
  classes.forEach(cls => {
    if (!Array.isArray(cls.schedule)) return;
    const teacher = teachers.find(t => t.id === cls.teacherId);
    cls.schedule.forEach(slot => {
      const cell = document.querySelector(
        `[data-day="${slot.day.toLowerCase()}"][data-time="${slot.start}"]`
      );
      if (!cell) return;
      cell.innerHTML = `
        <div class="bg-blue-100 hover:bg-blue-200 cursor-pointer rounded p-1 mb-1"
             data-class="${cls.id}">
          <div class="font-semibold text-blue-700">${teacher?.name || "?"}</div>
          <div class="text-gray-700">${cls.name}</div>
        </div>
      `;
      cell.querySelector("div").addEventListener("click", () => onClick(cls));
    });
  });
}
