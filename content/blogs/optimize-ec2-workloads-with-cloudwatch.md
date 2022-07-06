---
title: 'Optimizing EC2 Workloads with Amazon CloudWatch'
date: 2021-06-09T16:44:58+03:00
categories:
  - AWS Blogs
tags:
  - SQL Server
  - EC2 Windows
  - Amazon CloudWatch
  - Windows on AWS
draft: false
---

Many customers ask for our advice on choosing the ‘best’ or the ‘right’ storage and instance configuration, but there is no one solution that fits all circumstances. This blog post covers the critical techniques to right-size your workloads. We focus on right-sizing a SQL Server as our example workload, but the techniques we will demonstrate apply equally to any Amazon EC2 instance running any operating system or workload.

We create and use an Amazon CloudWatch dashboard to highlight any limits and bottlenecks within our example instance. Using our dashboard, we can ensure that we are using the right instance type and size, and the right storage volume configuration. The dimensions we look into are EC2 Network throughput, Amazon EBS throughput and IOPS, and the relationship between instance size and Amazon EBS performance.

## How to use the Python script?

```bash
# Download the script locally
wget -L https://raw.githubusercontent.com/aws-samples/amazon-ec2-mssql-workshop/master/resources/code/Monitoring/create-cw-dashboard.py

# Prerequisites (venv and boto3)
python3 -m venv env # Optional
source env/bin/activate  # Optional
pip3 install boto3 # Required

# Execute
python3 create-cw-dashboard.py --InstanceList i-example1 i-example2 --region eu-west-1
```

## The complete guide

{{< awsrichlink src="https://aws.amazon.com/blogs/compute/optimizing-ec2-workloads-with-amazon-cloudwatch/" >}}
