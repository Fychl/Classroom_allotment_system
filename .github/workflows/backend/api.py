from flask import Flask, request, jsonify, send_from_directory
import os
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
from email_utils import send_email
# Removed invalid JavaScript import lines
# import { initializeApp } from "firebase/app";


# Firebase Admin SDK imports
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__, static_folder='../teacher', static_url_path='/teacher')
CORS(app)

# MongoDB configuration
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client['room_allotment_system']
users_collection = db['users']
timetable_collection = db['timetable']

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    cred = credentials.Certificate('dataconnect/firebase-service-account.json')
    firebase_admin.initialize_app(cred)
firestore_db = firestore.client()

@app.route('/register/teacher', methods=['POST'])
def register_teacher():
    data = request.json
    full_name = data.get('teacherName')
    email = data.get('teacherEmail')
    user_id = data.get('teacherId')
    password = data.get('password')
    department = data.get('teacherDepartment')
    subjects = data.get('teacherSubjects', [])
    contact_number = data.get('teacherContact')

    if not all([full_name, email, user_id, password, department, contact_number]):
        return jsonify({'error': 'Missing required fields for teacher registration'}), 400

    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 400
    if users_collection.find_one({'userId': user_id}):
        return jsonify({'error': 'User ID already registered'}), 400

    if not isinstance(subjects, list) or len(subjects) > 3:
        return jsonify({'error': 'Subjects must be a list with up to 3 items'}), 400

    password_hash = generate_password_hash(password)

    user_doc = {
        'userType': 'teacher',
        'fullName': full_name,
        'email': email,
        'userId': user_id,
        'passwordHash': password_hash,
        'department': department,
        'subjects': subjects,
        'contactNumber': contact_number
    }

    users_collection.insert_one(user_doc)
    # Send welcome email to teacher
    try:
        subject = "Welcome to Room Allotment System"
        body = f"Hello {full_name},\n\nThank you for registering as a teacher in the Room Allotment System."
        send_email(email, subject, body)
    except Exception as e:
        print(f"Error sending email to teacher {email}: {e}")

    return jsonify({'message': 'Teacher registered successfully'}), 201

@app.route('/register/student', methods=['POST'])
def register_student():
    data = request.json
    full_name = data.get('studentName')
    email = data.get('studentEmail')
    user_id = data.get('studentId')
    password = data.get('password')
    course = data.get('studentCourse')

    if not all([full_name, email, user_id, password, course]):
        return jsonify({'error': 'Missing required fields for student registration'}), 400

    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 400
    if users_collection.find_one({'userId': user_id}):
        return jsonify({'error': 'User ID already registered'}), 400

    password_hash = generate_password_hash(password)

    user_doc = {
        'userType': 'student',
        'fullName': full_name,
        'email': email,
        'userId': user_id,
        'passwordHash': password_hash,
        'course': course
    }

    users_collection.insert_one(user_doc)
    # Send welcome email to student
    try:
        subject = "Welcome to Room Allotment System"
        body = f"Hello {full_name},\n\nThank you for registering as a student in the Room Allotment System."
        send_email(email, subject, body)
    except Exception as e:
        print(f"Error sending email to student {email}: {e}")

    return jsonify({'message': 'Student registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email_or_userid = data.get('emailOrUserId')
    password = data.get('password')

    user = users_collection.find_one({
        '$or': [{'email': email_or_userid}, {'userId': email_or_userid}]
    })

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if check_password_hash(user['passwordHash'], password):
        return jsonify({'message': 'Login successful', 'userType': user['userType']}), 200
    else:
        return jsonify({'error': 'Invalid password'}), 401

@app.route('/api/teachers', methods=['GET'])
def get_teachers():
    teachers_cursor = users_collection.find({'userType': 'teacher'})
    teachers = []
    for teacher in teachers_cursor:
        teachers.append({
            'fullName': teacher.get('fullName'),
            'courses': teacher.get('subjects', []),
            'subjectCodes': teacher.get('subjectCodes', [])  # Assuming subjectCodes field if exists
        })
    return jsonify(teachers)

@app.route('/api/teacher/<teacher_id>', methods=['GET'])
def get_teacher_by_id(teacher_id):
    teacher = users_collection.find_one({'userType': 'teacher', 'userId': teacher_id})
    if not teacher:
        return jsonify({'error': 'Teacher not found'}), 404
    teacher_data = {
        'userId': teacher.get('userId'),
        'fullName': teacher.get('fullName'),
        'email': teacher.get('email'),
        'department': teacher.get('department'),
        'subjects': teacher.get('subjects', []),
        'contactNumber': teacher.get('contactNumber')
    }
    return jsonify(teacher_data)

@app.route('/api/timetable/save', methods=['POST'])
def save_timetable():
    data = request.json
    if not data:
        return jsonify({'error': 'No timetable data provided'}), 400

    # Validate data structure: should be dict with days as keys
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid data format, expected a dictionary'}), 400

    valid_days = {'monday', 'tuesday', 'wednesday', 'thursday', 'friday'}
    for day, periods in data.items():
        if day.lower() not in valid_days:
            return jsonify({'error': f'Invalid day key: {day}'}), 400
        if not isinstance(periods, dict):
            return jsonify({'error': f'Invalid periods format for day {day}, expected a dictionary'}), 400
        for period_num, period_data in periods.items():
            required_fields = {'periodNumber', 'startTime', 'endTime', 'subject', 'teacher', 'roomId'}
            if not all(field in period_data for field in required_fields):
                return jsonify({'error': f'Missing fields in period data for day {day}, period {period_num}'}), 400

    # Clear existing timetable data
    timetable_collection.delete_many({})

    # Clear existing periodOverview for all users
    users_collection.update_many({}, {'$set': {'periodOverview': []}})

    # Update each user's periodOverview based on timetable data
    for day, periods in data.items():
        for period_num, period_data in periods.items():
            teacher_name = period_data.get('teacher')
            if not teacher_name:
                continue
            # Normalize teacher name for matching
            normalized_teacher_name = teacher_name.strip().lower()
            # Find user by fullName (case-insensitive) and userType teacher
            user = users_collection.find_one({
                'userType': 'teacher',
                'fullName': {'$regex': f'^{normalized_teacher_name}$', '$options': 'i'}
            })
            if user:
                period_entry = {
                    'day': day.lower(),
                    'period': period_data.get('periodNumber'),
                    'subject': period_data.get('subject'),
                    'startTime': period_data.get('startTime'),
                    'endTime': period_data.get('endTime'),
                    'room': period_data.get('roomId')
                }
                # Append periodEntry to user's periodOverview
                update_result = users_collection.update_one(
                    {'_id': user['_id']},
                    {'$push': {'periodOverview': period_entry}}
                )
                print(f"Updated user {user['fullName']} with period data: {period_entry}, matched count: {update_result.matched_count}, modified count: {update_result.modified_count}")
            else:
                print(f"No user found matching teacher name: {teacher_name}")

    # Insert each day's periods as separate documents in timetable collection (optional)
    documents = []
    for day, periods in data.items():
        day_doc = {
            'day': day.lower(),
            'periods': list(periods.values())
        }
        documents.append(day_doc)

    if documents:
        timetable_collection.insert_many(documents)
    else:
        return jsonify({'error': 'No valid timetable data to save'}), 400

    return jsonify({'message': 'Timetable saved successfully'}), 201

@app.route('/api/timetable', methods=['GET'])
def get_timetable():
    # Return all timetable documents grouped by day
    timetable_docs = list(timetable_collection.find({}, {'_id': 0}))
    if not timetable_docs:
        return jsonify({})  # Return empty if no timetable saved
    # Convert list of day documents to dict with day as key
    timetable_data = {doc['day']: doc['periods'] for doc in timetable_docs if 'day' in doc and 'periods' in doc}
    return jsonify(timetable_data)

@app.route('/api/user/periodOverview', methods=['GET'])
def get_user_period_overview():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'Missing userId parameter'}), 400

    user = users_collection.find_one({'userId': user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    period_overview = user.get('periodOverview', [])
    return jsonify({'periodOverview': period_overview}), 200

@app.route('/api/user/periodOverview/all', methods=['GET'])
def get_all_period_overview():
    # Aggregate periodOverview data from all users
    users_cursor = users_collection.find({'periodOverview': {'$exists': True, '$ne': []}})
    combined_period_overview = []
    count = 0
    for user in users_cursor:
        count += 1
        combined_period_overview.extend(user.get('periodOverview', []))
    print(f"Found {count} users with periodOverview data")
    print(f"Combined periodOverview count: {len(combined_period_overview)}")
    return jsonify({'periodOverview': combined_period_overview}), 200

@app.route('/api/report/submit', methods=['POST'])
def submit_report():
    data = request.json
    user_id = data.get('userId')
    report_type = data.get('reportType')
    report_content = data.get('reportContent')

    if not all([user_id, report_type, report_content]):
        return jsonify({'error': 'Missing required fields in report submission'}), 400

    user = users_collection.find_one({'userId': user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    to_email = user.get('email')
    if not to_email:
        return jsonify({'error': 'User email not found'}), 400

    subject = f"Report Submission: {report_type}"
    body = f"Hello {user.get('fullName')},\n\nYou have submitted a report of type '{report_type}'.\n\nReport Content:\n{report_content}\n\nThank you."

    try:
        send_email(to_email, subject, body)
    except Exception as e:
        print(f"Error sending report submission email to {to_email}: {e}")
        return jsonify({'error': 'Failed to send email'}), 500

    return jsonify({'message': 'Report submitted and email sent successfully'}), 200

@app.route('/teacher/<path:filename>')
def serve_teacher_static(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/student/<path:filename>')
def serve_student_static(filename):
    return send_from_directory('../student', filename)

# New API endpoint to fetch course materials metadata
@app.route('/api/course-materials', methods=['GET'])
def get_course_materials():
    try:
        materials_ref = firestore_db.collection('courseMaterials')
        docs = materials_ref.order_by('uploadedAt', direction=firestore.Query.DESCENDING).stream()
        materials = []
        for doc in docs:
            data = doc.to_dict()
            materials.append({
                'id': doc.id,
                'type': data.get('type'),
                'title': data.get('title'),
                'fileName': data.get('fileName'),
                'url': data.get('url'),
                'uploadedAt': data.get('uploadedAt').isoformat() if data.get('uploadedAt') else None
            })
        return jsonify({'courseMaterials': materials}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch course materials: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
