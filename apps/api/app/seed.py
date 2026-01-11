"""Database seeding script."""
import sys
import random
from sqlalchemy.orm import Session
from app.db import SessionLocal, init_db
from app.models import Question


def seed_questions(db: Session):
    """Seed initial questions if table is empty."""
    count = db.query(Question).count()
    
    if count > 0:
        print(f"✅ Database already has {count} questions, skipping seed")
        return
    
    questions = [
        {
            "title": "Two Sum",
            "difficulty": "Easy",
            "company_mode": "General",
            "prompt": "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. You may assume each input has exactly one solution.",
            "starter_code": "function solution(nums, target) {\n  // Your code here\n  return [];\n}",
            "sample_tests": [
                {"input": "[[2,7,11,15], 9]", "expected": "[0,1]"},
                {"input": "[[3,2,4], 6]", "expected": "[1,2]"},
                {"input": "[[3,3], 6]", "expected": "[0,1]"}
            ]
        },
        {
            "title": "Valid Parentheses",
            "difficulty": "Easy",
            "company_mode": "Google",
            "prompt": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: open brackets are closed by the same type of brackets, and open brackets are closed in the correct order.",
            "starter_code": "function solution(s) {\n  // Your code here\n  return false;\n}",
            "sample_tests": [
                {"input": "[\"()\"]", "expected": "true"},
                {"input": "[\"()[]{}\"]", "expected": "true"},
                {"input": "[\"(]\" ]", "expected": "false"},
                {"input": "[\"([)]\"]", "expected": "false"}
            ]
        },
        {
            "title": "Merge Intervals",
            "difficulty": "Medium",
            "company_mode": "General",
            "prompt": "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
            "starter_code": "function solution(intervals) {\n  // Your code here\n  return [];\n}",
            "sample_tests": [
                {"input": "[[[1,3],[2,6],[8,10],[15,18]]]", "expected": "[[1,6],[8,10],[15,18]]"},
                {"input": "[[[1,4],[4,5]]]", "expected": "[[1,5]]"}
            ]
        },
        {
            "title": "Two Integer Sum II",
            "difficulty": "Medium",
            "company_mode": "Meta",
            "prompt": "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all elements of nums except nums[i]. You must write an algorithm that runs in O(n) time and without using the division operation.",
            "starter_code": "function solution(nums) {\n  // Your code here\n  return [];\n}",
            "sample_tests": [
                {"input": "[[1,2,3,4]]", "expected": "[24,12,8,6]"},
                {"input": "[[-1,1,0,-3,3]]", "expected": "[0,0,9,0,0]"}
            ]
        },
        {
            "title": "Median of Two Sorted Arrays",
            "difficulty": "Hard",
            "company_mode": "Google",
            "prompt": "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).",
            "starter_code": "function solution(nums1, nums2) {\n  // Your code here\n  return 0;\n}",
            "sample_tests": [
                {"input": "[[1,3], [2]]", "expected": "2"},
                {"input": "[[1,2], [3,4]]", "expected": "2.5"}
            ]
        }
    ]
    
    for q_data in questions:
        question = Question(**q_data)
        db.add(question)
    
    db.commit()
    print(f"✅ Seeded {len(questions)} questions")


if __name__ == "__main__":
    print("🌱 Initializing database...")
    init_db()
    
    print("🌱 Seeding questions...")
    db = SessionLocal()
    try:
        seed_questions(db)
    finally:
        db.close()
    
    print("✅ Seeding complete!")
