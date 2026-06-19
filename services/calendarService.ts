import { Workout } from '../types';

// A reasonable default for workout duration
const WORKOUT_DEFAULT_DURATION_MINUTES = 60;

/**
 * Schedules a list of workouts into the user's Google Calendar for the upcoming week.
 *
 * @param workouts The array of workouts to schedule.
 * @param accessToken The Google OAuth2 access token with calendar scope.
 */
export const scheduleWorkouts = async (workouts: Workout[], accessToken: string): Promise<void> => {
    console.log("Attempting to schedule", workouts.length, "workouts");

    if (!workouts || workouts.length === 0) {
        console.warn("No workouts provided to schedule.");
        return;
    }

    // Get the start of the next week (next Monday)
    const startOfNextWeek = new Date();
    startOfNextWeek.setDate(startOfNextWeek.getDate() + (8 - startOfNextWeek.getDay()) % 7);
    startOfNextWeek.setHours(9, 0, 0, 0); // Default to 9:00 AM

    try {
        // Use Promise.all to handle all calendar event creations concurrently
        await Promise.all(workouts.map((workout, index) => {
            // Clone the date to avoid mutation
            const eventDate = new Date(startOfNextWeek.getTime());
            // Distribute workouts throughout the week (e.g., Mon, Wed, Fri for a 3-day split)
            eventDate.setDate(eventDate.getDate() + (index * 2));

            const event = {
                'summary': `${workout.name} - Your Fitness Program`,
                'description': workout.description || 'Time to get moving! View your full program in the app.',
                'start': {
                    'dateTime': eventDate.toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                'end': {
                    'dateTime': new Date(eventDate.getTime() + WORKOUT_DEFAULT_DURATION_MINUTES * 60000).toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            };

            console.log(`Creating event for: ${workout.name} on ${eventDate.toLocaleDateString()}`);

            return fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            })
            .then(response => {
                if (!response.ok) {
                    // Log the detailed error from Google API
                    return response.json().then(err => {
                        console.error(`Failed to create calendar event for ${workout.name}. Status: ${response.status}`)
                        console.error("Google API Error:", err);
                        throw new Error(`Google Calendar API error: ${err.error.message}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log(`Event created for ${workout.name}:`, data.htmlLink);
            });
        }));

        console.log("All workouts scheduled successfully!");

    } catch (error) {
        console.error("An error occurred during the scheduling process:", error);
        // Re-throw the error to be caught by the calling function in App.tsx
        throw new Error("Failed to schedule one or more workouts. Check console for details.");
    }
};
