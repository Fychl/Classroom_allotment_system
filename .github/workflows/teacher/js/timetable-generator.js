const savedDayData = {}; // Store saved data for each day

const PERIOD1_START_TIME = "09:00"; // Start time for period1 set to 9 AM

function toggleDayConfig(checkbox) {
    const day = checkbox.value.toLowerCase();
    const configDiv = document.getElementById(`${day}-config`);
    configDiv.style.display = checkbox.checked ? "block" : "none";
}

let teacherListData = [];
let teacherList = [];
let subjectList = [];

async function fetchTeacherAndSubjectData() {
    try {
        console.log('Fetching teacher and subject data from http://localhost:5000/api/teachers');
        const response = await fetch('http://localhost:5000/api/teachers');
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error('Failed to fetch teacher data');
        }
        const data = await response.json();
        console.log('Fetched teacher data:', data);
        teacherListData = data;
        teacherList = [...new Set(data.map(t => t.fullName))];
        subjectList = [...new Set(data.flatMap(t => t.courses))];

        // Update all elements with class 'teacher-name' with options
        updateTeacherNameOptions();
    } catch (error) {
        console.error('Error fetching teacher and subject data:', error);
    }
}

function updateTeacherNameOptions() {
    const teacherNameElements = document.querySelectorAll('.teacher-name');
    teacherNameElements.forEach(selectElem => {
        // Clear existing options
        selectElem.innerHTML = '';
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Teacher';
        selectElem.appendChild(defaultOption);

        // Add teacher options
        teacherList.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher;
            option.textContent = teacher;
            selectElem.appendChild(option);
        });
    });
}

function addPeriod(day) {
    const container = document.getElementById(`${day}-periods`);
    // Find the next available period number for new period input form
    let nextPeriodNumber = 1;
    if (savedDayData[day]) {
        const existingPeriodNumbers = Object.keys(savedDayData[day]).map(Number);
        while (existingPeriodNumbers.includes(nextPeriodNumber)) {
            nextPeriodNumber++;
        }
    }

    // Check if there is already an unsaved period input form for this day and period number
    const existingPeriodDiv = document.getElementById(`${day}-period-${nextPeriodNumber}`);
    if (existingPeriodDiv) {
        alert("Please save the current period before adding a new one.");
        return;
    }

    const teacherOptions = teacherList.map(teacher => `<option value="${teacher}">${teacher}</option>`).join('');

    const periodDiv = document.createElement("div");
    periodDiv.className = "period-input";
    periodDiv.id = `${day}-period-${nextPeriodNumber}`;

    periodDiv.innerHTML = `
        <label>Select Period: 
        <select class="period-number select" required>
            <option value="">Select Period</option>
            ${(() => {
                const options = [];
                for(let i = 1; i <= 9; i++) {
                    options.push(`<option value="${i}" ${i === nextPeriodNumber ? "selected" : ""}>Period ${i}</option>`);
                }
                return options.join("");
            })()}
        </select>
        </label>
        <label>Teacher: 
        <select class="teacher-name" required>
            <option value="">Select Teacher</option>
            ${teacherOptions}
        </select>
        </label>
        <label>Subject: 
        <select class="subject-name" required disabled>
            <option value="">Select Subject</option>
        </select>
        </label>
        <label>Department: 
          <select class="department" required>
            <option value="" disabled selected>Select Department</option>
            <option value="Business">Business</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Forestry">Forestry</option>
            <option value="Biotechnology">Biotechnology</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>Room ID: 
          <select class="room-id" required>
            <option value="" disabled selected>Select Room ID</option>
            <option value="C101"> C101</option>
            <option value="C102"> C102</option>
            <option value="C103"> C103</option>
            <option value="C104"> C104</option>
            <option value="C105"> C105</option>
            <option value="C106"> BUS106</option>
            <option value="C107"> BUS107</option>
            <option value="C108"> FR108</option>
            <option value="C109"> FR109</option>
            <option value="C110"> BIO110</option>
            <option value="C110"> BIO111</option>
            <option value="C110"> BIO112</option>
          </select>
        </label>
        <button onclick="savePeriod('${day}', ${nextPeriodNumber})">Save Period</button>
        <hr>
    `;

    container.appendChild(periodDiv);

    // Add event listener to update heading when period number changes
    const periodNumberSelect = periodDiv.querySelector(".period-number");
    const heading = document.getElementById(`period-heading-${day}-${nextPeriodNumber}`);
    periodNumberSelect.addEventListener("change", () => {
        if (heading) {
            heading.textContent = `Period ${periodNumberSelect.value}`;
        }
    });

    // Add event listener to teacher select to update subject options
    const teacherSelect = periodDiv.querySelector(".teacher-name");
    const subjectSelect = periodDiv.querySelector(".subject-name");

    teacherSelect.addEventListener("change", () => {
        const selectedTeacher = teacherSelect.value;
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        subjectSelect.disabled = true;
        if (selectedTeacher) {
            const teacherData = teacherListData.find(t => t.fullName === selectedTeacher);
            if (teacherData && teacherData.courses && teacherData.courses.length > 0) {
                teacherData.courses.forEach(course => {
                    const option = document.createElement("option");
                    // Remove subject code from option value and text
                    const courseName = course.split(" ")[0]; // Assuming course string contains code and name separated by space
                    option.value = courseName;
                    option.textContent = courseName;
                    subjectSelect.appendChild(option);
                });
                subjectSelect.disabled = false;
            }
        }
    });
}

const fixedPeriodTimes = {};

function calculateFixedPeriodTimes() {
    const periodDurationInput = document.getElementById("periodDuration");
    let periodDuration = parseInt(periodDurationInput.value);
    if (isNaN(periodDuration) || periodDuration < 30 || periodDuration > 120) {
        periodDuration = 45; // default fallback
    }

    const breakDurationInput = document.getElementById("breakDuration");
    let breakDuration = parseInt(breakDurationInput.value);
    if (isNaN(breakDuration) || breakDuration < 0 || breakDuration > 30) {
        breakDuration = 5; // default fallback
    }

    let startTime = PERIOD1_START_TIME;
    for (let i = 1; i <= 9; i++) {
        const endTime = calculateEndTime(startTime, periodDuration);
        fixedPeriodTimes[i] = { startTime, endTime };
        startTime = calculateEndTime(endTime, breakDuration);
    }
}

function savePeriod(day, periodNumber) {
    const periodDiv = document.getElementById(`${day}-period-${periodNumber}`);
    if (!periodDiv) {
        alert("Period input not found.");
        return;
    }

    const periodNumberSelected = parseInt(periodDiv.querySelector(".period-number").value);
    const subject = periodDiv.querySelector(".subject-name").value.trim();
    const teacher = periodDiv.querySelector(".teacher-name").value.trim();
    const department = periodDiv.querySelector(".department").value.trim();
    const roomId = periodDiv.querySelector(".room-id").value.trim();

    if (!periodNumberSelected || !subject || !teacher || !department || !roomId) {
        alert("Please fill all fields before saving.");
        return;
    }

    if (!savedDayData[day]) {
        savedDayData[day] = {};
    }

    // Calculate fixed startTime and endTime for this period
    if (Object.keys(fixedPeriodTimes).length === 0) {
        calculateFixedPeriodTimes();
    }
    const { startTime, endTime } = fixedPeriodTimes[periodNumberSelected];

    const periodData = { periodNumber: periodNumberSelected, startTime, endTime, subject, teacher, department, roomId };

    savedDayData[day][periodNumberSelected] = periodData;

    periodDiv.remove();

    updateSavedPeriodsDisplay();

    alert(`Period ${periodNumberSelected} for ${capitalize(day)} saved successfully.`);
}

function calculateEndTime(startTimeStr, periodDuration) {
    const [startHour, startMinute] = startTimeStr.split(":").map(Number);
    let endHour = startHour;
    let endMinute = startMinute + periodDuration;

    if (endMinute >= 60) {
        endHour += Math.floor(endMinute / 60);
        endMinute = endMinute % 60;
    }
    if (endHour >= 24) {
        endHour = endHour % 24;
    }

    return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

function updateSavedPeriodsDisplay() {
    const displayContainer = document.getElementById("saved-periods-content");
    if (!displayContainer) return;
    displayContainer.innerHTML = "";

    const table = document.createElement("table");
    table.style.width = "100%";
    table.border = "1";

    const headerRow = document.createElement("tr");

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    days.forEach(day => {
        const th = document.createElement("th");
        th.textContent = capitalize(day);
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    let maxPeriods = 9;

    for (let i = 1; i <= maxPeriods; i++) {
        const row = document.createElement("tr");

        days.forEach(day => {
            const cell = document.createElement("td");
            if (savedDayData[day] && savedDayData[day][i]) {
                const period = savedDayData[day][i];
                cell.innerHTML = `
                    <strong>Subject:</strong> ${period.subject}<br>
                    Time: ${period.startTime} - ${period.endTime}<br>
                    Teacher: ${period.teacher}<br>
                    Department: ${period.department}<br>
                    Room ID: ${period.roomId}<br>
                    <button onclick="editPeriod('${day}', ${i})">Edit</button>
                    <button onclick="deletePeriod('${day}', ${i})" style="color:red">Delete</button>
                `;
            } else {
                cell.textContent = "-";
            }
            row.appendChild(cell);
        });

        table.appendChild(row);
    }

    displayContainer.appendChild(table);
}

function editPeriod(day, periodNumber) {
    const data = savedDayData[day] ? savedDayData[day][periodNumber] : null;
    if (!data) {
        alert("Period data not found.");
        return;
    }
    const container = document.getElementById(`${day}-periods`);
    if (!container) return;

    const periodDiv = document.createElement("div");
    periodDiv.className = "period-input";
    periodDiv.id = `${day}-period-${periodNumber}`;

    periodDiv.innerHTML = `
        <h4>Edit Period ${periodNumber}</h4>
        <label>Period Number: 
        <select class="period-number select" required>
            <option value="">Select Period</option>
            ${(() => {
                const options = [];
                for (let i = 1; i <= 9; i++) {
                    options.push(`<option value="${i}" ${data.periodNumber == i ? "selected" : ""}>Period ${i}</option>`);
                }
                return options.join("");
            })()}
        </select>
        </label>
        <label>Subject: <input type="text" class="subject-name" value="${data.subject}" required></label>
        <label>Teacher: <input type="text" class="teacher-name" value="${data.teacher}" required></label>
        <label>Department: 
          <select class="department" required>
            <option value="Business" ${data.department === 'Business' ? 'selected' : ''}>Business</option>
            <option value="Computer Science" ${data.department === 'Computer Science' ? 'selected' : ''}>Computer Science</option>
            <option value="Forestry" ${data.department === 'Forestry' ? 'selected' : ''}>Forestry</option>
            <option value="Biotechnology" ${data.department === 'Biotechnology' ? 'selected' : ''}>Biotechnology</option>
            <option value="Other" ${(!['Business', 'Computer Science', 'Forestry', 'Biotechnology'].includes(data.department)) ? 'selected' : ''}>Other</option>
          </select>
        </label>
        <label>Room ID: 
          <select class="room-id" required>
            <option value="C101" ${data.roomId === 'C101' ? 'selected' : ''}>Classroom ID: C101</option>
            <option value="C102" ${data.roomId === 'C102' ? 'selected' : ''}>Classroom ID: C102</option>
            <option value="C103" ${data.roomId === 'C103' ? 'selected' : ''}>Classroom ID: C103</option>
            <option value="C104" ${data.roomId === 'C104' ? 'selected' : ''}>Classroom ID: C104</option>
            <option value="C105" ${data.roomId === 'C105' ? 'selected' : ''}>Classroom ID: C105</option>
            <option value="C106" ${data.roomId === 'C106' ? 'selected' : ''}>Classroom ID: C106</option>
            <option value="C107" ${data.roomId === 'C107' ? 'selected' : ''}>Classroom ID: C107</option>
            <option value="C108" ${data.roomId === 'C108' ? 'selected' : ''}>Classroom ID: C108</option>
            <option value="C109" ${data.roomId === 'C109' ? 'selected' : ''}>Classroom ID: C109</option>
            <option value="C110" ${data.roomId === 'C110' ? 'selected' : ''}>Classroom ID: C110</option>
          </select>
        </label>
        <button onclick="savePeriod('${day}', ${periodNumber})">Save Changes</button>
        <hr>
    `;

    container.appendChild(periodDiv);
}

function deletePeriod(day, periodNumber) {
    if (!savedDayData[day] || !savedDayData[day][periodNumber]) {
        alert("Period data not found.");
        return;
    }
    if (confirm("Are you sure you want to delete this period?")) {
        delete savedDayData[day][periodNumber];
        updateSavedPeriodsDisplay();
    }
}

function generateTimetable() {
    if (Object.keys(savedDayData).length === 0) {
        alert("No period data to generate timetable. Please save periods first.");
        return;
    }

    fetch('http://localhost:5000/api/timetable/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(savedDayData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
            // Fetch updated timetable from backend
            fetch('http://localhost:5000/api/timetable')
            .then(res => res.json())
            .then(timetableData => {
                localStorage.setItem('generatedTimetableData', JSON.stringify(timetableData));
                // Render timetable preview or notify user
                alert("Timetable updated successfully.");
            })
            .catch(err => {
                alert("Error fetching updated timetable: " + err);
            });
        } else if (data.error) {
            alert("Error saving timetable: " + data.error);
        }
    })
    .catch(error => {
        alert("Error saving timetable: " + error);
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function fetchTeacherById(teacherId) {
    try {
        const response = await fetch(`http://localhost:3000/api/teacher/${teacherId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch teacher data by id');
        }
        const teacherData = await response.json();
        console.log('Fetched teacher data by id:', teacherData);
        // Update dropdown or UI elements as needed with teacherData
        // Example: populate a specific dropdown or display teacher info
        return teacherData;
    } catch (error) {
        console.error('Error fetching teacher data by id:', error);
        return null;
    }
}

// Fetch teacher and subject data on script load
fetchTeacherAndSubjectData();
