"""
Feature Schema Validation for ML Inference Service V1 (UCI Student Performance).
Enforces exact 11 features required by student_score_model-1.joblib.
"""

REQUIRED_FEATURES = [
    "studytime",
    "failures",
    "absences",
    "G1",
    "school",
    "sex",
    "age",
    "internet",
    "higher",
    "goout",
    "health"
]

def validate_features(data: dict):
    if not isinstance(data, dict):
        return False, "Dữ liệu đầu vào phải là một đối tượng JSON (dict)."

    missing = [f for f in REQUIRED_FEATURES if f not in data or data[f] is None]
    if missing:
        return False, f"Thiếu các đặc trưng bắt buộc: {', '.join(missing)}"

    try:
        # Range and type checks
        studytime = float(data["studytime"])
        if not (1 <= studytime <= 4):
            return False, f"Giá trị 'studytime' ({studytime}) phải thuộc khoảng [1, 4]."

        failures = float(data["failures"])
        if not (0 <= failures <= 4):
            return False, f"Giá trị 'failures' ({failures}) phải thuộc khoảng [0, 4]."

        absences = float(data["absences"])
        if not (0 <= absences <= 93):
            return False, f"Giá trị 'absences' ({absences}) phải thuộc khoảng [0, 93]."

        G1 = float(data["G1"])
        if not (0 <= G1 <= 20):
            return False, f"Giá trị 'G1' ({G1}) phải thuộc khoảng [0, 20]."

        school = str(data["school"]).upper().strip()
        if school not in ["GP", "MS"]:
            return False, f"Giá trị 'school' ({school}) phải là 'GP' hoặc 'MS'."

        sex = str(data["sex"]).upper().strip()
        if sex not in ["F", "M"]:
            return False, f"Giá trị 'sex' ({sex}) phải là 'F' hoặc 'M'."

        age = float(data["age"])
        if not (15 <= age <= 22):
            return False, f"Giá trị 'age' ({age}) phải thuộc khoảng [15, 22]."

        internet = str(data["internet"]).lower().strip()
        if internet not in ["yes", "no"]:
            return False, f"Giá trị 'internet' ({internet}) phải là 'yes' hoặc 'no'."

        higher = str(data["higher"]).lower().strip()
        if higher not in ["yes", "no"]:
            return False, f"Giá trị 'higher' ({higher}) phải là 'yes' hoặc 'no'."

        goout = float(data["goout"])
        if not (1 <= goout <= 5):
            return False, f"Giá trị 'goout' ({goout}) phải thuộc khoảng [1, 5]."

        health = float(data["health"])
        if not (1 <= health <= 5):
            return False, f"Giá trị 'health' ({health}) phải thuộc khoảng [1, 5]."

        cleaned_data = {
            "studytime": studytime,
            "failures": failures,
            "absences": absences,
            "G1": G1,
            "school": school,
            "sex": sex,
            "age": age,
            "internet": internet,
            "higher": higher,
            "goout": goout,
            "health": health
        }

        return True, cleaned_data

    except ValueError as ve:
        return False, f"Lỗi kiểu dữ liệu không hợp lệ: {str(ve)}"
