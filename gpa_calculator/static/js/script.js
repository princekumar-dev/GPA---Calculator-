// DOM Elements
const coursesContainer = document.getElementById('courses-container');
const modal = document.getElementById('gradeModal');
const closeBtn = document.querySelector('.close');
const calculateBtn = document.querySelector('.calculate-btn');

// Close modal when clicking the close button or outside the modal
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Course counter for unique IDs
let courseCounter = 0;

// Function to create a new course entry
function addCourse() {
    const courseEntry = document.createElement('div');
    courseEntry.className = 'course-entry';
    courseEntry.id = `course-${courseCounter}`;

    courseEntry.innerHTML = `
        <input type="text" placeholder="Course Name" class="course-name" list="course-list" required>
        <input type="number" placeholder="Credits" class="course-credits" min="0.5" max="5" step="0.5" required>
        <select class="course-grade" required>
            <option value="">Select Grade</option>
            ${Object.keys(GRADE_POINTS).map(grade => 
                `<option value="${grade}">${grade}</option>`
            ).join('')}
        </select>
        <button class="btn-danger" onclick="removeCourse(${courseCounter})" aria-label="Remove course">&times;</button>
    `;

    coursesContainer.appendChild(courseEntry);
    
    // Create datalist for course suggestions if it doesn't exist
    if (!document.getElementById('course-list')) {
        const datalist = document.createElement('datalist');
        datalist.id = 'course-list';
        DEFAULT_COURSES.forEach(course => {
            const option = document.createElement('option');
            option.value = course.name;
            datalist.appendChild(option);
        });
        document.body.appendChild(datalist);
    }

    // Auto-fill credits when selecting a default course
    const courseNameInput = courseEntry.querySelector('.course-name');
    const creditsInput = courseEntry.querySelector('.course-credits');
    
    courseNameInput.addEventListener('change', () => {
        const selectedCourse = DEFAULT_COURSES.find(
            course => course.name === courseNameInput.value
        );
        if (selectedCourse) {
            creditsInput.value = selectedCourse.credits;
        }
    });

    // Add validation listeners
    creditsInput.addEventListener('input', () => {
        const value = parseFloat(creditsInput.value);
        if (value < 0.5) creditsInput.value = 0.5;
        if (value > 5) creditsInput.value = 5;
    });

    courseCounter++;
}

// Function to remove a course entry
function removeCourse(id) {
    const courseEntry = document.getElementById(`course-${id}`);
    if (!courseEntry) return;

    courseEntry.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
        coursesContainer.removeChild(courseEntry);
        if (coursesContainer.children.length === 0) {
            addCourse(); // Always keep at least one course
        }
    }, 300);
}

// Function to calculate GPA
function calculateGPA() {
    const courses = [];
    const courseEntries = document.querySelectorAll('.course-entry');

    // Validate and collect course data
    for (const entry of courseEntries) {
        const nameInput = entry.querySelector('.course-name');
        const creditsInput = entry.querySelector('.course-credits');
        const gradeInput = entry.querySelector('.course-grade');

        // Highlight missing fields
        [nameInput, creditsInput, gradeInput].forEach(input => {
            if (!input.value) {
                input.style.borderColor = 'var(--danger-color)';
                input.addEventListener('input', function onInput() {
                    this.style.borderColor = '';
                    this.removeEventListener('input', onInput);
                });
            }
        });

        if (!nameInput.value || !creditsInput.value || !gradeInput.value) {
            showAlert('Please fill in all fields for each course.', 'error');
            return;
        }

        courses.push({
            name: nameInput.value,
            credits: parseFloat(creditsInput.value),
            grade: gradeInput.value
        });
    }

    if (courses.length === 0) {
        showAlert('Please add at least one course.', 'error');
        return;
    }

    // Show loading state
    const originalText = calculateBtn.textContent;
    calculateBtn.innerHTML = `${originalText}<span class="loading"></span>`;
    calculateBtn.disabled = true;

    // Send request to calculate GPA
    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courses })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
            }
            return response.json().then(data => {
                throw new Error(data.error || 'Failed to calculate GPA');
            });
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('gpa-value').textContent = data.gpa.toFixed(2);
        document.getElementById('total-credits-value').textContent = data.total_credits.toFixed(1);
        showAlert(`GPA calculated successfully!`, 'success');
    })
    .catch(error => {
        showAlert(error.message || 'An error occurred while calculating GPA.', 'error');
        console.error('Error:', error);
    })
    .finally(() => {
        calculateBtn.innerHTML = originalText;
        calculateBtn.disabled = false;
    });
}

// Function to show alerts
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.setAttribute('role', 'alert');

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Initialize the calculator
document.addEventListener('DOMContentLoaded', () => {
    // Create datalist for course suggestions
    const datalist = document.createElement('datalist');
    datalist.id = 'course-list';
    DEFAULT_COURSES.forEach(course => {
        const option = document.createElement('option');
        option.value = course.name;
        datalist.appendChild(option);
    });
    document.body.appendChild(datalist);

    // Load default courses automatically
    coursesContainer.innerHTML = '';
    courseCounter = 0;

    DEFAULT_COURSES.forEach(course => {
        const courseEntry = document.createElement('div');
        courseEntry.className = 'course-entry';
        courseEntry.id = `course-${courseCounter}`;

        courseEntry.innerHTML = `
            <input type="text" placeholder="Course Name" class="course-name" list="course-list" value="${course.name}" required>
            <input type="number" placeholder="Credits" class="course-credits" min="0.5" max="5" step="0.5" value="${course.credits}" required>
            <select class="course-grade" required>
                <option value="">Select Grade</option>
                ${Object.keys(GRADE_POINTS).map(grade => 
                    `<option value="${grade}">${grade}</option>`
                ).join('')}
            </select>
            <button class="btn-danger" onclick="removeCourse(${courseCounter})" aria-label="Remove course">&times;</button>
        `;

        coursesContainer.appendChild(courseEntry);
        courseCounter++;
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            calculateGPA();
        }
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}); 