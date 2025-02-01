# Edsplore Task: Retell AI & Google Calendar Webhook

This repository contains a Node.js webhook designed to integrate Retell AI with Google Calendar. The webhook provides endpoints for checking available appointment slots and booking appointments by creating events in Google Calendar. It handles timezone conversions between US timezones and IST (Asia/Kolkata).

## Features

- **Check Availability:**  
  Retrieves available time slots for a given date range and US timezone by querying Google Calendar.
  
- **Save Booking:**  
  Books an appointment slot on Google Calendar. Supports combining separate date and time fields from the incoming payload.
  
- **Timezone Conversion:**  
  Converts times between user-provided US timezones and IST for scheduling consistency.

- **Detailed Logging:**  
  Logs raw payloads and processing steps to help with debugging and integration verification.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/)
- A Google Calendar API service account with credentials (Client Email, Private Key, and Calendar ID)
- [Ngrok](https://ngrok.com/) (for exposing your local server to the internet during development)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```
### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
PORT=3000
GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
```
### 4. Run the Application
``` bash
node server.js
```

### 5. Expose the Server with Ngrok
``` bash
ngrok http 3000
```

# Booking API Documentation

## Usage

### Endpoints

#### Health Check
`GET /health`
Returns a JSON response indicating the server status and a timestamp.

#### Check Availability
`POST /check-availability`

**Example Payload:**
```json
{
  "call": {
    "retell_llm_dynamic_variables": {
      "startDate": "2025-02-03",
      "endDate": "2025-02-03",
      "timeZone": "America/New_York"
    }
  }
}
```

#### Save Booking
`POST /save-booking`

**Example Payload:**
```json
{
  "call": {
    "retell_llm_dynamic_variables": {
      "startDate": "2025-02-03",
      "endDate": "2025-02-03",
      "timeZone": "America/New_York"
    }
  },
  "args": {
    "timezone": "America/New_York",
    "date": "2025-02-03",
    "time": "12:00 AM"
  }
}
```

This endpoint extracts the date and time from the payload, converts it to a full ISO date/time string based on the provided timezone, checks for slot availability, and creates an event in Google Calendar if the slot is free.

## Debugging

### Logging
The application logs all incoming payloads and internal processing steps. Check your console output for details if something doesn't work as expected.

### Payload Verification
Ensure that the payload sent by Retell AI matches the expected structure. The project now supports both a combined date/time string and separate `date` and `time` fields.

## Contributing
Contributions, bug reports, and feature requests are welcome! Feel free to fork the repository and submit a pull request or open an issue.

## License
This project is licensed under the MIT License.
