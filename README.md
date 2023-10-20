# Order Matching System

## Introduction

The Order Matching System is a software project designed to continuously track orders created on different markets hosted on a Substrate node. Its primary purpose is to identify and match orders that overlap with each other, thereby creating market positions. This documentation provides an overview of the project's objectives, functionality, and usage instructions.

## Purpose

The primary purpose of the Order Matching System is to:

1. Continuously monitor and track orders placed on various markets hosted on a substrate node.

2. Identify orders belonging to the same market, have different owners and overlap in terms of price - short position is lower than long position.

3. Match overlapping orders to create market positions, reducing overlap.

## System Components

The Order Matching System consists of several key components:

1. **Market Tracking**: Monitors and manages markets present on the node, collecting order data.

2. **Order Matching**: Utilizes a subscription-based mechanism to track newly created orders posted on the Indexer and triggers order matching.

3. **Position Creation**: Converts matched orders into market positions posted on the substrate node.

## Agents:

* Order Matching System (this)
* Indexer (https://github.com/bigshortbets/indexer)

## Getting Started

To use the Order Matching System, follow these steps:

## Prerequisites

- Node.js (latest stable version recommended)
- Running substrate node
- Running indexer with graphQL server exposed

## Installation

1. Clone the repository:
   git clone https://github.com/bigshortbets/order-matcher

2. Navigate to the project directory:
   cd order-matcher

3. Install the required dependencies:
   npm install

## Running

After setting up, you can run the project : `npm start`

## Author

blockydevs

## License

ISC
