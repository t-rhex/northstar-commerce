# Lab 13: ECR software supply chain

## Outcome

Produce a traceable, scanned, signed release promoted by digest rather than mutable tag.

## Work

Build all polyglot images with Bazel or Docker Buildx. Tag with Git SHA, push to the immutable ECR repositories, and capture each digest. Enable ECR Enhanced scanning with Amazon Inspector for continuous OS and language-package findings. Generate an SPDX or CycloneDX SBOM and attach provenance. Configure ECR managed signing or a reviewed GitHub artifact attestation flow.

Triage one critical/high finding: determine reachability, available fix, exception owner, expiry, and deployment gate. Verify the signature/attestation and deploy using `repository@sha256:...`.

## Evidence and gate

Submit digest, SBOM, scan result, triage decision, signature status, provenance verification, and proof that Helm rejects an empty digest. `latest` and mutable environment tags do not pass.

[ECR scanning](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html) · [ECR managed signing](https://docs.aws.amazon.com/AmazonECR/latest/userguide/managed-signing.html)
