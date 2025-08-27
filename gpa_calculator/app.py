from flask import Flask, render_template, jsonify, request
import os

app = Flask(__name__)

# Grade point values
GRADE_POINTS = {
    'O': 10.0, 'A+': 9.0, 
    'A': 8.0, 'B+': 7.0, 
    'B': 6.0, 'C': 5.0, 
    'U': 0.0, 'SA': 0.0,
    'WD': 0.0,
}

# Default courses data
DEFAULT_COURSES = [
    {"name": "Technical English", "credits": 2},
    {"name": "Mathematical Foundation For Engineers", "credits": 4},
    {"name": "Physics For Information Science I", "credits": 3},
    {"name": "Chemistry For Information Science", "credits": 3},
    {"name": "Heritage Of Tamils", "credits": 1},
    {"name": "Programming In C", "credits": 4},
    {"name": "Engineering Graphics And Computer Application", "credits": 4},
    {"name": "Engineering Practices Laboratory", "credits": 2},
    {"name": "Interpersonal Skills Laboratory", "credits": 1},
    {"name": "Design Thinking-Building Innovation And Solutioning Mindset", "credits": 0.5}
]

def validate_course_data(course):
    """Validate course data"""
    if not isinstance(course, dict):
        return False, "Invalid course format"
    if not all(k in course for k in ('credits', 'grade')):
        return False, "Missing required fields"
    try:
        credits = float(course['credits'])
        if not 0 < credits <= 5:
            return False, "Credits must be between 0 and 5"
        if course['grade'] not in GRADE_POINTS:
            return False, f"Invalid grade: {course['grade']}"
    except (ValueError, TypeError):
        return False, "Invalid credit value"
    return True, ""

@app.route('/')
def index():
    return render_template('index.html', grade_points=GRADE_POINTS, default_courses=DEFAULT_COURSES)

@app.route('/calculate', methods=['POST'])
def calculate():
    if not request.is_json:
        return jsonify({'error': 'Invalid content type'}), 400
        
    data = request.get_json()
    if not data or 'courses' not in data:
        return jsonify({'error': 'Invalid data format'}), 400
    
    courses = data.get('courses', [])
    
    if not courses:
        return jsonify({'error': 'No courses provided'}), 400
    
    try:
        # Validate all courses before processing
        for course in courses:
            is_valid, error_message = validate_course_data(course)
            if not is_valid:
                return jsonify({'error': error_message}), 400

        total_points = 0
        total_credits = 0
        
        for course in courses:
            credits = float(course['credits'])
            grade = course['grade']
            grade_point = GRADE_POINTS[grade]
            
            total_points += credits * grade_point
            total_credits += credits
        
        if total_credits == 0:
            return jsonify({'error': 'Total credits cannot be zero'}), 400
        
        gpa = total_points / total_credits
        return jsonify({
            'gpa': round(gpa, 2),
            'total_credits': total_credits,
            'total_points': total_points
        })
        
    except Exception as e:
        app.logger.error(f"Error calculating GPA: {str(e)}")
        return jsonify({'error': 'Server error occurred while calculating GPA'}), 500

if __name__ == '__main__':
    app.run(debug=True)