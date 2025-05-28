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

Then this

```console
psql: error : Connection refused.
```

### Thus I fell into the dreaded "debug and fail" loop

It was clear after opening the 3rd google chrome tab. No one else had the same error message as me.

How can that be? Surely someone has done a simple app on EC2 and connected it to RDS right?

### What's the takeaway here?

1. If you want to do things fast. You will learn a lot less.

I don't even need to tell you which of the 2 sentences above your company's standpoint is.

2. The advent of LLM means sites like stack overflow is slowly dying.

It's going to be harder and harder for new developers to get into the spirit of "getting your hands dirty"

3. Developers are moving away from being code monkeys and transitioning into critical thinkers. You will be required to solve more problems.

4. How do you get good at solving problems? (man these questions seem to answer themselves)

5. Developers have to spend time off work to develop their development skills.

EC2 stuff

- HOSTNAME is a reserved env variable name
  - storing your DB host/endpoint name under 'HOSTNAME' would clash with the internal environment variable for EC2's hostname
  - resulting in attempts to connect to postgres being directed to localhost
