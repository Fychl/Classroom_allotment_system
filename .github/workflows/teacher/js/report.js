document.getElementById("reportForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("teacherName").value;
    const fromEmail = document.getElementById("teacherEmail").value;
    const toEmail = document.getElementById("receiverEmail").value;
    const type = document.getElementById("issueType").value;
    const description = document.getElementById("issueDescription").value;

    if (!name || !fromEmail || !toEmail || !type || !description) {
        alert("Please fill out all fields.");
        return;
    }

    // For now, just show a confirmation
    console.log("Report submitted:", { name, fromEmail, toEmail, type, description });

    // Simulate report submission
    document.getElementById("confirmationMsg").style.display = "block";
    document.getElementById("reportForm").reset();

    setTimeout(() => {
        document.getElementById("confirmationMsg").style.display = "none";
    }, 4000);
});
