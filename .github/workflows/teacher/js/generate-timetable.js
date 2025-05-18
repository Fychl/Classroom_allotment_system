let savedDayData = {};

function toggleDayConfig(checkbox) {
    const day = checkbox.value.toLowerCase();
    const configDiv = document.getElementById(`${day}-config`);
    if (checkbox.checked) {
        configDiv.style.display = 'block';
    } else {
        configDiv.style.display = 'none';
    }
}

function collectSavedPeriodData() {
    const savedPeriodsContainer = document.getElementById('saved-periods-content');
    if (!savedPeriodsContainer) {
        console.error('Saved periods container not found');
        return;
    }

    // Reset savedDayData
    savedDayData = {};

    // Assuming saved periods are grouped by day in child elements with data-day attribute
    const dayContainers = savedPeriodsContainer.querySelectorAll('[data-day]');
    dayContainers.forEach(dayContainer => {
        const day = dayContainer.getAttribute('data-day').toLowerCase();
        savedDayData[day] = [];

        // Each period is assumed to be a child element with class 'period'
        const periods = dayContainer.querySelectorAll('.period');
        periods.forEach(periodEl => {
            // Extract period details from the element's dataset or inner text
            const subject = periodEl.querySelector('.subject') ? periodEl.querySelector('.subject').innerText.trim() : '';
            const teacher = periodEl.querySelector('.teacher') ? periodEl.querySelector('.teacher').innerText.trim() : '';
            const code = periodEl.querySelector('.code') ? periodEl.querySelector('.code').innerText.trim() : '';
            const roomId = periodEl.querySelector('.room-id') ? periodEl.querySelector('.room-id').innerText.trim() : '';
            const startTime = periodEl.querySelector('.start-time') ? periodEl.querySelector('.start-time').innerText.trim() : '';
            const endTime = periodEl.querySelector('.end-time') ? periodEl.querySelector('.end-time').innerText.trim() : '';

            savedDayData[day].push({
                subject,
                teacher,
                code,
                roomId,
                startTime,
                endTime
            });
        });
    });
}

function generateTimetable() {
    collectSavedPeriodData();

    if (Object.keys(savedDayData).length === 0) {
        alert("No period data to save. Please add and save periods first.");
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
            // Save timetable data to localStorage for timetable-final-updated.html
            localStorage.setItem('generatedTimetableData', JSON.stringify(savedDayData));
        } else if (data.error) {
            alert("Error saving timetable: " + data.error);
        }
    })
    .catch(error => {
        alert("Error saving timetable: " + error);
    });
}
