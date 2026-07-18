# Lab 29: Controlled chaos with AWS FIS

## Outcome

Test a reliability hypothesis inside an approved blast radius with automatic stop conditions.

## Work

Write a game-day hypothesis: “checkout remains within its SLO when one gateway pod disappears” or “queue consumers recover after node loss.” Establish steady state and a CloudWatch alarm stop condition. Create a least-privilege FIS role and target only resources with explicit lab tags/namespace labels.

Run `aws:eks:pod-delete`, then CPU/network latency or packet-loss in non-production. Observe Rollouts/PDB/HPA/Karpenter, traces, queue depth, and burn rate. Abort automatically when the stop alarm fires. Advance to `terminate-nodegroup-instances` only after pod tests pass.

## Evidence and gate

Submit approval, hypothesis, target selector, stop condition, steady-state data, experiment timeline, SLO impact, recovery, and improvement ticket. Broad selectors, no alarm, production-first execution, or experiments without a measurable hypothesis fail.

[AWS FIS EKS pod actions](https://docs.aws.amazon.com/fis/latest/userguide/eks-pod-actions.html)
