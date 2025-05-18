// ===== PROFILE DROPDOWN FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', function() {
    const profileLogo = document.getElementById('profileLogo');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileButton = document.getElementById('profileButton');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const uploadImageInput = document.getElementById('uploadImageInput');

    // Function to fetch profile data from backend and update dropdown
    async function fetchAndUpdateProfile() {
        console.log('fetchAndUpdateProfile called');
        // Check localStorage for teacherId first
        const teacherId = localStorage.getItem('teacherId') || window.teacherId;
        console.log('Using teacherId:', teacherId);
        if (!teacherId) {
            console.error('teacherId is not defined');
            return;
        }
        try {
            const response = await fetch(`/profile/teacher/${teacherId}`);
            console.log('Fetch response status:', response.status);
            if (!response.ok) {
                console.error('Failed to fetch profile data');
                return;
            }
            const profile = await response.json();
            console.log('Profile data received:', profile);
            // Update DOM elements with profile data
            document.getElementById('profileName').textContent = profile.fullName || '';
            document.getElementById('profileNumber').textContent = profile.teacherId || '';
            document.getElementById('profileEmail').textContent = profile.email || '';
            document.getElementById('profileDepartment').textContent = profile.department || '';
            document.getElementById('profileSubject').textContent = (profile.courses && profile.courses.join(', ')) || '';
        } catch (error) {
            console.error('Error fetching profile data:', error);
        }
    }
    
    // Function to fetch teacher list and populate the select element
    async function fetchAndPopulateTeachers() {
        const teacherSelect = document.getElementById('teacherSelect');
        if (!teacherSelect) {
            console.error('teacherSelect element not found');
            return;
        }
        try {
            const response = await fetch('/api/teachers');
            if (!response.ok) {
                console.error('Failed to fetch teachers list');
                teacherSelect.innerHTML = '<option value="">Failed to load teachers</option>';
                return;
            }
            const teachers = await response.json();
            teacherSelect.innerHTML = ''; // Clear existing options
            teachers.forEach(teacher => {
                const option = document.createElement('option');
                option.value = teacher.fullName;
                const courses = teacher.courses && teacher.courses.length > 0 ? ` (${teacher.courses.join(', ')})` : '';
                option.textContent = teacher.fullName + courses;
                teacherSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching teachers:', error);
            teacherSelect.innerHTML = '<option value="">Error loading teachers</option>';
        }
    }

// Create Dropdown instance for profile dropdown
const profileDropdownInstance = new Dropdown('profileLogo', 'profileDropdown');

// Fetch profile data when dropdown is opened
const originalOpen = profileDropdownInstance.open.bind(profileDropdownInstance);
profileDropdownInstance.open = function() {
    originalOpen();
    fetchAndUpdateProfile();
};

profileLogo.addEventListener('click', () => profileDropdownInstance.toggle());

// Handle image upload
uploadImageBtn.addEventListener('click', function() {
    uploadImageInput.click();
});

    uploadImageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const profileImage = document.getElementById('profileImage');
                const profileAvatar = document.getElementById('profileAvatar');
                profileImage.src = e.target.result; // Update the profile image
                profileAvatar.src = e.target.result; // Update the profile avatar
            };
            reader.readAsDataURL(file);
        }
    });

    // Additional: Toggle profile dropdown on button click inside .profile-logo-container
    if (profileButton && profileDropdown) {
        profileButton.addEventListener('click', toggleProfileDropdown);
    }

    // Call the function to fetch and populate teachers on page load
    fetchAndPopulateTeachers();

    // Call the function to fetch and update profile on page load
    fetchAndUpdateProfile();

    // Listen for login event or check localStorage periodically to auto fetch after login
    window.addEventListener('storage', (event) => {
        if (event.key === 'teacherId' && event.newValue) {
            fetchAndUpdateProfile();
            fetchAndPopulateTeachers();
        }
    });
});

// Dark mode toggle functionality
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;
const containers = document.querySelectorAll('div, section');

// Function to apply dark mode based on localStorage
function applyDarkMode() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
    if (darkModeEnabled) {
        body.classList.add('dark-mode');
        containers.forEach(el => el.classList.add('dark-mode'));
        darkModeToggle.classList = 'fas fa-sun';
    } else {
        body.classList.remove('dark-mode');
        containers.forEach(el => el.classList.remove('dark-mode'));
        darkModeToggle.classList = 'fas fa-moon';
    }
}

// Event listener for toggle button
darkModeToggle.addEventListener('click', () => {
    const darkModeEnabled = body.classList.contains('dark-mode');
    if (darkModeEnabled) {
        body.classList.remove('dark-mode');
        containers.forEach(el => el.classList.remove('dark-mode'));
        localStorage.setItem('darkMode', 'disabled');
        darkModeToggle.classList = 'fas fa-moon';
    } else {
        body.classList.add('dark-mode');
        containers.forEach(el => el.classList.add('dark-mode'));
        localStorage.setItem('darkMode', 'enabled');
        darkModeToggle.classList = 'fas fa-sun';
    }
});

// Apply dark mode on page load
applyDarkMode();
