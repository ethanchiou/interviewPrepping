"""
Seed database with sample interview questions
Run with: python -m app.seed
"""

from sqlalchemy.orm import Session
from .db import SessionLocal, init_db
from .models import Question
import uuid

# Sample interview questions
SAMPLE_QUESTIONS = [
    {
        "title": "Two Sum",
        "difficulty": "Easy",
        "company_mode": "General",
        "prompt": """Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].""",
        "starter_code": """function twoSum(nums, target) {
    // Your code here
    
}""",
        "sample_tests": [
            {"input": "[[2,7,11,15], 9]", "expected": "[0,1]"},
            {"input": "[[3,2,4], 6]", "expected": "[1,2]"},
            {"input": "[[3,3], 6]", "expected": "[0,1]"},
        ],
    },
    {
        "title": "Reverse String",
        "difficulty": "Easy",
        "company_mode": "General",
        "prompt": """Write a function that reverses a string. The input string is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.

Example:
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]""",
        "starter_code": """function reverseString(s) {
    // Your code here
    
}""",
        "sample_tests": [
            {"input": '[["h","e","l","l","o"]]', "expected": '["o","l","l","e","h"]'},
            {"input": '[["H","a","n","n","a","h"]]', "expected": '["h","a","n","n","a","H"]'},
        ],
    },
    {
        "title": "Valid Palindrome",
        "difficulty": "Easy",
        "company_mode": "General",
        "prompt": """A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string s, return true if it is a palindrome, or false otherwise.

Example 1:
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.

Example 2:
Input: s = "race a car"
Output: false""",
        "starter_code": """function isPalindrome(s) {
    // Your code here
    
}""",
        "sample_tests": [
            {"input": '["A man, a plan, a canal: Panama"]', "expected": "true"},
            {"input": '["race a car"]', "expected": "false"},
            {"input": '[" "]', "expected": "true"},
        ],
    },
    {
        "title": "Merge Two Sorted Lists",
        "difficulty": "Medium",
        "company_mode": "General",
        "prompt": """You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.

For this problem, represent the linked list as an array.

Example:
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]""",
        "starter_code": """function mergeTwoLists(list1, list2) {
    // Your code here
    // Treat as arrays and return merged sorted array
    
}""",
        "sample_tests": [
            {"input": "[[1,2,4], [1,3,4]]", "expected": "[1,1,2,3,4,4]"},
            {"input": "[[], []]", "expected": "[]"},
            {"input": "[[], [0]]", "expected": "[0]"},
        ],
    },
    {
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "Easy",
        "company_mode": "General",
        "prompt": """You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

Example:
Input: prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.""",
        "starter_code": """function maxProfit(prices) {
    // Your code here
    
}""",
        "sample_tests": [
            {"input": "[[7,1,5,3,6,4]]", "expected": "5"},
            {"input": "[[7,6,4,3,1]]", "expected": "0"},
        ],
    },
    {
        "title": "FizzBuzz",
        "difficulty": "Easy",
        "company_mode": "General",
        "prompt": """Given an integer n, return a string array answer (1-indexed) where:

- answer[i] == "FizzBuzz" if i is divisible by 3 and 5.
- answer[i] == "Fizz" if i is divisible by 3.
- answer[i] == "Buzz" if i is divisible by 5.
- answer[i] == i (as a string) if none of the above conditions are true.

Example:
Input: n = 5
Output: ["1","2","Fizz","4","Buzz"]""",
        "starter_code": """function fizzBuzz(n) {
    // Your code here
    
}""",
        "sample_tests": [
            {"input": "[3]", "expected": '["1","2","Fizz"]'},
            {"input": "[5]", "expected": '["1","2","Fizz","4","Buzz"]'},
            {"input": "[15]", "expected": '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]'},
        ],
    },
    {
        "title": "Valid Parentheses",
        "difficulty": "Medium",
        "company_mode": "General",
        "prompt": """Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Example:
Input: s = "()"
Output: true

Input: s = "()[]{}"
Output: true

Input: s = "(]"
Output: false""",
        "starter_code": """function isValid(s) {
    // Your code here
    
}""",
        "sample_tests": [
            {"input": '["()"]', "expected": "true"},
            {"input": '["()[]{}"]', "expected": "true"},
            {"input": '["(]"]', "expected": "false"},
            {"input": '["([)]"]', "expected": "false"},
        ],
    },
    {
        "title": "Maximum Subarray",
        "difficulty": "Medium",
        "company_mode": "General",
        "prompt": """Given an integer array nums, find the subarray with the largest sum, and return its sum.

Example 1:
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.

Example 2:
Input: nums = [1]
Output: 1

Example 3:
Input: nums = [5,4,-1,7,8]
Output: 23""",
        "starter_code": """function maxSubArray(nums) {
    // Your code here
    
}""",
        "sample_tests": [
            {"input": "[[-2,1,-3,4,-1,2,1,-5,4]]", "expected": "6"},
            {"input": "[[1]]", "expected": "1"},
            {"input": "[[5,4,-1,7,8]]", "expected": "23"},
        ],
    },
]


def seed_questions(db: Session):
    """Seed the database with sample questions"""
    
    # Check if questions already exist
    existing = db.query(Question).count()
    if existing > 0:
        print(f"Database already has {existing} questions. Skipping seed.")
        return
    
    print("Seeding database with sample questions...")
    
    for q_data in SAMPLE_QUESTIONS:
        question = Question(
            id=uuid.uuid4(),
            title=q_data["title"],
            difficulty=q_data["difficulty"],
            company_mode=q_data["company_mode"],
            prompt=q_data["prompt"],
            starter_code=q_data["starter_code"],
            sample_tests=q_data["sample_tests"],
        )
        db.add(question)
    
    db.commit()
    print(f"✅ Added {len(SAMPLE_QUESTIONS)} questions to database")


def main():
    """Main seed function"""
    print("Initializing database...")
    init_db()
    
    db = SessionLocal()
    try:
        seed_questions(db)
        print("✅ Database seeding complete!")
    finally:
        db.close()


if __name__ == "__main__":
    main()