---
title: 'Running SQL Server with Amazon FSx as a shared storage'
date: 2020-03-06T13:07:25+03:00
draft: false
categories:
  - AWS Blogs
tags:
  - SQL Server
  - Amazon FSx for Windows
  - Windows on AWS
---

With Amazon FSx, you get fully managed shared file storage that automatically replicates the storage synchronously across two Availability Zones. Moreover, Amazon FSx provides high availability with automatic failure detection, failover, and failback. The service also fully supports the SMB Continuous Availability (CA) feature required to support SQL Server Always On FCI deployments.

For those of you who chose to deploy SQL AG with Enterprise Edition licenses, to avoid the complexity and cost of using FCI with shared storage, now you can use Standard Edition licenses. This will save you 50–60% in license costs. It will also simplify the overall complexity of your SQL deployment and ongoing management (like not needing to replicate system database objects across all replicas, which you must do in AG deployments).

See the complete blogpost here:

{{< awsrichlink src="https://aws.amazon.com/blogs/storage/simplify-your-microsoft-sql-server-high-availability-deployments-using-amazon-fsx-for-windows-file-server/" >}}
