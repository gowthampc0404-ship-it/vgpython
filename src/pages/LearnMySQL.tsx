import { NotebookPage, TextCell, CodeCell } from "@/components/learn/Notebook";
import MySqlSimulator from "@/components/learn/MySqlSimulator";

export default function LearnMySQL() {
  return (
    <NotebookPage
      fileName="mysql_connectivity.ipynb"
      title="MySQL & Database Connectivity"
      subtitle="Type real SQL and watch the tables change row by row in the simulator, then use the ready-made Python connectivity code for your practical file."
    >
      <TextCell heading="1. Interactive MySQL simulator">
        <p>
          The database <code>school</code> already has a <code>student</code> and a{" "}
          <code>library</code> table. Run any query — the result grid and the live table
          below it update instantly, so you can see exactly what INSERT, UPDATE and DELETE
          do to your rows.
        </p>
      </TextCell>
      <MySqlSimulator />

      <TextCell heading="2. Creating a database and table">
        <p>
          In MySQL you first select a database, then create tables with a data type for
          every column and one primary key.
        </p>
      </TextCell>
      <CodeCell
        runnable={false}
        fileName="create_table.sql"
        code={`CREATE DATABASE school;
USE school;

CREATE TABLE student (
    rollno INT PRIMARY KEY,
    name   VARCHAR(30) NOT NULL,
    stream VARCHAR(20),
    marks  INT,
    city   VARCHAR(20)
);

DESC student;`}
      />

      <TextCell heading="3. The queries you must know">
        <p>
          Copy each of these into the simulator above and watch the table react. These cover
          almost every SQL question in the board paper.
        </p>
      </TextCell>
      <CodeCell
        runnable={false}
        fileName="queries.sql"
        code={`-- Show everything
SELECT * FROM student;

-- Filter rows
SELECT name, marks FROM student WHERE marks > 70;
SELECT * FROM student WHERE city IN ('Chennai','Salem');
SELECT * FROM student WHERE name LIKE 'A%';
SELECT * FROM student WHERE marks BETWEEN 60 AND 90;

-- Sort and limit
SELECT name, marks FROM student ORDER BY marks DESC LIMIT 3;

-- Aggregate functions
SELECT COUNT(*) FROM student;
SELECT AVG(marks), MAX(marks), MIN(marks) FROM student;
SELECT stream, COUNT(*), AVG(marks) FROM student GROUP BY stream;

-- Change data
INSERT INTO student VALUES (6,'Nila','Commerce',81,'Erode');
UPDATE student SET marks = marks + 5 WHERE stream = 'Science';
DELETE FROM student WHERE marks < 60;`}
      />

      <TextCell heading="4. Connecting Python to MySQL">
        <p>
          On your school computer install the connector once with{" "}
          <code>pip install mysql-connector-python</code>. This cell is reference code — it
          needs a real MySQL server, so it is not runnable in the browser.
        </p>
      </TextCell>
      <CodeCell
        runnable={false}
        fileName="connect.py"
        code={`import mysql.connector

con = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",
    database="school",
)

if con.is_connected():
    print("Connected successfully")

cur = con.cursor()
cur.execute("SELECT * FROM student")

for row in cur.fetchall():
    print(row)

cur.close()
con.close()`}
      />

      <TextCell heading="5. Full CRUD boilerplate">
        <p>
          Remember two rules: use <code>%s</code> placeholders instead of joining strings,
          and call <code>con.commit()</code> after every INSERT, UPDATE or DELETE — without
          it your changes disappear.
        </p>
      </TextCell>
      <CodeCell
        runnable={false}
        fileName="crud.py"
        code={`import mysql.connector

con = mysql.connector.connect(
    host="localhost", user="root", password="your_password", database="school"
)
cur = con.cursor()

# CREATE
cur.execute("INSERT INTO student VALUES (%s,%s,%s,%s,%s)",
            (7, "Ishan", "Science", 74, "Trichy"))
con.commit()
print(cur.rowcount, "row inserted")

# READ one row / many rows
cur.execute("SELECT * FROM student WHERE rollno = %s", (7,))
print(cur.fetchone())

cur.execute("SELECT * FROM student WHERE marks > %s", (70,))
for row in cur.fetchall():
    print(row)

# UPDATE
cur.execute("UPDATE student SET marks = %s WHERE rollno = %s", (80, 7))
con.commit()
print(cur.rowcount, "row updated")

# DELETE
cur.execute("DELETE FROM student WHERE rollno = %s", (7,))
con.commit()
print(cur.rowcount, "row deleted")

cur.close()
con.close()`}
      />

      <TextCell heading="6. Common errors and fixes">
        <p>
          <strong>Access denied</strong> — the password in your code doesn't match MySQL.{" "}
          <strong>Unknown database</strong> — create it first with{" "}
          <code>CREATE DATABASE school;</code>. <strong>Nothing saved</strong> — you forgot{" "}
          <code>con.commit()</code>. <strong>No module named mysql</strong> — run{" "}
          <code>pip install mysql-connector-python</code>.
        </p>
      </TextCell>

      <TextCell heading="7. Python logic you can run here">
        <p>
          This cell mimics fetched database rows with a list of tuples, so you can practise
          the reporting part of the program without a server.
        </p>
      </TextCell>
      <CodeCell
        fileName="report.py"
        code={`rows = [
    (1, "Aarav", "Science", 92),
    (2, "Diya", "Commerce", 78),
    (3, "Kabir", "Science", 65),
    (4, "Meera", "Humanities", 88),
]

print(f"{'Roll':<6}{'Name':<10}{'Stream':<12}{'Marks':>5}")
print("-" * 33)
for rollno, name, stream, marks in rows:
    print(f"{rollno:<6}{name:<10}{stream:<12}{marks:>5}")

print("-" * 33)
print("Average marks:", round(sum(r[3] for r in rows) / len(rows), 2))`}
      />
    </NotebookPage>
  );
}
