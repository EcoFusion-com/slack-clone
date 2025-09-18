# HR Dashboard

A comprehensive dashboard for HR management and ticket tracking.

## Features

- **Real-time Stats**: Total tickets, open tickets, submitted tickets, and active users
- **Quick Actions**: Create tickets, manage users, view reports, and more
- **Activity Feed**: Recent ticket activity and updates
- **Search**: Search across tickets, users, and activities
- **Responsive Design**: Works on desktop and mobile devices

## Usage

The dashboard is accessible through the main navigation in the SlackLayout component. It automatically loads data for the current workspace and refreshes every 30 seconds.

## Configuration

### Polling Interval
The dashboard uses React Query for data fetching with the following settings:
- **Refetch Interval**: 30 seconds
- **Stale Time**: 10 seconds
- **Retry**: 2 attempts on failure

### Data Sources
- **Total Tickets**: `apiClient.getTickets({ size: 1 })`
- **Open Tickets**: `apiClient.getTickets({ ticket_status: ['pending', 'in_progress'], size: 1 })`
- **Submitted Tickets**: `apiClient.getTickets({ ticket_status: ['submitted'], size: 1 })`
- **Active Users**: `apiClient.getActiveUsers()`
- **Recent Activity**: `apiClient.getTickets({ size: 5, sort: 'created_at' })`

## Testing

### Manual Testing
1. Navigate to the dashboard from the main navigation
2. Verify all stats cards load with correct data
3. Test the search functionality
4. Try creating a new ticket from Quick Actions
5. Check that the activity feed shows recent tickets
6. Verify responsive design on different screen sizes

### Unit Tests
Run the test suite:
```bash
npm test src/pages/dashboard
```

## Accessibility

The dashboard includes:
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly content
- High contrast support
- Focus indicators

## Performance

- Uses React Query for efficient data caching
- Implements loading states and error boundaries
- Optimized re-renders with proper dependency arrays
- Lazy loading for non-critical components
