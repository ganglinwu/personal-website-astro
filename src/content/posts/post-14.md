---
title: "Go's silent value-copy footgun (pointers and encapsulation)"
date: 2026-08-10T00:00:00Z
categories:
  - Golang
draft: false
---

I'm building a toy ride-hailing backend. Riders, drivers, the usual.

Eventually I want driver matching (Hungarian algorithm, very exciting, another post) but you can't match drivers to riders if you don't know where anybody _is_. So step one: let a user report their lat/lng.

### `UpdateLocation` the setup

My repo layer is still an in-memory `[]models.User`. Placeholder until I bolt on Postgres.

It already had

1. `GetUserByID` (loop the slice, return the match)
2. `CreateUser` (validate, `append`)

Adding a third method felt easy.

<img src="/images/sir%20robin.jpeg" alt="That's easy!" width="399" />

```go
func (u *UserRepository) UpdateLocation(userID string, lat, lng float64) (models.User, error) {
	user, err := u.GetUserByID(userID)   // I already have a lookup! reuse!
	if err != nil {
		return models.User{}, err
	}
	user.Lat = lat
	user.Lng = lng
	return user, nil
}
```

It compiles. I hit the endpoint. The JSON comes back with the right coordinates.

Nice.

<a href="https://youtu.be/VvSO5KEnaVE?si=RB5ynSM4Gb2DWgcl&t=105"><img src="/images/sir%20robin%20smug.png" alt="Overconfidence begets downfall" width="399" /></a>

### except it's completely broken

```bash
$ curl -X POST /users/123/location -d '{"lat": 1.35, "lng": 103.8}'
{"userID": "123", "lat": 1.35, "lng": 103.8}   # looks great!

$ curl /users/123
{"userID": "123", "lat": 0, "lng": 0}          # ...wait what
```

<img src="/images/sir%20robin%20i%20dont%20know%20that.png" alt="I don't know that" width="399" />

Huh.

<img src="/images/sir%20robin%20yeet.png" alt="yeet" width="399" />

First instinct: maybe the GET handler is broken, reading from the wrong place. I read through it twice. It just calls `GetUserByID` and marshals the result. Nothing wrong there.

Second instinct: add a `fmt.Println` inside `UpdateLocation` right after the mutation, print `user.Lat`. It prints `1.35`. Correct value, right there, right after I set it. So the write works. So the read must be... also fine? I'm staring at two functions that are each individually correct and somehow disagree with each other.

#### after what seemed like eternity..

**_Took embarrassingly long_** before I actually looked at how `GetUserByID` gets its data:

```go
for _, user := range u.users {  // <-- this copies
```

There it is. `GetUserByID` ranges by value, so it hands me back a **copy**. Which means `user.Lat = lat` inside `UpdateLocation` mutates a struct sitting on `UpdateLocation`'s stack frame and absolutely nowhere else.

#### why this one is extra sneaky

Most bugs at least have the decency to look wrong.

This one _validates itself_. The response echoes back the client's own input. You POST `1.35, 103.8`, you get back `1.35, 103.8`, your brain goes "yep, works", and you move on.

The lie only shows up on the **next read**. Different request. Probably a different part of the system. Possibly a different day.

### the fix

Mutate through an index, inside the method that owns the mutation:

```go
func (u *UserRepository) UpdateLocation(userID string, lat, lng float64) (models.User, error) {
	for i := range u.users {
		if u.users[i].UserID == userID {
			u.users[i].Lat = lat   // u.users[i] is the LIVE element
			u.users[i].Lng = lng
			return u.users[i], nil
		}
	}
	return models.User{}, fmt.Errorf("user not found")
}
```

#### wanna see me shoot my foot the second time?

so I thought "ok but... that's duplicated lookup, no?"

Yes. And this is where I tried to be clever with myself.

`GetUserByID` already knows how to find a user by ID. Why not just have it return a `*models.User`?

```go
// the tempting version
func (u *UserRepository) GetUserByID(userID string) (*models.User, error) {
	for i := range u.users {
		if u.users[i].UserID == userID {
			return &u.users[i], nil  // live pointer into the backing array
		}
	}
	return nil, fmt.Errorf("user not found")
}
```

And here's the annoying part: **it works.** `&u.users[i]` genuinely points into the backing array. Mutating through it genuinely persists. My original naive `UpdateLocation` would become correct as written, without touching a line of it.

### here's why this is a footgun: part 1 encapsulation

The moment `Get` hands back a mutable pointer, the answer becomes:

> anywhere in the codebase that ever called `Get`

handlers. middleware. that feature someone adds in six months. a goroutine.

A _read_ operation has quietly become a write capability handout. And nothing in the signature warns you — `*models.User` reads like a performance optimisation, not like "here, you may now edit the database".

It's the difference between a librarian photocopying a page for you and the librarian just... giving you a pen and leaving the room.

### part 2: what happens when `append` reallocates memory

This is the scarier one, and it's very Go.

Slices grow by allocating a **new, larger** backing array and copying everything into it. (I went down this rabbit hole in [an earlier post](/posts/post-2) — capacity, length, all that.) So any pointer you got from `&u.users[i]` becomes garbage the moment some completely unrelated `CreateUser` pushes the slice past capacity.

```go
users := make([]models.User, 1, 1)     // len 1, cap 1
users[0].UserID = "driver-1"

p := &users[0]                          // "live" pointer. for now.

users = append(users, models.User{})    // cap exceeded -> NEW array, contents copied

p.Lat = 1.35                            // no panic. no error. no effect.
fmt.Println(users[0].Lat)               // 0
```

#### Double whammy

not only are we writing at the wrong memory location, we are slowly leaking memory as well now.

Note what did _not_ happen. No crash. No nil deref. Go's GC keeps the old array alive **precisely because** your pointer still references it. So the pointer stays perfectly readable and writable — it's just pointing at an orphaned copy that nobody will ever read again.

### the actual takeaway

Here's the thing I landed on, and it's not "pointers are dangerous":

**A pointer is only trustworthy inside the single encapsulated operation that produced it.**

A get/read operation is low stakes and should stay that way.

The fixed `UpdateLocation` uses `&u.users[i]`-style access internally and that's completely fine — it finds the element, mutates it, returns, all inside one self-contained unit of work. Nothing gets a chance to `append` in the middle.

The trouble starts when the pointer tries to **leave**. Returned to a caller. Stashed in a struct field. Handed to a goroutine. Now its validity depends on things that happen after it left, and the holder has zero visibility into those things and zero control over them.

The pointer's lifetime and the data structure's lifetime have become two separate stories, and only one of them is being tracked.

> Don't let a pointer straddle two different units of work.

That's the whole discipline.

### bonus: this survives the move to Postgres

The nice part is this isn't a hack for my toy in-memory repo. It's the shape I want anyway once there's a real DB behind it.

- `GetUserByID` → `SELECT ... WHERE user_id = $1`
- `UpdateLocation` → `UPDATE users SET lat = $1, lng = $2 WHERE user_id = $3`

What you emphatically do **not** want is: `SELECT` the whole row, mutate the struct in Go, write the whole row back. That's read-modify-write, and it's how you clobber a concurrent update to some unrelated column and then spend an afternoon learning about lost updates, MVCC snapshots and optimistic concurrency control — when you could have just issued the targeted `UPDATE`.

|                  | Go (in-memory)                           | Postgres                                   |
| ---------------- | ---------------------------------------- | ------------------------------------------ |
| The stale handle | pointer into a reallocated backing array | row snapshot someone else already overtook |
| Symptom          | write lands in orphaned memory           | write clobbers someone else's change       |
| Fix              | targeted `UpdateX` method                | targeted `UPDATE ... WHERE`                |

Same mistake, different mechanism: a handle to state, held across a boundary, while the state quietly moved on without telling you.

### TL;DR

1. `for _, x := range s` gives you a **copy**. Mutating it does nothing. Use `for i := range s` and touch `s[i]`.
2. Bugs that echo your own input back at you are the worst kind — they pass the test you wrote first.
3. Don't return pointers from getters. You're not saving a loop, you're handing out write access to everyone who ever calls `Get`.
4. `append` can move the backing array. Your old pointer stays valid-looking and becomes silently wrong. That's worse than a crash.
5. A pointer is only trustworthy within the one operation that produced it.

Mutation should be a named, self-contained operation. Not a fetch, followed by hope.
