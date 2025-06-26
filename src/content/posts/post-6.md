---
title: "part 1 - go database/sql: excellent resources if RTFM did not help you"
date: 2025-06-15T00:00:00Z
image: /images/RTFM.jpg
categories:
  - Golang
  - database/sql
draft: false
---

## A simillar problem I observed while tutoring mathematics to high school students

A typical Singaporean high school student has 2 years to prepare for national exams (A' levels).

Tell me you are a year 1 student without telling me you are a year 1 student:

> My school's lecture notes sucks!

### Tell me you are a junior dev without telling me you are a junior dev

![Bear Trap Meme](./beartrapmeme.jpeg)

So I got to admit it. I didn't like [the docs](https://pkg.go.dev/database/sql) for database/sql for the longest time.

Nothing made sense when I was writing my first implementation of sql.DB.

I relied more on blogs/medium articles and their code snippets.

It was more of blind copying. I did not understand the rationale behind why the author of the blog did what he/she did.

I would often try to break things to see what was going under the hood.

#### switching back to math tutoring context..

Now, I notice this phenomenon of "the fault lies in the notes, not in me" always happens for topics that are more abstract.

For example vectors (dot/cross product, length of projection, finding shortest distance between line and plane etc)

how I help students in cases like these:

- instead of going through the concept/theory first, I prefer to start them off with practice questions (gradual increasing level of complexity)
- after enough practice, the students' mind start to conceive a vague notion of the abstract objects
- we then revisit the concept and theory, but now the student can apply these concepts by toying with the abstract objects in their mind
- then I point them back to their lecture notes
- wait for the "eureka" moment to show on their faces (best part of my job)

#### back to me struggling with database/sql

after implementing sql.DB more.. and scouring the world wide web (unlike my students who had someone feeding them gradually more complex problem sets, I had to seek out my own gradual improvement)

here are some really good articles that helped me build notions of what are the important types and functions in database/sql (perhaps you can have the "eureka" moment when you Return To Friendly Manual)

## Excellent resources here!

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

## PART 1: sql.DB from "database/sql" standard library

- it's pretty cool but it requires a database driver

  - e.g. if you are using MySQL you would need "github.com/go-sql-driver/mysql"
  - e.g. if you are using PostgreSQL you would need "github.com/jackc/pgx/v5/stdlib"
    - pgx is rather peculiar.. you could abandon database/sql and roll with pgx entirely
    - in which case you need "github.com/jackc/pgx/v5" (without "stdlib")
    - it has more powerful features, but you would no longer be using the same types/functions, which can make interfacing rather complicated

- here's how you can instantiate sql.DB
- e.g.

```go
  package main

  import (
    "log"
    "database/sql"

    _ "github.com/jackc/pgx/v5/stdlib"
  )

  func main() {
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
}
```

- it is important to note that sql.DB is not a connection to the database.
- it is somewhat simillar to a prepared statement that is stored in application memory to be used later
- thus, to ensure that the connection works, we need to call db.Ping()

### how to query database using \*sql.DB

- there are 3 main methods for database queries

  1. DB.QueryRow() - <u>mainly</u> used for SELECT queries which returns a single row
  2. DB.Query() - used for SELECT queries which return multiple rows
  3. DB.Exec() - used for other type of queries (e.g. update, delete, patch, insert)

- sql.DB.QueryRow() returns a *sql.Row type while sql.DB.Query() returns a *sql.Rows type **_(note the plural Rows)_**

  - it contains the method row.Scan()
  - e.g. fetching a snippet of id 1 from database

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

  row := DB.QueryRow("SELECT * from snippets WHERE id = $1", id)

  err := row.Scan(&snippet.ID, &snippet.Title, &snippet.Content, &snippet.Created, &snippet.Expires)

  if err != nil{
    ...
  }
  ```

- sql.DB.Exec() returns a sql.Result type

  - unlike sql.Row(s), sql.Result does not contain row(s) coming from DB tables.
  - instead it tells you how many rows were affected by the last query or what is the ID of your inserted row

    - it has 2 methods, sql.Result.LastInsertId() and sql.Result.RowsAffected()
    - LastInsertId() is not supported on postgres

      - but it's not a big deal.. we can easily work around that
      - e.g. how to return id of inserted row in postgres

    ```go

    row := DB.QueryRow(`INSERT INTO snippets (title, content)
      VALUES ($1, $2)
      RETURNING id;`
      , "title1", "content1")

    var id int

    err := row.Scan(&id)

    if err != nil {
      ...
    }

    ```

    - NOTE: usually we use sql.DB.Exec() for insert statements, but since we are expecting a returning value, we use sql.DB.QueryRow() instead
    - however, it's important to avoid using Query/QueryRow if not neccessary! (see why next section)

### If we can insert statements with Query()/QueryRow() why bother using Exec() at all?

- it turns out that Query/QueryRow methods return a Row/Rows type
- the Row(s) type actually hog a database connection until you close it!
- sql.Row is automatically closed after Scan method
- but sql.Rows might not close automatically
  - it closes automatically when Rows.Next is false (i.e. no more rows left to read)
  - but if we encounter an error midway, then it will not close automatically
  - thus we should defer Rows.Close()

When should we defer is also an important thing!

- defer after checking for errors
  - we cannot call Close() if \*sql.Rows is nil!
- do not defer inside the loop, you are adding duplicated defer calls to the stack!
  - defer is only triggered after the function scope ends, it does not trigger at the end of a for loop!

![Redundant defer calls accumulating on stack](./redundant_defer_calls_on_stack.jpg)

what happens if you don't close the connection?

the more accurate question is actually what if we don't close \*sql.Row(s)

what's the difference?

## What are connections?

Let me explain with an analogy (and a poor drawing)

![What are connections](./what_are_connections.jpeg)

The analogy is to imagine our backend app to be like a 3rd party grocery shopping service.

We have a fleet of vehicles that can access some supermarket's warehouse.

But the access is not for free, each vehicle must go through stringent checks and an approval process before it can go to the warehouse.

Think of the database connections as the fleet of vehicles sitting in our carpark lots.

- The fleet is analogous to the connection pool that is set up for us when we instantiate sql.DB type

  - each vehicle is capable of "Get groceries", just like we will use a connection to run a query.
  - bonus, sql.DB is concurrent safe!

- To establish a connection, we have to establish TCP/IP and even TLS, and then authenticate into RDBMS(in this case psql)

  - it is not uncommon for connections to be kept open so that we can use it for another Query
  - analogy: we keep our vehicles registered with the warehouse so we can still access it

- to be concurrent safe, under the hood database/sql uses goroutines to launch different connections for separate queries

  - each vehicle is used for one specific trip of "Get groceries"
  - we do not batch multiple "Get groceries" to 1 vehicle
  - we do not split one trip of "Get groceries" over multiple vehicles

- when the query returns the results in \*sql.Row(s) type

  - analogy: our vehicle has returned from the warehouse and now let's unload the goods
  - We use Scan() method to "unload the goods"
  - If all goes well, everything from the truck is unloaded, it is ready for another trip to warehouse
    - If too much time has past, we might cancel the registration with warehouse and let our vehicle rest
    - In database terms: connection has outlived the ConnMaxLifetime and will be reset.
  - If something goes wrong
    - best practice: "load up whatever that has already been unloaded" and return everything to the warehouse (a.k.a rolling back transaction)
    - non-best practice: "let's just clear out our truck so that it can prepare for next trip" (calling Rows.Close())

- an important distinction is that our goods sit atop the vehicles

  - also the vehicle can "outlive" the goods, in the sense that once the goods are unloaded we can use the vehicle for the next "Get groceries" trip
  - likewise \*sql.Row(s) are tied to a connection, but usually the latter will outlive the former.

- so if we don't call \*sql.Rows.Close()
  - The truck would still have goods inside, it will perpetually stay at the loading bay and would not be available.
  - In database terms: this connection will not return to your pool
  - If this happens over time, all connections will be exhausted and the application comes to a halt!

We will stop here, and continue in Part 2!

Meanwhile, if you feel enlightened enough about database/sql and connections, here are some good reads!

1. [Configuring sql.DB for better performance](https://www.alexedwards.net/blog/configuring-sqldb)

2. [Understanding Go and Databases at Scale: Connection Pooling](https://koho.dev/understanding-go-and-databases-at-scale-connection-pooling-f301e56fa73)

3. [Go's database/sq](https://jmoiron.net/blog/gos-database-sql/)
