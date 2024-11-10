# Vitosha Tulip

Vitosha Tulip is a web application that visualizes tasks from ClickUp in both Kanban and List views. It allows users to select snapshots of tasks by month and year, providing a historical perspective on task management. The app is built with React, styled using Material-UI (MUI), and leverages the ClickUp API to fetch task data.

## Features

* Kanban and List Views: Toggle between Kanban and List views to display tasks.
* Snapshot Selector: Select tasks snapshots by month and year.
* Responsive Design: Fully responsive UI using Material-UI (MUI).
* Automated Snapshots: Monthly snapshots of tasks using GitHub Actions.
* Deployment: Automatically deployed to vitosha-tulip.surge.sh.

## Public Website

Check out the live application: https://vitosha-tulip.surge.sh

## Installation

### Prerequisites

* Node.js (v14 or higher recommended)
* Yarn package manager
* Git

### Clone the Repository

```
git clone https://github.com/your-username/vitosha-tulip.git
cd vitosha-tulip
```

### Install Dependencies

`yarn install`

## Usage

Setting Up Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

### .env

```
PERSONAL_ACCESS_TOKEN=your_clickup_personal_access_token
CLICKUP_SPACE_ID=your_clickup_space_id
```

### Running the Application Locally

Start the development server

`yarn start`

Open your browser and navigate to http://localhost:3000 to view the app.

Building the Application

### Build the app for production

`yarn build`

The production-ready files are generated in the build directory.

**Scripts**:

* Start the Development Server: `yarn start`  
* Build the Application: `yarn build`  
* Download snapshots from ClickUp: `yarn snapshot`  
* Test the Application: `yarn test`

This script downloads the latest snapshots from ClickUp and saves them in src/data/snapshots.

**Environment Variables**: 

The application relies on certain environment variables for configuration. These variables should be stored securely and not committed to version control.

`PERSONAL_ACCESS_TOKEN`: Your ClickUp API token.
`CLICKUP_SPACE_ID`: The ID of your ClickUp space.
`SURGE_TOKEN`: (For deployment) Your Surge.sh authentication token.

**Automated Deployment**:

The project includes a GitHub Actions workflow that automates the following tasks:

* Monthly Snapshot and Deploy
* Schedule: Runs on the last day of each month at midnight Eastern European Time.
* Actions:
	+ Executes the yarn snapshot script to download the latest tasks from ClickUp.
	+ Builds the application using yarn build.
	+ Deploys the application to vitosha-tulip.surge.sh.

**Setting Up GitHub Actions Secrets**:

To enable automated deployment, add the following secrets to your GitHub repository:

1.	PERSONAL_ACCESS_TOKEN
2.	CLICKUP_SPACE_ID
3.	SURGE_TOKEN

Navigate to your repository settings on GitHub:

* Go to Settings > Secrets and variables > Actions.
* Click New repository secret for each secret and add the corresponding values.
