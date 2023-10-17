# Relationship in Mysql

## One-to-One Relationship:

Suppose you have two tables, Employees and EmployeeDetails, and you want to model a one-to-one relationship where each employee has a single corresponding set of employee details.

```
-- Create the Employees table
CREATE TABLE Employees (
    employee_id INT PRIMARY KEY,
    employee_name VARCHAR(50)
);

-- Create the EmployeeDetails table
CREATE TABLE EmployeeDetails (
    employee_id INT PRIMARY KEY,
    address VARCHAR(100),
    phone_number VARCHAR(15),
    FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
);

-- Insert sample data into Employees table
INSERT INTO Employees (employee_id, employee_name) VALUES
(1, 'John Doe'),
(2, 'Alice Smith');

-- Insert sample data into EmployeeDetails table
INSERT INTO EmployeeDetails (employee_id, address, phone_number) VALUES
(1, '123 Main St', '555-1234'),
(2, '456 Elm St', '555-5678');

-- Query to retrieve employee names and their details
SELECT e.employee_name, ed.address, ed.phone_number
FROM Employees e
JOIN EmployeeDetails ed ON e.employee_id = ed.employee_id;

```

The output for this query will be:

```
+--------------+------------+--------------+
| employee_name | address    | phone_number |
+--------------+------------+--------------+
| John Doe     | 123 Main St| 555-1234     |
| Alice Smith  | 456 Elm St | 555-5678     |
+--------------+------------+--------------+

```

## One-to-Many Relationship:

Now, let's consider a one-to-many relationship between Departments and Employees, where one department can have many employees.

```
-- Create the Departments table
CREATE TABLE Departments (
    department_id INT PRIMARY KEY,
    department_name VARCHAR(50)
);

-- Create the Employees table
CREATE TABLE Employees (
    employee_id INT PRIMARY KEY,
    employee_name VARCHAR(50),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

-- Insert sample data into Departments table
INSERT INTO Departments (department_id, department_name) VALUES
(1, 'HR'),
(2, 'Engineering');

-- Insert sample data into Employees table
INSERT INTO Employees (employee_id, employee_name, department_id) VALUES
(1, 'John Doe', 1),
(2, 'Alice Smith', 1),
(3, 'Bob Johnson', 2),
(4, 'Eve Anderson', 2);

-- Query to retrieve department names and their employees
SELECT d.department_name, e.employee_name
FROM Departments d
LEFT JOIN Employees e ON d.department_id = e.department_id;

```

The output for this query will be:

```
+----------------+--------------+
| department_name | employee_name |
+----------------+--------------+
| HR             | John Doe     |
| HR             | Alice Smith  |
| Engineering    | Bob Johnson  |
| Engineering    | Eve Anderson |
+----------------+--------------+

```

## Many-to-Many Relationship:

In a relational database like MySQL, you can create a many-to-many relationship between two entities by using a junction table. This junction table connects the primary keys of the two entities, allowing multiple records in one table to be associated with multiple records in another table. Here's how you can create a many-to-many relationship using a schema:

Let's say you have two entities: Students and Courses. Each student can enroll in multiple courses, and each course can have multiple students.

```
-- Create the Students table
CREATE TABLE Students (
    student_id INT PRIMARY KEY,
    student_name VARCHAR(50)
);

-- Create the Courses table
CREATE TABLE Courses (
    course_id INT PRIMARY KEY,
    course_name VARCHAR(50)
);

-- Create the junction table (StudentCourses)
CREATE TABLE StudentCourses (
    student_id INT,
    course_id INT,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

-- Insert sample data into Students table
INSERT INTO Students (student_id, student_name) VALUES
(1, 'John Doe'),
(2, 'Alice Smith'),
(3, 'Bob Johnson');

-- Insert sample data into Courses table
INSERT INTO Courses (course_id, course_name) VALUES
(101, 'Math 101'),
(102, 'History 101'),
(103, 'Science 101');

-- Enroll students in courses (example enrollments)
INSERT INTO StudentCourses (student_id, course_id) VALUES
(1, 101),  -- John Doe in Math 101
(1, 102),  -- John Doe in History 101
(2, 101),  -- Alice Smith in Math 101
(3, 102),  -- Bob Johnson in History 101
(3, 103);  -- Bob Johnson in Science 101

-- Query to retrieve students and their enrolled courses
SELECT s.student_name, c.course_name
FROM Students s
JOIN StudentCourses sc ON s.student_id = sc.student_id
JOIN Courses c ON sc.course_id = c.course_id;

```

This SQL example creates three tables: Students, Courses, and StudentCourses. It inserts sample data for students and courses and enrolls students in courses using the StudentCourses junction table.

The final query retrieves students and their enrolled courses, producing the following output:

```
+--------------+------------+
| student_name | course_name |
+--------------+------------+
| John Doe     | Math 101   |
| John Doe     | History 101 |
| Alice Smith  | Math 101   |
| Bob Johnson  | History 101 |
| Bob Johnson  | Science 101 |
+--------------+------------+

```