---
title: "database/sql golang: excellent resources + Part 1 of things I learnt"
date: 2025-06-15T00:00:00Z
image: /images/posts/post-1.jpg
categories:
  - Golang
  - database/sql
draft: false
---

### A simillar problem when teaching high school mathematics

A typical singaporean high school students has 2 years to prepare for national exams (A levels).

Tell me you are a year 1 student without telling me you are a year 1 student:

> My schools's lecture notes sucks!

### Tell me you are a junior dev without telling me you are a junior dev

![Bear Trap Meme](./beartrapmeme.jpeg)

So I got to admit it. I didn't like [the docs](https://pkg.go.dev/database/sql) for database/sql for the longest time.

Nothing made sense when I was writing my first implementation of sql.DB.

I relied more on blogs/medium articles and their code snippets.

Then I would try to implement it slightly differently to see how I could break things.

### switching back to math tutoring context..

Now, I notice this phenomenon of "the fault lies in the notes, not in me" always happens for topics that are more abstract.

For example vectors (dot/cross product, length of projection, finding shortest distance between line and plane etc)

how I help students in cases like these:

- instead of going through the concept/theory first, I prefer to start them off with practice questions (gradual increasing level of complexity)
- we then revisit the concept and theory AFTER the student has a vague notion of the abstract objects we are dealing with
- then I point them back to their lecture notes
- wait for the "eureka" moment to show on their faces (best part of my job)

### back to me struggling with database/sql

after implementing sql.DB more.. and scouring the world wide web (unlike my students who had someone feeding them gradually more complex problem sets, I had to seek out my own gradual improvement)

here are some really great resources that helped me overcome phobia of "RTFM"

1. [Let's Go](https://lets-go.alexedwards.net/) - PAID

- really high quality code snippets
- the author, Alex Edwards, doesn't skip explanations
  - if you are new to Go and find yourself opening 3-5 new tabs reading a Medium article
  - his ebook explains these so you don't have to chase rabbit holes, which is a great TIME-SAVER

2. If paid is not your thing, here's a free article from Alex Edwards - [An introduction to using SQL databases in Go](https://www.alexedwards.net/blog/introduction-to-using-sql-databases-in-go)

- this article is a little bit dated
- the database driver for postgres "github.com/lib/pq" is no longer actively maintained
- you might want to go with "github.com/jackc/pgx/v5/stdlib"

3. [Go database/sql tutorial](http://go-database-sql.org/index.html) - FREE

- this one goes one level deeper and complements the topics taught by Alex Edwards
- goes very well like PB & J

Anyways, here are some of the things I've learnt just from the resources mentioned above!

PART 1:

### sql.DB from "database/sql" standard library

- it's pretty cool but it requires a database driver

  - e.g. if you are using MySQL you would need "github.com/go-sql-driver/mysql"
  - e.g. if you are using posgreSQL you would need "github.com/jackc/pgx/v5/stdlib"
    - pgx is rather peculiar.. you could abandon database/sql and roll with pgx entirely
    - in which case you need "github.com/jackc/pgx/v5" (without "stdlib")
    - it has more powerful features, but you would no longer be using the same types/functions, which can make interfacing rather complicated

- here's how you can instantiate sql.DB
  -e.g.

  ```go

  // sql.Open(driverName string, dsn string) (*sql.DB, error)
  db, err := sql.Open("pgx", "postgres://username:password@hostname:port/dbname")
  if err != nil {
    log.Fatal(err)
  }
  defer db.Close()

  err = db.Ping()
  if err != nil {
    log.Fatal(err)
  }

  ```

- it is important to note that sql.DB is not a connection to the database.
- it is somewhat simillar to a prepared statement that is stored in your memory to be used later
- thus, to ensure that the connection works, we need to call db.Ping()

### how to query database using \*sql.DB

- there are 3 main methods for database queries

  1. DB.QueryRow() - used for SELECT queries which returns a single row
  2. DB.Query() - used for SELECT queries which return multiple rows
  3. DB.Exec() - used for other type of queries (e.g. update, delete, patch, insert)

- sql.DB.QueryRow() returns a *sql.Row type while sql.DB.Query() returns a *sql.Rows type (note the plural Rows)

  - it contains the method row.Scan()
  - e.g.

  ```go

  type Snippet struct {
    ID int
    Title string
    Content string
    Created time.Time
    Expires time.Time
  }

  var snippet Snippet

  var id = 1

  row := DB.QueryRow("SELECT * from snippets WHERE id = ?", id)

  err := row.Scan(&snippet.ID, &snippet.Title, &snippet.Content, &snippet.Created, &snippet.Expires)

  if err != nil{
    ...
  }
  ```

- sql.DB.Exec() returns a sql.Result type

  - it has 2 methods, result.LastInsertId() and result.RowsAffected()
  - LastInsertId() is not supported on postgres

    - but it's not a big deal.. we can easily work around that
    - e.g.

    ```go
    row := DB.QueryRow("INSERT INTO snippets (title, content) VALUES ($1, $2) RETURNING id", "title1", "content1")

    var id int

    err := row.Scan(&id)

    if err != nil {
      ...
    }

    ```

    - usually we use sql.DB.Exec() for insert statements, but since we are expecting a returning value, we use sql.DB.QueryRow() instead
    - however, it's important to avoid using Query/QueryRow if not neccessary! (see why next section)

### If we can insert statements with Query()/QueryRow() why bother using Exec() at all?

- it turns out that Query/QueryRow methods return a Row/Rows type
- the Row(s) type actually hog a database connection until you close it!
- sql.Row is automatically closed after Scan method
- but sql.Rows might not close automatically if it encounters scanning during Rows.Next() loop!
  - thus we should defer Rows.Close()
  - defer after checking for errors
  - do not defer inside the loop, you are adding duplicated defer calls to the stack!
- what happens if you don't close the connection?

### What are connections?

Let me explain with an analogy (and a poor drawing)

![What are connections](./what_are_connections.jpeg)
