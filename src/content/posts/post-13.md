---
title: "Graceful shutdown in Go"
date: 2026-05-10T00:00:00Z
categories:
  - Golang
draft: false

---

So you've built your Go web server. It works. You're happy.

Then you hit Ctrl+C and.. everything just dies. Mid-request. Database connections dangling. Logs half-written.

not great.

### what even is context?

If you've used React before, you might have heard of React context. Go has something similar-ish called `context.Context`.

In React, context lets you avoid prop drilling. In Go, context is less about sharing state and more about **coordination** — telling goroutines "hey, time to stop" or "you have 5 seconds to finish".

the `context.Context` interface gives you a few methods:

- `Done()` — returns a channel that fires when the context is cancelled or times out
- `Err()` — tells you *why* it was cancelled
- `Value()` — for passing request-scoped data (like a request ID)
- `Deadline()` — when will this context auto-cancel

### ok but why do I care?

because when you cancel a parent context, every child context also gets cancelled.

so if you create one context at the top of your app and pass it down to all your goroutines.. you can shut everything down by cancelling that one context.

kinda like pulling the plug on a power strip instead of unplugging each device individually.

## OS signals: what happens when you hit Ctrl+C

When you press Ctrl+C, your terminal sends a signal called `SIGINT` to your process. There's also `SIGTERM` which is what `docker stop` or Kubernetes sends when it wants your pod to shut down.

By default, the OS just kills your program immediately. No cleanup. Gone.

But we can intercept these signals!

```go
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit
// now we can clean up!
```

### why buffered channel of size 1?

If you use an unbuffered channel and the signal arrives before your goroutine is ready to receive.. the signal gets dropped. Buffered channel of size 1 makes sure we don't miss it.

(remember slice capacity from [my earlier post](/posts/post-2)? same idea — allocate just enough room so things don't get lost)

## SIGKILL: the one you can't catch

`SIGKILL` is the nuclear option. You **cannot** intercept it. `signal.Notify` will never receive it. The OS just terminates your process, no questions asked.

This is by design. It's the "ok I asked you nicely with SIGTERM but you didn't listen" signal.

That's why graceful shutdown patterns use `SIGTERM` — it gives your app a chance to wind down properly.

## what about os.Exit?

`os.Exit` is not a signal. It's your own program saying "I'm done, bye" and terminating immediately.

here's the gotcha: **it skips all deferred functions**.

so if you have something like

```go
defer db.Close()
// ...
os.Exit(1)
```

that `db.Close()` never runs. your database connection is left hanging.

| | `os.Exit` | Signal + Graceful Shutdown |
|---|---|---|
| Who triggers it | Your program | OS or another process |
| Runs deferred functions | No | Yes (if handled) |
| Cleanup possible | No | Yes |

## putting it all together

A typical graceful shutdown looks like this:

1. Create a cancellable context
2. Start your server/workers, passing context down
3. Listen for OS signals on a buffered channel
4. Signal arrives → cancel the context
5. All goroutines listening on `ctx.Done()` start winding down
6. Wait for cleanup to finish, then exit

### but what if the user spams Ctrl+C?

let's be real. when something hangs, nobody calmly presses Ctrl+C once and waits patiently. most people mash it repeatedly.

and most people don't know about `kill -9`.

so a nice pattern is: first Ctrl+C triggers graceful shutdown, second Ctrl+C force quits.

```go
ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
defer stop()

// start server with ctx...

<-ctx.Done()
log.Println("shutting down gracefully, press Ctrl+C again to force")
stop() // stop intercepting signals, next Ctrl+C goes straight to OS default (kill)

// do your cleanup here
// e.g. server.Shutdown(timeoutCtx)
```

the trick is calling `stop()` after the first signal. this deregisters our signal handler, so the next Ctrl+C hits the OS default behaviour — which is to kill the process immediately.

no need for `kill -9`. just Ctrl+C twice. your impatient users will thank you.
