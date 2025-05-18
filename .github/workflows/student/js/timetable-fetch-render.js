document.addEventListener('DOMContentLoaded', () => {
    fetchTimetable();
});

async function fetchTimetable() {
    try {
        const response = await fetch('/api/timetable');
        if (!response.ok) {
            throw new Error('Failed to fetch timetable data');
        }
        const timetableData = await response.json();
        renderTimetable(timetableData);
    } catch (error) {
        console.error('Error fetching timetable:', error);
        const timetableContent = document.getElementById('timetable-content');
        if (timetableContent) {
            timetableContent.innerHTML = '<p>Error loading timetable data.</p>';
        }
    }
}

function renderTimetable(timetableData) {
    const timetableContent = document.getElementById('timetable-content');
    if (!timetableContent) return;

    if (!timetableData || Object.keys(timetableData).length === 0) {
        timetableContent.innerHTML = '<p>No timetable data available.</p>';
        return;
    }

    let html = '';
    for (const day of Object.keys(timetableData)) {
        const periods = timetableData[day];
        html += `<h3>${capitalize(day)}</h3>`;
        if (!periods || periods.length === 0) {
            html += '<p>No timetable data available for this day.</p>';
            continue;
        }
        html += '<table class="timetable-table" border="1" cellspacing="0" cellpadding="5">';
        html += '<thead><tr><th>Period</th><th>Subject</th><th>Time</th><th>Teacher</th><th>Room</th></tr></thead><tbody>';
        for (const period of periods) {
            html += `<tr>
                <td>${period.periodNumber || ''}</td>
                <td>${period.subject || ''}</td>
                <td>${period.startTime || ''} - ${period.endTime || ''}</td>
                <td>${period.teacher || ''}</td>
                <td>${period.roomId || ''}</td>
            </tr>`;
        }
        html += '</tbody></table>';
    }
    timetableContent.innerHTML = html;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
