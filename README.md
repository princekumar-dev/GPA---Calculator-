# GPA---Calculator-
A sleek, web-based GPA Calculator built with Flask that instantly computes GPA from courses, grades, and credit hours—designed with real-time accuracy, responsive UI, and robust error handling.

## Overview
This project is a web-based GPA (Grade Point Average) Calculator designed to help students easily calculate their GPA based on their course grades and credit hours. The application provides a user-friendly interface for inputting course information and displays the calculated GPA instantly.

## Features
- Add multiple courses with grade and credit hour inputs
- Real-time GPA calculation
- Responsive and modern UI
- Error handling for invalid inputs
- Custom error pages (404 and 500)

## Technologies Used
- Python (Flask framework)
- HTML5, CSS3, JavaScript

## Project Structure
```
gpa_calculator/
├── app.py                  # Main Flask application
├── static/
│   ├── css/
│   │   └── style.css       # Stylesheet for the app
│   └── js/
│       └── script.js       # Client-side logic
├── templates/
│   ├── 404.html            # Custom 404 error page
│   ├── 500.html            # Custom 500 error page
│   └── index.html          # Main page for GPA calculation
```

## How It Works
1. The user enters course names, grades, and credit hours on the main page.
2. The app calculates the GPA based on the input using standard GPA formulas.
3. Results are displayed instantly, and users can add or remove courses as needed.
4. Custom error pages handle invalid routes and server errors gracefully.

## Setup Instructions
1. **Clone the repository:**
   ```
   git clone <repo-url>
   ```
2. **Navigate to the project directory:**
   ```
   cd gpa_calculator
   ```
3. **Install dependencies:**
   ```
   pip install flask
   ```
4. **Run the application:**
   ```
   python app.py
   ```
5. **Open your browser and go to:**
   ```
   http://localhost:5000
   ```

## Usage
- Enter your courses, grades, and credit hours.
- Click "Calculate GPA" to see your result.
- Add or remove courses as needed.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## License
This project is licensed under the MIT License.

## Author
- Prince 

---
Feel free to customize this README with additional details or contact information as needed.
