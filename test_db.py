from database import test_connection

try:
    result = test_connection()
    print("Database connected successfully!")
    print("Test result:", result)
except Exception as error:
    print("Database connection failed.")
    print(error)