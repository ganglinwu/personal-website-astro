---
title: "AWS EC2: Mistakes I learnt from"
date: 2025-03-01T05:00:00Z
image: /images/posts/facepalm.webp
categories:
  - AWS
  - EC2
draft: false
---

### Ok this is going to be a short one.

I am an aspiring backend engineer/developer.

Despite the AI hype, I like to learn things by getting my hands dirty.

### So I thought, why not deploy an app on an EC2 instance the old school way. No containers.

I installed and configured nginx.

Uploaded application code via ssh.

Spun up one PostGres instance via AWS RDS.

start my application

```go
go run main.go
```

Then this (I can't recall what the error message was exactly, below is a recreation from my fuzzy memory)

```console


psql: error : Connection refused dial 172.31.16.127:5432
```

### Thus I fell into the dreaded "debug and fail" loop

It was clear after opening the 3rd google chrome tab. No one else had the same error message as me.

How can that be? Surely someone has done a simple app on EC2 and connected it to RDS right?

### What's the takeaway here?

1. The advent of LLM (ChatGPT, Claude, etc), coding assistants (co-pilot/cursor) means sites like stack overflow are slowly dying.

(May 2025 edit: have you guys seen the demo for AWS Q cli? it can even deploy your app onto the cloud for you)

It's going to be harder and harder for new developers to get into the spirit of "getting your hands dirty"

2. If you want to do things fast. You will learn a lot less.

I don't even need to tell you which of the 2 sentences above your company's standpoint is.

3. Scope of developers is slowly shifting away from being code monkeys.

With cognitive load taken off by coding assistants, work will shift toward higher value tasks, e.g. problem solving.

4. How do you get good at solving problems? (man these questions seem to answer themselves)

Developers have to spend time off work, getting their hands dirty.

5. Back to the death of stack overflow.. as a community, developers are losing an important source of "documentation"

### Forgetful me, here's the solution to the problem

In my .env file I used HOSTNAME as a variable for the ARN of the RDS instance

HOSTNAME is a reserved OS env variable(Amazon Linux AMI, heck probably all Linux distros)

![picture describing how environment variables got the better of me](./a_thousand_words.jpeg)<sub>they say a picture speaks a thousand words.. but what if you get 1000 gibberish words</sub>

- storing your DB host/endpoint name under 'HOSTNAME' would clash with the internal environment variable for EC2's hostname
- resulting in attempts to connect to postgres being directed to localhost
