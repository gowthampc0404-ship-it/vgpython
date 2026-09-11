import { NotebookPage, TextCell, CodeCell } from "@/components/learn/Notebook";

export default function LearnFiles() {
  return (
    <NotebookPage
      fileName="file_handling.ipynb"
      title="File Handling & Simulations"
      subtitle="Text, binary and CSV files — every cell actually creates and reads files in a private in-browser filesystem, so you can watch read/write operations happen for real."
    >
      <TextCell heading="1. Writing a text file">
        <p>
          Mode <code>"w"</code> creates a new file (and erases an old one),
          <code> "a"</code> adds to the end and <code>"r"</code> reads. Using
          <code> with open(...)</code> closes the file automatically.
        </p>
      </TextCell>
      <CodeCell
        fileName="write_text.py"
        code={`with open("story.txt", "w") as f:
    f.write("Python makes file handling simple.\\n")
    f.write("Every board exam asks one text file question.\\n")

with open("story.txt", "a") as f:
    f.write("Practice reading and writing every day.\\n")

print("File written. Contents:\\n")
print(open("story.txt").read())`}
      />

      <TextCell heading="2. Reading: read, readline and readlines">
        <p>
          <code>read()</code> gives the whole file as one string,
          <code> readline()</code> gives one line, <code>readlines()</code> gives a list of
          lines.
        </p>
      </TextCell>
      <CodeCell
        fileName="read_text.py"
        code={`f = open("story.txt", "r")
print("read(20)   :", repr(f.read(20)))
print("tell()     :", f.tell(), "<- pointer position")
print("readline() :", repr(f.readline()))
f.seek(0)
print("readlines():", f.readlines())
f.close()`}
      />

      <TextCell heading="3. Counting lines, words, vowels">
        <p>The classic 3-mark question. Count characters, words and lines in one pass.</p>
      </TextCell>
      <CodeCell
        fileName="count_text.py"
        code={`with open("story.txt") as f:
    data = f.read()

lines = [ln for ln in data.split("\\n") if ln.strip()]
words = data.split()
vowels = sum(1 for ch in data if ch.lower() in "aeiou")
uppercase = sum(1 for ch in data if ch.isupper())

print("Lines     :", len(lines))
print("Words     :", len(words))
print("Vowels    :", vowels)
print("Uppercase :", uppercase)

print("\\nLines starting with 'P':")
for ln in lines:
    if ln.startswith("P"):
        print(" ->", ln)`}
      />

      <TextCell heading="4. Binary files with pickle">
        <p>
          <code>pickle.dump()</code> writes Python objects to a binary file and
          <code> pickle.load()</code> reads them back. Always open in <code>"wb"</code> /
          <code> "rb"</code> mode.
        </p>
      </TextCell>
      <CodeCell
        fileName="binary_file.py"
        code={`import pickle

students = [
    {"rollno": 1, "name": "Aarav", "marks": 92},
    {"rollno": 2, "name": "Diya", "marks": 78},
    {"rollno": 3, "name": "Kabir", "marks": 65},
]

with open("students.dat", "wb") as f:
    pickle.dump(students, f)
print("Records written:", len(students))

with open("students.dat", "rb") as f:
    data = pickle.load(f)

for r in data:
    print(r["rollno"], r["name"], r["marks"])`}
      />

      <TextCell heading="5. Search and update a binary record">
        <p>Read the whole list, change it in memory, then write it back.</p>
      </TextCell>
      <CodeCell
        fileName="binary_update.py"
        code={`import pickle


def load():
    with open("students.dat", "rb") as f:
        return pickle.load(f)


def save(records):
    with open("students.dat", "wb") as f:
        pickle.dump(records, f)


records = load()

# search
for r in records:
    if r["rollno"] == 2:
        print("Found:", r)

# update
for r in records:
    if r["rollno"] == 2:
        r["marks"] = 85
save(records)

print("After update:")
for r in load():
    print(r)`}
      />

      <TextCell heading="6. CSV files">
        <p>
          Use <code>csv.writer</code> with <code>newline=""</code> to avoid blank rows, and
          <code> csv.reader</code> to read rows back as lists.
        </p>
      </TextCell>
      <CodeCell
        fileName="csv_file.py"
        code={`import csv

rows = [
    ["rollno", "name", "marks"],
    [1, "Aarav", 92],
    [2, "Diya", 78],
    [3, "Kabir", 65],
    [4, "Meera", 88],
]

with open("students.csv", "w", newline="") as f:
    csv.writer(f).writerows(rows)

with open("students.csv") as f:
    reader = csv.reader(f)
    header = next(reader)
    print(header)
    total = 0
    count = 0
    for row in reader:
        marks = int(row[2])
        total += marks
        count += 1
        tag = "Distinction" if marks >= 80 else ""
        print(row[0], row[1], marks, tag)
    print("Class average:", round(total / count, 2))`}
      />

      <TextCell heading="7. Pointer simulator: seek and tell">
        <p>
          Watch the file pointer move. <code>tell()</code> reports the current byte position
          and <code>seek(n)</code> jumps to it.
        </p>
      </TextCell>
      <CodeCell
        fileName="seek_demo.py"
        code={`f = open("story.txt", "r")

for step in range(4):
    pos = f.tell()
    chunk = f.read(10)
    print(f"step {step}: pointer {pos:>3} -> {pos + len(chunk):>3} | {chunk!r}")

f.seek(0)
print("\\nAfter seek(0), pointer is at", f.tell())
print("First line again:", f.readline().strip())
f.close()`}
      />

      <TextCell heading="8. Practice cell">
        <p>Try writing a program that copies only the lines containing the word "exam".</p>
      </TextCell>
      <CodeCell
        fileName="scratch_files.py"
        code={`with open("story.txt") as src, open("filtered.txt", "w") as dst:
    for line in src:
        if "exam" in line.lower():
            dst.write(line)

print(open("filtered.txt").read() or "No matching lines")`}
      />
    </NotebookPage>
  );
}
