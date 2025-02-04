---
title: "Learning Golang: Growing Pains"
date: 2025-02-01T05:00:00Z
image: /images/posts/post-1.jpg
categories:
  - Golang
draft: false
---

### Golang is a breath of fresh air coming from JavaScript

I like that it is opinionated.

It's as if a minimalist looked at C and just threw away as much things as possible.

### But it does come with it's own set of problems..

Colour me unimpressed, 2 to 3 weeks into learning the golang, when I found out about slices.

(Using a very naive probabilistic model, if I were to take 2-3 years to get a good grasp of golang, then writing code would truly be akin to navigating a minefield)

So here's how you can inadvertently shoot yourself in the foot.

#### Slice problem 1

"Slices are like references to array" [link](https://go.dev/tour/moretypes/8)

```go
package main

import "fmt"

func main() {
  a:= []int{1,2,3}
  b:= a[0:2]

  fmt.Println(a)
  fmt.Println(b)
}
```

output

```console
[1 2 3]
[1 2]
```

So far so good right?

Let's try to change 2nd element of slice b

```go
package main

import "fmt"

func main() {
  a:= []int{1,2,3}
  b:= a[0:2]

  b[1] = 5 // We introduce this line of code
  fmt.Println(a)
  fmt.Println(b)
}
```

output

```console
[1 5 3]
[1 5]
```

uh oh.

but hey this is _kinda_ expected?

after all a slice IS a reference to the underlying array!

#### Slice problem 2

Let's append to slice b this time. Surely runtime/compiler will allocate new memory to (slice) b and it will no longer be referencing (slice) a right?

Right?

```go
package main

import "fmt"

func main() {
  a:= []int{1,2,3}
  b:= a[0:2]

  b = append(b, 5) // We changed this line
  fmt.Println(a)
  fmt.Println(b)
}
```

<details>
<summary>wanna guess the output?</summary>

output

```console
[1 2 5]
[1 2 5]
```

</details>

#### Slice problem 3

Let's deep dive a little. Let's initialize slices using <code>make()</code>

```go
package main

import "fmt"

func main() {
  a:= make([]int, 5)
  b:= make([]int, 0 , 5)

  fmt.Println(a)
  fmt.Println(b)
}
```

output

```console
[0 0 0 0 0]
[]
```

huh what's with the 2nd and 3rd argument of make?

so it turns out <code>make([]int, 5)</code> creates an anonymous, zerorized int array of length 5 in memory. slice a points to that anonymous int array.

but <code>make([]int, 0 , 5)</code> creates the same anonymous int array again but slice b references none of it's values! slice b has zero length!

according to golang [documentation](https://go.dev/tour/moretypes/11) this is the capacity of a slice!

**Now, allow me to demonstrate the problem**

```go
package main

import "fmt"

func main() {
  intArray := [5]int{3,1,4,1,5} // we create an int array

  a:= intArray[:3] // a will be a slice of intArray
  fmt.Printf("Length: %d, Capacity: %d, Slice: %v\n", len(a), cap(a), a)

  // magic happens here
  a = a[:5]
  fmt.Printf("Length: %d, Capacity: %d, Slice: %v\n", len(a), cap(a), a)
}
```

```console
Length: 3, Capacity: 5, [3 1 4]
Length: 5, Capacity: 5, [3 1 4 1 5]
```

whoa.. we can restore length by reslicing!

**_folks, stay seated.. the performance is not over_**

```go
package main

import "fmt"

func main() {
  intArray := [5]int{3,1,4,1,5} // we create an int array

  b:= intArray[2:5] // now we use b
  fmt.Printf("Length: %d, Capacity: %d, Slice: %v\n", len(b), cap(b), b)

  // HUH? no magic here??? WHY?
  b = b[0:]
  fmt.Printf("Length: %d, Capacity: %d, Slice: %v\n", len(b), cap(b), b)
}
```

```console
Length: 3, Capacity: 3, [4 1 5]
Length: 3, Capacity: 3, [4 1 5]
```

Apparently, slicing from the front reduces capacity..

Is slice b no longer referencing intArray? Let's deep dive

#### Problem 3 gets worse..

Let's recreate problem 3 but we print the pointer addresses of intArray and slice b

```go
package main

import "fmt"

func main() {

  intArray:= [5]int{3,1,4,1,5}

  b:= intArray[0:]
  fmt.Printf("Length: %d, Capacity: %d, Slice: %v\n", len(b), cap(b), b)

  // deep dive here
  fmt.Printf("Address of intArray, %p\n", &intArray)
  fmt.Printf("Address of slice b, %p\n", &b)
}
```

output

```console
Length: 3, Capacity: 3, [4 1 5]
Address of intArray, 0xc00011a000
Address of slice b, 0xc00011c000
```

This is confusing... the docs mentioned slices are references to the underlying array? But apparently that's not the case here?

#### Slice problem 4

let's look at how append works!

```go
package main

import "fmt"

func main() {
  a:= make([]int, 5)
  b:= make([]int, 0 , 5)

  a = append(a, 5)
  b = append(b, 5)

  fmt.Println(a)
  fmt.Println(b)
}
```

<details>
<summary>wanna guess the output again?</summary>

output

```console
[0 0 0 0 0 5]
[5]
```

</details>
