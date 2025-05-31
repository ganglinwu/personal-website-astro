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

1. Why nobody else was getting the same error messages?

Because I am a n00b.. that's why. Thanks for coming to my TED talk.

But if we go a little deeper, the only threads that were close to my problem were stack overflow posts from yonder years.

With the advent of containers and container orchestrators.. who still does stupid things like me in this day and age?

2. Now with LLM (ChatGPT, Claude, etc), coding assistants (co-pilot/cursor). That is the final nail on the coffin for stack overflow.

(May 2025 edit: have you guys seen the demo for AWS Q cli? it can even write your app AND THEN deploy to the cloud for you)

It's going to be harder and harder for new developers to get into the spirit of "getting your hands dirty"

3. In a company, you gotta ship fast. You have to be agile.

If you want to do things fast. You will learn a lot less.

4. With AI code completion as a dev tool. Scope of developers is slowly shifting away from being code monkeys.

With cognitive load taken off by coding assistants, work will shift toward higher value tasks, e.g. problem solving.

5. How do you get good at solving problems?

Developers have to spend time off work, getting their hands dirty.

6. Back to the death of stack overflow.. as a community, developers are losing an important source of "documentation"

### Forgetful me, here's the solution to the problem

In my .env file I used HOSTNAME as a variable for the IP address of the RDS instance

HOSTNAME is a reserved OS env variable(Amazon Linux AMI, heck probably all Linux distros)

![picture describing how environment variables got the better of me](./a_thousand_words.jpeg)<sub>they say a picture paints a thousand words.. but what if 1000 gibberish words were painted</sub>

- storing your DB host/endpoint name under 'HOSTNAME' would clash with the internal environment variable for EC2's hostname
- resulting in attempts to connect to postgres being directed to localhost
