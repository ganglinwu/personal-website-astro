---
title: "Frontend to Backend: HTML formData or JSON. Golang perspective"
date: 2025-06-01T00:00:00Z
image: /images/posts/post-1.jpg
categories:
  - Golang
  - svelte
  - net/http
draft: false
---

TL:DR; Just use JSON.

## What happened?

You know me, if a YouTube tutorial/ChatGPT response tells me to do things one way.

I will do it some other way.

## Setting the stage.

Project - Simple CRUD todo app

Backend - Golang (because I'm trying to improve)

Frontend - Svelte5/sveltekit (it's new, it's shiny and it's not React)

## The problem?

I've decided to use HTML formData to send input fields from front to backend.

## Here's how the problem played out

After much bumbling around, I'm ready to hit my first backend api call from frontend.

Status code 500.

### After some logging..

Lo(g) and behold,

Backend's http.Request.Form is an empty map.

```console

2025/05/29 13:40:42 debug: handleCreateTodo triggered
2025/05/29 13:40:42 debug: r.Form map[]

```

So the api was triggered but none of the fields of the formData went through?

and no.. I called request.ParseForm() (that's the most common solution you can find on google)

### After deeper logging..

ah.. error returned from r.ParseForm() says

```console

2025/05/29 13:49:21 invalid semicolon separator in query

```

### Welcome to the rabbit hole!

huh.. I wonder what that means.

only 1 stackoverflow post talking about W3C 2014 recommendations:

> ... The current status, according to the 2014 W3C Recommendation, is that semicolon is now illegal as a parameter separator

ok.. let's continue looking

oh a github [issue](https://github.com/golang/go/issues/50034) on golang net/url package!

the issue talks about semicolons in the query string (not the form body)

seems like there is an adjacent [issue](https://github.com/golang/go/issues/45973). this one is closed and a function AllowQuerySemicolons has been approved!

Let me try it!

```console

2025/05/29 14:06:57 invalid semicolon separator in query

```

Turns out AllowQuerySemicolons only helps to parse query strings.. here's a snippet of the <underline>proposed code</underline>

```go
func AllowQuerySemicolons(h http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                if r.URL.RawQuery != "" {
                        r2 := new(http.Request)
                        *r2 = *r
                        r2.URL = new(url.URL)
                        *r2.URL = *r.URL
                        r2.URL.RawQuery = strings.ReplaceAll(r.URL.RawQuery, ";", "&")
                        h.ServeHTTP(w, r2)
                } else {
                        h.ServeHTTP(w, r)
                }
        })
}
```

### more logging

That got me curious.. what if i tried to "stringify" the form data inside request.Body?

```console

2025/05/29 14:21:05 ------formdata-undici-015897964970
Content-Disposition: form-data; name="todoName"

Test todo

2025/05/29 14:21:05 ------formdata-undici-015897964970
Content-Disposition: form-data; name="description"

123

2025/05/29 14:21:05 ------formdata-undici-015897964970
Content-Disposition: form-data; name="projID"

6833da52af68429898856eca

2025/05/29 14:21:05 ------formdata-undici-015897964970
Content-Disposition: form-data; name="priority"

high

2025/05/29 14:21:05 ------formdata-undici-015897964970
Content-Disposition: form-data; name="dueDate"

2025-07-12

```

ah.. that little semi-colon after "form-data"

## Conclusion

All of these can be avoided.. if you simply use JSON. That's really it.

But it is rather bemusing that something that the W3C recommends is not being followed by chrome? or was svelte the culprit?
(if i have time i might revisit the issue with React, but right now I just can't bring myself to take on anymore self torture)

In fact, many on the github issue made references to URL spec.

So which org/authority do we follow? W3C or WHATWG?

Also, under the [URL spec for serializing x-www-form-urlencoded](https://url.spec.whatwg.org/#urlencoded-serializing). There is no mention of using a semi-colon!
