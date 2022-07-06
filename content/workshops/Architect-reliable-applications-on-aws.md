---
title: 'Architect Reliable Applications on Aws'
date: 2021-12-01T17:06:59+03:00
categories:
  - Workshops
tags:
  - ReInvent 2021
  - AWS Events
  - Shuffle Sharding
  - Cell based architecture
draft: false
---

{{< repo "aws-samples" "windows-on-aws-samples/reinvent-2021-win306" "true">}}

Workshop link :
{{< richlink src="https://catalog.us-east-1.prod.workshops.aws/workshops/a9ae9061-fef9-43d8-918b-39835ece04a9/en-US" >}}

This workshop presents a new way to design your application using the Well-Architected Reliability Pillar. You will get exposure to implementing advanced and modern techniques like Shuffle Sharding, Horizontal Scaling for windows workloads, and infrastructure as code using the Cloud Development Kit (CDK).

In modern design techniques, Chaos Engineering taught us how to design for failure. Each architecture is designed using multiple AWS services, and each service has its own SLA. In this workshop, you will learn how to evaluate each AWS services SLA and combine them to ensure your architecture will meet the availability requirements for your business using the Cloud 9 IDE.

**The code samples in this workshop have been published to the [AWS-Samples GitHub Repo](https://github.com/aws-samples/windows-on-aws-samples/tree/main/reinvent-2021-win306) for future reference**

This is a `200-300 level` workshop suitable for infrastructure, developers, and operations engineers that have experience deploying and maintaining Windows Workloads.

In this 2 hour workshop, you will learn Infrastructure-as-Code and design principles that allow you to reliably deploy your Microsoft workload using CDK(Cloud Development Kit) along with CloudWatch (monitoring) and Auto Scaling to improve the reliability and availability of your application.

## Learning Objectives

- Understand the concepts and best practice implementation patterns of autoscaling and shuffle sharding to reduce the blast radius
- Understand the [Five Design Principles](https://wa.aws.amazon.com/wellarchitected/2020-07-02T19-33-23/wat.pillar.reliability.en.html) of the Reliability Pillar to improve the overall reliability of your applications (Uptime)
- Be familiar with The Well Architect Reliability Pillar to increase your application availability
- Monitoring techniques with CloudWatch Dashboards
