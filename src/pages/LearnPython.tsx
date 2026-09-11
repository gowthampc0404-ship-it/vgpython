import { NotebookPage, TextCell, CodeCell } from "@/components/learn/Notebook";

export default function LearnPython() {
  return (
    <NotebookPage
      fileName="python_fundamentals.ipynb"
      title="Python Fundamentals & Data Structures"
      subtitle="Run every cell right here in your browser — no installation. Edit the code, press the play button and see real output, exactly like a Colab notebook."
    >
      <TextCell heading="1. Variables, input and output">
        <p>
          Everything in Python starts with storing values. <code>input()</code> always
          gives you text, so wrap it in <code>int()</code> or <code>float()</code> when
          you need numbers.
        </p>
      </TextCell>
      <CodeCell
        fileName="variables.py"
        code={`name = "Aarav"
marks = 92
percentage = marks / 100

print("Name:", name)
print("Marks:", marks)
print("Percentage: {:.2f}%".format(percentage * 100))
print(type(name), type(marks), type(percentage))`}
      />

      <TextCell heading="2. Conditions">
        <p>Indentation decides which lines belong to which block — four spaces each time.</p>
      </TextCell>
      <CodeCell
        fileName="grades.py"
        code={`def grade(marks):
    if marks >= 90:
        return "A1"
    elif marks >= 75:
        return "A2"
    elif marks >= 60:
        return "B1"
    else:
        return "Needs practice"


for m in [95, 82, 66, 41]:
    print(m, "->", grade(m))`}
      />

      <TextCell heading="3. Loops and patterns">
        <p>
          <code>for</code> loops walk through a sequence; <code>while</code> loops repeat
          until a condition breaks. Star patterns are a favourite board question.
        </p>
      </TextCell>
      <CodeCell
        fileName="patterns.py"
        code={`# Multiplication table
for i in range(1, 6):
    print(f"5 x {i} = {5 * i}")

print()

# Right-angled triangle
for i in range(1, 6):
    print("*" * i)

print()

# Sum of digits with a while loop
n = 4729
total = 0
while n > 0:
    total += n % 10
    n //= 10
print("Sum of digits =", total)`}
      />

      <TextCell heading="4. Functions, default and keyword arguments">
        <p>
          Functions keep your practical file clean. Default values let you call the same
          function in different ways.
        </p>
      </TextCell>
      <CodeCell
        fileName="functions.py"
        code={`def report(name, marks, stream="Science"):
    return f"{name} ({stream}) scored {marks}"


print(report("Aarav", 92))
print(report("Diya", 78, "Commerce"))
print(report(marks=88, name="Meera", stream="Humanities"))


def stats(*numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)


low, high, avg = stats(45, 78, 92, 66)
print("Lowest:", low, "Highest:", high, "Average:", round(avg, 2))`}
      />

      <TextCell heading="5. Lists, tuples and dictionaries">
        <p>
          Lists can change, tuples cannot, dictionaries store key-value pairs. Most Class 12
          data-handling questions use these three.
        </p>
      </TextCell>
      <CodeCell
        fileName="collections.py"
        code={`marks = [92, 78, 65, 88, 54]
print("Sorted:", sorted(marks, reverse=True))
print("Top 3:", sorted(marks, reverse=True)[:3])
print("Average:", round(sum(marks) / len(marks), 2))

student = ("Aarav", "XII-A", 92)
name, section, score = student
print(name, section, score)

record = {"rollno": 1, "name": "Aarav", "marks": 92}
record["city"] = "Chennai"
for key, value in record.items():
    print(key, "=", value)`}
      />

      <TextCell heading="6. Stack — push, pop, peek">
        <p>
          A stack is Last-In-First-Out. In Python a plain list is enough:
          <code> append()</code> to push and <code>pop()</code> to remove the top item.
          Always check for underflow before popping.
        </p>
      </TextCell>
      <CodeCell
        fileName="stack.py"
        code={`stack = []


def push(item):
    stack.append(item)
    print("Pushed", item, "->", stack)


def pop():
    if not stack:
        print("Underflow - stack is empty")
        return None
    item = stack.pop()
    print("Popped", item, "->", stack)
    return item


def peek():
    return stack[-1] if stack else "empty"


push(10)
push(20)
push(30)
print("Top is", peek())
pop()
pop()
pop()
pop()`}
      />

      <TextCell heading="7. Queue — enqueue and dequeue">
        <p>A queue is First-In-First-Out: add at the rear, remove from the front.</p>
      </TextCell>
      <CodeCell
        fileName="queue.py"
        code={`queue = []


def enqueue(item):
    queue.append(item)
    print("Added", item, "->", queue)


def dequeue():
    if not queue:
        print("Queue is empty")
        return None
    item = queue.pop(0)
    print("Removed", item, "->", queue)
    return item


enqueue("A")
enqueue("B")
enqueue("C")
dequeue()
dequeue()`}
      />

      <TextCell heading="8. Practice it yourself">
        <p>
          Clear the cell below and write your own program — it runs with the same Python
          engine as the rest of the notebook.
        </p>
      </TextCell>
      <CodeCell
        fileName="scratch.py"
        code={`# Your turn: print the Fibonacci series up to 10 terms
a, b = 0, 1
for _ in range(10):
    print(a, end=" ")
    a, b = b, a + b`}
      />
    </NotebookPage>
  );
}
