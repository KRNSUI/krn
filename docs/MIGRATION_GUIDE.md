# Migration Guide: Legacy to Enhanced System

This guide helps you migrate from the legacy KRN complaints system to the new enhanced system with improved features and better performance.

## 🚨 Breaking Changes

### API Endpoints
- **Old**: `/complaints` → **New**: `/complaints_enhanced`
- **Old**: `/submit` → **New**: `/submit_enhanced`
- **Old**: `/stars/*` → **New**: Integrated into `/complaints_enhanced`

### Database Schema
- **Old**: Simple complaints table → **New**: Enhanced schema with counts and moderation
- **Old**: Separate stars table → **New**: Integrated stars and flags system

### Frontend Components
- **Old**: `feed.js` → **New**: `feed_enhanced.js`
- **Old**: Basic star functionality → **New**: Full star/flag system with real-time updates

## 📋 Migration Checklist

### 1. Database Migration

#### Backup Existing Data
```bash
# Export existing complaints
wrangler d1 execute YOUR_DB --command="SELECT * FROM complaints" --output=complaints_backup.json

# Export existing stars (if any)
wrangler d1 execute YOUR_DB --command="SELECT * FROM stars" --output=stars_backup.json
```

#### Deploy Enhanced Schema
```bash
# Deploy the new schema
./migrations/deploy_enhanced_schema.sh
```

#### Migrate Data (if needed)
```sql
-- If you have existing data to migrate
INSERT INTO complaints (id, message, created_at, author_addr)
SELECT id, message, created_at, NULL
FROM old_complaints_table;

-- Migrate stars (adjust column names as needed)
INSERT INTO stars (complaint_id, user_addr, created_at)
SELECT post_id, addr, created_at
FROM old_stars_table;
```

### 2. API Updates

#### Update Wrangler Configuration
Replace old routes in `wrangler.toml`:

```toml
# Remove old routes
# [[routes]]
# pattern = "/complaints"
# script = "api/complaints.js"

# [[routes]]
# pattern = "/submit"
# script = "api/submit.js"

# Add new enhanced routes
[[routes]]
pattern = "/complaints_enhanced"
script = "api/complaints_enhanced.js"

[[routes]]
pattern = "/submit_enhanced"
script = "api/submit_enhanced.js"
```

#### Update API Calls in Frontend
Replace API calls in your JavaScript:

```javascript
// Old
fetch('/complaints?limit=50')

// New
fetch('/complaints_enhanced?limit=50&sort=newest')

// Old
fetch('/complaints', {
  method: 'POST',
  body: JSON.stringify({ complaintId, action, payload })
})

// New
fetch('/complaints_enhanced', {
  method: 'POST',
  body: JSON.stringify({ 
    action: 'star', 
    complaintId: id, 
    userAddr: address 
  })
})
```

### 3. Frontend Updates

#### Replace Feed Component
```javascript
// Old
import initFeed from './src/core/utils/feed.js';
initFeed();

// New
import initEnhancedFeed from './src/core/utils/feed_enhanced.js';
initEnhancedFeed();
```

#### Update HTML Structure
The enhanced feed automatically creates its own navigation and controls, so you can simplify your HTML:

```html
<!-- Old -->
<div id="feed"></div>
<div id="feed-nav">
  <a href="#" id="refreshBtn">Refresh</a>
  <a href="#" id="newer-link">Newer</a>
  <a href="#" id="older-link">Older</a>
</div>

<!-- New (simplified) -->
<div id="feed"></div>
<!-- Navigation is automatically created by enhanced feed -->
```

### 4. Remove Old Files

After confirming everything works, remove old files:

```bash
# Remove old API files
rm api/complaints.js
rm api/submit.js

# Remove old frontend files
rm src/core/utils/feed.js

# Remove old migration files
rm migrations/schema.sql
rm migrations/stars.sql
rm migrations/0001_create_comments_table.sql
```

## 🔄 Step-by-Step Migration

### Phase 1: Preparation
1. **Backup your data**
2. **Deploy enhanced schema** alongside existing system
3. **Test new endpoints** in development environment

### Phase 2: Gradual Rollout
1. **Update frontend** to use enhanced feed
2. **Test thoroughly** with new features
3. **Monitor performance** and user feedback

### Phase 3: Complete Migration
1. **Update all API calls** to use enhanced endpoints
2. **Remove old files** and routes
3. **Clean up documentation**

## 🧪 Testing

### Test Enhanced Features
1. **Pagination** - Test newer/older navigation
2. **Sorting** - Test different sort options
3. **Star/Flag** - Test user interactions
4. **Content Moderation** - Test flagging system
5. **Performance** - Verify improved loading times

### Test Data Integrity
```bash
# Verify complaints migrated correctly
wrangler d1 execute YOUR_DB --command="SELECT COUNT(*) FROM complaints"

# Verify stars migrated correctly
wrangler d1 execute YOUR_DB --command="SELECT COUNT(*) FROM stars"

# Check for any orphaned data
wrangler d1 execute YOUR_DB --command="SELECT COUNT(*) FROM stars WHERE complaint_id NOT IN (SELECT id FROM complaints)"
```

## 🚨 Rollback Plan

If issues arise, you can rollback:

### Database Rollback
```bash
# Restore from backup
wrangler d1 execute YOUR_DB --file=complaints_backup.json
```

### API Rollback
```toml
# Revert wrangler.toml to old routes
[[routes]]
pattern = "/complaints"
script = "api/complaints.js"

[[routes]]
pattern = "/submit"
script = "api/submit.js"
```

### Frontend Rollback
```javascript
// Revert to old feed
import initFeed from './src/core/utils/feed.js';
initFeed();
```

## 📊 Post-Migration Verification

### Performance Metrics
- [ ] Page load times improved
- [ ] API response times faster
- [ ] Database query performance better
- [ ] User engagement increased

### Feature Verification
- [ ] Pagination works correctly
- [ ] Sorting options functional
- [ ] Star/flag interactions work
- [ ] Content moderation active
- [ ] Mobile responsiveness maintained

### Data Integrity
- [ ] All complaints migrated
- [ ] All stars preserved
- [ ] No orphaned records
- [ ] Counts accurate

## 🆘 Troubleshooting

### Common Issues

1. **API 404 Errors**
   - Verify new routes are deployed
   - Check wrangler.toml configuration
   - Ensure file paths are correct

2. **Database Errors**
   - Verify enhanced schema is deployed
   - Check D1 database binding
   - Review migration logs

3. **Frontend Issues**
   - Clear browser cache
   - Check JavaScript console for errors
   - Verify import paths

4. **Performance Issues**
   - Monitor database query performance
   - Check for missing indexes
   - Review API response times

### Getting Help
- Check the [Enhanced Complaints README](../ENHANCED_COMPLAINTS_README.md)
- Review [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
- Check [D1 database documentation](https://developers.cloudflare.com/d1/)

---

**Migration completed successfully?** 🎉 Update your documentation and let your users know about the new features!
