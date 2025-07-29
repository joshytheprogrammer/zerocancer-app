# Compute Service

This project is a **compute service** designed to support the backend infrastructure for the Zero Cancer platform. The service is intended to run on the edge, specifically targeting environments like **Cloudflare Workers** for low-latency, scalable operations.

## Overview

The compute service is responsible for handling backend computations and services that power the Zero Cancer application. While the long-term goal is to provide a suite of compute capabilities at the edge, the current implementation focuses on providing **email functionality** using [Nodemailer](https://nodemailer.com/).

## Features

- **Edge-Ready**: Designed to be deployed on Cloudflare Workers or similar edge platforms.
- **Email Support**: Currently, the service exposes endpoints for sending emails using Nodemailer.

## Getting Started

### Installation

Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to:

```text
http://localhost:3000
```

## Future Plans

- Add more compute endpoints for various backend tasks.
- Optimize for edge deployment and scalability.
- Integrate with other Zero Cancer platform services.

## License

See [LICENSE](./LICENSE) for details.
