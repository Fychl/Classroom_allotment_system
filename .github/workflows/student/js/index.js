document.getElementById('reportForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('teacherName').value;
    const fromEmail = document.getElementById('teacherEmail').value;
    const toEmail = document.getElementById('receiverEmail').value;
    const issueType = document.getElementById('issueType').value;
    const description = document.getElementById('issueDescription').value;

    if (!name || !fromEmail || !toEmail || !issueType || !description) {
        alert('Please fill out all fields.');
        return;
    }

    // Example: Log the form data or send it to the server
    console.log({
        name,
        fromEmail,
        toEmail,
        issueType,
        description
    });

    // Show confirmation message
    const confirmationMsg = document.getElementById('confirmationMsg');
    confirmationMsg.style.display = 'block';

    // Reset form
    this.reset();
});

const profileDropdownInstance = new Dropdown('profileButton', 'profileDropdown');
