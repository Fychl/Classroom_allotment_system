// Enhanced Timetable Generator with User Input
class TimetableGenerator {
  constructor() {
    this.periods = [];
    this.initUI();
  }

  initUI() {
    // Create input form
    const form = document.createElement('div');
    form.className = 'timetable-form';
    form.innerHTML = `
      <h3>Create New Timetable</h3>
      <div>
        <label>Start Time: </label>
        <input type="time" id="start-time" value="09:00">
      </div>
      <div>
        <label>Period Duration (mins): </label>
        <input type="number" id="period-duration" value="45" min="30" max="120">
      </div>
      <div>
        <label>Break Duration (mins): </label>
        <input type="number" id="break-duration" value="5" min="0" max="30">
      </div>
      <div id="period-inputs">
        <!-- Period inputs will be added here -->
      </div>
      <button id="add-period">Add Period</button>
      <button id="generate-timetable">Generate Timetable</button>
    `;

    const header = document.querySelector('.timetable-header');
    if (header) {
      header.insertAdjacentElement('afterend', form);
    }

    // Add event listeners
    document.getElementById('add-period').addEventListener('click', () => this.addPeriodInput());
    document.getElementById('generate-timetable').addEventListener('click', () => this.generateTimetable());
    
    // Add initial period
    this.addPeriodInput();
  }

  addPeriodInput() {
    const periodNum = this.periods.length + 1;
    const periodDiv = document.createElement('div');
    periodDiv.className = 'period-input';
    periodDiv.innerHTML = `
      <h4>Period ${periodNum}</h4>
      <input type="text" placeholder="Subject Code" class="subject-input" required>
      <input type="text" placeholder="Room ID" class="room-input" required>
      <input type="text" placeholder="Teacher Name" class="teacher-input" required>
    `;
    document.getElementById('period-inputs').appendChild(periodDiv);
  }

  generateTimetable() {
    this.periods = [];
    const startTime = new Date();
    const [hours, minutes] = document.getElementById('start-time').value.split(':');
    startTime.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const periodDuration = parseInt(document.getElementById('period-duration').value) || 45;
    const breakDuration = parseInt(document.getElementById('break-duration').value) || 5;

    const periodInputs = document.querySelectorAll('.period-input');
    periodInputs.forEach((input, i) => {
      const periodEnd = new Date(startTime);
      periodEnd.setMinutes(periodEnd.getMinutes() + periodDuration);
      
      this.periods.push({
        period: i + 1,
        subject: input.querySelector('.subject-input').value || `Subject ${i+1}`,
        room: input.querySelector('.room-input').value || `Room ${i+1}`,
        teacher: input.querySelector('.teacher-input').value || `Teacher ${i+1}`,
        startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: periodEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // Add break time
      startTime.setMinutes(periodEnd.getMinutes() + breakDuration);
    });

    this.renderTimetable();
  }

  renderTimetable() {
    const timetableContainer = document.getElementById('timetable-content');
    if (!timetableContainer) return;

    let html = '';
    this.periods.forEach(period => {
      html += `
      <div class="period">
        <h3>Period ${period.period}: ${period.subject}</h3>
        <div class="class-info">
          <p><strong>Time:</strong> ${period.startTime} - ${period.endTime}</p>
          <p><strong>Room:</strong> ${period.room}</p>
          <p><strong>Teacher:</strong> ${period.teacher}</p>
        </div>
      </div>`;
    });
    timetableContainer.innerHTML = html;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TimetableGenerator();
});
