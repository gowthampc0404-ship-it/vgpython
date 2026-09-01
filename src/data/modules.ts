export interface Topic {
  id: string;
  title: string;
  badge: string;
  code: string;
  explanation: { line: string; text: string }[];
  notes?: string[];
}

export interface ModuleDef {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  topics: Topic[];
}

export const MODULES: ModuleDef[] = [
  {
    slug: "python-fundamentals",
    title: "Python Fundamentals & Data Structures",
    tagline: "Loops · Functions · Stacks",
    description:
      "Master the logic. Step-by-step breakdowns of loops, functions, and Stack implementations with easy-to-copy code snippets.",
    topics: [
      {
        id: "functions",
        title: "Functions & Arguments",
        badge: "FUNCTION",
        code: `# Function with default and keyword arguments
def student_report(name, marks, total=100):
    percent = (marks / total) * 100
    return f"{name} scored {percent:.2f}%"

print(student_report("Aarav", 87))
print(student_report(marks=92, name="Diya", total=120))`,
        explanation: [
          { line: "def student_report(...)", text: "Defines a function with two required parameters and one default parameter (total=100)." },
          { line: "percent = (marks / total) * 100", text: "Arithmetic runs inside the local scope; percent only exists while the function executes." },
          { line: "return f\"...{percent:.2f}%\"", text: "An f-string formats the value to 2 decimal places and returns it to the caller." },
          { line: "student_report(marks=92, ...)", text: "Keyword arguments can be passed in any order, unlike positional arguments." },
        ],
        notes: [
          "Default arguments must always come after non-default arguments.",
          "A function without return sends back None.",
        ],
      },
      {
        id: "loops",
        title: "Loops & Iteration Patterns",
        badge: "LOOP",
        code: `# Board-favourite loop patterns
nums = [12, 7, 25, 4, 19]

# 1. Sum and largest using a for loop
total = 0
largest = nums[0]
for n in nums:
    total += n
    if n > largest:
        largest = n
print("Sum:", total, "Largest:", largest)

# 2. Index based traversal
for i in range(len(nums)):
    print(i, "->", nums[i])

# 3. while loop with a counter
i = 0
while i < 3:
    print("Pass", i + 1)
    i += 1`,
        explanation: [
          { line: "for n in nums:", text: "Iterates over each value directly — no index needed." },
          { line: "if n > largest:", text: "Classic maximum-finding logic: compare and replace." },
          { line: "for i in range(len(nums))", text: "Gives index numbers so you can print position and value together." },
          { line: "while i < 3:", text: "Runs until the condition is False; i += 1 prevents an infinite loop." },
        ],
        notes: ["Forgetting i += 1 in a while loop is the most common exam mistake."],
      },
      {
        id: "stack",
        title: "Stack Implementation (List based)",
        badge: "DATA STRUCTURE",
        code: `# Stack using a Python list (LIFO)
stack = []

def push(item):
    stack.append(item)
    print("Pushed:", item)

def pop():
    if not stack:                 # underflow check
        return "Stack Underflow"
    return stack.pop()

def peek():
    return stack[-1] if stack else None

push(10)
push(20)
push(30)
print("Top:", peek())
print("Popped:", pop())
print("Stack now:", stack)`,
        explanation: [
          { line: "stack = []", text: "An empty list acts as the stack; the end of the list is the TOP." },
          { line: "stack.append(item)", text: "PUSH operation — always adds at the top in O(1) time." },
          { line: "if not stack:", text: "Underflow check. Popping from an empty list raises IndexError, so guard it." },
          { line: "stack.pop()", text: "POP removes and returns the last element (Last In, First Out)." },
          { line: "stack[-1]", text: "PEEK reads the top element without removing it." },
        ],
        notes: ["Exams often ask for push, pop and display functions with underflow messages."],
      },
    ],
  },
  {
    slug: "file-handling",
    title: "File Handling & Simulations",
    tagline: "Text · Binary · CSV",
    description:
      "Text, Binary, and CSV files demystified. Use interactive simulators to see read/write operations in action.",
    topics: [
      {
        id: "text",
        title: "Text Files (read / write / append)",
        badge: "TEXT FILE",
        code: `# Writing, appending and reading a text file
f = open("notes.txt", "w")
f.write("Python is fun\\n")
f.write("Class 12 CS\\n")
f.close()

with open("notes.txt", "a") as f:
    f.write("Board exam 2026\\n")

with open("notes.txt", "r") as f:
    for line in f:
        print(line.strip())

# Count lines starting with 'P'
with open("notes.txt") as f:
    count = sum(1 for l in f if l.startswith("P"))
print("Lines starting with P:", count)`,
        explanation: [
          { line: "open(\"notes.txt\", \"w\")", text: "'w' creates the file, or erases everything if it already exists." },
          { line: "f.write(...)", text: "write() does NOT add a newline — you must add \\n yourself." },
          { line: "with open(...) as f:", text: "The with block closes the file automatically, even if an error occurs." },
          { line: "\"a\" mode", text: "Append keeps existing data and writes at the end of the file." },
          { line: "line.strip()", text: "Removes the trailing newline picked up while reading." },
        ],
        notes: ["Modes: r (read), w (overwrite), a (append), r+ (read & write)."],
      },
      {
        id: "binary",
        title: "Binary Files with pickle",
        badge: "BINARY FILE",
        code: `import pickle

students = [
    {"roll": 1, "name": "Aarav", "marks": 87},
    {"roll": 2, "name": "Diya", "marks": 92},
]

# Write objects to a binary file
with open("students.dat", "wb") as f:
    pickle.dump(students, f)

# Read them back
with open("students.dat", "rb") as f:
    data = pickle.load(f)

for s in data:
    if s["marks"] > 90:
        print(s["name"], "->", s["marks"])`,
        explanation: [
          { line: "import pickle", text: "pickle converts Python objects into a byte stream (serialisation)." },
          { line: "\"wb\" / \"rb\"", text: "Binary modes are compulsory — text mode will raise a TypeError." },
          { line: "pickle.dump(obj, f)", text: "Writes the whole object in one shot." },
          { line: "pickle.load(f)", text: "Reads one object back. Reading past the end raises EOFError, so loop with try/except." },
        ],
        notes: ["Searching a binary file = load the list, then loop with an if condition."],
      },
      {
        id: "csv",
        title: "CSV Files with the csv module",
        badge: "CSV FILE",
        code: `import csv

rows = [["roll", "name", "marks"],
        [1, "Aarav", 87],
        [2, "Diya", 92]]

# Write CSV (newline='' avoids blank rows on Windows)
with open("marks.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerows(rows)

# Read CSV and skip the header
with open("marks.csv", "r", newline="") as f:
    reader = csv.reader(f)
    header = next(reader)
    for r in reader:
        print(r[1], "scored", r[2])`,
        explanation: [
          { line: "csv.writer(f)", text: "Creates a writer object bound to the open file." },
          { line: "writerows(rows)", text: "Writes a list of lists; use writerow() for a single record." },
          { line: "newline=\"\"", text: "Prevents an extra blank line between records." },
          { line: "next(reader)", text: "Reads and discards the header row before processing data." },
          { line: "r[2]", text: "Every value read from CSV is a string — convert with int() before maths." },
        ],
      },
    ],
  },
  {
    slug: "mysql",
    title: "MySQL & Database Connectivity",
    tagline: "connect · CRUD · commit",
    description:
      "Connect Python to MySQL without syntax errors. Ready-to-use boilerplate code for all CRUD operations.",
    topics: [
      {
        id: "connect",
        title: "Connecting Python to MySQL",
        badge: "CONNECT",
        code: `import mysql.connector as sql

con = sql.connect(
    host="localhost",
    user="root",
    password="your_password",
    database="school"
)

if con.is_connected():
    print("Connected successfully")

cur = con.cursor()
cur.execute("SELECT DATABASE();")
print(cur.fetchone())

con.close()`,
        explanation: [
          { line: "import mysql.connector", text: "Install once with: pip install mysql-connector-python" },
          { line: "sql.connect(...)", text: "Creates the connection object using host, user, password and database." },
          { line: "con.cursor()", text: "The cursor is the object that actually executes SQL and holds the result set." },
          { line: "fetchone()", text: "Returns a single record as a tuple; fetchall() returns a list of tuples." },
          { line: "con.close()", text: "Always close the connection at the end of the program." },
        ],
        notes: ["Wrong password → mysql.connector.errors.ProgrammingError, not a syntax error."],
      },
      {
        id: "crud",
        title: "CRUD Operations (INSERT / SELECT / UPDATE / DELETE)",
        badge: "CRUD",
        code: `cur = con.cursor()

# CREATE
cur.execute("""CREATE TABLE IF NOT EXISTS student(
                 roll INT PRIMARY KEY,
                 name VARCHAR(30),
                 marks INT)""")

# INSERT (parameterised - safe)
cur.execute("INSERT INTO student VALUES (%s, %s, %s)", (1, "Aarav", 87))
con.commit()

# READ
cur.execute("SELECT * FROM student WHERE marks > %s", (80,))
for row in cur.fetchall():
    print(row)

# UPDATE
cur.execute("UPDATE student SET marks = %s WHERE roll = %s", (95, 1))
con.commit()

# DELETE
cur.execute("DELETE FROM student WHERE roll = %s", (1,))
con.commit()
print("Rows affected:", cur.rowcount)`,
        explanation: [
          { line: "%s placeholders", text: "Always pass values as a tuple — this prevents SQL injection and quoting errors." },
          { line: "con.commit()", text: "INSERT, UPDATE and DELETE are NOT saved until you commit." },
          { line: "fetchall()", text: "Returns every matching row as a list of tuples." },
          { line: "cur.rowcount", text: "Tells how many rows the last statement affected." },
        ],
        notes: [
          "SELECT never needs commit(); write operations always do.",
          "A single-value tuple needs the trailing comma: (80,)",
        ],
      },
    ],
  },
];

export const getModule = (slug?: string) => MODULES.find((m) => m.slug === slug);
