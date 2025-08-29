# Enhanced KRN Complaints System

## Overview

This enhanced complaints system provides a complete solution for anonymous complaint management with Cloudflare Workers D1 database, featuring pagination, user interactions (stars/flags), and content moderation.

## Features

### ✅ Core Functionality
- **Anonymous Complaint Submission** - Submit complaints without revealing identity
- **Identified Submissions** - Optional user identification with Sui wallet addresses
- **Content Moderation** - Automatic content filtering and flagging system
- **Real-time Updates** - Live star and flag counts with automatic triggers

### ✅ User Interactions
- **Star System** - Users can star complaints they like (requires wallet connection)
- **Flag System** - Users can flag inappropriate content for moderation
- **User State Tracking** - Remember which complaints users have starred/flagged

### ✅ Advanced Features
- **Pagination** - Newer/Older navigation with cursor-based pagination
- **Sorting Options** - Sort by newest, oldest, most starred, most flagged
- **Content Filtering** - Option to show/hide flagged content
- **Performance Optimized** - Database indexes and efficient queries

## Database Schema

### Tables

#### `complaints`
- `id` - Primary key
- `message` - Complaint content (sanitized)
- `created_at` - Timestamp
- `updated_at` - Last update timestamp
- `author_addr` - Optional Sui wallet address
- `is_flagged` - Boolean flag for moderation
- `flag_count` - Number of flags
- `star_count` - Number of stars
- `view_count` - View counter (future use)

#### `stars`
- `id` - Primary key
- `complaint_id` - Foreign key to complaints
- `user_addr` - User's wallet address
- `created_at` - Timestamp
- Unique constraint on (complaint_id, user_addr)

#### `flags`
- `id` - Primary key
- `complaint_id` - Foreign key to complaints
- `user_addr` - User's wallet address
- `reason` - Optional flag reason
- `created_at` - Timestamp
- Unique constraint on (complaint_id, user_addr)

#### `user_sessions`
- `id` - Primary key
- `user_addr` - User's wallet address
- `session_id` - Session identifier
- `created_at` - Session creation time
- `last_activity` - Last activity timestamp

### Automatic Triggers
- **Star Count Updates** - Automatically maintain star counts
- **Flag Count Updates** - Automatically maintain flag counts
- **Auto-flagging** - Content automatically flagged after 3 flags

## API Endpoints

### GET `/complaints_enhanced`
Retrieve complaints with pagination and filtering.

**Query Parameters:**
- `limit` - Number of complaints to return (1-200, default 50)
- `before` - Cursor for pagination (ISO timestamp or milliseconds)
- `after` - Cursor for pagination (ISO timestamp or milliseconds)
- `sort` - Sort order: `newest`, `oldest`, `most_starred`, `most_flagged`
- `show_flagged` - Show flagged content: `true`/`false`
- `user_addr` - User's wallet address for personalization

**Response:**
```json
{
  "ok": true,
  "complaints": [
    {
      "id": 1,
      "message": "Complaint content...",
      "created_at": "2024-01-01T00:00:00Z",
      "author_addr": "0x1234...",
      "star_count": 5,
      "flag_count": 0,
      "is_flagged": false,
      "user_starred": true,
      "user_flagged": false
    }
  ],
  "pagination": {
    "has_more": true,
    "before_cursor": "2024-01-01T00:00:00Z",
    "after_cursor": "2024-01-02T00:00:00Z",
    "total_returned": 50,
    "limit": 50
  }
}
```

### POST `/complaints_enhanced`
Perform actions on complaints (star, unstar, flag, unflag).

**Request Body:**
```json
{
  "action": "star", // "star", "unstar", "flag", "unflag"
  "complaintId": 123,
  "userAddr": "0x1234...",
  "reason": "Optional flag reason"
}
```

**Response:**
```json
{
  "ok": true,
  "operation": "starred",
  "complaint_id": 123,
  "star_count": 6,
  "flag_count": 0,
  "user_starred": true,
  "user_flagged": false,
  "message": "Successfully starred complaint"
}
```

### POST `/submit_enhanced`
Submit new complaints.

**Request Body (JSON):**
```json
{
  "message": "Complaint content...",
  "author_addr": "0x1234...", // Optional
  "is_anonymous": true // Optional, defaults to true
}
```

**Form Data:**
- `message` - Complaint content
- `author_addr` - Optional Sui wallet address
- `is_anonymous` - Optional boolean
- `website` - Honeypot field (should be empty)

## Frontend Integration

### Enhanced Feed Component
The `feed_enhanced.js` provides a complete UI with:

- **Navigation Controls** - Refresh, Newer, Older buttons
- **Sorting Options** - Dropdown for different sort orders
- **Content Filtering** - Checkbox to show/hide flagged content
- **Interactive Elements** - Star and flag buttons with real-time updates
- **Responsive Design** - Works on all device sizes

### Usage
```javascript
import initEnhancedFeed from './src/core/utils/feed_enhanced.js';

// Initialize the enhanced feed
const feed = initEnhancedFeed('feed-container');

// Manual refresh
feed.refresh();

// Get current user address
const userAddr = feed.getUserAddr();
```

## Deployment

### 1. Deploy Database Schema
```bash
# Make script executable
chmod +x migrations/deploy_enhanced_schema.sh

# Deploy enhanced schema
./migrations/deploy_enhanced_schema.sh
```

### 2. Update Wrangler Configuration
Add the enhanced API routes to your `wrangler.toml`:

```toml
[[routes]]
pattern = "/complaints_enhanced"
script = "api/complaints_enhanced.js"

[[routes]]
pattern = "/submit_enhanced"
script = "api/submit_enhanced.js"
```

### 3. Deploy to Cloudflare
```bash
wrangler deploy
```

## Security Features

### Content Moderation
- **Automatic Filtering** - Content is sanitized using the censor utility
- **Flag System** - Users can flag inappropriate content
- **Auto-moderation** - Content automatically flagged after 3 flags
- **Honeypot Protection** - Bot protection on submission forms

### User Privacy
- **Anonymous by Default** - Users can submit without identification
- **Optional Identification** - Users can choose to identify themselves
- **Address Validation** - Sui wallet addresses are validated
- **Session Tracking** - User activity is tracked for analytics

### Data Protection
- **Input Validation** - All inputs are validated and sanitized
- **SQL Injection Protection** - Parameterized queries prevent injection
- **CORS Configuration** - Proper CORS headers for cross-origin requests
- **Rate Limiting** - Built-in protection against abuse

## Performance Optimizations

### Database Indexes
- `idx_complaints_created_at` - Fast timestamp-based queries
- `idx_complaints_star_count` - Fast sorting by popularity
- `idx_complaints_flag_count` - Fast moderation queries
- `idx_stars_complaint_id` - Fast star lookups
- `idx_flags_complaint_id` - Fast flag lookups

### Query Optimization
- **Cursor-based Pagination** - Efficient for large datasets
- **Automatic Counts** - Triggers maintain counts without manual updates
- **Selective Loading** - Only load necessary data
- **Connection Pooling** - Efficient database connections

## Monitoring and Analytics

### Logging
The system logs important events:
- Complaint submissions (with metadata)
- Star/flag actions
- Content moderation events
- Error conditions

### Metrics to Track
- **Submission Volume** - Number of complaints per time period
- **Engagement Rate** - Stars and flags per complaint
- **Moderation Activity** - Flag frequency and reasons
- **User Activity** - Active users and session data

## Migration from Legacy System

### Database Migration
If you have existing data, you can migrate it:

```sql
-- Migrate existing complaints
INSERT INTO complaints (id, message, created_at, author_addr)
SELECT id, message, created_at, NULL
FROM old_complaints_table;

-- Migrate existing stars
INSERT INTO stars (complaint_id, user_addr, created_at)
SELECT post_id, addr, created_at
FROM old_stars_table;
```

### API Migration
Update your frontend to use the new endpoints:
- Replace `/complaints` with `/complaints_enhanced`
- Replace `/submit` with `/submit_enhanced`
- Update response handling for new data structure

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify D1 database exists and is properly configured
   - Check wrangler.toml for correct binding name

2. **CORS Errors**
   - Ensure CORS headers are properly set
   - Check browser console for specific error details

3. **Wallet Connection Issues**
   - Verify Sui wallet extension is installed
   - Check network connectivity for wallet operations

4. **Performance Issues**
   - Monitor database query performance
   - Check for missing indexes
   - Review pagination implementation

### Debug Mode
Enable debug logging by setting environment variables:
```bash
wrangler dev --env DEBUG=true
```

## Future Enhancements

### Planned Features
- **Advanced Analytics** - Detailed user behavior tracking
- **Content Categories** - Organized complaint types
- **Moderation Tools** - Admin interface for content management
- **Notification System** - Real-time updates for users
- **API Rate Limiting** - Advanced abuse prevention
- **Content Search** - Full-text search capabilities

### Scalability Considerations
- **Database Sharding** - For high-volume deployments
- **Caching Layer** - Redis integration for performance
- **CDN Integration** - Global content delivery
- **Microservices** - Service decomposition for scale

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Cloudflare Workers documentation
3. Check D1 database documentation
4. Monitor application logs for errors

---

**Built with ❤️ for the KRN community**
