export interface PracticalScript {
  id: string;
  file: string;
  title: string;
  category: "Python" | "File Handling" | "Data Structures" | "MySQL" | "CSV";
  aim: string;
  code: string;
}

const header = (aim: string, file: string) =>
  `# ============================================================\n# Program : ${file}\n# Aim     : ${aim}\n# Class   : XII - Computer Science (CBSE)\n# ============================================================\n\n`;

const s = (
  id: string,
  file: string,
  title: string,
  category: PracticalScript["category"],
  aim: string,
  code: string
): PracticalScript => ({
  id,
  file,
  title,
  category,
  aim,
  code: header(aim, file) + code.trim() + "\n",
});

export const PRACTICAL_SCRIPTS: PracticalScript[] = [
  s(
    "p1",
    "p1_number_menu.py",
    "Menu-driven number utilities",
    "Python",
    "Write a menu-driven program to check even/odd, find factorial and reverse a number.",
    `
def is_even(n):
    return n % 2 == 0


def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result


def reverse_number(n):
    rev = 0
    while n > 0:
        rev = rev * 10 + n % 10
        n //= 10
    return rev


def main():
    print("1. Even or Odd\\n2. Factorial\\n3. Reverse")
    choice = int(input("Enter choice (1-3): "))
    num = int(input("Enter a number: "))

    if choice == 1:
        print("Even" if is_even(num) else "Odd")
    elif choice == 2:
        print("Factorial =", factorial(num))
    elif choice == 3:
        print("Reversed =", reverse_number(num))
    else:
        print("Invalid choice")


main()`
  ),
  s(
    "p2",
    "p2_stack_operations.py",
    "Stack using a list (push / pop / display)",
    "Data Structures",
    "Write a program to implement a stack using a list with push, pop and display operations.",
    `
stack = []


def push(item):
    stack.append(item)
    print(item, "pushed")


def pop():
    if not stack:
        print("Underflow - stack is empty")
        return None
    item = stack.pop()
    print(item, "popped")
    return item


def peek():
    return stack[-1] if stack else None


def display():
    if not stack:
        print("Stack is empty")
    else:
        print("Stack (top to bottom):", stack[::-1])


push(10)
push(20)
push(30)
display()
pop()
display()
print("Top element:", peek())`
  ),
  s(
    "p3",
    "p3_text_file_count.py",
    "Count lines, words and vowels in a text file",
    "File Handling",
    "Write a program to create a text file and count its lines, words and vowels.",
    `
# Step 1: create the file
with open("story.txt", "w") as f:
    f.write("Python makes file handling simple.\\n")
    f.write("Every board exam asks one text file question.\\n")
    f.write("Practice reading and writing every day.\\n")

# Step 2: read and analyse
with open("story.txt", "r") as f:
    data = f.read()

lines = data.split("\\n")
lines = [ln for ln in lines if ln.strip() != ""]
words = data.split()
vowels = sum(1 for ch in data if ch.lower() in "aeiou")

print("Lines  :", len(lines))
print("Words  :", len(words))
print("Vowels :", vowels)

# Step 3: lines starting with a given letter
with open("story.txt", "r") as f:
    for line in f:
        if line.startswith("P"):
            print("Starts with P ->", line.strip())`
  ),
  s(
    "p4",
    "p4_binary_file_records.py",
    "Binary file: add, search and update student records",
    "File Handling",
    "Write a program to store student records in a binary file and search/update a record.",
    `
import pickle


def add_records():
    records = []
    for rollno, name, marks in [(1, "Aarav", 92), (2, "Diya", 78), (3, "Kabir", 65)]:
        records.append({"rollno": rollno, "name": name, "marks": marks})
    with open("students.dat", "wb") as f:
        pickle.dump(records, f)
    print(len(records), "records written")


def display_records():
    with open("students.dat", "rb") as f:
        records = pickle.load(f)
    for r in records:
        print(r["rollno"], r["name"], r["marks"])


def search(rollno):
    with open("students.dat", "rb") as f:
        records = pickle.load(f)
    for r in records:
        if r["rollno"] == rollno:
            print("Found:", r)
            return r
    print("Record not found")
    return None


def update(rollno, new_marks):
    with open("students.dat", "rb") as f:
        records = pickle.load(f)
    for r in records:
        if r["rollno"] == rollno:
            r["marks"] = new_marks
    with open("students.dat", "wb") as f:
        pickle.dump(records, f)
    print("Record updated")


add_records()
display_records()
search(2)
update(2, 85)
display_records()`
  ),
  s(
    "p5",
    "p5_csv_file.py",
    "CSV file: write and read student marks",
    "CSV",
    "Write a program to create a CSV file of students and read back rows above a cut-off.",
    `
import csv

rows = [
    ["rollno", "name", "marks"],
    [1, "Aarav", 92],
    [2, "Diya", 78],
    [3, "Kabir", 65],
    [4, "Meera", 88],
]

with open("students.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerows(rows)
print("CSV file created")

with open("students.csv", "r") as f:
    reader = csv.reader(f)
    header = next(reader)
    print(header)
    for row in reader:
        if int(row[2]) >= 80:
            print("Distinction:", row[1], row[2])`
  ),
  s(
    "p6",
    "p6_mysql_connectivity.py",
    "Python + MySQL: full CRUD with mysql.connector",
    "MySQL",
    "Write a program to connect Python with MySQL and perform insert, display, update and delete.",
    `
import mysql.connector

con = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",
    database="school",
)
cur = con.cursor()

cur.execute(
    """CREATE TABLE IF NOT EXISTS student (
           rollno INT PRIMARY KEY,
           name VARCHAR(30),
           stream VARCHAR(20),
           marks INT)"""
)

# INSERT
cur.execute(
    "INSERT INTO student VALUES (%s, %s, %s, %s)",
    (1, "Aarav", "Science", 92),
)
con.commit()
print(cur.rowcount, "record inserted")

# DISPLAY
cur.execute("SELECT * FROM student")
for row in cur.fetchall():
    print(row)

# UPDATE
cur.execute("UPDATE student SET marks = %s WHERE rollno = %s", (95, 1))
con.commit()
print(cur.rowcount, "record updated")

# DELETE
cur.execute("DELETE FROM student WHERE rollno = %s", (1,))
con.commit()
print(cur.rowcount, "record deleted")

cur.close()
con.close()`
  ),
  s(
    "p7",
    "p7_queue_operations.py",
    "Queue using a list (enqueue / dequeue)",
    "Data Structures",
    "Write a program to implement a queue using a list with enqueue and dequeue operations.",
    `
queue = []


def enqueue(item):
    queue.append(item)
    print(item, "added to queue")


def dequeue():
    if not queue:
        print("Queue is empty")
        return None
    item = queue.pop(0)
    print(item, "removed from queue")
    return item


def display():
    print("Queue (front to rear):", queue if queue else "empty")


enqueue("A")
enqueue("B")
enqueue("C")
display()
dequeue()
display()`
  ),
  s(
    "p8",
    "p8_random_dice.py",
    "Random module: dice game simulation",
    "Python",
    "Write a program using the random module to simulate rolling two dice and count the scores.",
    `
import random

counts = {}
for _ in range(20):
    dice = random.randint(1, 6) + random.randint(1, 6)
    counts[dice] = counts.get(dice, 0) + 1

for score in sorted(counts):
    print(score, "->", "*" * counts[score])

print("Most common score:", max(counts, key=counts.get))`
  ),
];
