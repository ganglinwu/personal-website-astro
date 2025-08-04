---
title: "Why Do We Need HandlerFunc?"
date: 2025-07-15T00:00:00Z
image: /images/posts/post-8.jpg
categories:
  - Golang
  - net/http
draft: false
---

I see myself in some of my high school students when learning a new topic—they tend to flip through lecture notes, trying to read from front to back, only to end up frustrated and learning nothing new.

How many of us resolve to learn from documentation with the purest of intentions, but try to read it like a textbook and end up with more questions than we started with?

## Laying the Context Before Introducing the Problem

Below is code that shows "Hello, world!" when we visit `http://localhost:8081`:

```go
package main

import (
    "net/http"
)

func main() {
    h := http.NewServeMux()

    h.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello, world!"))
    })

    s := http.Server{
        Handler: h,
        Addr:    ":8081",
    }

    s.ListenAndServe()
}
```

## Now the Problem: http.HandlerFunc

First, you might have missed it because the spelling is so similar.

Notice the "r": **Handler**Func vs HandleFunc.

Also, the link to the [documentation](https://pkg.go.dev/net/http#HandlerFunc).

To save you a click, here's the description:

> The HandlerFunc type is an adapter to allow the use of ordinary functions as HTTP handlers. If f is a function with the appropriate signature, HandlerFunc(f) is a Handler that calls f.

Huh? Why would we ever need something like that?

Let's look at how to implement "Hello, world!" again, but with **HandlerFunc**:

```go
package main

import (
    "net/http"
)

func helloWorld(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Hello, world!"))
}

func main() {
    h := http.NewServeMux()
    h.Handle("/", http.HandlerFunc(helloWorld))

    s := http.Server{
        Handler: h,
        Addr:    ":8081",
    }

    s.ListenAndServe()
}
```

## So What's the Point?

I never understood what `HandlerFunc` was for until I saw it implemented in the wild.

Here's the key insight: handler functions have a fixed signature—they must take exactly two parameters: an `http.ResponseWriter` and a pointer to an `http.Request` struct.

But what if you want to pass additional data to your handler? For example, what if you need access to a channel, a database connection, or configuration settings?

```go
// This won't compile!
h.HandleFunc("/stop", func(w http.ResponseWriter, r *http.Request, stopCh <-chan struct{}) {
})
```

The solution is to use a struct with methods. By making your handler a method on a struct, you can access any data stored in that struct:

## The Solution: Methods as Handlers

```go


type SomeStruct struct {
    stopCh <-chan struct{}
}

func (s *SomeStruct) stopHandler(w http.ResponseWriter, r *http.Request) {
    select {
    case <-s.stopCh:
        w.Write([]byte("Server is stopping..."))
    default:
    }
}

func main() {
    stopCh := make(chan struct{})
    concreteStruct := &SomeStruct{stopCh: stopCh}

    h := http.NewServeMux()
    h.Handle("/stop", http.HandlerFunc(concreteStruct.stopHandler))

    // Now server.stopHandler has access to stopCh!
}
```

## The Key Takeaway

`http.HandlerFunc` is a type adapter that converts any function with the signature `func(http.ResponseWriter, *http.Request)` into an `http.Handler`. This becomes powerful when combined with methods on structs.

Instead of trying to pass extra parameters to handler functions (which is impossible), you:

1. Create a struct that holds the data you need
2. Make your handler a method on that struct
3. Use `http.HandlerFunc` to convert the method into a proper handler

This pattern allows you to create handlers that have access to databases, configuration, channels, or any other dependencies while still conforming to Go's HTTP handler interface.
