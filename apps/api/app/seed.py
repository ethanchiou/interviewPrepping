"""Seed the database with sample questions."""
import sys
from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models import Base, Question


def seed_questions(db: Session):
    """Add sample interview questions to the database."""
    
    # Clear existing questions (optional - remove if you want to keep existing data)
    db.query(Question).delete()
    db.commit()
    
    questions = [
        # ========== GENERAL - EASY ==========
        {
            "title": "Two Sum",
            "difficulty": "Easy",
            "company_mode": "General",
            "data_structure": "HashMaps",
            "prompt": """Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].""",
            "starter_code": "function twoSum(nums, target) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[2,7,11,15], 9", "expected": "[0,1]"},
                {"input": "[3,2,4], 6", "expected": "[1,2]"},
                {"input": "[3,3], 6", "expected": "[0,1]"}
            ]
        },
        {
            "title": "Valid Palindrome",
            "difficulty": "Easy",
            "company_mode": "General",
            "data_structure": "Two Pointers",
            "prompt": """A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string s, return true if it is a palindrome, or false otherwise.

Example:
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.""",
            "starter_code": "function isPalindrome(s) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": '"A man, a plan, a canal: Panama"', "expected": "true"},
                {"input": '"race a car"', "expected": "false"},
                {"input": '" "', "expected": "true"}
            ]
        },
        {
            "title": "Reverse Linked List",
            "difficulty": "Easy",
            "company_mode": "General",
            "data_structure": "Linked Lists",
            "prompt": """Given the head of a singly linked list, reverse the list, and return the reversed list.

Example:
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]""",
            "starter_code": "function reverseList(head) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[1,2,3,4,5]", "expected": "[5,4,3,2,1]"},
                {"input": "[1,2]", "expected": "[2,1]"},
                {"input": "[]", "expected": "[]"}
            ]
        },
        {
            "title": "Valid Parentheses",
            "difficulty": "Easy",
            "company_mode": "General",
            "data_structure": "Stacks",
            "prompt": """Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

Example:
Input: s = "()[]{}"
Output: true""",
            "starter_code": "function isValid(s) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": '"()"', "expected": "true"},
                {"input": '"()[]{}"', "expected": "true"},
                {"input": '"(]"', "expected": "false"}
            ]
        },
        
        # ========== GENERAL - MEDIUM ==========
        {
            "title": "Group Anagrams",
            "difficulty": "Medium",
            "company_mode": "General",
            "data_structure": "HashMaps",
            "prompt": """Given an array of strings strs, group the anagrams together. You can return the answer in any order.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

Example:
Input: strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]""",
            "starter_code": "function groupAnagrams(strs) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": '["eat","tea","tan","ate","nat","bat"]', "expected": '[["bat"],["nat","tan"],["ate","eat","tea"]]'},
                {"input": '[""]', "expected": '[[""]]'},
                {"input": '["a"]', "expected": '[["a"]]'}
            ]
        },
        {
            "title": "Container With Most Water",
            "difficulty": "Medium",
            "company_mode": "General",
            "data_structure": "Two Pointers",
            "prompt": """You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

Example:
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49""",
            "starter_code": "function maxArea(height) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[1,8,6,2,5,4,8,3,7]", "expected": "49"},
                {"input": "[1,1]", "expected": "1"}
            ]
        },
        {
            "title": "Add Two Numbers",
            "difficulty": "Medium",
            "company_mode": "General",
            "data_structure": "Linked Lists",
            "prompt": """You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

Example:
Input: l1 = [2,4,3], l2 = [5,6,4]
Output: [7,0,8]
Explanation: 342 + 465 = 807.""",
            "starter_code": "function addTwoNumbers(l1, l2) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[2,4,3], [5,6,4]", "expected": "[7,0,8]"},
                {"input": "[0], [0]", "expected": "[0]"},
                {"input": "[9,9,9], [9,9,9,9]", "expected": "[8,9,9,0,1]"}
            ]
        },
        {
            "title": "Daily Temperatures",
            "difficulty": "Medium",
            "company_mode": "General",
            "data_structure": "Stacks",
            "prompt": """Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. If there is no future day for which this is possible, keep answer[i] == 0 instead.

Example:
Input: temperatures = [73,74,75,71,69,72,76,73]
Output: [1,1,4,2,1,1,0,0]""",
            "starter_code": "function dailyTemperatures(temperatures) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[73,74,75,71,69,72,76,73]", "expected": "[1,1,4,2,1,1,0,0]"},
                {"input": "[30,40,50,60]", "expected": "[1,1,1,0]"},
                {"input": "[30,60,90]", "expected": "[1,1,0]"}
            ]
        },
        {
            "title": "Number of Islands",
            "difficulty": "Medium",
            "company_mode": "General",
            "data_structure": "Graphs",
            "prompt": """Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.

Example:
Input: grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
Output: 3""",
            "starter_code": "function numIslands(grid) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": '[["1","1","0"],["1","1","0"],["0","0","1"]]', "expected": "2"},
                {"input": '[["1","0","1"],["0","1","0"],["1","0","1"]]', "expected": "5"}
            ]
        },
        
        # ========== GENERAL - HARD ==========
        {
            "title": "LRU Cache",
            "difficulty": "Hard",
            "company_mode": "General",
            "data_structure": "HashMaps",
            "prompt": """Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the LRUCache class:
- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.
- int get(int key) Return the value of the key if the key exists, otherwise return -1.
- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions get and put must each run in O(1) average time complexity.""",
            "starter_code": "class LRUCache {\n  constructor(capacity) {\n    // Your code here\n  }\n  \n  get(key) {\n    // Your code here\n  }\n  \n  put(key, value) {\n    // Your code here\n  }\n}",
            "sample_tests": [
                {"input": 'capacity=2, ops=["put","put","get","put","get","get"]', "expected": "[null,null,1,null,-1,3]"}
            ]
        },
        {
            "title": "Trapping Rain Water",
            "difficulty": "Hard",
            "company_mode": "General",
            "data_structure": "Two Pointers",
            "prompt": """Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

Example:
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6""",
            "starter_code": "function trap(height) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[0,1,0,2,1,0,1,3,2,1,2,1]", "expected": "6"},
                {"input": "[4,2,0,3,2,5]", "expected": "9"}
            ]
        },
        {
            "title": "Merge k Sorted Lists",
            "difficulty": "Hard",
            "company_mode": "General",
            "data_structure": "Linked Lists",
            "prompt": """You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.

Merge all the linked-lists into one sorted linked-list and return it.

Example:
Input: lists = [[1,4,5],[1,3,4],[2,6]]
Output: [1,1,2,3,4,4,5,6]""",
            "starter_code": "function mergeKLists(lists) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[[1,4,5],[1,3,4],[2,6]]", "expected": "[1,1,2,3,4,4,5,6]"},
                {"input": "[]", "expected": "[]"},
                {"input": "[[]]", "expected": "[]"}
            ]
        },
        {
            "title": "Largest Rectangle in Histogram",
            "difficulty": "Hard",
            "company_mode": "General",
            "data_structure": "Stacks",
            "prompt": """Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.

Example:
Input: heights = [2,1,5,6,2,3]
Output: 10""",
            "starter_code": "function largestRectangleArea(heights) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[2,1,5,6,2,3]", "expected": "10"},
                {"input": "[2,4]", "expected": "4"}
            ]
        },
        {
            "title": "Word Ladder",
            "difficulty": "Hard",
            "company_mode": "General",
            "data_structure": "Graphs",
            "prompt": """A transformation sequence from word beginWord to word endWord using a dictionary wordList is a sequence of words beginWord -> s1 -> s2 -> ... -> sk such that every adjacent pair of words differs by a single letter.

Return the length of the shortest transformation sequence from beginWord to endWord, or 0 if no such sequence exists.

Example:
Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]
Output: 5
Explanation: "hit" -> "hot" -> "dot" -> "dog" -> "cog".""",
            "starter_code": "function ladderLength(beginWord, endWord, wordList) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": '"hit", "cog", ["hot","dot","dog","lot","log","cog"]', "expected": "5"},
                {"input": '"hit", "cog", ["hot","dot","dog","lot","log"]', "expected": "0"}
            ]
        },
        
        # ========== GOOGLE - MEDIUM ==========
        {
            "title": "Longest Substring Without Repeating Characters",
            "difficulty": "Medium",
            "company_mode": "Google",
            "data_structure": "HashMaps",
            "prompt": """Given a string s, find the length of the longest substring without repeating characters.

Example:
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.""",
            "starter_code": "function lengthOfLongestSubstring(s) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": '"abcabcbb"', "expected": "3"},
                {"input": '"bbbbb"', "expected": "1"},
                {"input": '"pwwkew"', "expected": "3"}
            ]
        },
        {
            "title": "Course Schedule",
            "difficulty": "Medium",
            "company_mode": "Google",
            "data_structure": "Graphs",
            "prompt": """There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.

Return true if you can finish all courses. Otherwise, return false.

Example:
Input: numCourses = 2, prerequisites = [[1,0]]
Output: true
Explanation: There are a total of 2 courses to take. To take course 1 you should have finished course 0. So it is possible.""",
            "starter_code": "function canFinish(numCourses, prerequisites) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "2, [[1,0]]", "expected": "true"},
                {"input": "2, [[1,0],[0,1]]", "expected": "false"}
            ]
        },
        
        # ========== META - MEDIUM ==========
        {
            "title": "Binary Tree Level Order Traversal",
            "difficulty": "Medium",
            "company_mode": "Meta",
            "data_structure": "Graphs",
            "prompt": """Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).

Example:
Input: root = [3,9,20,null,null,15,7]
Output: [[3],[9,20],[15,7]]""",
            "starter_code": "function levelOrder(root) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[3,9,20,null,null,15,7]", "expected": "[[3],[9,20],[15,7]]"},
                {"input": "[1]", "expected": "[[1]]"},
                {"input": "[]", "expected": "[]"}
            ]
        },
        {
            "title": "Subarray Sum Equals K",
            "difficulty": "Medium",
            "company_mode": "Meta",
            "data_structure": "HashMaps",
            "prompt": """Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k.

Example:
Input: nums = [1,1,1], k = 2
Output: 2""",
            "starter_code": "function subarraySum(nums, k) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[1,1,1], 2", "expected": "2"},
                {"input": "[1,2,3], 3", "expected": "2"}
            ]
        },
        
        # ========== MICROSOFT - MEDIUM ==========
        {
            "title": "3Sum",
            "difficulty": "Medium",
            "company_mode": "Microsoft",
            "data_structure": "Two Pointers",
            "prompt": """Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets.

Example:
Input: nums = [-1,0,1,2,-1,-4]
Output: [[-1,-1,2],[-1,0,1]]""",
            "starter_code": "function threeSum(nums) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[-1,0,1,2,-1,-4]", "expected": "[[-1,-1,2],[-1,0,1]]"},
                {"input": "[0,1,1]", "expected": "[]"},
                {"input": "[0,0,0]", "expected": "[[0,0,0]]"}
            ]
        },
        {
            "title": "Design HashMap",
            "difficulty": "Medium",
            "company_mode": "Microsoft",
            "data_structure": "HashMaps",
            "prompt": """Design a HashMap without using any built-in hash table libraries.

Implement the MyHashMap class:
- MyHashMap() initializes the object with an empty map.
- void put(int key, int value) inserts a (key, value) pair into the HashMap.
- int get(int key) returns the value to which the specified key is mapped, or -1 if this map contains no mapping for the key.
- void remove(key) removes the key and its corresponding value if the map contains the mapping for the key.

Example:
Input: ["MyHashMap", "put", "put", "get", "get", "put", "get", "remove", "get"]
       [[], [1, 1], [2, 2], [1], [3], [2, 1], [2], [2], [2]]
Output: [null, null, null, 1, -1, null, 1, null, -1]""",
            "starter_code": "class MyHashMap {\n  constructor() {\n    // Your code here\n  }\n  \n  put(key, value) {\n    // Your code here\n  }\n  \n  get(key) {\n    // Your code here\n  }\n  \n  remove(key) {\n    // Your code here\n  }\n}",
            "sample_tests": [
                {"input": '["put","put","get","get"]', "expected": "[null,null,1,-1]"}
            ]
        },
        
        # ========== APPLE - EASY ==========
        {
            "title": "Merge Two Sorted Lists",
            "difficulty": "Easy",
            "company_mode": "Apple",
            "data_structure": "Linked Lists",
            "prompt": """You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.

Example:
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]""",
            "starter_code": "function mergeTwoLists(list1, list2) {\n  // Your code here\n}",
            "sample_tests": [
                {"input": "[1,2,4], [1,3,4]", "expected": "[1,1,2,3,4,4]"},
                {"input": "[], []", "expected": "[]"},
                {"input": "[], [0]", "expected": "[0]"}
            ]
        },
        
        # Add more company-specific questions as needed...
    ]
    
    for q_data in questions:
        question = Question(**q_data)
        db.add(question)
    
    db.commit()
    print(f"✅ Seeded {len(questions)} questions successfully!")


def main():
    """Run the seed script."""
    print("Starting database seed...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db = SessionLocal()
    
    try:
        seed_questions(db)
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()
    
    print("Database seeding complete!")


if __name__ == "__main__":
    main()