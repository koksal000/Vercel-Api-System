# **App Name**: CapUpdate Manager

## Core Features:

- Application Submission: Allows users to submit a new application by providing its name, version, HTML content, and password.  Upon submission, a unique 10-character alphanumeric ID is generated and stored along with the application data.
- Application Listing: Displays a random selection of added applications, each showing the application name and version (with a star indicator).
- Application Search: Enables users to search for applications from the listing.
- Saved Applications: Allows users to save listed applications. Saved applications are listed alphabetically, and can be searched.
- Application Details Modal: Displays a modal with detailed information about an application, including name, version, creation date, last updated date, and an update button.
- Application Update: Allows users to update the application name, version, and HTML content by entering the correct password. The application ID remains unchanged after the update.
- Content Delivery via API: Enables applications to fetch their HTML content via a JavaScript API using their unique ID.

## Style Guidelines:

- Primary color: Dark Blue (#34495E), offering a professional and reliable feel.
- Background color: Light Gray (#ECF0F1), provides a clean and neutral backdrop.
- Accent color: Orange (#E67E22), used for calls to action and highlights, ensuring important elements stand out.
- Body and headline font: 'Inter', a sans-serif for a clean, modern, and readable experience.
- Code font: 'Source Code Pro' for clear and readable display of HTML code snippets.
- Simple, geometric icons to represent different application types and actions.
- A clean, card-based layout for displaying applications and details. Use of modals for detailed information and update forms.
- Subtle transitions and animations for loading states, form submissions, and modal appearances.