---
title: "Finite Fields"
date: 2024-04-04T05:00:00Z
image: /images/posts/post-1.jpg
categories:
  - Mathematics
draft: false
---

Finite field is so interesting.

But first what is a field? You could look that up on [Wikipedia](<https://en.wikipedia.org/wiki/Field_(mathematics)>), there is no value in this blog explaining that.

Perhaps what is more valuable is the **motivation** behind a field!

## A laymen's attempt on motivation behind fields.

You just came back from Japan.

- Japan was clean
- Japan has great public transport
- Japan had great food

You liked it and want to plan for the next vacation.

> I like **_countries_** that are
>
> - clean <br />
> - has great public transport<br />
> - has great food

Likewise in mathematics, we have different "number systems" (comparable to countries). We would like to preserve some "rules" (comparable to qualities) that makes it nice to work with!

> We like **_number systems_** that have
>
> - addition and multiplication <br />
> - identities and inverses for addition and multiplication<br />
> - additive and multiplicative commutativity <br />
> - are self-contained

#### Addition and multiplication

You know those buy 1 get 1 free bargains?

If addition exists, we can actually do subtraction!

Likewise multiplication and division!

#### Additive and multiplicative inverses exist

To undo an addition, we need an additive inverse!

To undo a multiplication, we need a multiplication inverse!

#### Additive and multiplicative identities exist

For the sake of brevity, we will skip over this!

#### Fields are self contained

When doing addition or multiplication with any numbers, it should not result in us having to use any other number systems

### Example of fields?

#### Real numbers

- we can add and multiply them
- additive and multiplicative inverses exist!
  - the additive inverse is simply the negative version of number
    > e.g. $2.68 + (-2.68) = 0$
  - the multiplicative inverse is simply the reciprocal of the number (e.g. $$5 \times \frac{1}{5} = 1$$)
- reals are self contained (examples for non-fields will shine more light on this)

### Example of **_Non-fields_**?

#### Integers

- we can add and multiply them
- additive inverse exist!
  - the additive inverse is simply the negative version of number (e.g. $$5 + (-5) = 0$$)
- **multiplicative inverse does not exist**
  - the multiplicative inverse is the reciprocal of the number, however the reciprocal is **NOT AN INTEGER!**
- by extension of above, if we were to divide an integer with another integer (e.g. $$2 \divide 5 = \frac{2}{5}$$), we might require another class of numbers (namely rationals), to describe the answer

## Enter Hero (Stage Left) i.e. Finite Fields

#### Integers can be finite fields.. just use modular arithmetic!

The catch is we have to use prime/powers of prime as modulus numbers!

let's consider modulus 5

the additive inverse of 3 is 3! because $$ 3 + 3 = 6 \equiv 1 (mod 5)$$

the multiplicative inverse of 3 is 2! because $$ 3 \time 2 = 6 \equiv 1 (mod 5)$$
